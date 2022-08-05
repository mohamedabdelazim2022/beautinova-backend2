import { checkExistThenGet, checkExist ,isInArray,isImgUrl} from '../../helpers/CheckMethods';
import { body } from 'express-validator/check';
import { checkValidations, handleImg,convertLang ,convertLangSocket} from '../shared/shared.controller';
import { generateToken } from '../../utils/token';
import ApiResponse from "../../helpers/ApiResponse";
import User from "../../models/user/user.model";
import Report from "../../models/reports/report.model";
import Address from "../../models/address/address.model";
import ApiError from '../../helpers/ApiError';
import bcrypt from 'bcryptjs';
import { generateVerifyCode } from '../../services/generator-code-service';
import Notif from "../../models/notif/notif.model";
import Product from "../../models/product/product.model";
import Booking from "../../models/booking/booking.model";
import Anoncement from "../../models/anoncement/anoncement.model";
import Rate from "../../models/rate/rate.model";
import Favourite from "../../models/favourite/favourite.model";
import View from "../../models/viewing/viewing.model";
import Compare from "../../models/compare/compare.model";
import Post from "../../models/post/post.model";
import { sendEmail } from "../../services/emailMessage.service";
import {sendSms} from "../../services/message-service"
import Country from "../../models/country/country.model";
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import i18n from "i18n";
import moment from "moment";
import {transformUser,transformUserById } from '../../models/user/transformUser';
import { transformPost } from "../../models/post/transformPost";
import { transformProduct } from "../../models/product/transformProduct";
import Order from "../../models/order/order.model";
import Live from "../../models/live/live.model";
import Logger from "../../services/logger";
const logger = new Logger('cart '+ new Date(Date.now()).toDateString())
const checkUserExistByPhone = async (phone) => {
    let user = await User.findOne({ phone:phone,deleted:false });
    if (!user)
        throw new ApiError.BadRequest('Phone Not Found');

    return user;
}
const checkUserExistByEmail = async (email) => {
    let user = await User.findOne({ email : email,delete : false});
    if (!user)
        throw new ApiError.BadRequest('email Not Found');

    return user;
}
const populateQuery = [
    {
        path: 'permission', model: 'permission',
    },
    {
        path: 'country', model: 'country',
    },
    {
        path: 'city', model: 'city',
    },
    {
        path: 'area', model: 'area',
    },
    {
        path: 'services.service', model: 'category',
    },
];

const populateQueryProduct = [
    { path: 'category', model: 'category' },
    { path: 'subCategory', model: 'category' },
    { path: 'brand', model: 'brand' },
];
const populateQueryPost = [
    {path: 'owner', model: 'user'},
    {path: 'category', model: 'category'}
];

export default {
    async addToken(req,res,next){
        try{
            convertLang(req)
            let user = req.user;
            let users = await checkExistThenGet(user.id, User);
            let arr = users.token;
            var found = arr.find(function(element) {
                return element == req.body.token;
            });
            if(!found){
                users.token.push(req.body.token);
                await users.save();
            console.log(req.body.token);
            }
            res.status(200).send({
                users,
            });
            
        } catch(err){
            next(err);s
        }
    },
    async signIn(req, res, next) {
        try{
            convertLang(req)
            let user = req.user;
            user = await User.findById(user.id).populate(populateQuery);
           
            if(!user)
                return next(new ApiError(403, ('phone or password incorrect')));
            
            if(user.block == true){
                return next(new ApiError(500, (i18n.__('user.block'))));
            }
            if(user.deleted == true){
                return next(new ApiError(500, (i18n.__('user.delete'))));
            }
            /*if(user.active == false){
                return next(new ApiError(403, ('sorry you are not active')));
            }*/

            if(req.body.token != null && req.body.token !=""){
                let arr = user.token; 
                var found = arr.find(function(element) {
                    return element == req.body.token;
                });
                if(!found){
                    user.token.push(req.body.token);
                    await user.save();
                }
            }
            if(user.accountType === "SIGNUP-PROCESS"){
                res.status(200).send({
                    success: true,
                    user: await User.findById(user.id).populate(populateQuery),
                    
                });
            }else{
                res.status(200).send({
                    success: true,
                    user: await User.findById(user.id).populate(populateQuery),
                    token: generateToken(user.id)
                });
            }
            
            
            
        } catch(err){
            next(err);
        }
    },
    validateSocialLoginBody(isUpdate = false) {
        let validations = [
            body('username').optional().custom(async (value, { req }) => {
                let userQuery = { username: { $regex: value , '$options' : 'i'  },deleted:false };
                if (isUpdate && req.user.username == value)
                    userQuery._id = { $ne: req.user._id };

                if (await User.findOne(userQuery))
                    throw new Error(req.__('username.duplicated'));
                else
                    return true;
            }),
            body('fullname').optional(),
            body('token').optional(),
            body('socialId').not().isEmpty().withMessage((value, { req}) => {
                return req.__('socialId.required', { value});
            }),
            body('signUpFrom').optional(),
            body('country').optional(),
            body('phone').trim().escape().optional()
            .custom(async (value, { req }) => {
                var exp = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[s/./0-9]*$/g
                if(!exp.test(value)){
                    throw new Error(req.__('phone.syntax'));
                }
                let userQuery = { phone: value,deleted:false };
                if (isUpdate && req.user.phone === value)
                    userQuery._id = { $ne: req.user._id };

                if (await User.findOne(userQuery))
                    throw new Error(req.__('phone.duplicated'));
                else
                    return true;
                
            }),
            body('email').optional().isEmail().custom(async (value, { req }) => {
                let userQuery = { email: { $regex: value , '$options' : 'i'  },deleted:false };
                if (isUpdate && req.user.email == value)
                    userQuery._id = { $ne: req.user._id };

                if (await User.findOne(userQuery))
                    throw new Error(req.__('email.duplicated'));
                else
                    return true;
            }),
            body('type').optional().isIn(['ARTIST','ADMIN','USER','SUB-ADMIN']).withMessage((value, { req}) => {
                    return req.__('type.invalid', { value});
                }),
        ];
        return validations;
    },
    async socialLogin(req, res, next) {
        try{
            const validatedBody = checkValidations(req);
            let user = await User.findOne({socialId:validatedBody.socialId,deleted:false}).populate(populateQuery);
            if(user){
                console.log(user)
                if(validatedBody.token != null && validatedBody.token !=""){
                    let arr = user.token; 
                    var found = arr.find(function(element) {
                        return element == validatedBody.token;
                    });
                    if(!found){
                        user.token.push(validatedBody.token);
                        await user.save();
                    }
                }
                if(user.block == true){
                    return next(new ApiError(500, (i18n.__('user.block'))));
                }
                if(user.deleted == true){
                    return next(new ApiError(500, (i18n.__('user.delete'))));
                }
                if(user.phoneVerify == false){
                    res.status(200).send({
                        success: true,
                        user: await User.findOne({socialId:user.socialId,deleted:false}).populate(populateQuery),
                    });
                }else{
                    res.status(200).send({
                        success: true,
                        user: await User.findOne({socialId:user.socialId,deleted:false}).populate(populateQuery),
                        token: generateToken(user.id)
                    });
                }
                
            }else{
                if(!validatedBody.country)
                    return next(new ApiError(422, (i18n.__('country.required'))));
                await checkExistThenGet(validatedBody.country,Country, { deleted: false })
                validatedBody.accountType ="ACTIVE"
                let createdUser = await User.create({
                    ...validatedBody
                });
                res.status(201).send({
                    success: true,
                    user: await User.findById(createdUser.id).populate(populateQuery),
                    //token: generateToken(createdUser.id)
                });
            }
            
            
        } catch(err){
            next(err);
        }
    },
    validateSignUpBody(isUpdate = false) {
        let validations = [
            body('token').optional(),
            body('signUpFrom').optional(),
            body('password').not().isEmpty().withMessage((value, { req}) => {
                return req.__('password.required', { value});
            }).isLength({ min: 8 }).withMessage((value, { req}) => {
                return req.__('password.invalid', { value});
            }).custom(async (value, { req }) => {
                var exp = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
                //"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$""
                if(!exp.test(value)){
                    throw new Error(req.__('password.invalid'));
                }
                else
                    return true;
                
            }),
            body('country').not().isEmpty().withMessage((value, { req}) => {
                return req.__('country.required', { value});
            }),
            body('phone').trim().escape().not().isEmpty().withMessage((value, { req}) => {
                return req.__('phone.required', { value});
            })//.isLength({ min: 9,max:14 })
            .custom(async (value, { req }) => {
                var exp = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[s/./0-9]*$/g
                if(!exp.test(value)){
                    throw new Error(req.__('phone.syntax'));
                }
                let userQuery = { phone: value,deleted:false };
                if (isUpdate && req.user.phone === value)
                    userQuery._id = { $ne: req.user._id };

                if (await User.findOne(userQuery))
                    throw new Error(req.__('phone.duplicated'));
                else
                    return true;
                
            }),
            body('email').optional().isEmail(),
            body('type').not().isEmpty().withMessage((value, { req}) => {
                return req.__('type.required', { value});
            }).isIn(['ARTIST','ADMIN','USER','SUB-ADMIN']).withMessage((value, { req}) => {
                    return req.__('type.invalid', { value});
                }),
        ];
        return validations;
    },
    async signUp(req, res, next) {
        try {
            const validatedBody = checkValidations(req);
            let createdUser = await User.create({
                ...validatedBody
            });
            //send code
            // let theUser = await checkExistThenGet(createdUser.id, User,{deleted: false });
            // let code =  generateVerifyCode();
            // if(code.toString().length < 4){
            //     code = generateVerifyCode(); 
            // }else{
            //     theUser.verifycode = code
            // }
            // console.log(code)
            // theUser.verifycode = "0000" 
            // await theUser.save();
            // let country = await checkExistThenGet(validatedBody.country,Country)
            // let realPhone = country.countryCode + validatedBody.phone;
            // let message =  ' رمز الدخول الخاص ب Beauti Nova هو ' + theUser.verifycode
            // sendSms(realPhone,message)
            let reports = {
                "action":"User Sign Up",
            };
            await Report.create({...reports, user: createdUser.id });
            res.status(201).send({
                success: true,
                user: await User.findById(createdUser.id).populate(populateQuery),
                //token: generateToken(createdUser.id)
            });
            

        } catch (err) {
            next(err);
        }
    },
    validateVerifyPhone() {
        return [
            // body('verifycode').not().isEmpty().withMessage((value, { req}) => {
            //     return req.__('verifycode.required', { value});
            // }),
            body('phone').not().isEmpty().withMessage((value, { req}) => {
                return req.__('phone.required', { value});
            }).custom(async (value, { req }) => {
                var exp = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[s/./0-9]*$/g
                if(!exp.test(value)){
                    throw new Error(req.__('phone.syntax'));
                }else{
                    return true;
                }
            })
        ];
    },
    async verifyPhone(req, res, next) {
        try {
            convertLang(req)
            let validatedBody = checkValidations(req);
            let user = await checkUserExistByPhone(validatedBody.phone);
            // if (user.verifycode != validatedBody.verifycode)
            //     return next(new ApiError.BadRequest(i18n.__('verifyCode.notMatch')));
            
            user.active = true;
            user.phoneVerify = true;
            await user.save();
            ////
            if(user.accountType == "ACTIVE"){
                res.status(200).send({
                    success: true,
                    user: await User.findById(user.id).populate(populateQuery),
                    token:generateToken(user.id)
                });
            }else{
                res.status(200).send({
                    success: true,
                    accountType:user.accountType,
                    user: await User.findById(user.id).populate(populateQuery),
                });
            }
           
        } catch (err) {
            next(err);
        }
    },
    validateComplateDataBody(isUpdate = false) {
        let validations = [
            body('username').not().isEmpty().withMessage((value, { req}) => {
                return req.__('username.required', { value});
            }).custom(async (value, { req }) => {
                let {userId} = req.params;
                let user = await checkExistThenGet(userId, User);
                let userQuery = { username: { $regex: value , '$options' : 'i'  },deleted:false };
                if (isUpdate && user.username == value)
                    userQuery._id = { $ne: userId };

                if (await User.findOne(userQuery))
                    throw new Error(req.__('username.duplicated'));
                else
                    return true;
            }),
            body('fullname').not().isEmpty().withMessage((value, { req}) => {
                return req.__('fullname.required', { value});
            }),
            body('city').optional(),
            body('area').optional(),
            body('street').optional(),
            body('placeType').optional(),
            body('floor').optional(),
            body('apartment').optional(),
            body('address').optional(),
            body('studio').optional(),
            body('country').optional(),
            body('phone').optional()
            .custom(async (value, { req }) => {
                var exp = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[s/./0-9]*$/g
                if(!exp.test(value)){
                    throw new Error(req.__('phone.syntax'));
                }
                let {userId} = req.params;
                let user = await checkExistThenGet(userId, User);
                let userQuery = { phone: value ,deleted:false};
                if (isUpdate && user.phone === value)
                    userQuery._id = { $ne: userId };

                if (await User.findOne(userQuery))
                    throw req.__('phone.duplicated')
                else
                    return true;
            }),
            
            body('email').not().isEmpty().withMessage((value, { req}) => {
                return req.__('email.required', { value});
            }).isEmail().withMessage('email.syntax').custom(async (value, { req }) => {
                    let {userId} = req.params;
                    let user = await checkExistThenGet(userId, User);

                    let userQuery = { email: { $regex: value , '$options' : 'i'  },deleted:false };
                    if (isUpdate && user.email == value)
                        userQuery._id = { $ne: userId };
                    if (await User.findOne(userQuery))
                        throw new Error(req.__('email.duplicated'));
                    else
                        return true;
            }),
            body('services').optional()
            .custom(async (services, { req }) => {
                for (let prop of services) {
                    body('service').not().isEmpty().withMessage((value, { req}) => {
                        return req.__('service.required', { value});
                    })
                    body('price').not().isEmpty().withMessage((value, { req}) => {
                        return req.__('service.required', { value});
                    })
                }
                return true;
            }),
            body('type').optional().isIn(['ARTIST','ADMIN','USER','SUB-ADMIN']).withMessage((value, { req}) => {
                    return req.__('type.invalid', { value});
                }),
        ];
        if (!isUpdate) {
            validations.push([
                body('password').optional().isLength({ min: 8 }).withMessage((value, { req}) => {
                    return req.__('password.invalid', { value});
                }).custom(async (value, { req }) => {
                    var exp = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
                    if(!exp.test(value)){
                        throw new Error(req.__('password.invalid'));
                    }
                    else
                        return true;
                    
                }),
                
                body('img').optional().custom(val => isImgUrl(val)).withMessage((value, { req}) => {
                    return req.__('image.invalid', { value});
                })
            ]);
        }
        return validations;
    },
    
    async completeSignUp(req, res, next) {
        try {
            convertLang(req)
            const validatedBody = checkValidations(req);
            let {userId} = req.params;
            let user = await checkExistThenGet(userId, User);
            user.accountType='ACTIVE'
            if(validatedBody.services){
                user.services = validatedBody.services;
            }
            if(validatedBody.studio){
                user.studio = validatedBody.studio;
            }
            if(validatedBody.phone){
                user.phone = validatedBody.phone;
            }
            if(validatedBody.fullname){
                user.fullname = validatedBody.fullname;
            }
            if(validatedBody.username){
                user.username = validatedBody.username;
            }

            if(validatedBody.email){
                user.email = validatedBody.email;
            }
            if(validatedBody.type){
                user.type = validatedBody.type;
            }
            if(validatedBody.password){
                user.password = validatedBody.password;
            }
            await user.save();
           
            res.status(200).send({
                success: true,
                user: await User.findById(userId).populate(populateQuery),
                token:generateToken(userId)
            });


        } catch (error) {
            next(error);
        }
    },
    validateUserCreateBody(isUpdate = false) {
        let validations = [
            body('country').not().isEmpty().withMessage((value, { req}) => {
                return req.__('country.required', { value});
            }),
            body('username').not().isEmpty().withMessage((value, { req}) => {
                return req.__('username.required', { value});
            }).custom(async (value, { req }) => {
                let userQuery = { username: { $regex: value , '$options' : 'i'  },deleted:false };
                if (isUpdate && req.user.username == value)
                    userQuery._id = { $ne: req.user._id };

                if (await User.findOne(userQuery))
                    throw new Error(req.__('username.duplicated'));
                else
                    return true;
            }),
            body('fullname').not().isEmpty().withMessage((value, { req}) => {
                return req.__('fullname.required', { value});
            }),
            body('city').optional(),
            body('area').optional(),
            body('street').optional(),
            body('placeType').optional(),
            body('floor').optional(),
            body('apartment').optional(),
            body('address').optional(),
            body('bio').optional(),
            body('studio').optional(),
            body('phone').not().isEmpty().withMessage((value, { req}) => {
                return req.__('phone.required', { value});
            })
            .custom(async (value, { req }) => {
                var exp = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[s/./0-9]*$/g
                if(!exp.test(value)){
                    throw new Error(req.__('phone.syntax'));
                }
                let userQuery = { phone: value,deleted:false };
                if (isUpdate && req.user.phone === value)
                    userQuery._id = { $ne: req.user._id };

                if (await User.findOne(userQuery))
                    throw new Error(req.__('phone.duplicated'));
                else
                    return true;
            }),
           
            body('email').not().isEmpty().not().isEmpty().withMessage((value, { req}) => {
                return req.__('email.required', { value});
            }).isEmail().withMessage('email.syntax')
                .custom(async (value, { req }) => {
                    let userQuery = { email: { $regex: value , '$options' : 'i'  },deleted:false };
                    if (isUpdate && req.user.email == value)
                        userQuery._id = { $ne: req.user._id };

                    if (await User.findOne(userQuery))
                        throw new Error(req.__('email.duplicated'));
                    else
                        return true;
                }),
            body('services').optional()
                .custom(async (services, { req }) => {
                    for (let prop of services) {
                        body('service').not().isEmpty().withMessage((value, { req}) => {
                            return req.__('service.required', { value});
                        })
                        body('price').not().isEmpty().withMessage((value, { req}) => {
                            return req.__('price.required', { value});
                        })
                    }
                    return true;
                }),
            body('type').not().isEmpty().withMessage((value, { req}) => {
                    return req.__('type.required', { value});
                }).isIn(['ARTIST','ADMIN','USER','SUB-ADMIN']).withMessage((value, { req}) => {
                        return req.__('type.invalid', { value});
                    }),
            body('permission').optional()
        ];
        if (!isUpdate) {
            validations.push([
                body('password').optional().isLength({ min: 8 }).withMessage((value, { req}) => {
                    return req.__('password.invalid', { value});
                }).custom(async (value, { req }) => {
                    var exp = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
                    if(!exp.test(value)){
                        throw new Error(req.__('password.invalid'));
                    }
                    else
                        return true;
                    
                }),
                body('img').optional().custom(val => isImgUrl(val)).withMessage((value, { req}) => {
                    return req.__('image.invalid', { value});
                })
            ]);
        }
        return validations;
    },
    async addUser(req, res, next) {
        try {
            convertLang(req)
            const validatedBody = checkValidations(req);
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            if (req.file) {
               let image = await handleImg(req)
               validatedBody.img = image;
            }
            validatedBody.accountType = "ACTIVE"
            let createdUser = await User.create({
                ...validatedBody,token:req.body.token
            });
            let reports = {
                "action":"add User",
            };
            await Report.create({...reports, user: createdUser.id });
            res.status(201).send({
                success: true,
                user: await User.findById(createdUser.id).populate(populateQuery),
                token: generateToken(createdUser.id)
            });
        } catch (err) {
            next(err);
        }
    },
    async block(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 

            let { userId} = req.params;
            let activeUser = await checkExistThenGet(userId,User);
            activeUser.block = true;
            await activeUser.save();
            sendNotifiAndPushNotifi({
                targetUser: userId, 
                fromUser: user._id, 
                text: 'BeautiNova ',
                subject: userId,
                subjectType: 'logout',
                info:'logout',
                content_available:true
            });
            let reports = {
                "action":"block User",
            };
            let  report = await Report.create({...reports, user: user });
            res.send({success: true});
        } catch (error) {
            next(error);
        }
    },
    async unblock(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 

            let { userId} = req.params;
            let activeUser = await checkExistThenGet(userId,User);
            activeUser.block = false;
            await activeUser.save();
            let reports = {
                "action":"Active User",
            };
            await Report.create({...reports, user: user });
            res.send({success: true});
        } catch (error) {
            next(error);
        }
    },
    async active(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 

            let { userId} = req.params;
            let activeUser = await checkExistThenGet(userId,User);
            activeUser.active = true;
            await activeUser.save();
            let reports = {
                "action":"Active User",
            };
            await Report.create({...reports, user: user });
            sendNotifiAndPushNotifi({
                targetUser: userId, 
                fromUser: req.user, 
                text: 'Beauti Nova',
                subject: activeUser.id,
                subjectType: 'Beauti Nova active your acount',
                info:'user'
            });
            let notif = {
                "description_en":'Beauti Nova active your acount',
                "description_ar":'تم تفعيل الحساب الخاص بك',
                "title_ar":"اشعار النطام",
                "title_en":"app Notification",
                "type":"APP"
            }
            await Notif.create({...notif,resource:req.user,target:userId,user:activeUser.id});
            res.send({success: true});
            
        } catch (error) {
            next(error);
        }
    },
    async disactive(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 

            let { userId} = req.params;
            let activeUser = await checkExistThenGet(userId,User);
            activeUser.active = false;
            await activeUser.save();
            let reports = {
                "action":"Dis-Active User",
            };
            await Report.create({...reports, user: user });
            res.send({success: true});
        } catch (error) {
            next(error);
        }
    },
    validateUpdatedPassword(isUpdate = false) {
        let validation = [
            body('newPassword').not().isEmpty().withMessage((value, { req}) => {
                return req.__('newPassword.required', { value});
            }).isLength({ min: 6 }).withMessage((value, { req}) => {
                return req.__('newPassword.invalid', { value});
            }),
            body('currentPassword').not().isEmpty().withMessage((value, { req}) => {
                return req.__('currentPassword.required', { value});
            }).isLength({ min: 6 }).withMessage((value, { req}) => {
                return req.__('currentPassword.invalid', { value});
            }),
           
        ];

        return validation;
    },
    async updatePassword(req, res, next) {
        try {
            convertLang(req)
            let user = await checkExistThenGet(req.user._id, User);
            if (req.body.newPassword) {
                if (req.body.currentPassword) {
                    if (bcrypt.compareSync(req.body.currentPassword, user.password)) {
                        user.password = req.body.newPassword;
                    }
                    else {
                        res.status(400).send({
                            errors: [
                                {
                                    location: 'body',
                                    param: 'currentPassword',
                                    msg: i18n.__('currentPassword.invalid')
                                }
                            ]
                        });
                    }
                }
            }
            await user.save();
            res.status(200).send({
                success: true,
                user: await User.findById(req.user._id).populate(populateQuery),
                token:generateToken(req.user._id)
            });

        } catch (error) {
            next(error);
        }
    },
    validateVerifyEmail() {
        return [
            body('verifycode').not().isEmpty().withMessage((value, { req}) => {
                return req.__('verifycode.required', { value});
            }),
            body('email').not().isEmpty().withMessage((value, { req}) => {
                return req.__('email.required', { value});
            }),
        ];
    },
    async verifyEmail(req, res, next) {
        try {
            convertLang(req)
            let validatedBody = checkValidations(req);
            let user = await checkUserExistByEmail(validatedBody.email);
            if (user.verifycode != validatedBody.verifycode)
                return next(new ApiError.BadRequest(i18n.__('verifyCode.notMatch')));
            
            user.emailVerify = true;
            await user.save();
            ////
            res.status(200).send({success: true})
           
        } catch (err) {
            next(err);
        }
    },
    //forget password send to email
    
    validateSendCode() {
        return [
            body('email').not().isEmpty().withMessage((value, { req}) => {
                return req.__('email.required', { value});
            }).isEmail().withMessage('email.syntax')
        ];
    },
    async sendCodeToEmail(req, res, next) {
        try {
            convertLang(req)
            let validatedBody = checkValidations(req);
            let user = await checkUserExistByPhone(validatedBody.phone);
            user.verifycode = generateVerifyCode(); 
            await user.save();
            //send code
            let text = user.verifycode.toString();
            let description = ' verfication code ';
            sendEmail(validatedBody.email, text,description)
            res.status(200).send({success: true});
        } catch (error) {
            next(error);
        }
    },
    validateConfirmVerifyCode() {
        return [
            body('verifycode').not().isEmpty().withMessage((value, { req}) => {
                return req.__('verifycode.required', { value});
            }),
            body('email').not().isEmpty().withMessage((value, { req}) => {
                return req.__('email.required', { value});
            }).isEmail().withMessage('email.syntax')
        ];
    },
    async resetPasswordConfirmVerifyCode(req, res, next) {
        try {
            convertLang(req)
            let validatedBody = checkValidations(req);
            let user = await checkUserExistByEmail(validatedBody.email);
            if (user.verifycode != validatedBody.verifycode)
                return next(new ApiError.BadRequest(i18n.__('verifyCode.notMatch')));
            /////
            user.active = true;
            await user.save();
            ////
            
            res.status(200).send({success: true});
        } catch (err) {
            next(err);
        }
    },

    validateResetPassword() {
        return [
            body('email').not().isEmpty().withMessage((value, { req}) => {
                return req.__('email.required', { value});
            }).isEmail().withMessage('email.syntax'),
            body('newPassword').not().isEmpty().withMessage((value, { req}) => {
                return req.__('newPassword.required', { value});
            }).isLength({ min: 8 }).withMessage((value, { req}) => {
                return req.__('newPassword.invalid', { value});
            }).custom(async (value, { req }) => {
                var exp = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
                if(!exp.test(value)){
                    throw new Error(req.__('newPassword.invalid'));
                }
                else
                    return true;
                
            }),
        ];
    },

    async resetPassword(req, res, next) {
        try {
            convertLang(req)
            let validatedBody = checkValidations(req);
            let user = await checkUserExistByEmail(validatedBody.email);

            user.password = validatedBody.newPassword;
            await user.save();
            res.status(200).send({success: true,msg:i18n.__('done')});

        } catch (err) {
            next(err);
        }
    },
    validateForgetPassword() {
        return [
            body('phone').not().isEmpty().withMessage((value, { req}) => {
                return req.__('phone.required', { value});
            }).custom(async (value, { req }) => {
                var exp = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[s/./0-9]*$/g
                if(!exp.test(value)){
                    throw new Error(req.__('phone.syntax'));
                }else{
                    return true;
                }
            })
        ];
    },
    async forgetPasswordSms(req, res, next) {
        try {
            convertLang(req)
            let validatedBody = checkValidations(req);
            let realPhone = validatedBody.phone;
            let user = await checkUserExistByPhone(validatedBody.phone);

            user.verifycode = generateVerifyCode();
            await user.save();
             //send code
            let message =  ' رمز الدخول الخاص ب Beauti Nova هو ' + user.verifycode
            sendSms(realPhone,message)
            let reports = {
                "action":"send verify code to user",
            };
            await Report.create({...reports, user: req.user });
            res.status(200).send({success: true});
        } catch (error) {
            next(error);
        }
    },
    validateConfirmVerifyCodePhone() {
        return [
            body('phone').not().isEmpty().withMessage((value, { req}) => {
                return req.__('phone.required', { value});
            }).custom(async (value, { req }) => {
                var exp = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[s/./0-9]*$/g
                if(!exp.test(value)){
                    throw new Error(req.__('phone.syntax'));
                }else{
                    return true;
                }
            }),
            body('verifycode').not().isEmpty().withMessage((value, { req}) => {
                return req.__('verifycode.required', { value});
            }),
        ];
    },
    async resetPasswordConfirmVerifyCodePhone(req, res, next) {
        try {
            convertLang(req)
            let validatedBody = checkValidations(req);
            let user = await checkUserExistByPhone(validatedBody.phone);
            if (user.verifycode != validatedBody.verifycode)
                return next(new ApiError.BadRequest(i18n.__('verifyCode.notMatch')));
            user.active = true;
            await user.save();
            res.status(200).send({success: true});
        } catch (err) {
            next(err);
        }
    },
    validateResetPasswordPhone() {
        return [
            body('phone').not().isEmpty().withMessage((value, { req}) => {
                return req.__('phone.required', { value});
            }),
            body('newPassword').not().isEmpty().withMessage((value, { req}) => {
                return req.__('newPassword.required', { value});
            }).isLength({ min: 8 }).withMessage((value, { req}) => {
                return req.__('newPassword.invalid', { value});
            }).custom(async (value, { req }) => {
                var exp = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
                if(!exp.test(value)){
                    throw new Error(req.__('newPassword.invalid'));
                }
                else
                    return true;
                
            }),
        ];
    },
    async resetPasswordPhone(req, res, next) {
        try {
            convertLang(req)
            let validatedBody = checkValidations(req);
            let user = await checkUserExistByPhone(validatedBody.phone);
            user.password = validatedBody.newPassword;
            await user.save();
            let reports = {
                "action":"User reset Password",
            };
            await Report.create({...reports, user: req.user });
           
            res.status(200).send({success: true,msg:i18n.__("done")});

        } catch (err) {
            next(err);
        }
    },
    async updateToken(req,res,next){
        try{
            convertLang(req)
            let users = await checkExistThenGet(req.user._id, User);
            let arr = users.token;
            var found = arr.find(function(element) {
                return element == req.body.newToken;
            });
            if(!found){
                users.token.push(req.body.newToken);
                await users.save();
            }
            let oldtoken = req.body.oldToken;
            console.log(arr);
            for(let i = 0;i<= arr.length;i=i+1){
                if(arr[i] == oldtoken){
                    arr.splice(arr[i], 1);
                }
            }
            users.token = arr;
            await users.save();
            res.status(200).send({success: true,data:await checkExistThenGet(req.user._id, User)});
        } catch(err){
            next(err)
        }
    },
    async logout(req,res,next){
        try{
            convertLang(req)
            let users = await checkExistThenGet(req.user._id, User);
            let arr = users.token;
            let token = req.body.token;
            console.log(arr);
            for(let i = 0;i<= arr.length;i=i+1){
                if(arr[i] == token){
                    arr.splice(arr[i], 1);
                }
            }
            users.token = arr;
            await users.save();
            res.status(200).send({success: true});
        } catch(err){
            next(err)
        }
    },
    async findById(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let { id } = req.params;
            await checkExist(id, User, { deleted: false });
            let {userId} = req.params;
            let myUser
            if(userId){
                myUser= await checkExistThenGet(userId, User)
            }
            await User.findById(id).populate(populateQuery)
            .then(async(e)=>{
                let index = await transformUserById(e,lang,myUser,userId)
                res.send({success:true,user:index});
            })
            
        } catch (error) {
            next(error);
        }
    },
    async findAll(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20,
            {verify,phoneVerify,emailVerify,instaVerify,price,search,type, active,accountType,name,viewCount,rate,category,priceFrom,priceTo,userId} = req.query;
            
            let query = {deleted: false };
            if (verify=="true") query.verify = true;
            if (verify=="false") query.verify = false;
            if (phoneVerify=="true") query.phoneVerify = true;
            if (phoneVerify=="false") query.phoneVerify = false;
            if (emailVerify=="true") query.emailVerify = true;
            if (emailVerify=="false") query.emailVerify = false;
            if (instaVerify=="true") query.instaVerify = true;
            if (instaVerify=="false") query.instaVerify = false;
            if (type) query.type = type;
            if(accountType) query.accountType = accountType;
            if (category){
                Object.assign(query, {"services.service":  { $in : category} })
            }
            if(priceTo && priceFrom) {
                Object.assign(query, {"services.price":  {$gte : priceFrom , $lte : priceTo } })
            } 
            if (active=="true") query.active = true;
            if (active=="false") query.active = false;
            if(name){
                query.fullname = { $regex: '.*' + name + '.*' }
            }  
            if(search) {
                Object.assign(query ,{
                    $and: [
                        { $or: [
                            {fullname: { $regex: '.*' + search + '.*' , '$options' : 'i'  }}, 
                            {phone: { $regex: '.*' + search + '.*', '$options' : 'i'  }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                })
            }
            let sortd = {createdAt: -1}
            if (viewCount =="down") sortd = {viewCount:-1};
            if (viewCount =="up") sortd = {viewCount:1};
            if (rate =="down") sortd = {rate:-1};
            if (rate =="up") sortd = {rate:1};
            if (price =="down") sortd = {"services.price":-1};
            if (price =="up") sortd = {"services.price":1};
            let myUser
            if(userId){
                myUser= await checkExistThenGet(userId, User)
            }
            await User.find(query).populate(populateQuery)
            .sort(sortd)
            .limit(limit)
            .skip((page - 1) * limit)
            .then(async(data)=>{
                let newdate = []
                await Promise.all(data.map(async(e)=>{
                    let index = await transformUser(e,lang,myUser,userId)
                    if(e.type ==="ARTIST"){
                        let lastPost = await Post.findOne({deleted: false,owner: e._id}).select("title desxription img likesCount dataType")
                        if(lastPost){
                            index.lastPost = lastPost;
                        }
                    }
                    newdate.push(index)
                }))
                
                const usersCount = await User.countDocuments(query);
                const pageCount = Math.ceil(usersCount / limit);
                res.send(new ApiResponse(newdate, page, pageCount, limit, usersCount, req));
            })
           
        } catch (err) {
            next(err);
        }
    },
    async getAll(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let {verify,phoneVerify,emailVerify,instaVerify,search,type, active,accountType,viewCount,rate,category,priceFrom,priceTo,userId} = req.query;
            
        
            let query = {deleted: false };
            if (verify=="true") query.verify = true;
            if (verify=="false") query.verify = false;
            if (phoneVerify=="true") query.phoneVerify = true;
            if (phoneVerify=="false") query.phoneVerify = false;
            if (emailVerify=="true") query.emailVerify = true;
            if (emailVerify=="false") query.emailVerify = false;
            if (instaVerify=="true") query.instaVerify = true;
            if (instaVerify=="false") query.instaVerify = false;
            if (type) query.type = type;
            if (accountType) query.accountType = accountType;
            if (category){
                Object.assign(query, {"services.service":  { $in : category} })
            }
            if(priceTo && priceFrom) {
                Object.assign(query, {"services.price":  {$gte : priceFrom , $lte : priceTo } })
            } 
            if (active=="true") query.active = true;
            if (active=="false") query.active = false;

            if(search) {
                Object.assign(query ,{
                    $and: [
                        { $or: [
                            {fullname: { $regex: '.*' + search + '.*' , '$options' : 'i'  }}, 
                            {phone: { $regex: '.*' + search + '.*', '$options' : 'i'  }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                })
            }
            let sortd = {createdAt: -1}
            if (viewCount =="down") sortd = {viewCount:-1};
            if (viewCount =="up") sortd = {viewCount:1};
            if (rate =="down") sortd = {rate:-1};
            if (rate =="up") sortd = {rate:1};
            let myUser
            if(userId){
                myUser= await checkExistThenGet(userId, User)
            }
            await User.find(query).populate(populateQuery)
            .sort(sortd)
            .then(async(data)=>{
                let newdate = []
                await Promise.all(data.map(async(e)=>{
                    
                    let index = await transformUser(e,lang,myUser,userId)
                    if(e.type ==="ARTIST"){
                        let lastPost = await Post.findOne({deleted: false,owner: e._id}).select("title desxription img likesCount dataType")
                        if(lastPost){
                            index.lastPost = lastPost;
                        }
                    }
                    newdate.push(index)
                }))
                res.send({success: true,data:newdate});
            });
        } catch (err) {
            next(err);
        }
    },
    async lastRecent(req, res, next) {//last artist user visit it
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20,
            {price,search,type, active,name,viewCount,rate,category,priceFrom,priceTo,userId} = req.query;
            let artists = await View.find({deleted: false,user:req.user,relatedTo:'ARTIST'}).distinct('artist')
            let query = {deleted: false,_id:{$in:artists} };
           
            if (type) query.type = type;
            if (category){
                Object.assign(query, {"services.service":  { $in : category} })
            }
            if(priceTo && priceFrom) {
                Object.assign(query, {"services.price":  {$gte : priceFrom , $lte : priceTo } })
            } 
            if (active=="true") query.active = true;
            if (active=="false") query.active = false;
            if(name){
                query.fullname = { $regex: '.*' + name + '.*' }
            }  
            if(search) {
                Object.assign(query ,{
                    $and: [
                        { $or: [
                            {fullname: { $regex: '.*' + search + '.*' , '$options' : 'i'  }}, 
                            {phone: { $regex: '.*' + search + '.*', '$options' : 'i'  }}, 
                          ] 
                        },
                        {deleted: false},
                        {_id:{$in:artists}}
                    ]
                })
            }
            let sortd = {createdAt: -1}
            if (viewCount =="down") sortd = {viewCount:-1};
            if (viewCount =="up") sortd = {viewCount:1};
            if (rate =="down") sortd = {rate:-1};
            if (rate =="up") sortd = {rate:1};
            if (price =="down") sortd = {"services.price":-1};
            if (price =="up") sortd = {"services.price":1};
            let myUser = await checkExistThenGet(req.user._id, User)
            
            await User.find(query).populate(populateQuery)
            .sort(sortd)
            .limit(limit)
            .skip((page - 1) * limit)
            .then(async(data)=>{
                let newdate = []
                await Promise.all(data.map(async(e)=>{
                    let index = await transformUser(e,lang,myUser,userId)
                    if(e.type ==="ARTIST"){
                        let lastPost = await Post.findOne({deleted: false,owner: e._id}).select("title desxription img likesCount dataType")
                        if(lastPost){
                            index.lastPost = lastPost;
                        }
                    }
                    newdate.push(index)
                }))
                
                const usersCount = await User.countDocuments(query);
                const pageCount = Math.ceil(usersCount / limit);
                res.send(new ApiResponse(newdate, page, pageCount, limit, usersCount, req));
            })
           
        } catch (err) {
            next(err);
        }
    },
    async delete(req, res, next) {
        try {
            convertLang(req)
            let {userId } = req.params;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
            return next(new ApiError(403, i18n.__('admin.auth'))); 
            let user = await checkExistThenGet(userId, User,
                {deleted: false });
            user.deleted = true
            let posts = await Post.find({ owner: userId });
            for (let id of posts) {
                id.deleted = true;
                await id.save();
            }
            let lives = await Live.find({ owner: userId });
            for (let id of lives) {
                id.deleted = true;
                await id.save();
            }
            let orders = await Order.find({ client: userId });
            for (let id of orders) {
                id.deleted = true;
                await id.save();
            }
            let bookings = await Booking.find({ $or: [{client: userId}, {artist: userId}] });
            for (let id of bookings) {
                id.deleted = true;
                await id.save();
            }
            let favs = await Favourite.find({ $or: [{user: userId}, {favPerson: userId}] });
            for (let id of favs) {
                id.favs = true;
                await id.save();
            }
            await user.save();
            let reports = {
                "action":"Delete user",
            };
            await Report.create({...reports, user: req.user._id });
            res.status(200).send({success: true});
        }
        catch (err) {
            next(err);
        }
    },
    validateUpdatedUser(isUpdate = true) {
        let validation = [
            body('fullname').optional(),
            body('username').optional().custom(async (value, { req }) => {
                let {userId} = req.params;
                let user = await checkExistThenGet(userId, User);
                let userQuery = { username: { $regex: value , '$options' : 'i'  },deleted:false };
                if (isUpdate && user.username == value)
                    userQuery._id = { $ne: userId };

                if (await User.findOne(userQuery))
                    throw new Error(req.__('username.duplicated'));
                else
                    return true;
            }),
            body('city').optional(),
            body('area').optional(),
            body('street').optional(),
            body('placeType').optional(),
            body('floor').optional(),
            body('apartment').optional(),
            body('address').optional(),
            body('bio').optional(),
            body('permission').optional(),
            body('studio').optional(),
            body('country').optional(),
            body('balance').optional(),
            body('phone').optional()
            .custom(async (value, { req }) => {
                var exp = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[s/./0-9]*$/g
                if(!exp.test(value)){
                    throw new Error(req.__('phone.syntax'));
                }
                let {userId} = req.params;
                let user = await checkExistThenGet(userId, User);
                let userQuery = { phone: value ,deleted:false};
                if (isUpdate && user.phone === value)
                    userQuery._id = { $ne: userId };

                if (await User.findOne(userQuery))
                    throw new Error(req.__('phone.duplicated'));
                else
                    return true;
            }),
            body('email').optional().isEmail().withMessage('email.syntax')
                .custom(async (value, { req }) => {
                    let {userId} = req.params;
                    let user = await checkExistThenGet(userId, User);
                    let userQuery = { email: { $regex: value , '$options' : 'i'  },deleted:false };
                    if (isUpdate && user.email == value)
                        userQuery._id = { $ne: userId };

                    if (await User.findOne(userQuery))
                        throw new Error(req.__('email.duplicated'));
                    else
                        return true;
            }),
            body('services').optional()
            .isLength({ min: 1 }).withMessage('services should have at least one element of service')
            .custom(async (services, { req }) => {
                for (let prop of services) {
                    body('service').not().isEmpty().withMessage((value, { req}) => {
                        return req.__('service.required', { value});
                    })
                    body('price').not().isEmpty().withMessage((value, { req}) => {
                        return req.__('price.required', { value});
                    })
                }
                return true;
            }),
            body('type').not().isEmpty().withMessage((value, { req}) => {
                return req.__('type.required', { value});
            }).isIn(['ARTIST','ADMIN','USER','SUB-ADMIN']).withMessage((value, { req}) => {
                return req.__('wrong.type', { value});
            })
        ];
        if (isUpdate)
            validation.push([
                body('img').optional().custom(val => isImgUrl(val)).withMessage((value, { req}) => {
                    return req.__('image.invalid', { value});
                })
            ]);

        return validation;
    },
    async updateUser(req, res, next) {
        try {
            convertLang(req)
            const validatedBody = checkValidations(req);
            let {userId} = req.params;
            let user = await checkExistThenGet(userId, User);
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type)){
                if (userId!= req.user._id){
                    return next(new ApiError(403,  i18n.__('notAllow')));
                }
            }
            if (req.file) {
                let image = await handleImg(req)
                user.img = image
             }
            if(validatedBody.services){
                user.services = validatedBody.services;
            }
            if(validatedBody.balance){
                user.balance = validatedBody.balance;
            }
            if(validatedBody.phone){
                user.phone = validatedBody.phone;
            }
            if(validatedBody.fullname){
                user.fullname = validatedBody.fullname;
            }
            if(validatedBody.permission){
                user.permission = validatedBody.permission;
            }
            if(validatedBody.username){
                user.username = validatedBody.username;
            }
            if(validatedBody.bio){
                user.bio = validatedBody.bio;
            }
            if(validatedBody.email){
                user.email = validatedBody.email;
            }
            if(validatedBody.type){
                user.type = validatedBody.type;
            }
            if(validatedBody.city){
                user.city = validatedBody.city;
            }
            if(validatedBody.area){
                user.area = validatedBody.area;
            }
            if(validatedBody.street){
                user.street = validatedBody.street;
            }
            if(validatedBody.placeType){
                user.placeType = validatedBody.placeType;
            }
            if(validatedBody.apartment){
                user.apartment = validatedBody.apartment;
            }
            if(validatedBody.floor){
                user.floor = validatedBody.floor;
            }
            if(validatedBody.address){
                user.address = validatedBody.address;
            }
           
            await user.save();
           
            res.status(200).send({
                success: true,
                user: await User.findById(userId).populate(populateQuery),
                token:generateToken(userId)
            });


        } catch (error) {
            next(error);
        }
    },
    validateNotif() {
        let validations = [
            body('description').withMessage((value, { req}) => {
                return req.__('description.required', { value});
            }),
            body('title').not().isEmpty().withMessage((value, { req}) => {
                return req.__('title.required', { value});
            }),
            body('userType').optional(),
            body('users').optional(),
        ];
        return validations;
    },
    async SendNotif(req, res, next) {
        try {
            convertLang(req) 
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                 return next(new ApiError(403, i18n.__('admin.auth'))); 
            const validatedBody = checkValidations(req);
            let query = {deleted:false}
            //if determine the user type to send notifs to them
            let adminNotif = true
            if(validatedBody.userType){
                let users = await User.find({'type':validatedBody.userType});
                users.forEach(user => {
                    sendNotifiAndPushNotifi({
                        targetUser: user.id, 
                        fromUser: req.user._id, 
                        text: 'Beauti Nova',
                        subject: validatedBody.title,
                        subjectType: validatedBody.description,
                        info:'notifications'
                    });
                    let notif = {
                        "description_en":validatedBody.description,
                        "description_ar":validatedBody.description,
                        "title_en":validatedBody.title,
                        "title_ar":validatedBody.title,
                        "adminNotif":adminNotif,
                        "type":"APP"
                    }
                    adminNotif = false
                    Notif.create({...notif,resource:req.user._id,target:user.id});
                    
                });
            } else{
                //if determine the users ids to send notifs to them
                let users = await User.find({'_id':validatedBody.users});
                users.forEach(user => {
                    sendNotifiAndPushNotifi({
                        targetUser: user.id, 
                        fromUser: req.user._id, 
                        text: 'Dall',
                        subject: validatedBody.title,
                        subjectType:validatedBody.description ,
                        info:'notifications'
                    });
                    let notif = {
                        "description_en":validatedBody.description,
                        "description_ar":validatedBody.description,
                        "title_en":validatedBody.title,
                        "title_ar":validatedBody.title,
                        "type":"APP"
                    }
                    Notif.create({...notif,resource:req.user._id,target:user.id});
                });
            }
            
            let reports = {
                "action":"send notification to all users",
            };
            await Report.create({...reports, user: req.user._id });
            res.status(200).send('notification send');
        } catch (error) {
            next(error)
        }
    },
    async statistics(req, res, next) {

        try {
            convertLang(req)
            let {userId} = req.params;
            let {startDate,endDate} =req.query
            //likes -rating -request-visit -compare
            if(!startDate || !endDate){
                //prev month
                startDate =  moment(new Date()).add(-1, 'M').format('YYYY-MM-DD')
                endDate =new Date()
            }
            console.log(startDate)
            console.log(endDate)
            let bookingCount = await Booking.countDocuments({
                deleted: false,
                artist:userId,
                startDateMillSec: {$gte :Date.parse(startDate) , $lte : Date.parse(endDate) }
            })
            let viewsCount = await View.countDocuments({
                deleted: false,
                artist:userId,
                startDateMillSec: {$gte :Date.parse(startDate) , $lte : Date.parse(endDate) }
            })
            let rateCount = await Rate.countDocuments({
                deleted: false,
                artist:userId,
                dateMillSec: {$gte :Date.parse(startDate) , $lte : Date.parse(endDate) }
            })
            let compareCount = await Compare.countDocuments({
                deleted: false,
                artist:userId,
                dateMillSec: {$gte :Date.parse(startDate) , $lte : Date.parse(endDate) }
            })
            let favCount = await Favourite.countDocuments({
                deleted: false,
                favPerson:userId,
                dateMillSec: {$gte :Date.parse(startDate) , $lte : Date.parse(endDate) }
            })
            res.send({
                bookingCount:bookingCount,
                viewsCount:viewsCount,
                rateCount:rateCount,
                compareCount:compareCount,
                favCount:favCount,
            });
        } catch (err) {
            next(err);
        }
    },
    async statisticsSocket(socket,nsp,data){ // not used 
        
        try {
            var userId = data.userId;
            var toRoom = 'room-'+userId;
            let startDate = data.startDate;
            let endDate = data.endDate;
            //likes -rating -request-visit -compare
            if(!data.startDate || !data.endDate){
                //prev month
                startDate =  moment(new Date()).add(-1, 'M').format('YYYY-MM-DD')
                endDate =new Date()
            }
            console.log(startDate)
            console.log(endDate)
            let bookingCount = await Booking.countDocuments({
                deleted: false,
                artist:userId,
                startDateMillSec: {$gte :Date.parse(startDate) , $lte : Date.parse(endDate) }
            })
            let viewsCount = await View.countDocuments({
                deleted: false,
                artist:userId,
                startDateMillSec: {$gte :Date.parse(startDate) , $lte : Date.parse(endDate) }
            })
            let rateCount = await Rate.countDocuments({
                deleted: false,
                artist:userId,
                dateMillSec: {$gte :Date.parse(startDate) , $lte : Date.parse(endDate) }
            })
            let compareCount = await Compare.countDocuments({
                deleted: false,
                artist:userId,
                dateMillSec: {$gte :Date.parse(startDate) , $lte : Date.parse(endDate) }
            })
            let favCount = await Favourite.countDocuments({
                deleted: false,
                favPerson:userId,
                dateMillSec: {$gte :Date.parse(startDate) , $lte : Date.parse(endDate) }
            })
            let responseDate ={
                bookingCount:bookingCount,
                viewsCount:viewsCount,
                rateCount:rateCount,
                compareCount:compareCount,
                favCount:favCount,
            }
            nsp.to(toRoom).emit('Statistics', {data:responseDate});
           
        }catch (error) {
            console.log(error);
        }
    },
    async explore(req, res, next) {// not used in mobile

        try {
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            convertLang(req)
            let lang = i18n.getLocale(req)
            let favArtist = await Favourite.find({deleted: false,user:req.user._id}).distinct("favPerson");
            let mostFavArtist = await User.find({deleted: false,type:"ARTIST"}).sort({viewCount:-1}).distinct("_id")
            console.log(mostFavArtist)
            console.log(favArtist)
            let allArtists = [...favArtist , ...mostFavArtist]
            let arr1 =[ ...new Set(allArtists) ];//artists
            console.log(arr1)
            let bestSeller = await Product.find({deleted: false}).sort({saleCount:-1}).distinct("_id")
            let bestRate = await Product.find({deleted: false}).sort({rate:-1}).distinct("_id")
            let allProducts = [...bestSeller , ...bestRate]
            let arr2 =[ ...new Set(allProducts) ];
            // let arr3 = await Anoncement.find({deleted: false}).sort({createdAt:-1}).distinct("_id")
            let artists = []
            await Post.find({owner:arr1}).populate(populateQueryPost)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit).then(async(data)=>{
                    data.map(async(e) =>{
                        let index = await transformPost(e,lang)
                        index.type = "ARTIST"
                        artists.push(index);
                    })
                })
            let products = []
            await Product.find({_id:arr2}).populate(populateQueryProduct)
               .sort({ createdAt: -1 })
               .limit(limit)
               .skip((page - 1) * limit).then(async(data)=>{
                   data.map(async(e) =>{
                       let index = await transformProduct(e,lang)
                       index.type = "PRODUCT"
                       products.push(index);
                   })
               })
            let news = []
            await Anoncement.find({deleted: false})
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit).then(async(data)=>{
                    data.map(async(e) =>{
                        let index = {
                            type:"NEWS",
                            title_en:e.title_en,
                            title_ar:e.title_ar,
                            description_ar:e.description_ar,
                            description_en:e.description_en,
                            dataType:e.dataType,
                            img:e.img,
                            createdAt:e.createdAt,
                            id: e._id,
                        }
                        news.push(index);
                    })
                })
            let data = [...artists,...products,...news]
            console.log(data)
            data.sort(function(a, b){return 0.5 - Math.random()});
            console.log(data)
            res.send(data);
        } catch (err) {
            next(err);
        }
    },
    async exploreSocket(socket,data,nsp,userId){ 
        
        try {
            //var userId = data.userId;
            var toRoom = 'room-'+userId;
            let page = data.page?data.page:1
            let limit = data.limit?data.limit:20
            
            let lang = data.lang?data.lang:"ar"
            convertLangSocket(lang)
            let favArtist = await Favourite.find({deleted: false,user:userId}).distinct("favPerson");
            let mostFavArtist = await User.find({deleted: false,type:"ARTIST"}).sort({viewCount:-1}).distinct("_id")
            console.log(mostFavArtist)
            console.log(favArtist)
            let allArtists = [...favArtist , ...mostFavArtist]
            let arr1 =[ ...new Set(allArtists) ];//artists
            console.log(arr1)
            let bestSeller = await Product.find({deleted: false}).sort({saleCount:-1}).distinct("_id")
            let bestRate = await Product.find({deleted: false}).sort({rate:-1}).distinct("_id")
            let allProducts = [...bestSeller , ...bestRate]
            let arr2 =[ ...new Set(allProducts) ];
           // let arr3 = await Anoncement.find({deleted: false}).sort({createdAt:-1}).distinct("_id")
            let artists = []
            await Post.find({owner:arr1}).populate(populateQueryPost)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit).then(async(data)=>{
                    data.map(async(e) =>{
                        let index = await transformPost(e,lang)
                        index.type = "ARTIST"
                        artists.push(index);
                    })
                })
            let products = []
            await Product.find({_id:arr2}).populate(populateQueryProduct)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit).then(async(data)=>{
                    data.map(async(e) =>{
                        let index = await transformProduct(e,lang)
                        index.type = "PRODUCT"
                        products.push(index);
                    })
                })
            let news = []
            await Anoncement.find({deleted: false})
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit).then(async(data)=>{
                    data.map(async(e) =>{
                        let index = {
                            type:"NEWS",
                            title:lang=="ar"?e.title_ar:e.title_en,
                            title_ar:e.title_ar,
                            title_en:e.title_en,
                            description:lang=="ar"?e.description_ar:e.description_en,
                            description_ar:e.description_ar,
                            description_en:e.description_en,
                            dataType:e.dataType,
                            img:e.img,
                            createdAt:e.createdAt,
                            id: e._id,
                        }
                        news.push(index);
                    })
                })
            let responseData = [...artists,...products,...news]
            responseData.sort(function(a, b){return 0.5 - Math.random()});
            nsp.to(toRoom).emit('Explore', {data:responseData});
           
        }catch (error) {
            console.log(error);
        }
    },
    async getAddress(req, res, next){
        try {
            convertLang(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let { userId } = req.params;
            let query = {deleted: false,user:userId};
 
            let userAddress = await Address.find(query)
                .sort({createdAt: -1})
                .limit(limit)
                .skip((page - 1) * limit);


            const userCount = await Address.countDocuments(query);
            const pageCount = Math.ceil(userCount / limit);

            res.send(new ApiResponse(userAddress, page, pageCount, limit, userCount, req));
        } catch (err) {
            next(err);
        }
    },
    async addBalance(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 
            let user = await checkExistThenGet(req.params.userId, User,{deleted: false });
            user.balance = user.balance + parseInt(req.body.balance);
            await user.save();
            logger.info(`add balance :${req.body.balance} to user : ${req.params.userId}` );
            res.status(200).send({success: true,data:await User.findById(req.params.userId).populate(populateQuery)});
        }
        catch (err) {
            next(err);
        }
    },
    

};
