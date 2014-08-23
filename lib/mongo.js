//*********************************************************************************************************************************************************************
//requires
//*********************************************************************************************************************************************************************

var mongo=require('mongodb').MongoClient;
var async=require("async");

var _databaseConnections = {};
var _collectionConnections={};

var _connCnt=0;

var _defaultConnectOptions={
    db:{

    },
    server:{
        auto_reconnect:true,
        socketOptions: {
            keepAlive: 1,
            connectTimeoutMS : 30000
        }
    }
    ,
    replSet: {
        socketOptions:{
            connectTimeoutMS : 30000,
            keepAlive: 1

        }
    },
    mongos: {}
}

 /*


*/

//*********************************************************************************************************************************************************************
//exports
//*********************************************************************************************************************************************************************
tools=
{
    connectToCollection:
        function(name,connectionString,callback)
        {
            function collectionCreated(err,collection)
            {
                if (err)
                {
                    return callback(err);
                }
                else
                {
                    console.log("collection " + name + " created");
                    _collectionConnections[connectionString+name]=collection;
                    return callback(null,collection);

                }
            }

            function databaseRetrieved(db)
            {
                console.log("database retrieved");
                if (_collectionConnections[connectionString+name]){
                    console.log("collection " + name + " retrieved from cache");
                   return callback(null,_collectionConnections[connectionString+name]);
                }
                var collection = db.collection(name);
                if (collection!=null)
                {
                    console.log("collection " + name + " retrieved");
                    _collectionConnections[connectionString+name]=collection;
                    return callback(null,_collectionConnections[connectionString+name]);
                }
                db.createCollection(name,collectionCreated);
            }


            function databaseConnected(err,db){
                if (err){return callback(err);}
                _connCnt++;
                _databaseConnections[connectionString]=db;
                db.on('close', function() {
                    _connCnt--;
                    console.log("connection forced closed");
                    if (_databaseConnections[connectionString]){ delete _databaseConnections[connectionString];}
                    //clear connetions to be safe
                    _collectionConnections={};
                    // connection closed
                });
                db.on('error', function() {
                    _connCnt--;
                    console.error("connection error");
                    if (_databaseConnections[connectionString]){ delete _databaseConnections[connectionString];}
                    //clear connetions to be safe
                    _collectionConnections={};
                    // connection closed
                });
                db.on('timeout', function() {
                    console.error("connection timed out");
                });

                console.log("connected to database connections loaded:" + _connCnt);
                databaseRetrieved(db);
            }

            var retryCnt=5;
            function tryConnectToDB()
            {
                function databaseTried(err,db){
                    if (err){
                        retryCnt--;
                        console.log("error connecting to database: " +  JSON.stringify(err));
                        if (retryCnt>=0){
                            console.log("retry attempt:" + retryCnt);
                            setTimeout(tryConnectToDB,1000)
                        }else{
                            callback(err);
                        }
                    }
                    else{
                        databaseConnected(null,db);
                    }
                }

                try{
                    console.log("connecting to database");
                    mongo.connect(connectionString,_defaultConnectOptions
                    , databaseTried)
                        ;
                } catch(exp) {

                    console.error("Error connecting to MongoDB:" + JSON.stringify(exp))
                    return callback(exp);
                }

            }

            if (_databaseConnections[connectionString]){
                console.log("retrieving database from cache");
                databaseRetrieved(_databaseConnections[connectionString]);
            } else {
                tryConnectToDB();
            }
        }

    ,connectToCollections:
    function(connectionString,callback){
        var collections={};
        var collectionNames=Array.prototype.slice.call(arguments, 2);


        function connectToCollection(collectionName,callback){
            function connectedToCollection(err,collection){
                if (err){return callback(err);}
                collections[collectionName]=collection;
                return callback();
            }
            tools.connectToCollection(collectionName,connectionString,connectedToCollection);
        }

        function collectionsConnected(err){
            if(err){return callback(err);}
            return callback(null,collections);
        }

        async.eachSeries(collectionNames,connectToCollection,collectionsConnected)


        //connect to db first

    }

    ,buildQueryFromOptions:
    function(query,options){
        var queryOptions = getQueryOptions(options);

        var arr, i, re;
        for (var key in options) {
            if(queryOptions.protected.indexOf(key)>-1)
            {
                continue;
            }
            query.where(key);
            var value = options[key];

            if ('~' === value[0]) {
                re = new RegExp(value.substring(1), 'i');
                query.where(key).regex(re);
            } else if ('>' === value[0]) {
                if ('=' === value[1]) {
                    query.gte(value.substr(2));
                } else {
                    query.gt(value.substr(1));
                }
            } else if ('<' === value[0]) {
                if ('=' === value[1]) {
                    query.lte(value.substr(2));
                } else {
                    query.lt(value.substr(1));
                }
            } else if ('!' === value[0] && '=' === value[1]) { //H+ for !=
                query.ne(value.substr(2));
            } else if ('[' === value[0] && ']' === value[value.length - 1]) {
                query.in(value.substr(1, value.length - 2).split(','));
            } else {
                query.equals(value);
            }
        }

        //H+ exposes Query AND, OR and WHERE methods
        if (queryOptions.current.query) {
            query.where(JSON.parse(queryOptions.current.query,
                jsonQueryParser));
        }
        //TODO - as introduction of QUERY param obsoletes need of $and, $or
        if (queryOptions.current.$and) {
            query.and(JSON.parse(queryOptions.current.$and, jsonQueryParser));
        }
        if (queryOptions.current.$or) {
            query.or(JSON.parse(queryOptions.current.$or, jsonQueryParser));
        }
        //H+ exposes Query AND, OR methods

        if (queryOptions.current.skip) {
            query.skip(queryOptions.current.skip);
        }
        if (queryOptions.current.limit) {
            query.limit(queryOptions.current.limit);
        }
        if (queryOptions.current.sort) {
            query.sort(queryOptions.current.sort);
        }
        var selectObj = {root: {}};
        if (queryOptions.current.select) {

            if (queryOptions.current.select) {
                arr = queryOptions.current.select.split(',');
                for (i = 0; i < arr.length; ++i) {
                    if (arr[i].match(/\./)) {
                        var subSelect = arr[i].split('.');
                        if (!selectObj[subSelect[0]]) {
                            selectObj[subSelect[0]] = {};
                            //selectObj.root[subSelect[0]] = 1;
                        }
                        selectObj[subSelect[0]][subSelect[1]] = 1;
                    } else {
                        selectObj.root[arr[i]] = 1;
                    }
                }
            }
            query.select(selectObj.root);
        }

        //doesnt currently work
        //if (queryOptions.current.populate) {
        //    arr = queryOptions.current.populate.split(',');
        //    for (i = 0; i < arr.length; ++i) {
        //        if (!_.isUndefined(selectObj[arr[i]]) &&
        //            !_.isEmpty(selectObj.root)) {
        //            selectObj.root[arr[i]] = 1;
        //        }
        //        query = query.populate(arr[i], selectObj[arr[i]]);
        //    }
        //    query.select(selectObj.root);
        //}

        //return query;

    }

    ,clearPools:
        function(){

            function connectionClosed(err){
                if (err){console.log("error closing database connection" + err);}
                else{console.log("database connection closed" + err);}
            }

            for(var k in _databaseConnections){
                console.log("closing database connection");
                _databaseConnections[k].close(connectionClosed);
            }

            _databaseConnections={};
            _collectionConnections={};
        },
    setDefaultOptions:
        function(defaultOptions){
            _defaultConnectOptions=defaultOptions;
        }
    
}


module.exports=tools;
//*********************************************************************************************************************************************************************
//private functions
//*********************************************************************************************************************************************************************
function jsonQueryParser(key, value) {
    if (_.isString(value)) {
        if ('~' === value[0]) { //parse RegExp
            return new RegExp(value.substring(1), 'i');
        } else if ('>' === value[0]) {
            if ('=' === value[1]) {
                return {$gte: value.substr(2)};
            } else {
                return {$gt: value.substr(1)};
            }
        } else if ('<' === value[0]) {
            if ('=' === value[1]) {
                return {$lte: value.substr(2)};
            } else {
                return {$lt: value.substr(1)};
            }
        } else if ('!' === value[0] && '=' === value[1]) {
            return {$ne: value.substr(2)};
        }
    } else if (_.isArray(value)) {
        if (model.schema.paths.hasOwnProperty(key)) {
            return {$in: value};
        }
    }
    return value;
}

function getQueryOptions(options)
{
    newQueryOptions = {
        protected: ['skip', 'limit', 'sort', 'populate', 'select', 'lean',
            '$and', '$or', 'query'],//H+ exposes OR, AND and WHERE methods
        current: {}
    };

    for (var key in options) {
        if (newQueryOptions.protected.indexOf(key) !== -1) {
            newQueryOptions.current[key] = options[key];
        }
    }
    return newQueryOptions;
}