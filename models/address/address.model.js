import mongoose, { Schema } from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const addressSchema=new Schema({
    _id: {
        type: Number,
        required: true
    },
    user:{
        type:Number,
        ref:'user',
        required:true
    },
    city: {
        type: Number,
        ref:'city',
        required: true
    },
    area: {
        type: Number,
        ref:'area',
    },
    phone: {
        type: String,
        default:'',
        required: true
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
    deleted:{
        type:Boolean,
        default:false
    },

},{ timestamps: true });
addressSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
addressSchema.plugin(autoIncrement.plugin, { model: 'address', startAt: 1 });

export default mongoose.model('address', addressSchema);