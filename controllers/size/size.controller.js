import Size from "../../models/size/size.model";
import { body } from "express-validator/check";
import { checkValidations,convertLang,handleImg } from "../shared/shared.controller";
import ApiError from "../../helpers/ApiError";
import Report from "../../models/reports/report.model";
import { checkExist } from "../../helpers/CheckMethods";
import ApiResponse from "../../helpers/ApiResponse";
import { checkExistThenGet,isInArray ,isImgUrl} from "../../helpers/CheckMethods";
import i18n from "i18n";
export default {
    validateBody(isUpdate = false) {

        let validations = [
            body('size_ar').not().isEmpty().withMessage((value, { req}) => {
                return req.__('size_ar.required', { value});
            }),
            body('size_en').not().isEmpty().withMessage((value, { req}) => {
                return req.__('size_en.required', { value});
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
            await Size.create({ ...validatedBody});
            let reports = {
                "action":"Create size",
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
            let { sizeId } = req.params;
            
            await checkExist(sizeId, Size, { deleted: false });

            await Size.findById(sizeId).then( e => {
                let size = {
                    size:lang=="ar"?e.size_ar:e.size_en,
                    size_ar:e.size_ar,
                    size_en:e.size_en,
                    id: e._id,
                    createdAt: e.createdAt,
                }
                return res.send({
                    success:true,
                    data:size
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
            let { sizeId } = req.params;
            await checkExist(sizeId, Size, { deleted: false });
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            const validatedBody = checkValidations(req);
           
            await Size.findByIdAndUpdate(sizeId, { ...validatedBody });
            let reports = {
                "action":"Update size",
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
            let lang = i18n.getLocale(req)
            let {search} = req.query;
            let query = { deleted: false };
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {size_en: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {size_ar: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                        
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            await Size.find(query)
            .then(async (data) => {
                var newdata = [];
                data.map(async(e) =>{
                    newdata.push({
                        size:lang=="ar"?e.size_ar:e.size_en,
                        size_ar:e.size_ar,
                        size_en:e.size_en,
                        id: e._id,
                        createdAt: e.createdAt,
                    });
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
            let {search} = req.query;
            let query = { deleted: false };
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {size_en: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {size_ar: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                        
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            await Size.find(query)
                .limit(limit)
                .skip((page - 1) * limit).sort({ _id: -1 })
                .then(async (data) => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push({
                            size:lang=="ar"?e.size_ar:e.size_en,
                            size_ar:e.size_ar,
                            size_en:e.size_en,
                            img:e.img,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    const count = await Size.countDocuments({deleted: false });
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
            let { sizeId } = req.params;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let size = await checkExistThenGet(sizeId, Size);
            size.deleted = true;
            await size.save();
            let reports = {
                "action":"Delete size",
            };
            await Report.create({...reports, user: req.user });
            res.send({success: true});

        } catch (err) {
            next(err);
        }
    },


}