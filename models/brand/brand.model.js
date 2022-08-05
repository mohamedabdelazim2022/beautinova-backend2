import mongoose,{ Schema} from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const BrandSchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    brandName_en: {
        type: String,
        trim: true,
        required: true,
    },
    brandName_ar: {
        type: String,
        trim: true,
        required: true,
    },
    color: {
        type:[Number],
        ref: 'color',
    },
    deleted:{
        type:Boolean,
        default:false
    }
}, { timestamps: true });

BrandSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
BrandSchema.plugin(autoIncrement.plugin, { model: 'brand', startAt: 1 });

export default mongoose.model('brand', BrandSchema);