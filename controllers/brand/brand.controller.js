import Brand from "../../models/brand/brand.model";
import { body } from "express-validator/check";
import { checkValidations,convertLang,handleImg } from "../shared/shared.controller";
import ApiError from "../../helpers/ApiError";
import Report from "../../models/reports/report.model";
import { checkExist } from "../../helpers/CheckMethods";
import ApiResponse from "../../helpers/ApiResponse";
import { checkExistThenGet,isInArray ,isImgUrl} from "../../helpers/CheckMethods";
import i18n from "i18n";
const populateQuery = [
    {path:'color',model: 'color'}
]
export default {
    validateBody(isUpdate = false) {

        let validations = [
            body('brandName_ar').not().isEmpty().withMessage((value, { req}) => {
                return req.__('brandName_ar.required', { value});
            }),
            body('brandName_en').not().isEmpty().withMessage((value, { req}) => {
                return req.__('brandName_en.required', { value});
            }),
            body('color').optional()
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
            await Brand.create({ ...validatedBody});
            let reports = {
                "action":"Create brand",
            };
            await Report.create({...reports, user: user });
            return res.status(201).send({success:true});
        } catch (error) {
            next(error);
        }
    },
    async getById(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let { brandId } = req.params;
            
            await checkExist(brandId, Brand, { deleted: false });

            await Brand.findById(brandId).then( e => {
                let brand = {
                    brandName:lang=="ar"?e.brandName_ar:e.brandName_en,
                    brandName_ar:e.brandName_ar,
                    brandName_en:e.brandName_en,
                    id: e._id,
                    createdAt: e.createdAt,
                }
                return res.send({
                    success:true,
                    data:brand
                });
            })
        } catch (error) {
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            let { brandId } = req.params;
            await checkExist(brandId, Brand, { deleted: false });
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            const validatedBody = checkValidations(req);
           
            await Brand.findByIdAndUpdate(brandId, { ...validatedBody });
            let reports = {
                "action":"Update Brand",
            };
            let report = await Report.create({...reports, user: user });
            return res.status(200).send({success: true});
        } catch (error) {
            next(error);
        }
    },

    async getAll(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let {search,color} = req.query;
            let query = { deleted: false };
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {brandName_en: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {brandName_ar: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                        
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            if(color) query.color = color;
            await Brand.find(query).populate(populateQuery)
            .then(async (data) => {
                var newdata = [];
                data.map(async(e) =>{
                    let index ={
                        brandName:lang=="ar"?e.brandName_ar:e.brandName_en,
                        brandName_ar:e.brandName_ar,
                        brandName_en:e.brandName_en,
                        id: e._id,
                        createdAt: e.createdAt,
                    }
                    /*color*/
                    let color=[]
                    for (let val of e.color) {
                        color.push({
                            colorName:lang=="ar"?val.colorName_ar:val.colorName_en,
                            colorName_ar:val.colorName_ar,
                            colorName_en:val.colorName_en,
                            id: val._id,
                        })
                    }
                    index.color = color
                    newdata.push(index);
                    
                })
                res.send({success:true,data:newdata});
            })
        } catch (error) {
            next(error);
        }
    },

    async getAllPaginated(req, res, next) {
        try {    
            convertLang(req)
            let lang = i18n.getLocale(req)       
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let {search,color} = req.query;
            let query = { deleted: false };
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {brandName_en: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {brandName_ar: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                        
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            if(color) query.color = color;
            await Brand.find(query).populate(populateQuery)
                .limit(limit)
                .skip((page - 1) * limit).sort({ _id: -1 })
                .then(async (data) => {
                    var newdata = [];
                    data.map(async(e) =>{
                        let index ={
                            brandName:lang=="ar"?e.brandName_ar:e.brandName_en,
                            brandName_ar:e.brandName_ar,
                            brandName_en:e.brandName_en,
                            id: e._id,
                            createdAt: e.createdAt,
                        }
                        /*color*/
                        let color=[]
                        for (let val of e.color) {
                            color.push({
                                colorName:lang=="ar"?val.colorName_ar:val.colorName_en,
                                colorName_ar:val.colorName_ar,
                                colorName_en:val.colorName_en,
                                id: val._id,
                            })
                        }
                        index.color = color
                        newdata.push(index);
                    })
                    const count = await Brand.countDocuments({deleted: false });
                    const pageCount = Math.ceil(count / limit);
                    res.send(new ApiResponse(newdata, page, pageCount, limit, count, req));
                })
        } catch (error) {
            next(error);
        }
    },


    async delete(req, res, next) {
        
        try {
            convertLang(req)
            let { brandId } = req.params;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let brand = await checkExistThenGet(brandId, Brand);
            brand.deleted = true;
            await brand.save();
            let reports = {
                "action":"Delete brand",
            };
            let report = await Report.create({...reports, user: req.user });
            res.send({success: true});

        } catch (err) {
            next(err);
        }
    },


}