import mongoose,{ Schema} from "mongoose";
import autoIncrement from 'mongoose-auto-increment';
import { isImgUrl } from "../../helpers/CheckMethods";
const AboutSchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    aboutUs_ar:{
        type: String,
        trim: true,
        required: true
    },
    aboutUs_en:{
        type:String,
        required: true
    },
    email:{
        type:String,
        required: true
    },
    address:{
        type:String,
        required: true
    },
    phone:{
        type:String,
        required: true
    },
    deleted:{
        type:Boolean,
        default:false
    }
}, { timestamps: true });

AboutSchema.index({ location: '2dsphere' });
AboutSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.deleted;
        if (ret.location) {
            ret.location = ret.location.coordinates;
        }
    }
});

autoIncrement.initialize(mongoose.connection);
AboutSchema.plugin(autoIncrement.plugin, { model: 'about', startAt: 1 });

export default mongoose.model('about', AboutSchema);