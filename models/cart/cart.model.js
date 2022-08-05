import mongoose, { Schema } from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const CartSchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    user: {
        type: Number,
        ref: 'user',
        required: true
    },
    product: {
        type: Number,
        ref: 'product',
        required: true
    },
    size: {
        type: Number,
        ref: 'size'
    },
    color: {
        type: Number,
        ref: 'color'
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

CartSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
CartSchema.plugin(autoIncrement.plugin, { model: 'cart', startAt: 1 });

export default mongoose.model('cart', CartSchema);