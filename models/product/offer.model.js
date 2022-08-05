import mongoose, { Schema } from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const OfferSchema=new Schema({
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
        //required: true,
    },
    color: {
        type: Number,
        //required: true,
        ref: 'color'
    },
    offerType:{
        type:String,
        enum:["COLOR","SIZE","BOTH"]
    },
    discountType:{
        type:String,
        enum:["RATIO","PRICE"],
        default:"RATIO"
    },
    offerRatio: {
        type: Number,
        default: 0
    },
    offerPrice: {
        type: Number,
        default: 0
    },
    deleted:{
        type:Boolean,
        default:false
    },

},{ timestamps: true });
OfferSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
OfferSchema.plugin(autoIncrement.plugin, { model: 'offer', startAt: 1 });

export default mongoose.model('offer', OfferSchema);