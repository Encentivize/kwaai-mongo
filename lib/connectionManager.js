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

    this.connectToDB=connectToDB;
    this.connectToCollection= connectToCollection;
    this.connectToCollections=connectToCollections;

    function connectToDB(callback){
        var retryCnt=6;

        function databaseConnected(err,db){
            if (err){return callback(err);}
            _databaseConnection=db;
            db.on('close', function() {
                console.log("connection forced closed");
                if (_databaseConnection){_databaseConnection=null;}
                //clear connetions to be safe
                _collectionConnections={};
                // connection closed
            });
            db.on('error', function() {
                console.error("connection error");
                if (_databaseConnection){_databaseConnection=null;}
                //clear connetions to be safe
                _collectionConnections={};
                // connection closed
            });
            db.on('timeout', function() {
                console.error("connection timed out");
                if (_databaseConnection){_databaseConnection=null;}
                //clear connetions to be safe
                _collectionConnections={};
                // connection closed
            });

            return callback(null,db);
        }


        function tryConnectToDB(){

            retryCnt--;
            function databaseTried(err,db){
                if (err){
                    if (retryCnt>=0){
                        console.warn("unable to connect to DB retry attempt:" + retryCnt);
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
                console.error("Error connecting to MongoDB:" + JSON.stringify(exp));
                return callback(exp);
            }
        }

        if (_databaseConnection){
            console.log("retrieving database from pool cache");
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
