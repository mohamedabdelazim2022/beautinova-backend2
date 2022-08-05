import mongoose, { Schema } from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const AnoncementSchema=new Schema({
    _id: {
        type: Number,
        required: true
    },
    img: {
        type: String,
        required: true,
        validate: {
            validator: imgUrl => isImgUrl(imgUrl),
            message: 'img is invalid url'
        }
    },
    dataType:{
        type: String,
        enum:['IMAGE', 'VIDEO'],
        default:'IMAGE',
    },
    title_en:{
        type: String,
        required: true,
    },
    title_ar:{
        type: String,
        required: true,
    },
    description_en:{
        type: String,
        required: true,
    },
    description_ar:{
        type: String,
        required: true,
    },
    category:{
        type: [Number],
        ref:'category'
    },
    priority:{
        type: Number,
        default: 0,
    },
    deleted:{
        type:Boolean,
        default:false
    },

},{ timestamps: true });
AnoncementSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
AnoncementSchema.plugin(autoIncrement.plugin, { model: 'anoncement', startAt: 1 });

export default mongoose.model('anoncement', AnoncementSchema);