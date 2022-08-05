import Area from "../../models/area/area.model";
import City from "../../models/city/city.model";
import User from "../../models/user/user.model";
import Report from "../../models/reports/report.model";
import { body } from "express-validator/check";
import { checkValidations ,convertLang } from "../shared/shared.controller";
import ApiError from "../../helpers/ApiError";
import { checkExist ,checkExistThenGet,isInArray} from "../../helpers/CheckMethods";
import ApiResponse from "../../helpers/ApiResponse";
import i18n from "i18n";

export default {
    validateAreaBody() {
        return [
            body('areaName_en').not().isEmpty().withMessage((value, { req}) => {
                return req.__('areaName_en.required', { value});
            }),
            body('areaName_ar').not().isEmpty().withMessage((value, { req}) => {
                return req.__('areaName_ar.required', { value});
            }),
            body('delivaryCost').not().isEmpty().withMessage((value, { req}) => {
                return req.__('delivaryCost.required', { value});
            }),
            
        ];
    },
    async create(req, res, next) {
        try {
            convertLang(req)
            let user = req.user, { cityId } = req.params;
            await checkExist(cityId, City);
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            const validatedBody = checkValidations(req);
            validatedBody.city = cityId;
            await Area.create({ ...validatedBody });
            let reports = {
                "action":"Create New Area",
            };
            await Report.create({...reports, user: user });
            return res.status(201).send({success: true});
        } catch (error) {
            next(error);
            send(error);
        }
    },
    async getById(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            let { areaId } = req.params;

            if (user.type != 'ADMIN')
               return next(new ApiError(403, ('admin.auth')));
            await checkExist(areaId, Area, { deleted: false });

            let area = await Area.findById(areaId).populate('city');
            return res.send({success: true,area: area});
        } catch (error) {
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            let { areaId } = req.params;

            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            const validatedBody = checkValidations(req);
            await Area.findByIdAndUpdate(areaId, { ...validatedBody });

            let reports = {
                "action":"Update Area",
            };
            await Report.create({...reports, user: user });
            return res.status(200).send({success: true});
        } catch (error) {
            next(error);
        }
    },

    async getAll(req, res, next) {
        try {
            convertLang(req)
            let lang= i18n.getLocale(req)
            let { cityId } = req.params;
            await checkExist(cityId, City, { deleted: false });
            await Area.find({ 'city': cityId, deleted: false })
            .then(async(data) => {
                let newdata = [];
                await Promise.all(data.map(async(e)=>{
                    let index = {
                        areaName:lang=="ar"?e.areaName_ar:e.areaName_en,
                        areaName_en:e.areaName_en,
                        areaName_ar:e.areaName_ar,
                        delivaryCost:e.delivaryCost,
                        city:e.city,
                        id:e._id,
                    }
                    newdata.push(index)
                }))
                return res.send(newdata);
            })
            
        } catch (error) {
            next(error);
        }
    },

    async getAllPaginated(req, res, next) {
        try {
            convertLang(req)
            let lang= i18n.getLocale(req)
            let { cityId } = req.params;
            
            let page = +req.query.page || 1, limit = +req.query.limit || 20;


            await Area.find({ 'city': cityId, deleted: false })
                .populate('city')
                .limit(limit)
                .skip((page - 1) * limit).sort({ _id: -1 }) .then(async(data) => {
                    let newdata = [];
                    await Promise.all(data.map(async(e)=>{
                        let index = {
                            areaName:lang=="ar"?e.areaName_ar:e.areaName_en,
                            areaName_en:e.areaName_en,
                            areaName_ar:e.areaName_ar,
                            delivaryCost:e.delivaryCost,
                            city:e.city,
                            id:e._id,
                        }
                        newdata.push(index)
                    }))
                    let count = await Area.countDocuments({ 'city': cityId, deleted: false });
                    const pageCount = Math.ceil(count / limit);
                    res.send(new ApiResponse(newdata, page, pageCount, limit, count, req));
                })
            
        } catch (error) {
            next(error);
        }
    },

    async delete(req, res, next) {
        let { areaId } = req.params;
        try {
            convertLang(req)
            let user = req.user;
            if (user.type != 'ADMIN')
               return next(new ApiError(403, ('admin.auth')));
            let area = await checkExistThenGet(areaId, Area);
            
            area.deleted = true;
            await area.save();
            let reports = {
                "action":"Delete Area",
            };
            await Report.create({...reports, user: user });
            res.send({success: true});

        } catch (err) {
            next(err);
        }
    },


}