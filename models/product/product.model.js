import mongoose, { Schema } from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const ProductSchema=new Schema({
    _id: {
        type: Number,
        required: true
    },
    name_en: {
        type: String,
        required: true
    },
    name_ar: {
        type: String,
        required: true
    },
    priceFrom: {
        type: Number,
        required: true,
        default:0,
    },
    priceTo: {
        type: Number,
        required: true,
        default:0,
    },
    quantity:{
        type:Number,
        required:true
    },
    category: {
        type: Number,
        ref: 'category',
        required:true
    },
    subCategory: {
        type: Number,
        ref: 'sub-category',
        required:true
    },
    
    brand:{
        type: Number,
        ref: 'brand',
        required:true
    },
    stock:[{
        type: Number,
        ref: 'stock',
        required:true
    }],
    img: [{
        type: String,
        required: true,
    }],
    description_ar:{
        type:String,
        required:true
    },
    description_en:{
        type:String,
        required:true
    },
    hasOffer: {
        type: Boolean,
        default: false
    },
    freeShipping: {
        type: Boolean,
        default: false
    },
    
    rateCount: {
        type: Number,
        default:0
    },
    rateNumbers: {
        type: Number,
        default:0
    },
    rate: {
        type: Number,
        default:0
    },
    visible: {
        type: Boolean,
        default: true
    },
    available:{
        type:Boolean,
        default:true
    },
    sallCount:{
        type: Number,
        default: 0
    },
    viewsCount:{
        type: Number,
        default: 0
    },
    viewers:{
        type: [Number],
        ref:'user'
    },
    top:{
        type:Boolean,
        default:false
    },
    deleted:{
        type:Boolean,
        default:false
    },

},{ timestamps: true });
ProductSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
ProductSchema.plugin(autoIncrement.plugin, { model: 'product', startAt: 1 });

export default mongoose.model('product', ProductSchema);