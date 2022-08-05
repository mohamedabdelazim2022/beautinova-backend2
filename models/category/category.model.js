import mongoose, { Schema } from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const CategorySchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    categoryName_en: {
        type: String,
        trim: true,
        required: true,
    },
    categoryName_ar: {
        type: String,
        trim: true,
        required: true,
    },
    type: {
        type: String,
        enum:["PRODUCT","SERVICE"],
        default:"PRODUCT"
    },
    priority:{
        type:Number,
        default:0,
    },
    img: {
        type: String,
        //required: true,
        /*validate: {
            validator: imgUrl => isImgUrl(imgUrl),
            message: 'img is invalid url'
        }*/
    },
    hasChild: {
        type: Boolean,
        default: false
    },
    child:{
        type:[Number]
    },
    main: {
        type: Boolean,
        default: false
    }, 
    isGeneral:{
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    },
    details:{
        type:String,
        default:''
    }
}, { discriminatorKey: 'kind', timestamps: true });

CategorySchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.updatedAt;
        delete ret.__v;
        if(ret.hasChild == false){
            delete ret.child;
            delete ret.hasChild;
        }
    }
});
autoIncrement.initialize(mongoose.connection);
CategorySchema.plugin(autoIncrement.plugin, { model: 'category', startAt: 1 });

export default mongoose.model('category', CategorySchema);