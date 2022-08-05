import ApiResponse from "../../helpers/ApiResponse";
import Report from "../../models/reports/report.model";
import User from "../../models/user/user.model";

import ApiError from '../../helpers/ApiError';
import { checkExistThenGet ,isInArray} from "../../helpers/CheckMethods";
import { checkValidations,convertLang } from "../shared/shared.controller";
import { body } from "express-validator/check";
import InstaVerify from "../../models/instaVerify/instaVerify.model";
import {transformInstaVerify } from '../../models/instaVerify/transformInstaVerify';
import Notif from "../../models/notif/notif.model";
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import i18n from "i18n";
import Logger from "../../services/logger";
const logger = new Logger('insta verify '+ new Date(Date.now()).toDateString())
const populateQuery = [
    {
        path: 'user', model: 'user',
    },
];
export default {

    async findAll(req, res, next) {
        try {
            convertLang(req)
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
            
            await InstaVerify.find(query).populate(populateQuery)
                .sort({createdAt: -1})
                .limit(limit)
                .skip((page - 1) * limit).then(async(data)=>{
                    let newdate = []
                    await Promise.all(data.map(async(e)=>{
                        let value = await transformInstaVerify(e)
                        newdate.push(value)
                    }))
                    
                    const usersCount = await InstaVerify.countDocuments(query);
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
            
            await InstaVerify.find(query).populate(populateQuery)
                .sort({createdAt: -1}).then(async(data)=>{
                    let newdate = []
                    await Promise.all(data.map(async(e)=>{
                        let value = await transformInstaVerify(e)
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
            let {id} = req.params;
            await InstaVerify.findById(id).populate(populateQuery)
                .sort({createdAt: -1}).then(async(e)=>{
                    let index = await transformInstaVerify(e)
                    res.send({success: true,data:index});
                })

        } catch (err) {
            next(err);
        }
    },

    validateBody(isUpdate = false) {
        let validations = [
            body('instaUserName').not().isEmpty().withMessage((value, { req}) => {
                return req.__('instaUserName.required', { value});
            }),
        ];
        return validations;
    },

    async create(req, res, next) {

        try {
            convertLang(req)
            const validatedBody = checkValidations(req); 
            validatedBody.user = req.user._id;
            let instaVerify =  await InstaVerify.create({ ...validatedBody});
            logger.info(`create instaVerify   ${instaVerify.id}`);
            let users = await User.find({'type':['ADMIN','SUB-ADMIN']});
            users.forEach(async(user) => {
                sendNotifiAndPushNotifi({
                    targetUser: user.id, 
                    fromUser: req.user._id, 
                    text: 'Beauti Nova',
                    subject: instaVerify.id,
                    subjectType: 'New Instagram Verification Request',
                    info:'verify'
                });
                let notif = {
                    "description_en":'New Instagram Verification Request',
                    "description_ar":'طلب تأكيد حساب  انستجرام جديد',
                    "title_ar":"  طلب تأكيد انستجرام جديد",
                    "title_en":"New Instagram Verification Request",
                    "type":"INSTA-VERIFY"
                }
                await Notif.create({...notif,resource:req.user._id,target:user.id,instaVerify:instaVerify.id});
            })
            let reports = {
                "action":"Create instagram Verification request",
            };
            await Report.create({...reports, user: req.user._id });
            res.status(201).send({success: true});
        } catch (error) {
            logger.error(`create instaVerify  error: ${error}`);
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
            let instaVerify = await checkExistThenGet(id, InstaVerify, { deleted: false })
            instaVerify.deleted = true
            await instaVerify.save();
            let reports = {
                "action":"delete User instagram verify request",
            };
            await Report.create({...reports, user: user });
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
            let instaVerify = await checkExistThenGet(id, InstaVerify, { deleted: false })
            instaVerify.status = validatedBody.status
            instaVerify.reply = true
            if(validatedBody.status == "REFUSED"){
                instaVerify.reason = validatedBody.reason
            }else{
                let user = await checkExistThenGet(instaVerify.user,User)
                user.instaVerify = true;
                user.instaUserName = instaVerify.instaUserName
                await user.save();
            }
            await instaVerify.save();
            sendNotifiAndPushNotifi({
                targetUser: instaVerify.user, 
                fromUser: req.user._id, 
                text: 'Beauti Nova',
                subject: instaVerify.id,
                subjectType: 'Beauti Nova replay to your Instagram Verification Request',
                info:'verify'
            });
            let notif = {
                "description_en":'Beauti Nova replay to your Instagram Verification Request',
                "description_ar":'تم الرد على طلبك بخصوص تأكيد حساب الانستجرام',
                "title_ar":"تحديث بخصوص طلب تأكيد الانستجرام",
                "title_en":"Updated about instagram Verification Request",
                "type":"INSTA-VERIFY"
            }
            await Notif.create({...notif,resource:req.user._id,target:instaVerify.user,instaVerify:instaVerify.id});
            let reports = {
                "action":"Replay on Verification request",
            };
            await Report.create({...reports, user: req.user._id });
            res.status(201).send({success: true});
        } catch (error) {
            logger.error(`reply instaVerify  error: ${error}`);
            next(error);
        }
    },
};