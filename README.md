#kwaai-mongo

Node helpers for mongoDB

##Description
A set of helper tools to assist in working with mongo in Node

##API
###connectToCollection(name,connectionString,callback)
Connects to a collection.

###connectToCollections(connectionString,callback,collectionName1,collectionName2,...)
Connects to multiple collections in a single go.

###buildQueryFromOptions(query,options)
Builds a mongo query from a url querystring.
    e.g ?name=a&limit=100&fields=name,_id
Useful for web applications.

###clearPools()
Reset all the connection pooling madness

###setDefaultOptions(defaultOptions)
connects to mongo with some assumptions so this can override the connection options. 

