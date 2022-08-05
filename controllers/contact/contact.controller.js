import { body } from "express-validator/check";
import Contact from "../../models/contact/contact.model";
import User from "../../models/user/user.model";
import { checkExist, checkExistThenGet,isInArray } from "../../helpers/CheckMethods";
import ApiError from "../../helpers/ApiError";
import ApiResponse from "../../helpers/ApiResponse";
import { checkValidations,convertLang } from "../shared/shared.controller";
import { sendEmail } from "../../services/emailMessage.service";
import i18n from "i18n";
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import Notif from "../../models/notif/notif.model";
export default {
    validateContactCreateBody() {
        return [
            body('name').not().isEmpty().withMessage((value, { req}) => {
                return req.__('name.required', { value});
            }),
            body('phone').optional(),
            body('email').not().isEmpty().withMessage((value, { req}) => {
                return req.__('email.required', { value});
            })
            .isEmail().withMessage((value, { req}) => {
                return req.__('email.syntax', { value});
            }),
            body('message').not().isEmpty().withMessage((value, { req}) => {
                return req.__('message.required', { value});
            }),
        ]
    },
    async createContactMessage(req, res, next) {
        try {
            const validatedBody = checkValidations(req);
            validatedBody.user = req.user._id;
            let message = await Contact.create({ ...validatedBody });
            let users = await User.find({'type':['ADMIN','SUB-ADMIN']});
            users.forEach(async(user) => {
                sendNotifiAndPushNotifi({
                    targetUser: user.id, 
                    fromUser: req.user._id, 
                    text: 'Beauti Nova',
                    subject: message.id,
                    subjectType: 'New Contact Request',
                    info:'contact'
                });
                let notif = {
                    "description_en":'New Contact Request',
                    "description_ar":'طلب تواصل جديد',
                    "title_ar":"  طلب تواصل جديد",
                    "title_en":"New Contact Request",
                    "type":"MESSAGE"
                }
                await Notif.create({...notif,resource:req.user._id,target:user.id,contact:message.id});
            })
            res.status(200).send({success: true});
        } catch (error) {
            next(error);
        }
    },
    async findAll(req, res, next) {
        try {
            convertLang(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20, query = { deleted: false };

            await checkExist(req.user._id, User);
            let user = req.user;
            

            let contacts = await Contact.find(query).populate([{path: 'replys.user', model: 'user'}])
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit);


            const contactsCount = await Contact.countDocuments(query);
            const pageCount = Math.ceil(contactsCount / limit);

            res.send(new ApiResponse(contacts, page, pageCount, limit, contactsCount, req));
        } catch (err) {
            next(err);
        }
    },
    async findById(req, res, next) {
        try {
            convertLang(req)
            let { contactId } = req.params;
            res.send({success: true,data:await Contact.findById(contactId).populate([{path: 'replys.user', model: 'user'}])});
        } catch (err) {
            next(err);
        }
    },
    validateContactReplyBody() {
        let validation = [
            body('reply').not().isEmpty().withMessage((value, { req}) => {
                return req.__('reply.required', { value});
            }),
        ]
        return validation;
    },
    async reply(req, res, next) {
        try {
            convertLang(req)
            let { contactId } = req.params;
            const validatedBody = checkValidations(req);
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let contact = await checkExistThenGet(contactId, Contact);
            contact.replys.push({
                reply:validatedBody.reply,
                user:req.user,
                date:Date.parse(new Date())
            })
            contact.reply = true
            await contact.save();
            let description = 'BeautiNova Reply on your message';
            sendEmail(contact.email, validatedBody.reply,description)
            sendNotifiAndPushNotifi({
                targetUser: contact.user, 
                fromUser: req.user._id, 
                text: "Beautinova Team's Response",
                subject: contactId,
                subjectType: validatedBody.reply,
                info:'contact'
            });
            let notif = {
                "description_en":validatedBody.reply,
                "description_ar":validatedBody.reply,
                "title_ar":" تحديث طلب تواصل",
                "title_en":"ٌBeautinova Team's Response",
                "type":"CONTACT"
            }
            await Notif.create({...notif,resource:req.user._id,target:contact.user,contact:contact.id});
        
            res.status(200).send({success: true});
        } catch (err) {
            next(err);
        }
    },
    async delete(req, res, next) {
        try {
            let { contactId } = req.params;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let contact = await checkExistThenGet(contactId, Contact);
            contact.deleted = true;
            await contact.save();
            res.status(200).send({success: true});
        } catch (err) {
            next(err);
        }
    },
};