import mongoose, { Schema } from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const compareSchema=new Schema({
    _id: {
        type: Number,
        required: true
    },
    user:{
        type:Number,
        ref:'user',
        required:true
    },
    artist:{
        type:Number,
        ref:'user',
        required:true
    },
    dateMillSec:{
        type:Number,
        required: true,
        default:Date.now
    },
    deleted:{
        type:Boolean,
        default:false
    },

},{ timestamps: true });
compareSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
compareSchema.plugin(autoIncrement.plugin, { model: 'compare', startAt: 1 });

export default mongoose.model('compare', compareSchema);