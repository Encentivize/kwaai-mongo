var mongo=require('mongodb');

var utils={

    generateId:function(){
        return new mongo.ObjectID().toString();
    }

    ,isValidId:function(id){
        if (!id){return false;}
        if (id.toString().length!=24){return false;}
        return mongo.ObjectID.isValid(id.toString());
    }

    ,parseId:function(id){
        if (this.isValidId(id)){
            return new mongo.ObjectID(id.toString());
        }
        else{
            return null;
        }
    }

}



module.exports=utils;