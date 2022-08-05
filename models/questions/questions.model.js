import mongoose,{ Schema} from "mongoose";
import autoIncrement from 'mongoose-auto-increment';
import { isImgUrl } from "../../helpers/CheckMethods";
const QuestionSchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    question_ar: {
        type: String,
        required: true,
    },
    question_en:{
        type:String,
        required: true,
    },
    answer_ar:{
        type: String,
        required: true,
    },
    answer_en:{
        type:String,
        required: true,
    },
    visible:{
        type: Boolean,
        default: true,
    },
    deleted:{
        type:Boolean,
        default:false
    }
}, { timestamps: true });

QuestionSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
QuestionSchema.plugin(autoIncrement.plugin, { model: 'question', startAt: 1 });

export default mongoose.model('question', QuestionSchema);