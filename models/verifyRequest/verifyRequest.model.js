import mongoose,{ Schema} from "mongoose";
import autoIncrement from 'mongoose-auto-increment';
import { isImgUrl } from "../../helpers/CheckMethods";

const verifySchema = new Schema({
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
    img: {
        type: [String],
        validate: {
            validator: imgUrl => isImgUrl(imgUrl),
            message: 'img is invalid url'
        }
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

verifySchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
verifySchema.plugin(autoIncrement.plugin, { model: 'verify', startAt: 1 });

export default mongoose.model('verify', verifySchema);