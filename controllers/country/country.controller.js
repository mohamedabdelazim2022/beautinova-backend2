import Country from "../../models/country/country.model";
import City from "../../models/city/city.model";

import ApiError from "../../helpers/ApiError";
import ApiResponse from "../../helpers/ApiResponse";
import { body, query } from "express-validator/check";
import { checkExistThenGet ,isInArray,checkExist} from "../../helpers/CheckMethods";
import { handleImg, checkValidations,convertLang } from "../shared/shared.controller";
import Area from "../../models/area/area.model";
import i18n from "i18n";
import Report from "../../models/reports/report.model";

export default {
    /*validate body data */
    validateCountryBody(isUpdate = false) {
        let validations = [
            body('countryName_en').not().isEmpty().withMessage((value, { req}) => {
                return req.__('country_en.required', { value});
            }) .custom(async (value, { req }) => {
                let userQuery = { countryName_en: value, deleted: false };
                if (isUpdate)
                    userQuery._id = { $ne: req.params.countryId };
                if (await Country.findOne(userQuery))
                    throw req.__('country_en.duplicated');
                else
                    return true;
            }),
            body('countryName_ar').not().isEmpty().withMessage((value, { req}) => {
                return req.__('country_ar.required', { value});
            }).custom(async (value, { req }) => {
                let userQuery = { countryName_ar: value, deleted: false };
                if (isUpdate)
                    userQuery._id = { $ne: req.params.countryId };
                if (await Country.findOne(userQuery)){
                    throw req.__('country_ar.duplicated')
                }
                else
                    return true;
            }),
            body('countryCode').not().isEmpty().withMessage((value, { req}) => {
                return req.__('countryCode.required', { value});
            }),
            body('isoCode').not().isEmpty().withMessage((value, { req}) => {
                return req.__('isoCode.required', { value});
            }),
            body('numbersCount').not().isEmpty().withMessage((value, { req}) => {
                return req.__('numbersCount.required', { value});
            }),
            body('hint').not().isEmpty().withMessage((value, { req}) => {
                return req.__('hint.required', { value});
            })
        ];
        if (isUpdate)
        validations.push([
            body('img').optional().custom(val => isImgUrl(val)).withMessage((value, { req}) => {
                return req.__('img.syntax', { value});
            })
        ]);
        return validations;
    },
    /*create new country */
    async create(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));

            const validatedBody = checkValidations(req);
            let image = await handleImg(req);
            let country = await Country.create({ ...validatedBody,img:image });
            let reports = {
                "action":"Create country",
            };
            await Report.create({...reports, user: user });
            return res.status(200).send({success:true,country:country});
        } catch (error) {
            next(error);
        }
    },
    /*get all data without pagenation */
    async getAll(req, res, next) {
        try {
            //get lang
            let lang = i18n.getLocale(req)
            let {search} = req.query;
            let query = { deleted: false }
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {countryName_ar: { $regex: '.*' + name + '.*' , '$options' : 'i'  }}, 
                            {countryName_en: { $regex: '.*' + name + '.*', '$options' : 'i'  }}, 
                          
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            
            await Country.find(query)
                .sort({ _id: -1 })
                .then( data => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push({
                            countryName:lang=="ar"?e.countryName_ar:e.countryName_en,
                            countryName_en:e.countryName_en,
                            countryName_ar:e.countryName_ar,
                            countryCode:e.countryCode,
                            isoCode:e.isoCode,
                            numbersCount:e.numbersCount,
                            hint:e.hint,
                            img:e.img,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    res.send({
                        success:true,
                        countries:newdata
                    });
                })
        } catch (error) {
            next(error);
        }
    },
/*get all data with pagenation */
    async getAllPaginated(req, res, next) {
        try {
            //get lang
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20,
            {search} = req.query;
            let query = { deleted: false }
            /*search by name */
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {countryName_ar: { $regex: '.*' + name + '.*' , '$options' : 'i'  }}, 
                            {countryName_en: { $regex: '.*' + name + '.*', '$options' : 'i'  }}, 
                          
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            await Country.find(query)
                .sort({ _id: -1 })
                .limit(limit)
                .skip((page - 1) * limit)
                .then(async (data) => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push({
                            countryName:lang=="ar"?e.countryName_ar:e.countryName_en,
                            countryName_en:e.countryName_en,
                            countryName_ar:e.countryName_ar,
                            countryCode:e.countryCode,
                            isoCode:e.isoCode,
                            numbersCount:e.numbersCount,
                            hint:e.hint,
                            img:e.img,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    const count = await Country.countDocuments(query);
                    const pageCount = Math.ceil(count / limit);

                    res.send(new ApiResponse(newdata, page, pageCount, limit, count, req));
                })
        } catch (error) {
            next(error);
        } 
    }, 
/*update record */
    async update(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            let { countryId } = req.params;

            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));

            const validatedBody = checkValidations(req);
            if (req.file) {
                let image = await handleImg(req, { attributeName: 'img', isUpdate: true });
                validatedBody.img = image;
            }
            let country  = await Country.findByIdAndUpdate(countryId, {
                ...validatedBody,
            }, { new: true });
            let reports = {
                "action":"Update Country",
            };
            await Report.create({...reports, user: user });
            return res.status(200).send({success: true});
        } catch (error) {
            next(error);
        }
    },
/*get by id */
    async getById(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let { countryId } = req.params;
            await checkExist(countryId, Country, { deleted: false });
            await Country.findById(countryId).then( e => {
                let country = {
                    countryName:lang=="ar"?e.countryName_ar:e.countryName_en,
                    countryName_en:e.countryName_en,
                    countryName_ar:e.countryName_ar,
                    countryCode:e.countryCode,
                    isoCode:e.isoCode,
                    numbersCount:e.numbersCount,
                    hint:e.hint,
                    img:e.img,
                    id: e._id,
                    createdAt: e.createdAt,
                }
                return res.send({
                    success:true,
                    country:country,
                });
            })
        } catch (error) {
            next(error);
        }
    },
    /*delete country */
    async delete(req, res, next) {
        let { countryId } = req.params;
        try {
            convertLang(req)
            let country = await checkExistThenGet(countryId, Country, { deleted: false });
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            /*delete cities under country */
            let cities = await City.find({ country: countryId });
            for (let cityId of cities) {
                cityId.deleted = true;
                await cityId.save();
                /*delete areas under city */
                let areas = await Area.find({ city: cityId });
                for (let areaId of areas) {
                    areaId.deleted = true;
                    await areaId.save();
                }
            }
            country.deleted = true;
            
            await country.save();
            let reports = {
                "action":"Delete Country",
            };
            await Report.create({...reports, user: req.user._id });
            res.send({success:true});

        } catch (err) {
            next(err);
        }
    }
}