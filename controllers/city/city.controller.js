import Country from "../../models/country/country.model";
import City from "../../models/city/city.model";
import Area from "../../models/area/area.model";
import User from "../../models/user/user.model";
import Report from "../../models/reports/report.model";
import { checkValidations,convertLang } from "../shared/shared.controller";
import ApiError from "../../helpers/ApiError";
import ApiResponse from "../../helpers/ApiResponse";
import { body } from "express-validator/check";
import { checkExist ,checkExistThenGet ,isInArray } from "../../helpers/CheckMethods";
import i18n from "i18n";

export default {
    validateCityBody(isUpdate = false) {
        return [
            body('country').not().isEmpty().withMessage((value, { req}) => {
                return req.__('country.required', { value});
            }),
            body('cityName_en').not().isEmpty().withMessage((value, { req}) => {
                return req.__('cityName_en.required', { value});
            }),
            body('cityName_ar').not().isEmpty().withMessage((value, { req}) => {
                return req.__('cityName_ar.required', { value});
            }),
            body('delivaryCost').not().isEmpty().withMessage((value, { req}) => {
                return req.__('delivaryCost.required', { value});
            }),
            
               
        ];
    },
    async create(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            const validatedBody = checkValidations(req);
            await checkExist(validatedBody.country,Country,{deleted:false})
            let city = await City.create({ ...validatedBody });
            let reports = {
                "action":"Create City",
            };
            await Report.create({...reports, user: user });
            return res.status(201).send({success:true,data:city});
        } catch (error) {
            next(error);
        }
    },
    async getAll(req, res, next) {
        try {
            convertLang(req)
            let lang= i18n.getLocale(req)
            let {countryId} = req.params
            await City.find({ deleted: false ,country:countryId})
            .then(async(data) => {
                let newdata = [];
                await Promise.all(data.map(async(e)=>{
                    let index = {
                        cityName:lang=="ar"?e.cityName_ar:e.cityName_en,
                        cityName_en:e.cityName_en,
                        cityName_ar:e.cityName_ar,
                        delivaryCost:e.delivaryCost,
                        country:e.country,
                        id:e._id,
                    }
                    newdata.push(index)
                }))
                return res.status(200).send(newdata);
            })
            
        } catch (error) {
            next(error);
        }
    },

    async getAllPaginated(req, res, next) {
        try {
            convertLang(req)
            let lang= i18n.getLocale(req)
            let {countryId} = req.params
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            await City.find({ deleted: false,country:countryId })
                .limit(limit)
                .skip((page - 1) * limit).sort({ _id: -1 }).then(async(data) => {
                    let newdata = [];
                    await Promise.all(data.map(async(e)=>{
                        let index = {
                            cityName:lang=="ar"?e.cityName_ar:e.cityName_en,
                            cityName_en:e.cityName_en,
                            cityName_ar:e.cityName_ar,
                            delivaryCost:e.delivaryCost,
                            country:e.country,
                            id:e._id,
                        }
                        newdata.push(index)
                    }))
                    let count = await City.countDocuments({ deleted: false,country:countryId });
                    const pageCount = Math.ceil(count / limit);
                    res.send(new ApiResponse(newdata, page, pageCount, limit, count, req));
                })

            
        } catch (error) {
            next(error);
        }
    },

    async update(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            let { cityId } = req.params;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            const validatedBody = checkValidations(req);
            let city = await City.findByIdAndUpdate(cityId, { ...validatedBody });
            let reports = {
                "action":"Update City",
            };
            await Report.create({...reports, user: user });
            return res.status(200).send({success: true});
        } catch (error) {
            next(error);
        }
    },

    async getById(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            let { cityId } = req.params;
            let city = await checkExistThenGet(cityId, City, { deleted: false });
            return res.send({success: true,data:city});
        } catch (error) {
            next(error);
        }
    },
    async delete(req, res, next) {
        let { cityId} = req.params;

        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let city = await checkExistThenGet(cityId, City, { deleted: false });
            let areas = await Area.find({ city: cityId });
            for (let areaId of areas) {
                areaId.deleted = true;
                await areaId.save();
            }
            city.deleted = true;
            await city.save();
            let reports = {
                "action":"Delete City",
            };
            await Report.create({...reports, user: user });
            res.send({success: true});

        } catch (err) {
            next(err);
        }
    }
}