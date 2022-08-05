import mongoose, { Schema } from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const StockSchema=new Schema({
    _id: {
        type: Number,
        required: true
    },
    product:{
        type:Number,
        required:true,
        ref:'product'
    },
    size: {
        type: Number,
        ref:'size',
        required: true,
    },
    colors: [
        new Schema({
            color: {
                type: Number,
                required: true,
                ref: 'color'
            },
            quantity: {
                type: Number,
                required: true,
            },
        }, { _id: false })
    ],
    quantity: {
        type: Number,
        required: true,
        default:20
    },
    price: {
        type: Number,
        required: true,
    },
    deleted:{
        type:Boolean,
        default:false
    },

},{ timestamps: true });
StockSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
StockSchema.plugin(autoIncrement.plugin, { model: 'stock', startAt: 1 });

export default mongoose.model('stock', StockSchema);