var kwaaiMongo=require('./lib/mongo.js');


var connectionString="mongodb://127.0.0.1:27017/testdb";


function collectionConnected(err,collection){
    if(err){console.log(err)}
    console.log("success connecting to single collection")

    var document = {name:"David", title:"About MongoDB",collectionName:collection.collectionName};
    collection.insert(document, function(err, records){
        console.log("Record added as "+records[0]._id);
    });
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