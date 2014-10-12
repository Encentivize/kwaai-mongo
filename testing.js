var kwaaiMongo=require("./index.js");
var mongo =require("mongodb");

console.log("testing utils");
console.log(kwaaiMongo.utils.generateId());
console.log(kwaaiMongo.utils.isValidId(null));
console.log(kwaaiMongo.utils.isValidId("123456789012"));
console.log(kwaaiMongo.utils.isValidId(new mongo.ObjectID()));
console.log(kwaaiMongo.utils.isValidId("542daab9c4aa8ea8051018db"));
console.log(kwaaiMongo.utils.parseId(new mongo.ObjectID()));
return

var connectionString="mongodb://127.0.0.1:27017/testdb";
var kwaaiMongoConnection=kwaaiMongo.connectionManager(connectionString);

/*
kwaaiMongoConnection.connectToDB(function(err){
   if (err){console.log("db error",err);}
   console.log("db connected")
});

*/

for (var i=0;i<100;i++){
    //setTimeout(testConnection,i*1000);
}

function testConnection()
{
    function collectionConnected(err, collection) {
        if (err) {
            return console.log(err)
        }else{
        console.log("success connecting to single collection");}
    }

    kwaaiMongoConnection.connectToCollection("testcol1", collectionConnected)
}

function collectionsConnected(err, collections) {
    if (err) {
        return console.log(err)
    }else{
        console.log("success connecting to collections");}
}
kwaaiMongoConnection.connectToCollections(["testcol1","testcol2","testcol4","testcol5","testcol6","testcol7","testcol8","testcol9"],collectionsConnected);


/*

var kwaaiMongo=require('./lib/mongo.js');
var mquery=require("mquery");
var mongo=require("mongodb");


function collectionConnected(err,collection){
    if(err){console.log(err)}
    console.log("success connecting to single collection")

    var query=mquery(collection);
    kwaaiMongo.buildQueryFromOptions(query,{"additionalFields.val1":1})
    query.exec(function(err,values){
        console.log(err);
        console.log(values);

    })

}
kwaaiMongo.connectToCollection("testcol1",connectionString,collectionConnected)

*/


/*
function collectionConnected(err,collection){
    if(err){console.log(err)}
    console.log("success connecting to single collection")

    var document = {name:"David", title:"About MongoDB",collectionName:collection.collectionName};
    collection.insert(document, function(err, records){
        console.log("Record added as "+records[0]._id);
    });


    var query=mquery(collection);
    kwaaiMongo.buildQueryFromOptions(query,{"additionalFields.val1":1})
    query.exec

}
kwaaiMongo.connectToCollection("testcol1",connectionString,collectionConnected)


function collectionsConnected(err,collections){
    if(err){console.log(err)}
    console.log("success connecting to multiple collections")
    for (var k in collections){
        var collection=collections[k];
        var document = {name:"David", title:"About MongoDB",collectionName:collection.collectionName};
            collection.insert(document, function(err, records){
        console.log("Record added as "+records[0]._id);
    });}
}
kwaaiMongo.connectToCollections(connectionString,collectionsConnected,"testcol1","testcol2","testcol4","testcol5","testcol6","testcol7","testcol8","testcol9")

    */