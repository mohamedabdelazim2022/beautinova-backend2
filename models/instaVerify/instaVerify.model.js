import mongoose,{ Schema} from "mongoose";
import autoIncrement from 'mongoose-auto-increment';
import { isImgUrl } from "../../helpers/CheckMethods";

const instaVerifySchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    user: {
        type: Number,
        ref:'user',
        required: true,
    },
    status: {
        type: String,
        enum:["PENDING","ACCEPTED","REFUSED"],
        default:"PENDING"
    },
    instaUserName: {
        type: String,
        required: true
    },
    reply:{
        type:Boolean,
        default:false
    },
    deleted:{
        type:Boolean,
        default:false
    }
}, { timestamps: true });

instaVerifySchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
instaVerifySchema.plugin(autoIncrement.plugin, { model: 'instaVerify', startAt: 1 });

export default mongoose.model('instaVerify', instaVerifySchema);