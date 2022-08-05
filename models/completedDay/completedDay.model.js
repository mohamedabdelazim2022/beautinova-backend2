import mongoose, { Schema } from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const completedDaySchema=new Schema({
    _id: {
        type: Number,
        required: true
    },
    artist: {
        type: Number,
        ref:'user',
        required: true
    },
    date:{
        type: Date,
        required: true,
    },
    deleted:{
        type:Boolean,
        default:false
    },

},{ timestamps: true });
completedDaySchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
completedDaySchema.plugin(autoIncrement.plugin, { model: 'completedDay', startAt: 1 });

export default mongoose.model('completedDay', completedDaySchema);