import ApiResponse from "../../helpers/ApiResponse";
import Report from "../../models/reports/report.model";
import User from "../../models/user/user.model";
import Notif from "../../models/notif/notif.model"
import ApiError from '../../helpers/ApiError';
import { checkExist, checkExistThenGet, isImgUrl ,isInArray} from "../../helpers/CheckMethods";
import { handleImg, checkValidations,convertLang } from "../shared/shared.controller";
import { body } from "express-validator/check";
import Anoncement from "../../models/anoncement/anoncement.model";
import i18n from "i18n";
import { sendNotifiAndPushNotifi } from "../../services/notification-service";

export default {

    async findAll(req, res, next) {

        try {
            convertLang(req)
            let lang= i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let {orderByPriority,search} = req.query
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {title_en: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {title_ar: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {description_en: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {description_ar: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            let query = {deleted: false };
            
            let sortd ={ createdAt: -1 }
            if(orderByPriority){
                sortd = { priority: -1 }
            }
            await Anoncement.find(query)
            .sort(sortd)
            .limit(limit)
            .skip((page - 1) * limit)
            .then(async (data) => {
                let newdata = [];
                data.map(async(e)=>{
                    newdata.push({
                        title:lang=="ar"?e.title_ar:e.title_en,
                        title_ar:e.title_ar,
                        title_en:e.title_en,
                        description:lang=="ar"?e.description_ar:e.description_en,
                        description_ar:e.description_ar,
                        description_en:e.description_en,
                        img:e.img,
                        dataType:e.dataType,
                        priority:e.priority,
                        id:e._id, 
                    })
                })
                const anoncementsCount = await Anoncement.countDocuments(query);
                const pageCount = Math.ceil(anoncementsCount / limit);
    
                res.send(new ApiResponse(newdata, page, pageCount, limit, anoncementsCount, req));
            })


            
        } catch (err) {
            next(err);
        }
    },
    async findSelection(req, res, next) {
        try {
            convertLang(req)
            let lang= i18n.getLocale(req)
            let query = { deleted: false };
            let {orderByPriority,search} = req.query
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {title_en: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {title_ar: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {description_en: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {description_ar: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            let sortd = { priority: -1 }
            if(orderByPriority){
                sortd = { priority: -1 }
            }
            await Anoncement.find(query)
                .sort(sortd)
                .sort({ createdAt: -1 }).then(async(data) => {
                    let newdata = [];
                    await Promise.all(data.map(async(e)=>{
                        let index = {
                            title:lang=="ar"?e.title_ar:e.title_en,
                            title_en:e.title_en,
                            title_ar:e.title_ar,
                            description:lang=="ar"?e.description_ar:e.description_en,
                            description_en:e.description_en,
                            description_ar:e.description_ar,
                            img:e.img,
                            dataType:e.dataType,
                            priority:e.priority,
                            id:e.id,
                        }
                        if(e.category){
                            index.category={
                                categoryName:lang=="ar"?e.category.categoryName_ar:e.category.categoryName_en,
                                categoryName_ar:e.category.categoryName_ar,
                                categoryName_en:e.category.categoryName_en,
                            }
                        }
                        newdata.push(index)
                    }))
                    res.send({success:true,data:newdata})
                })
            
        } catch (err) {
            next(err);
        }
    },

    validateBody(isUpdate = false) {
        let validations = [
            body('title_en').not().isEmpty().withMessage((value, { req}) => {
                return req.__('title_en.required', { value});
            }),
            body('title_ar').not().isEmpty().withMessage((value, { req}) => {
                return req.__('title_ar.required', { value});
            }),
            body('description_en').not().isEmpty().withMessage((value, { req}) => {
                return req.__('description_en.required', { value});
            }),
            body('description_ar').not().isEmpty().withMessage((value, { req}) => {
                return req.__('description_ar.required', { value});
            }),
            body('category').optional(),
            body('priority').optional()
        ];
        if (isUpdate)
        validations.push([
            body('img').optional().custom(val => isImgUrl(val)).withMessage((value, { req}) => {
                return req.__('img.syntax', { value});
            })
        ]);

        return validations;
    },

    async create(req, res, next) {

        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
    
            const validatedBody = checkValidations(req);
            console.log(validatedBody);
            let image = await handleImg(req);
            let fileType = req.file.mimetype
            if(fileType == 'image/jpg' || fileType == 'image/jpeg' ||fileType == 'image/png' ||fileType == 'image/gif'){
                validatedBody.dataType = 'IMAGE'
            }else{
                validatedBody.dataType = 'VIDEO'
            }
            console.log(image);
             console.log(image);
            let createdAnoncement = await Anoncement.create({ ...validatedBody,img:image});
            let users = await User.find({'type':$in['USER','ARTIST']});
            users.forEach(async(user) => {
                sendNotifiAndPushNotifi({////////
                    targetUser: user.id, 
                    fromUser: req.user._id, 
                    text: 'new notification',
                    subject: createdAnoncement.id,
                    subjectType: 'new annoncement',
                    info:'anoncement'
                });
                let notif = {
                    "description_en":'New anoncement ',
                    "description_ar":'اعلان جديد',
                    "title_en":"New anoncement",
                    "title_ar":"اعلان جديد",
                    "type":"NEWS"
                }
                await Notif.create({...notif,resource:req.user._id,target:user.id,anoncement:createdAnoncement.id});
            });
            let reports = {
                "action":"Create Ads",
            };
            await Report.create({...reports, user: user });
            res.status(201).send({success: true});
        } catch (err) {
            next(err);
        }
    },


    async findById(req, res, next) {
        try {
            convertLang(req)
            let { anonId } = req.params;
            await checkExist(anonId, Anoncement, { deleted: false });
            let anon = await Anoncement.findById(anonId);
            res.send(anon);
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

            let { anonId } = req.params;
            await checkExist(anonId, Anoncement, { deleted: false });

            const validatedBody = checkValidations(req);
            if (req.file) {
                let image = await handleImg(req, { attributeName: 'img', isUpdate: true });
                validatedBody.img = image;
                let fileType = req.file.mimetype
                if(fileType == 'image/jpg' || fileType == 'image/jpeg' ||fileType == 'image/png' ||fileType == 'image/gif'){
                    validatedBody.dataType = 'IMAGE'
                }else{
                    validatedBody.dataType = 'VIDEO'
                }
            }
            let updatedAnoncement = await Anoncement.findByIdAndUpdate(anonId, {
                ...validatedBody,
            }, { new: true });
            let reports = {
                "action":"Update Ads",
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
                
            let { anonId } = req.params;
            let anoncement = await checkExistThenGet(anonId, Anoncement, { deleted: false });
            
            anoncement.deleted = true;
            await anoncement.save();
            let reports = {
                "action":"Delete Anoncement",
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
    async beFirst(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
                
            let { anonId } = req.params;
            let allAnoncement = await Anoncement.find({deleted:false});
            for (let id of allAnoncement ) {
                id.priority = 0;
                await id.save();
            }
            let anoncement = await checkExistThenGet(anonId, Anoncement, { deleted: false });
            
            anoncement.priority = 1;
            await anoncement.save();
            let reports = {
                "action":"First Anoncement",
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
};