import mongoose, { Schema } from "mongoose";
import autoIncrement from 'mongoose-auto-increment';
const OrderSchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    client: {
        type: Number,
        ref: 'user',
        required:true
    },
    total: {
        type: Number,
        required: true
    },
    finalTotal:{
        type: Number,
        required: true,
        default:0
    },
    delivaryCost: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default:0
    },
    destination: {
        type: { type: String, enum: 'Point' },
        coordinates: { type: [Number] }
    },
    address: {
        type: String,
        required: true
    },
    street: {
        type: String,
        required: true
    },
    placeType: {
        type: String,
        required: true
    },
    floor: {
        type: String,
        required: true
    },
    apartment: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    city: {
        type: Number,
        ref:'city',
        required: true
    },
    area: {
        type: Number,
        ref:'area',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED','CANCELED','REFUSED','OUT-FOR-DELIVERY', 'DELIVERED'],
        default: 'ACCEPTED'
    },
    paymentSystem:{
        type: String,
        enum: ['cash', 'online'],
        default:'cash'
    },
    promoCode: {
        type: Number,
        ref:'coupon',
    },
    hasPromoCode:{
        type:Boolean,
        default:false
    },
    accept:{
        type:Boolean,
        default:false
    },
    productOrders: [
        new Schema({
            product: {
                type: Number,
                ref: 'product',
                required: true
            },
            unitCost: {// price of single product
                type: Number,
            },
            size: {
                type: Number,
                ref: 'size',
            },
            color: {
                type: Number,
                ref: 'color',
            },
            count: {
                type: Number,
                default: 1
            },

        }, { _id: false })
    ],
    reason:{
        type:String
    },
    rated: {
        type: Boolean,
        default: false
    },
    ratedProduct: {
        type: [Number],
        ref:'product'
    },
    freeShipping:{
        type: Boolean,
        default: false
    },
    
    refusedDateMillSec:{
        type:Number,
        //default: Date.now
    },
    cancelDateMillSec:{
        type:Number,
        //default: Date.now
    },
    outForDeliveryDateMillSec:{
        type:Number,
        //default: Date.now
    },
    deliveredDateMillSec:{
        type:Number,
        //default: Date.now
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

OrderSchema.index({ location: '2dsphere' });
OrderSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        if (ret.destination) {
            ret.destination = ret.destination.coordinates;
        }
    }
});
autoIncrement.initialize(mongoose.connection);
OrderSchema.plugin(autoIncrement.plugin, { model: 'order', startAt: 1 });

export default mongoose.model('order', OrderSchema);