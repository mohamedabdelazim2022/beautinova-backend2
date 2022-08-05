import mongoose, { Schema } from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const bookingSchema=new Schema({
    _id: {
        type: Number,
        required: true
    },
    client:{
        type:Number,
        ref:'user',
        //required:true
    },
    clientName:{
        type:String,
    },
    artist:{
        type:Number,
        ref:'user',
        required:true
    },
    service: {
        type: Number,
        ref:'category',
        required: true,
    },
    status:{
        type:String,
        enum:['PENDING','ACCEPTED','REJECTED','CANCEL','COMPLETED'],
        default:'PENDING',
        required:true,
    },
    personsCount:{
        type:Number,
        required:true,
        default:1
    },
    notes:{
        type:String,
        //required:true,
    },
    date:{
        type:Date,
        required: true,
    },
    time:{
        type:String,
        required: true,
    },
    artistNotes:{
        type:[String],
        //required:true,
    },
    startDate:{
        type:Date,
        required: true,
    },
    
    startDateMillSec:{
        type:Number,
        required: true,
    },
    
    type:{
        type:String,
        enum:['ARTIST-BOOKING','CLIENT-BOOKING'],
        default:'CLIENT-BOOKING'
    },
    placeType: {
        type: String,
        required: true
    },

    city: {
        type: Number,
        ref:'city',
        required: true
    },
    area: {
        type: Number,
        ref:'area',
        required: true
    },
    destination: {
        type: { type: String, enum: 'Point' },
        coordinates: { type: [Number] }
    },
    address: {
        type: String,
        //required: true
    },
    endDate:{
        type:Date,
        
    },
    endDateMillSec:{
        type:Number,
        //required: true,
    },
    closeDate:{
        type:Date,
    },
    closeDateMillSec:{
        type:Number,
        //required: true,
    },
    
    reasonType:{
        type:String,
    },
    reason:{
        type:String,
    },
    deleted:{
        type:Boolean,
        default:false
    },

},{ timestamps: true });
bookingSchema.index({ location: '2dsphere' });

bookingSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        if (ret.destination) {
            ret.destination = ret.destination.coordinates;
        }
    }
});
autoIncrement.initialize(mongoose.connection);
bookingSchema.plugin(autoIncrement.plugin, { model: 'booking', startAt: 1 });

export default mongoose.model('booking', bookingSchema);