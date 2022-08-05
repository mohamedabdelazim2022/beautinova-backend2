var mongoose=require('mongoose');
var mongoose_auto_increment=require('mongoose-auto-increment');
var Schema=mongoose.Schema;

var message={
    _id:{
        type:Number,
        required:true
    },
    to:{
        type:Number,
        ref:'user',
        required:true
    },
    from:{
        type:Number,
        ref:'user',
        required:true
    },
    booking:{
        type:Number,
        ref:'booking',
        //required:true
    },
    content:{
        type:String,
        default:""
    },
    duration:{
        type:String,
        default:""
    },
    dataType:{
        type:String,
        enum:["TEXT","LINK","VIDEO","IMAGE","RECORD","LOCATION","DOCX"],
        default:"TEXT"
    },
    
    seen:{
        type:Boolean,
        default:0
    },
    seendate:{
        type:Date 
    },
    incommingDate:{
        type:Date, 
        required:true,
        default: Date.now
    },
    deleted:{
        type: Boolean,
        default:0
    },
    lastMessage : {
        type : Boolean ,
        default : true
    },
    sent:{
        type : Boolean,
        default : false
    },
    delivered:{
        type : Boolean,
        default : false
    },
    informed:{
       type: Boolean ,
       default : false 
    }
}

var messgaeSchema=new Schema(message);
mongoose_auto_increment.initialize(mongoose.connection);
messgaeSchema.plugin(mongoose_auto_increment.plugin , {model:'message' , startAt:1} );
var messageModel = mongoose.model('message',messgaeSchema);
module.exports = messageModel ;