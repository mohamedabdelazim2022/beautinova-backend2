import mongoose,{ Schema} from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const ColorSchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    colorName_en: {
        type: String,
        trim: true,
        required: true,
    },
    colorName_ar: {
        type: String,
        trim: true,
        required: true,
    },
    img: {
        type: String,
        required: true,
        validate: {
            validator: imgUrl => isImgUrl(imgUrl),
            message: 'img is invalid url'
        }
    },

    deleted:{
        type:Boolean,
        default:false
    }
}, { timestamps: true });

ColorSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
ColorSchema.plugin(autoIncrement.plugin, { model: 'color', startAt: 1 });

export default mongoose.model('color', ColorSchema);