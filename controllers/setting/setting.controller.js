import ApiResponse from "../../helpers/ApiResponse";
import Setting from "../../models/setting/setting.model";
import Report from "../../models/reports/report.model";
import ApiError from '../../helpers/ApiError';

import { checkExist, checkExistThenGet, isImgUrl,isInArray } from "../../helpers/CheckMethods";
import { handleImg, checkValidations,convertLang } from "../shared/shared.controller";
import { body } from "express-validator/check";
import i18n from "i18n";

export default {

    async findAll(req, res, next) {

        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let query = {deleted: false };
            let Settings = await Setting.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit);


            const SettingsCount = await Setting.count(query);
            const pageCount = Math.ceil(SettingsCount / limit);

            res.send(new ApiResponse(Settings, page, pageCount, limit, SettingsCount, req));
        } catch (err) {
            next(err);
        }
    },

    validateBody(isUpdate = false) {
        let validations = [
            body('freeShipping').not().isEmpty().withMessage((value, { req}) => {
                return req.__('freeShipping.required', { value});
            }),
           
        ];
        return validations;
    },

    async create(req, res, next) {

        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
    
            const validatedBody = checkValidations(req);
            let createdSetting = await Setting.create({ ...validatedBody});
            let reports = {
                "action":"Create Setting",
            };
            await Report.create({...reports, user: user });
            res.status(201).send({success: true,data:createdSetting});
        } catch (err) {
            next(err);
        }
    },


    async findById(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let { SettingId } = req.params;
            await checkExist(SettingId, Setting, { deleted: false });
            let setting = await Setting.findById(SettingId);
            res.send({success: true,data:setting});
        } catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {

        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));

            let { SettingId } = req.params;
            await checkExist(SettingId, Setting, { deleted: false });

            const validatedBody = checkValidations(req);
            let updatedSetting = await Setting.findByIdAndUpdate(SettingId, {
                ...validatedBody,
            }, { new: true });
            let reports = {
                "action":"Update Setting value",
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});
        }
        catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
                
            let { SettingId } = req.params;
            let setting = await checkExistThenGet(SettingId, Setting, { deleted: false });
            setting.deleted = true;
            await setting.save();
            let reports = {
                "action":"Delete Setting",
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
  
};