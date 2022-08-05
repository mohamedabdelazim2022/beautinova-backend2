import ApiResponse from "../../helpers/ApiResponse";
import Report from "../../models/reports/report.model";
import User from "../../models/user/user.model";

import ApiError from '../../helpers/ApiError';
import { checkExist, checkExistThenGet, isImgUrl ,isInArray} from "../../helpers/CheckMethods";
import { handleImgs, checkValidations,convertLang } from "../shared/shared.controller";
import { body } from "express-validator/check";
import VerifyRequest from "../../models/verifyRequest/verifyRequest.model";
import {transformVerifyRequest } from '../../models/verifyRequest/transformVerifyRequest';
import Notif from "../../models/notif/notif.model";
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import i18n from "i18n";
import Logger from "../../services/logger";
const logger = new Logger('verify request '+ new Date(Date.now()).toDateString())
const populateQuery = [
    {
        path: 'user', model: 'user',
    },
];
export default {

    async findAll(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let {status,userId,search} = req.query
            let query = {deleted: false};
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {user: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            if(status) query.status = status;
            
            await VerifyRequest.find(query).populate(populateQuery)
                .sort({createdAt: -1})
                .limit(limit)
                .skip((page - 1) * limit).then(async(data)=>{
                    let newdate = []
                    await Promise.all(data.map(async(e)=>{
                        let value = await transformVerifyRequest(e)
                        newdate.push(value)
                    }))
                    
                    const usersCount = await VerifyRequest.countDocuments(query);
                    const pageCount = Math.ceil(usersCount / limit);
                    res.send(new ApiResponse(newdate, page, pageCount, limit, usersCount, req));
                })

        } catch (err) {
            next(err);
        }
    },
    async findSelection(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let {status,userId,search} = req.query
            let query = {deleted: false};
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {user: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            if(status) query.status = status;
            
            await VerifyRequest.find(query).populate(populateQuery)
                .sort({createdAt: -1}).then(async(data)=>{
                    let newdate = []
                    await Promise.all(data.map(async(e)=>{
                        let value = await transformVerifyRequest(e)
                        newdate.push(value)
                    }))
                    res.send({success: true,data:newdate});
                })

        } catch (err) {
            next(err);
        }
    },
    async findById(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let {id} = req.params;
            await VerifyRequest.findById(id).populate(populateQuery)
                .sort({createdAt: -1}).then(async(e)=>{
                    let index = await transformVerifyRequest(e)
                    res.send({success: true,data:index});
                })

        } catch (err) {
            next(err);
        }
    },

    validateBody(isUpdate = false) {
        let validations = [
            body('img').not().isEmpty().withMessage((value, { req}) => {
                return req.__('img.required', { value});
            })
        ];
        return validations;
    },

    async create(req, res, next) {

        try {
            convertLang(req)
            const validatedBody = checkValidations(req); 
            validatedBody.user = req.user._id;
            let image = await handleImgs(req);
            validatedBody.img = image;
            let verifyRequest =  await VerifyRequest.create({ ...validatedBody});
            let users = await User.find({'type':['ADMIN','SUB-ADMIN']});
            users.forEach(async(user) => {
                sendNotifiAndPushNotifi({
                    targetUser: user.id, 
                    fromUser: req.user._id, 
                    text: 'Beauti Nova',
                    subject: verifyRequest.id,
                    subjectType: 'New Verification Request',
                    info:'verify'
                });
                let notif = {
                    "description_en":'New Verification Request',
                    "description_ar":'طلب تأكيد حساب جديد',
                    "title_ar":"  طلب التفعيل جديد",
                    "title_en":"New Verification Request",
                    "type":"VERIFY"
                }
                await Notif.create({...notif,resource:req.user._id,target:user.id,verify:verifyRequest.id});
            })
            logger.info(`create verify request  ${verifyRequest.id}`);
            let reports = {
                "action":"Create Verification request",
            };
            await Report.create({...reports, user: req.user._id });
            res.status(201).send({success: true});
        } catch (error) {
            logger.error(`create verify request error: ${error}`);
            next(error);
        }
    },
    
    async delete(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 

            let { id} = req.params;
            let verifyRequest = await checkExistThenGet(id, VerifyRequest, { deleted: false })
            verifyRequest.deleted = true
            await verifyRequest.save();
            let reports = {
                "action":"delete User verify request",
            };
            let  report = await Report.create({...reports, user: user });
            res.send({success: true});
        } catch (error) {
            next(error);
        }
    },
  
    validateReplyBody(isUpdate = false) {
        let validations = [
            body('status').not().isEmpty().withMessage((value, { req}) => {
                return req.__('status.required', { value});
            })
            .isIn(["PENDING","ACCEPTED","REFUSED"]).withMessage((value, { req}) => {
                return req.__('wrong.status', { value});
            }),
            body('reason').optional()
        ];
        return validations;
    },
    async reply(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let {id} = req.params;
            const validatedBody = checkValidations(req);
            let verifyRequest = await checkExistThenGet(id, VerifyRequest, { deleted: false })
            verifyRequest.status = validatedBody.status
            verifyRequest.reply = true
            if(validatedBody.status == "REFUSED"){
                verifyRequest.reason = validatedBody.reason
            }else{
                let user = await checkExistThenGet(verifyRequest.user,User)
                user.verify = true;
                await user.save();
            }
            await verifyRequest.save();
            logger.info(`create verify request  ${verifyRequest.id}`);
            sendNotifiAndPushNotifi({
                targetUser: verifyRequest.user, 
                fromUser: req.user._id, 
                text: 'Beauti Nova',
                subject: verifyRequest.id,
                subjectType: 'Beauti Nova replay to your Verification Request',
                info:'verify'
            });
            let notif = {
                "description_en":'Beauti Nova replay to your Verification Request',
                "description_ar":'تم الرد على طلبك بخصوص تأكيد الحساب',
                "title_ar":"تحديث بخصوص طلب التفعيل",
                "title_en":"Updated about Verification Request",
                "type":"VERIFY"
            }
            await Notif.create({...notif,resource:req.user._id,target:verifyRequest.user,verify:verifyRequest.id});
            let reports = {
                "action":"Replay on Verification request",
            };
            await Report.create({...reports, user: req.user._id });
            res.status(201).send({success: true});
        } catch (error) {
            logger.error(`reply on verifyRequest error: ${error}`);
            next(error);
        }
    },
};