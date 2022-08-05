import mongoose, { Schema } from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';


const areaSchema = new Schema({

    _id: {
        type: Number,
        required: true
    },
    areaName_en: {
        type: String,
        required: true,
        trim: true
    },
    areaName_ar: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: Number,
        ref: 'city'
    },
    delivaryCost: {
        type: Number,
        required: true,
        default:0
    },
    deleted:{
        type:Boolean,
        default:false
    }
});

areaSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.deleted;
    }
});


areaSchema.plugin(autoIncrement.plugin, { model: 'area', startAt: 1 });

export default mongoose.model('area', areaSchema);
