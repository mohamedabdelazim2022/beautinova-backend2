import Permission from "../../models/permission/permission.model";
import { body } from "express-validator/check";
import { checkValidations ,convertLang} from "../shared/shared.controller";
import ApiError from "../../helpers/ApiError";
import { checkExist,isInArray } from "../../helpers/CheckMethods";
import ApiResponse from "../../helpers/ApiResponse";
import { checkExistThenGet } from "../../helpers/CheckMethods";
import i18n from "i18n";

export default {
    //permission validate body
    validatePermissionBody() {
        return [
            body('permission_ar').not().isEmpty().withMessage((value, { req}) => {
                return req.__('permission_ar.required', { value});
            }),
            body('permission_en').not().isEmpty().withMessage((value, { req}) => {
                return req.__('permission_en.required', { value});
            }),
            body('pages').not().isEmpty().withMessage((value, { req}) => {
                return req.__('pages.required', { value});
            })
        ];
    },
    //add new permission
    async create(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
           
            const validatedBody = checkValidations(req);
            let permission = await Permission.create({ ...validatedBody });
            return res.status(200).send({success:true,data:permission});
        } catch (error) {
            next(error);
        }
    },
    //get by id
    async getById(req, res, next) {
        try {
            convertLang(req)
            //get the language selected
            let lang = i18n.getLocale(req)
            let { PermissionId } = req.params;
            
            await checkExist(PermissionId, Permission, { deleted: false });
            await Permission.findById(PermissionId).then( e => {
                let permission = {
                    permission:lang=="ar"?e.permission_ar:e.permission_en,
                    permission_ar:e.permission_ar,
                    permission_en:e.permission_en,
                    pages:e.pages,
                    id: e._id,
                    createdAt: e.createdAt,
                }
                return res.send({
                    success: true,
                    data:permission,
                });
            })
        } catch (error) {
            next(error);
        }
    },
    //edit record
    async update(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            let { PermissionId } = req.params;

            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            const validatedBody = checkValidations(req);


            let permission = await Permission.findByIdAndUpdate(PermissionId, { ...validatedBody });
            return res.status(200).send({success:true,data: permission});
        } catch (error) {
            next(error);
        }
    },
    //with pagenation
    async findAll(req, res, next) {
        try {
            convertLang(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            //get the language selected
            let lang = i18n.getLocale(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let query = { deleted: false }

            await Permission.find(query)
                .limit(limit)
                .skip((page - 1) * limit)
                .then( async(data) => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push({
                            permission:lang=="ar"?e.permission_ar:e.permission_en,
                            permission_ar:e.permission_ar,
                            permission_en:e.permission_en,
                            pages:e.pages,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    const permissionsCount = await Permission.countDocuments(query);
                    const pageCount = Math.ceil(permissionsCount / limit);

                    res.send(new ApiResponse(newdata, page, pageCount, limit, permissionsCount, req));
                })
        } catch (error) {
            next(error);
        }
    },
    //without pagenation
    async getAll(req, res, next) {
        try {
            convertLang(req)
            //get the language selected
            let lang = i18n.getLocale(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let query = { deleted: false }
            await Permission.find(query)
                .then( data => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push({
                            permission:lang=="ar"?e.permission_ar:e.permission_en,
                            permission_ar:e.permission_ar,
                            permission_en:e.permission_en,
                            pages:e.pages,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    res.send({
                        success:true,
                        data:newdata
                    });
                })
        } catch (error) {
            next(error);
        }
    },

   

//delete permission
    async delete(req, res, next) {
        let { PermissionId } = req.params;
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let permission = await checkExistThenGet(PermissionId, Permission);
            //all users have this permission will be not active
            let users = await User.find({ permission: PermissionId });
            for (let user of users) {
                user.accountType = "NOT-ACTIVE";
                await user.save();
            }
            permission.deleted = true;
            await permission.save();
            
            res.send({success:true});

        } catch (err) {
            next(err);
        }
    },


}