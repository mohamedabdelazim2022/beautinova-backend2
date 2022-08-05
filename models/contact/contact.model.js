import mongoose,{ Schema } from "mongoose";
import autoIncrement from 'mongoose-auto-increment';
const ContactSchema=new Schema({
    _id: {
        type: Number,
        required: true
    },
    user: {
        type: Number,
        ref:'user',
        required: true
    },
    name: {
        type: String,
        trim:true,
        required: true
    },
    email: {
        type: String,
        trim:true,
        //required: true
    },
    phone: {
        type: String,
        trim:true,
        //required: true
    },
    message: {
        type: String,
        required: true
    },
    replys: [
        new Schema({
            user: {
                type: Number,
                ref:'user',
                required: true,
            },
            reply: {
                type: String,
                required: true,
            },
            date: {
                type: Number,
                default: Date.now
            },
        }, { _id: false })
    ],
    
    reply:{
        type:Boolean,
        default:false
    },
    deleted:{
        type:Boolean,
        default:false
    }
},{timestamps:true});
ContactSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
ContactSchema.plugin(autoIncrement.plugin, { model: 'contact', startAt: 1 });

export default mongoose.model('contact', ContactSchema);