import mongoose, { Schema } from "mongoose";
import autoIncrement from 'mongoose-auto-increment';
const likeSchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    user: {
        type: Number,
        ref: 'user',
        required: true

    },
    post: {
        type: Number,
        ref: 'post',
        required: true

    },
    deleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

likeSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
likeSchema.plugin(autoIncrement.plugin, { model: 'like', startAt: 1 });

export default mongoose.model('like', likeSchema);