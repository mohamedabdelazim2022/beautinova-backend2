import mongoose, { Schema } from "mongoose";
import Category from "./category.model";
const SubCategorySchema = new Schema({
    parent: {
        type: Number,
        ref:'category'
    },
    details:{
        type:String,
        default:''
    }
}, { discriminatorKey: 'kind', _id: false });


export default Category.discriminator('sub-category', SubCategorySchema);