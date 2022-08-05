import mongoose, { Schema } from "mongoose";
import { isImgUrl,isMediaUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const postSchema=new Schema({
    _id: {
        type: Number,
        required: true
    },
    owner: {
        type: Number,
        ref:'user',
        required: true
    },
    img: {
        type: String,
        required: true,
        
    },
    thumbnail:{
        type: String,
    },
    dataType:{
        type: String,
        enum:['IMAGE', 'VIDEO'],
        default:'IMAGE',
    },
    title:{
        type: String,
        //required: true,
    },
    description:{
        type: String,
        //required: true,
    },
    category:{
        type:[Number],
        ref:'category',
        //required:true
    },
    likesCount:{
        type:Number,
        default:0
    },
    isLike:{
        type:Boolean,
        default:false
    },
    viewsCount:{
        type: Number,
        default: 0
    },
    viewers:{
        type: [Number],
        ref:'user'
    },
    sendDailyNotif:{
        type:Boolean,
        default:false
    },
    notifsDate:{
        type:Date,
    },
    lastLikeDate:{
        type:Date,
    },
    deleted:{
        type:Boolean,
        default:false
    },

},{ timestamps: true });
postSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
postSchema.plugin(autoIncrement.plugin, { model: 'post', startAt: 1 });

export default mongoose.model('post', postSchema);