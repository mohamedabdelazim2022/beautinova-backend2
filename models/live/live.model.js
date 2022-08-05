import mongoose, { Schema } from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const liveSchema=new Schema({
    _id: {
        type: Number,
        required: true
    },
    owner:{
        type:Number,
        ref:'user',
        required:true
    },
    bannar: {
        type: String,
        validate: {
            validator: imgUrl => isImgUrl(imgUrl),
            message: 'img is invalid url'
        }
    },
    status:{
        type:String,
        enum:['PENDING','ACCEPTED','REJECTED','CANCEL','STARTED','ENDED'],
        default:'PENDING',
        required:true,
    },
    streamKey:{
        type: String,
        //required: true,
        default: "",
    },
    videoId:{
        type: String,
        //required: true,
        default: "",
    },
    title:{
        type: String,
        required: true,
    },
    description:{
        type: String,
        required: true,
    },
    startDate:{
        type: Date,
        required: true,
    },
    startDateMillSec:{
        type: Number,
        required: true,
    },
    endDate:{
        type: Date,
        required: true,
    },
    endDateMillSec:{
        type: Number,
        required: true,
    },
    reason:{
        type:String,
    },
    viewersCount:{
        type: Number,
        default: 0,
    },
    deleted:{
        type:Boolean,
        default:false
    },

},{ timestamps: true });
liveSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
liveSchema.plugin(autoIncrement.plugin, { model: 'live', startAt: 1 });

export default mongoose.model('live', liveSchema);