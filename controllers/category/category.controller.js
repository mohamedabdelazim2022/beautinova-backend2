import ApiResponse from "../../helpers/ApiResponse";
import { checkExist, checkExistThenGet, isImgUrl,isInArray } from "../../helpers/CheckMethods";
import { handleImg, checkValidations,convertLang  } from "../shared/shared.controller";
import { body } from "express-validator/check";
import Category from "../../models/category/category.model";
import SubCategory from "../../models/category/sub-category.model";
import User from "../../models/user/user.model";
import Product from "../../models/product/product.model";
import i18n from "i18n";

const populateQuery = [ 
    { path: 'child', model: 'category' },
    //{ path: 'parent', model: 'category' },
];

export default {


    async findCategoryPagenation(req, res, next) {
        try {
            convertLang(req)
            let lang= i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20,
            { main,orderByPriority,type,search} = req.query;
            
            let query = { deleted: false, parent: { $exists: false }};
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {categoryName_en: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {categoryName_ar: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                        
                          ] 
                        },
                        {deleted: false},
                        {parent: { $exists: false }},
                    ]
                };
            }
            if (main) query.main = main;
            if (type) query.type = type;
            let sortd = { createdAt: 1 }
            if(orderByPriority){
                sortd = { priority: 1 }
            }
            await Category.find(query)
                .populate(populateQuery)
                .sort(sortd)
                .limit(limit)
                .skip((page - 1) * limit)
                .then(async (data) => {
                    var newdata = [];
                    data.map(async(e) =>{
                        let childs = []
                        e.child.map((e)=>{
                            childs.push({
                                categoryName:lang=="ar"?e.categoryName_ar:e.categoryName_en,
                                categoryName_en:e.categoryName_en,
                                categoryName_ar:e.categoryName_ar,
                                img:e.img,
                                type:e.type,
                                priority:e.priority,
                                hasChild:e.hasChild,
                                id: e._id,
                                createdAt: e.createdAt,
                            });
                        })
                        newdata.push({
                            categoryName:lang=="ar"?e.categoryName_ar:e.categoryName_en,
                            categoryName_en:e.categoryName_en,
                            categoryName_ar:e.categoryName_ar,
                            img:e.img,
                            type:e.type,
                            priority:e.priority,
                            hasChild:e.hasChild,
                            child:childs,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    const count = await Category.countDocuments(query);
                    const pageCount = Math.ceil(count / limit);

                    res.send(new ApiResponse(newdata, page, pageCount, limit, count, req));
                })
            
        } catch (err) {
            next(err);
        }
    },
    async findAllSubCategoryPagenation(req, res, next) {
        try {
            convertLang(req)
            let lang= i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20,
            { main,orderByPriority,type} = req.query;
            
            let query = { deleted: false};
            if (type) query.type = type;
            if (main) query.main = main;
            let sortd = { createdAt: 1 }
            if(orderByPriority){
                sortd = { priority: 1 }
            }

            await SubCategory.find(query)
                .sort(sortd)
                .limit(limit)
                .skip((page - 1) * limit)
                .then(async (data) => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push({
                            categoryName:lang=="ar"?e.categoryName_ar:e.categoryName_en,
                            categoryName_en:e.categoryName_en,
                            categoryName_ar:e.categoryName_ar,
                            img:e.img,
                            type:e.type,
                            priority:e.priority,
                            hasChild:e.hasChild,
                            parent:e.parent,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    const count = await SubCategory.countDocuments(query);
                    const pageCount = Math.ceil(count / limit);

                    res.send(new ApiResponse(newdata, page, pageCount, limit, count, req));
                })
        } catch (err) {
            next(err);
        }
    },
    async findSubCategoryPagenation(req, res, next) {
        try {
            convertLang(req)
            let lang= i18n.getLocale(req)
            let { categoryId ,orderByPriority,type} = req.params,
                page = +req.query.page || 1,
                limit = +req.query.limit || 20;

            await checkExist(categoryId, Category);

            let query = { parent: categoryId, deleted: false };
            let sortd = { createdAt: 1 }
            if(orderByPriority){
                sortd = { priority: 1 }
            }
            if (type) query.type = type;
            await SubCategory.find(query)
                .sort(sortd)
                .limit(limit)
                .skip((page - 1) * limit)
                .then(async (data) => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push({
                            categoryName:lang=="ar"?e.categoryName_ar:e.categoryName_en,
                            categoryName_en:e.categoryName_en,
                            categoryName_ar:e.categoryName_ar,
                            img:e.img,
                            type:e.type,
                            priority:e.priority,
                            hasChild:e.hasChild,
                            parent:e.parent,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    const count = await SubCategory.countDocuments(query);
                    const pageCount = Math.ceil(count / limit);

                    res.send(new ApiResponse(newdata, page, pageCount, limit, count, req));
                })

        } catch (error) {
            next(error);
        }
    },
    async findCategory(req, res, next) {
        try {   
            convertLang(req)       
            let lang= i18n.getLocale(req)  
            let {orderByPriority,type,search,isGeneral} = req.query
            let query = { deleted: false,main:true,isGeneral:false};
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {categoryName_en: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {categoryName_ar: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                        
                          ] 
                        },
                        {deleted: false},
                        {main:true},
                    ]
                };
            }
            let sortd = { createdAt: 1 }
            if(orderByPriority){
                sortd = { priority: 1 }
            }
            if(isGeneral == "true") query.isGeneral = true;
            if (type) query.type = type;
            await Category.find(query)
                .populate(populateQuery)
                .sort(sortd)
                .then( data => {
                    var newdata = [];
                    data.map(async(e) =>{
                        let childs = []
                        e.child.map((e)=>{
                            childs.push({
                                categoryName:lang=="ar"?e.categoryName_ar:e.categoryName_en,
                                categoryName_en:e.categoryName_en,
                                categoryName_ar:e.categoryName_ar,
                                img:e.img,
                                type:e.type,
                                priority:e.priority,
                                hasChild:e.hasChild,
                                id: e._id,
                                createdAt: e.createdAt,
                            });
                        })
                        console.log(childs)
                        newdata.push({
                            categoryName_en:e.categoryName_en,
                            categoryName_ar:e.categoryName_ar,
                            img:e.img,
                            type:e.type,
                            priority:e.priority,
                            hasChild:e.hasChild,
                            child:childs,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    res.send(newdata);
                })
        } catch (err) {
            next(err);
        }
    },
    async findSubCategory(req, res, next) {
        try {
            convertLang(req)
            let lang= i18n.getLocale(req)
            let {orderByPriority,type} = req.query
            let { categoryId } = req.params;
            await checkExist(categoryId, Category);
            let query = { parent: categoryId, deleted: false,isGeneral:false};
            let sortd = { createdAt: 1 }
            
            if(orderByPriority){
                sortd = { priority: 1 }
            }
            if (type) query.type = type;
            await SubCategory.find(query)
                .sort(sortd)
                .then( data => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push({
                            categoryName:lang=="ar"?e.categoryName_ar:e.categoryName_en,
                            categoryName_en:e.categoryName_en,
                            categoryName_ar:e.categoryName_ar,
                            img:e.img,
                            type:e.type,
                            priority:e.priority,
                            hasChild:e.hasChild,
                            parent:e.parent,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    res.send(newdata);
                })

        } catch (error) {
            next(error);
        }
    },
    async findAllSubCategory(req, res, next) {
        try {
            convertLang(req)
            let lang= i18n.getLocale(req)
            let query = { deleted: false};
            let sortd = { createdAt: 1 }
            await SubCategory.find(query)
                .sort(sortd)
                .then( data => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push({
                            categoryName:lang=="ar"?e.categoryName_ar:e.categoryName_en,
                            categoryName_en:e.categoryName_en,
                            categoryName_ar:e.categoryName_ar,
                            img:e.img,
                            type:e.type,
                            priority:e.priority,
                            hasChild:e.hasChild,
                            parent:e.parent,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    res.send(newdata);
                })
        } catch (err) {
            next(err);
        }
    },
    validateBody(isUpdate = false) {
        let validations = [
            body('categoryName_en').not().isEmpty().withMessage((value, { req}) => {
                return req.__('categoryName_en.required', { value});
            }).custom(async (val, { req }) => {
                    let query = { categoryName_en: val, deleted: false };

                    if (isUpdate)
                        query._id = { $ne: req.params.categoryId };

                    let category = await Category.findOne(query).lean();
                    console.log(category)
                    if (category)
                        throw req.__('categoryName_en.duplicated')

                    return true;
                }),
            body('categoryName_ar').not().isEmpty().withMessage((value, { req}) => {
                return req.__('categoryName_ar.required', { value});
            }).custom(async (val, { req }) => {
                    let query = { categoryName_en: val, deleted: false };

                    if (isUpdate)
                        query._id = { $ne: req.params.categoryId };

                    let category = await Category.findOne(query).lean();
                    if (category)
                        throw req.__('categoryName_ar.duplicated')

                    return true;
                }),
            body('parent').optional(),
            body('details').optional(),
            body('main').optional(),
            body('priority').optional(),
            body('type').optional(),
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
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            const validatedBody = checkValidations(req);
            let model;
            if(validatedBody.main){
                validatedBody.main = true
            }
            if (validatedBody.parent) {
                let parentCategory = await checkExistThenGet(validatedBody.parent, Category);
                parentCategory.hasChild = true;
                await parentCategory.save();
                model = SubCategory;
            }
            else {
                model = Category;
            }

            if (req.file) {
                let image = await handleImg(req, { attributeName: 'img', isUpdate: true });
                validatedBody.img = image;
            }
            let createdCategory = await model.create({ ...validatedBody});
            if(model == SubCategory){
                let parentCategory = await checkExistThenGet(validatedBody.parent, Category);
                parentCategory.child.push(createdCategory._id);
                await parentCategory.save();
            }
            res.status(201).send(createdCategory);
        } catch (err) {
            next(err);
        }
    },


    async findById(req, res, next) {
        try {
            convertLang(req)
            let { categoryId } = req.params;
            await checkExist(categoryId, Category, { deleted: false });
            let category = await Category.findById(categoryId).populate(populateQuery)
            res.send(category);
        } catch (err) {
            next(err);
        }
    },

    async update(req, res, next) {

        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let { categoryId } = req.params, model;
            await checkExist(categoryId, Category, { deleted: false });

            const validatedBody = checkValidations(req);


            if (validatedBody.parent) {
                let parentCategory = await checkExistThenGet(validatedBody.parent, Category);
                parentCategory.hasChild = true;
                await parentCategory.save();
                model = SubCategory;
            }
            else {
                model = Category;
            }

            if (req.file) {
                let image = await handleImg(req, { attributeName: 'img', isUpdate: true });
                validatedBody.img = image;
            }

            let updatedCategory = await model.findByIdAndUpdate(categoryId, {
                ...validatedBody,
            }, { new: true });
            if(model == SubCategory){
                let parentCategory = await checkExistThenGet(validatedBody.parent, Category);
                parentCategory.child.push(updatedCategory._id);
                await parentCategory.save();
            }

            res.status(200).send(updatedCategory);
        }
        catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let { categoryId } = req.params;

            let category = await checkExistThenGet(categoryId, Category, { deleted: false });
             /* delete category from her parent child array */
            if(typeof category.parent == 'number'){
                console.log("j")
                let parentCategory = await checkExistThenGet(category.parent, Category, { deleted: false });
                let arr = parentCategory.child;
                console.log(arr);
                for(let i = 0;i<= arr.length;i=i+1){
                    console.log(category.id);
                    if(arr[i] == category.id){
                        arr.splice(i, 1);
                    }
                }
                parentCategory.child = arr;
                await parentCategory.save();
                console.log("w")
            }
            /* delete all category children */
            if(category.hasChild == true){
                let childs = await SubCategory.find({parent : categoryId });
                for (let child of childs ) {
                    console.log(child)
                    child.deleted = true;
                    await child.save();
                }
            }
            /* delete users under category */
            let users = await User.find({category : categoryId});
            for (let user of users ) {
                user.accountType = "NOT-ACTIVE";
                await user.save();
            }
             /* delete product under category */
             let products = await Product.find({
                $or: [
                    {category : categoryId},
                    {subCategory : categoryId}, 
                ]  
            });
            for (let id of products ) {
                id.deleted = true;
                await id.save();
            }
            category.deleted = true;

            await category.save();

            res.status(200).send();

        }
        catch (err) {
            next(err);
        }
    },
    async unDelete(req, res, next) {
        try {
            let { categoryId } = req.params;

            let category = await checkExistThenGet(categoryId, Category);
            if(category.parent){
                let parentCategory = await checkExistThenGet(category.parent, Category);
                let arr = parentCategory.child;
                
                var found = arr.find(function(element) {
                    return element == categoryId;
                });
                if(!found){
                    arr.push(categoryId);
                    parentCategory.child = arr;
                    await parentCategory.save();
                }
                
            }
            let users = await User.find({
                $or: [
                    {category : categoryId},
                    {subCategory : categoryId}, 
                ]  
            });
            for (let user of users ) {
                user.deleted = false;
                await user.save();
            }
            category.deleted = false;

            await category.save();

            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    }

};