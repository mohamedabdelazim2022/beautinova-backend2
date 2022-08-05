import mongoose, { Schema } from "mongoose";
import autoIncrement from 'mongoose-auto-increment';
const NotifSchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    resource: {
        type: Number,
        ref: 'user'
    },
    target: {
        type: [Number],
        ref: 'user'
    },
    description_en:{
        type:String
    },
    description_ar:{
        type:String
    },
    title_ar:{
        type:String
    },
    title_en:{
        type:String
    },
    type:{
        type:String,
        enum:['APP','ORDER','FAVOURITE','USER','RATE','PROBLEM','BOOKING','LIVE','LIKE','MESSAGE','NEWS','VERIFY','INSTA-VERIFY','CONTACT']
    },
    anoncement: {
        type: Number,
        ref: 'anoncement',
    },
    contact:{
        type:Number,
        ref:'contact'
    },
    order: {
        type: Number,
        ref: 'order',
    },
    favourite: {
        type: Number,
        ref: 'favourite',
    },
    user: {
        type: Number,
        ref: 'user',
    },
    problem: {
        type: Number,
        ref: 'problem',
    },
    live: {
        type: Number,
        ref: 'live',
    },
    like: {
        type: Number,
        ref: 'like',
    },
    booking: {
        type: Number,
        ref: 'booking',
    },
    rate: {
        type: Number,
        ref: 'rate',
    },
    order: {
        type: Number,
        ref: 'order',
    },
    message: {
        type: Number,
        ref: 'message',
    },
    verify:{
        type: Number,
        ref: 'verify',
    },
    instaVerify:{
        type: Number,
        ref: 'instaVerify',
    },
    read:{
        type:Boolean,
        default:false
    },
    adminNotif:{
        type:Boolean,
        default:false
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

NotifSchema.index({ location: '2dsphere' });
NotifSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
NotifSchema.plugin(autoIncrement.plugin, { model: 'notif', startAt: 1 });

export default mongoose.model('notif', NotifSchema);