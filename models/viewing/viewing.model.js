import mongoose, { Schema } from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const ViewSchema=new Schema({
    _id: {
        type: Number,
        required: true
    },
    user:{
        type:Number,
        ref:'user',
        required:true
    },
    product:{
        type: Number,
        ref: 'product',
    },
    relatedTo: {
        type: String,
        required: true,
        enum:["PRODUCT","ARTIST","POST"],
        default:"PRODUCT"
    },
    artist:{
        type:Number,
        ref:'user'
    },
    post:{
        type:Number,
        ref:'post'
    },
    startDateMillSec:{
        type:Number,
        required: true,
    },
    endDateMillSec:{
        type:Number,
        required: true,
    },
    duration:{
        type:Number,
        required: true,
    },
    deleted:{
        type:Boolean,
        default:false
    },

},{ timestamps: true });
ViewSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
ViewSchema.plugin(autoIncrement.plugin, { model: 'view', startAt: 1 });

export default mongoose.model('view', ViewSchema);