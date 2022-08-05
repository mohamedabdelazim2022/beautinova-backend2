import mongoose, { Schema } from "mongoose";
import autoIncrement from 'mongoose-auto-increment';
const FavouriteSchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    user: {//فاعل
        type: Number,
        ref: 'user',
        required: true

    },
    favPerson: {//مفعول
        type: Number,
        ref: 'user',
        required: true

    },
    dateMillSec:{
        type:Number,
        required: true,
        default:Date.now
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

FavouriteSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
FavouriteSchema.plugin(autoIncrement.plugin, { model: 'favourite', startAt: 1 });

export default mongoose.model('favourite', FavouriteSchema);