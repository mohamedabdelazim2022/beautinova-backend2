import mongoose,{ Schema} from "mongoose";
import autoIncrement from 'mongoose-auto-increment';
const SizeSchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    size_en: {
        type: String,
        trim: true,
        required: true,
    },
    size_ar: {
        type: String,
        trim: true,
        required: true,
    },
    deleted:{
        type:Boolean,
        default:false
    }
}, { timestamps: true, discriminatorKey: 'kind' });

SizeSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
SizeSchema.plugin(autoIncrement.plugin, { model: 'size', startAt: 1 });

export default mongoose.model('size', SizeSchema);