import mongoose, { Schema } from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';
import bcrypt from 'bcryptjs';
import isEmail from 'validator/lib/isEmail';
import { isImgUrl } from "../../helpers/CheckMethods";

const userSchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    country: {
        type: Number,
        ref:'country',
        required:true
    },
    fullname: {
        type: String,
        //required: true,
        trim: true
    },
    username: {
        type: String,
        //required: true,
    },
    password: {
        type: String,
        //required: true,
    },
    bio: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        trim: true,
        //required: true,
        validate: {
            validator: (email) => isEmail(email),
            message: 'Invalid Email Syntax'
        }    
    },
    phone: {
        type:String,
        required: true,
        trim: true,
    },
    img: {
        type: String,
        validate: {
            validator: imgUrl => isImgUrl(imgUrl),
            message: 'img is invalid url'
        }
    },
    type: {
        type: String,
        enum: ['ARTIST','ADMIN','USER','SUB-ADMIN'],
        default:'USER',
        required:true
    },

    accountType: {
        type: String,
        enum: ['SIGNUP-PROCESS','ACTIVE'],
        default:'SIGNUP-PROCESS',
        required:true
    },
    signUpFrom:{
        type: String,
        enum:['NORMAL','FACEBOOK','GOOGLE','APPLE','INSTAGRAM'],
        default:'NORMAL',
    },
    socialId:{
        type: String
    },
    favourite:{
        type: [Number],
        ref:'user',
    },
    isFavourite: {
        type: Boolean,
        default: false,
    },
    likedPosts:{
        type: [Number],
        ref:'post',
    },
    city: {
        type: Number,
        ref:'city',
    },
    area: {
        type: Number,
        ref:'area',
    },
    permission: {
        type: Number,
        ref:'permission',
    },
    instaUserName:{
        type: String,
    },
    street: {
        type: String,
        //required: true
    },
    placeType: {
        type: String,
        //required: true
    },
    floor: {
        type: String,
        //required: true
    },
    apartment: {
        type: String,
        //required: true
    },
    address: {
        type: String,
        //required: true
    },
    token:{
        type:[String],
    },
    block:{
        type: Boolean,
        default: false
    },
    active:{
        type: Boolean,
        default: false
    },
    online:{
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Number
    },
    verifycode: {
        type: Number
    },
    carts:{
        type: [Number],
        ref:'cart',
    },
    ///artist
    services: [
        new Schema({
            service: {
                type: Number,
                ref:'category',
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
        }, { _id: false })
        
    ],
    studio:{ 
        type: Boolean,
        default: false,
    },
    rateCount: {
        type: Number,
        default:0
    },
    rateNumbers: {
        type: Number,
        default:0
    },
    rate: {
        type: Number,
        default:0
    },
    viewsCount:{
        type: Number,
        default: 0
    },
    viewers:{
        type: [Number],
        ref:'user'
    },
    favCount:{
        type: Number,
        default:0
    },
    favCategories:{
        type: [Number],
        ref:'category'
    },
    balance:{
        type: Number,
        default:0
    },
    verify:{
        type: Boolean,
        default: false
    },
    instaVerify:{
        type: Boolean,
        default: false
    },
    phoneVerify:{
        type: Boolean,
        default: false
    },
    emailVerify:{
        type: Boolean,
        default: false
    },
    usedCoupons:{
        type: [Number],
        ref:'coupon'
    },
    sendWeeklyNotif:{
        type:Boolean,
        default:false
    },
    notifsDate:{
        type:Date,
    },
    lastLikeDate:{
        type:Date,
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true, discriminatorKey: 'kind' });

userSchema.pre('save', function (next) {
    const account = this;
    if (!account.isModified('password')) return next();

    const salt = bcrypt.genSaltSync();
    bcrypt.hash(account.password, salt).then(hash => {
        account.password = hash;
        next();
    }).catch(err => console.log(err));
});
userSchema.index({ location: '2dsphere' });
userSchema.methods.isValidPassword = function (newPassword, callback) {
    let user = this;
    bcrypt.compare(newPassword, user.password, function (err, isMatch) {
        if (err)
            return callback(err);
        callback(null, isMatch);
    });
};

userSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret.password;
        delete ret._id;
        delete ret.__v;
        delete ret.verifycode;
        delete ret.favCategories;
        if (ret.location) {
            ret.location = ret.location.coordinates;
        }
        if(ret.type !=="SUB-ADMIN"){
            delete ret.permission;
        }
        if (ret.type != 'ARTIST') {
            delete ret.services;
            delete ret.rateCount;
            delete ret.rateNumbers;
            delete ret.rate;
            delete ret.viewCount;
            delete ret.viewers
        }
    }
});
autoIncrement.initialize(mongoose.connection);
userSchema.plugin(autoIncrement.plugin, { model: 'user', startAt: 1 });
export default mongoose.model('user', userSchema);