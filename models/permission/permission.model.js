import mongoose, { Schema } from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';


const permissionSchema = new Schema({

    _id: {
        type: Number,
        required: true
    },
    permission_en: {
        type: String,
        required: true,
        trim: true,
    },
    permission_ar: {
        type: String,
        required: true,
        trim: true
    },
    pages: {
        type: [String],
        enum:["CONTACT-US","SUB-ADMIN","CLIENTS","ARTISTS","ANONCEMENTS",
        "ORDERS","LIVE","BOOKING","FAQ","SETTINGS","CATEGORIES","REPORTS","NOTIFS",
        "STORE","COUNTRIES","ABOUT","PERMISSIONS","PRODUCTS","VERIFY-REQUEST","COUPONS"],
        required: true,
    },
    deleted:{
        type:Boolean,
        default:false
    }
}, { timestamps: true });

permissionSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.deleted;
    }
});


permissionSchema.plugin(autoIncrement.plugin, { model: 'permission', startAt: 1 });

export default mongoose.model('permission', permissionSchema);
