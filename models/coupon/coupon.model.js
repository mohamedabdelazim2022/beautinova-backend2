import mongoose,{ Schema} from "mongoose";
import autoIncrement from 'mongoose-auto-increment';
const CouponSchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    couponNumber: {
        type: String,
        required: true,
    },
    discountType: {
        type: String,
        enum:['FIXED','RATIO'],
        default:'RATIO',
        required: true,
    },
    discount: {
        type: Number,
        required: true,
    },
    singleTime:{
        type:Boolean,
        default:true
    },
    end:{
        type:Boolean,
        default:false
    },
    expireDate:{
        type:Date,
    },
    expireDateMillSec:{
        type:Number,
    },
    deleted:{
        type:Boolean,
        default:false
    }
}, { timestamps: true });

CouponSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
CouponSchema.plugin(autoIncrement.plugin, { model: 'coupon', startAt: 1 });

export default mongoose.model('coupon', CouponSchema);