//*********************************************************************************************************************************************************************
//requires
//*********************************************************************************************************************************************************************
var mongo=require('mongodb').MongoClient;
var async=require("async");

function mongoDbConnection(connectionString,connectionOptions){
    var _databaseConnection =null;
    var _collectionConnections={};
    var _connectionOptions=connectionOptions;
    var _connectionString=connectionString;
    var _connectionSource=connectionOptions?(connectionOptions.sourceTag?connectionOptions.sourceTag:""):"";
    this.connectToDB=connectToDB;
    this.connectToCollection= connectToCollection;
    this.connectToCollections=connectToCollections;

    function connectToDB(callback){
        function databaseConnected(err,db){
            if (err){return callback(err);}
            _databaseConnection=db;
            console.log("new connection to DB:" + _connectionSource +":" + db.tag);
            db.on('close', function() {
                console.log("connection forced closed:" + _connectionSource +":"+ this.tag);
                if (_databaseConnection){_databaseConnection=null;}
                //clear connetions to be safe
                _collectionConnections={};
                // connection closed
            });
            db.on('error', function() {
                console.error("connection error:" + _connectionSource +":" + this.tag);
                this.close();
            });
            db.on('timeout', function(err) {
                console.warn("connection timed out:"  + this.tag + ":" + _connectionSource +":" + JSON.stringify(err));
            });

            return callback(null,db);
        }

        var retryCnt=6;
        function tryConnectToDB(){

            retryCnt--;
            function databaseTried(err,db){
                if (err){
                    if (retryCnt>=0){
                        console.warn("unable to connect to DB retry attempt:" + _connectionSource +":" + retryCnt);
                        setTimeout(tryConnectToDB,1000);
                    }else{
                        console.error("Error connecting to MongoDB:" + JSON.stringify(err));
                        return callback(err);
                    }
                }
                else{
                    databaseConnected(null,db);
                }
            }

            try{
                console.log("connecting to database");
                mongo.connect(_connectionString,_connectionOptions, databaseTried);
            } catch(exp) {
                console.error("Error connecting to MongoDB:"  + _connectionSource +":"+ JSON.stringify(exp));
                return callback(exp);
            }
        }

        if (_databaseConnection){
            console.log("retrieving database from pool cache:"  + _connectionSource +":" + _databaseConnection.tag);
            return callback(null,_databaseConnection);
        } else {
            tryConnectToDB();
        }
    }

    function connectToCollection(name,callback){
        function collectionCreated(err,collection)
        {
            if (err){
                return callback(err);
            } else{
                console.log("collection " + name + " created");
                _collectionConnections[name]=collection;
                return callback(null,_collectionConnections[name]);
            }
        }

        function databaseRetrieved(err,db)
        {
            if (err){return callback(err);}
            if (_collectionConnections[name]){
                console.log("collection " + name + " retrieved from cache");
                return callback(null,_collectionConnections[name]);
            }
            var collection = db.collection(name);
            if (collection!=null)
            {
                console.log("collection " + name + " retrieved");
                _collectionConnections[name]=collection;
                return callback(null,_collectionConnections[name]);
            }else{
                db.createCollection(name,collectionCreated);
            }
        }
        connectToDB(databaseRetrieved)
    }

    function connectToCollections(collectionNames,callback){
        function dbConnected(err){
            if(err){return callback(err);}
            function tryConnectToCollection(collectionName,callback){
                function connectedToCollection(err,collection){
                    if (err){return callback(err);}
                    return callback();
                }
                connectToCollection(collectionName,connectedToCollection);
            }

            function collectionsConnected(err){
                if(err){return callback(err);}
                return callback(null,_collectionConnections);
            }
            async.eachSeries(collectionNames,tryConnectToCollection,collectionsConnected);
        }

        connectToDB(dbConnected);
    }


}

module.exports=function(connectionString,connectionOptions){
    return new mongoDbConnection(connectionString,connectionOptions);
}
