import ApiResponse from "../../helpers/ApiResponse";
import Report from "../../models/reports/report.model";
import ApiError from '../../helpers/ApiError';
import { checkExist, checkExistThenGet,isMediaUrl ,isInArray} from "../../helpers/CheckMethods";
import { handleImg, checkValidations,convertLang } from "../shared/shared.controller";
import { body } from "express-validator/check";
import Post from "../../models/post/post.model";
import Like from "../../models/like/like.model";
import User from "../../models/user/user.model";
import i18n from "i18n";
import { transformPost,transformPostById } from "../../models/post/transformPost";
import Category from "../../models/category/category.model"
import { toImgUrl } from "../../utils";
import Logger from "../../services/logger";
const logger = new Logger('post '+ new Date(Date.now()).toDateString())
const populateQuery = [
    {
        path: 'owner', model: 'user',
        populate: { path: 'country', model: 'country' },
    },
    {
        path: 'owner', model: 'user',
        populate: { path: 'city', model: 'city' },
    },
    {
        path: 'owner', model: 'user',
        populate: { path: 'area', model: 'area' },
    },
    {
        path: 'owner', model: 'user',
        populate: { path: 'services.service', model: 'category' },
    },
    {path: 'category', model: 'category',}
];
export default {

    async findAll(req, res, next) {

        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let {owner,category,userId} = req.query
            let query = {deleted: false };
            if(owner) query.owner = owner;
            if (category) {
                let values = category.split(",");
                console.log(values)
                query.category = {$in:values};
            };
            let myUser
            if(userId){
                myUser = await checkExistThenGet(userId, User)
            }
            await Post.find(query).populate(populateQuery)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit).then(async(data)=>{
                    let newdata =[]
                    await Promise.all( data.map(async(e)=>{
                        let index = await transformPost(e,lang,myUser,userId)
                        newdata.push(index)
                    }))
                    const postsCount = await Post.countDocuments(query);
                    const pageCount = Math.ceil(postsCount / limit);

                    res.send(new ApiResponse(newdata, page, pageCount, limit, postsCount, req));
                })


            
        } catch (err) {
            next(err);
        }
    },
    async findSelection(req, res, next) {
        try {
            convertLang(req)
            let {owner,category} = req.query
            let query = {deleted: false };
            if(owner) query.owner = owner;
            if (category) {
                let values = category.split(",");
                console.log(values)
                query.category = values;
            };
            let myUser = await checkExistThenGet(req.user._id, User)
            await Post.find(query).populate(populateQuery)
                .sort({ createdAt: -1 }).then(async(data)=>{
                    let newdata =[]
                    await Promise.all( data.map(async(e)=>{
                        let index = await transformPost(e,lang,myUser)
                        newdata.push(index)
                    }))
                    
                    res.send(newdata);
                })
        } catch (err) {
            next(err);
        }
    },

    validateBody(isUpdate = false) {
        let validations = [
            body('title').optional(),
            body('description').optional(),
            body('category').optional().isNumeric().isNumeric().withMessage((value, { req}) => {
                return req.__('category.numeric', { value});
            }),
        ];
        if (isUpdate)
        validations.push([
            body('img').optional().custom(val => isMediaUrl(val)).withMessage((value, { req}) => {
                return req.__('img.syntax', { value});
            }),
            body('thumbnail').optional().custom(val => isMediaUrl(val)).withMessage((value, { req}) => {
                return req.__('thumbnail.syntax', { value});
            })
        ]);

        return validations;
    },

    async create(req, res, next) {

        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","ARTIST"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let user = req.user
            const validatedBody = checkValidations(req);
            validatedBody.owner = req.user._id;
            
            if (req.files) {
                if (req.files['img']) {
                    let imagesList = [];
                    for (let imges of req.files['img']) {
                        imagesList.push(await toImgUrl(imges))
                    }
                    validatedBody.img = imagesList[0];
                    let fileType = req.files['img'][0].mimetype
                    console.log("fileType",fileType);
                    if(fileType == 'image/jpg' || fileType == 'image/jpeg' ||fileType == 'image/png' ||fileType == 'image/gif'){
                        validatedBody.dataType = 'IMAGE'
                    }else{
                        validatedBody.dataType = 'VIDEO'
                    }
                }
                if (req.files['thumbnail']) {
                    console.log("thumbnail",req.files['thumbnail']);
                    let imagesList = [];
                    for (let imges of req.files['thumbnail']) {
                        imagesList.push(await toImgUrl(imges))
                    }
                    validatedBody.thumbnail = imagesList[0];
                    
                }
            }
            if(!validatedBody.category){
                let generalCategory = await Category.findOne({deleted: false,isGeneral:true}).distinct("_id")
                validatedBody.category = generalCategory
            }
            logger.error(`validatedBody post : ${validatedBody.thumbnail}`);
            logger.error(`validatedBody post : ${validatedBody}`);

            let createdPost = await Post.create({ ...validatedBody});
            logger.info(`user ${req.user._id} created Post ${createdPost.id}`);
            let reports = {
                "action":"Create Post",
            };
            await Report.create({...reports, user: user });
            res.status(201).send(createdPost);
        } catch (err) {
            logger.error(`create post error : ${err}`);
            next(err);
        }
    },
    async importFromInsta(req, res, next) {
        try {
            logger.info(`import from instagram`);
            convertLang(req)
            let user = await checkExistThenGet(req.user._id, User);
            if(user.instaUserName){
                let posts = req.body.posts
                posts.forEach(async(val) => {
                    let post = {
                        owner:req.user._id,
                        title:val.title?val.title:"",
                        description:val.description?val.description:"",
                        likesCount:val.likesCount?val.likesCount:0,
                        img:val.img?val.img:""
                    }
                    await Post.create({ ...post});
                });
                let reports = {
                    "action":"import from instagram",
                };
                await Report.create({...reports, user: req.user._id });
                res.status(201).send({success: true});
            }else{
                return next(new ApiError(500,i18n.__('insta.notLinked') ));
            }

            
        } catch (err) {
            next(err);
        }
    },
    async importInstagram(socket,nsp,data){ 
        
        try {
            let theLang = data.lang?data.lang:"ar"
            convertLangSocket(theLang)
            let lang = i18n.getLocale(theLang) 
            var userId = data.userId;
            var toRoom = 'room-'+userId;
            let user = await checkExistThenGet(userId, User);
            if(user.instaUserName){
                let posts = data.posts
                posts.forEach(async(val) => {
                    let post = {
                        owner:req.user._id,
                        title:val.title?val.title:"",
                        description:val.description?val.description:"",
                        likesCount:val.likesCount?val.likesCount:0,
                        img:val.img?val.img:""
                    }
                    await Post.create({ ...post});
                });
                let reports = {
                    "action":"import from instagram",
                };
                await Report.create({...reports, user: req.user._id });
                nsp.to(toRoom).emit('importFromInsta', {success: true});
            }else{
                nsp.to(toRoom).emit('importFromInsta', {data:i18n.__('insta.notLinked')});
            }
           
        }catch (error) {
            console.log(error);
        }
    },
    async findById(req, res, next) {
        try {
            convertLang(req)
            let { postId } = req.params;
            await checkExist(postId, Post, { deleted: false });
            let myUser = await checkExistThenGet(req.user._id, User)
            await Post.findById(postId).populate(populateQuery)
                .sort({ createdAt: -1 }).then(async(e)=>{
                    let index = await transformPostById(e,lang,myUser)
                    res.send(index);
                })
        } catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {

        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","ARTIST"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));

            
            let user = req.user;
            let { postId } = req.params;
            let post = await checkExistThenGet(postId, Post, { deleted: false });
            //if artist not the owner
            if(req.user.type =="ARTIST" && req.user._id != post.owner)
                return next(new ApiError(403, i18n.__('admin.auth')));
            const validatedBody = checkValidations(req);
            
            if (req.files) {
                if (req.files['img']) {
                    let imagesList = [];
                    for (let imges of req.files['img']) {
                        imagesList.push(await toImgUrl(imges))
                    }
                    validatedBody.img = imagesList[0];
                    let fileType = req.files['img'].mimetype
                    if(fileType == 'image/jpg' || fileType == 'image/jpeg' ||fileType == 'image/png' ||fileType == 'image/gif'){
                        validatedBody.dataType = 'IMAGE'
                    }else{
                        validatedBody.dataType = 'VIDEO'
                    }
                }
                if (req.files['thumbnail']) {
                    let imagesList = [];
                    for (let imges of req.files['thumbnail']) {
                        imagesList.push(await toImgUrl(imges))
                    }
                    validatedBody.thumbnail = imagesList[0];
                    
                }
            }
            let updatedPost = await Post.findByIdAndUpdate(postId, {
                ...validatedBody,
            }, { new: true });
            let reports = {
                "action":"Update Post",
            };
            await Report.create({...reports, user: user });
            res.status(200).send(updatedPost);
        }
        catch (err) {
            next(err);
        }
    },
    
    async delete(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","ARTIST"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let user = req.user;
            let { postId } = req.params;
            let post = await checkExistThenGet(postId, Post, { deleted: false });
            //if the artist not the owner
            if(req.user.type =="ARTIST" && req.user._id != post.owner)
                return next(new ApiError(403, i18n.__('admin.auth')));
            
            post.deleted = true;
            await post.save();
            let reports = {
                "action":"Delete Post",
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
     /*like post*/
     async addLike(req, res, next) { 
        try {
            convertLang(req)
            let {postId} = req.params
            await checkExist (postId,Post,{deleted:false})
            let user = await checkExistThenGet(req.user._id, User);
            if(!await Like.findOne({ user: req.user._id, post: postId,deleted:false})){
                let arr = user.likedPosts;
                var found = arr.find(function(element) {
                    return element == postId;
                }); 
                if(!found){
                    user.likedPosts.push(postId);
                    await user.save();
                    let thePost = await checkExistThenGet(postId, Post);
                    thePost.likesCount = thePost.likesCount + 1;
                    thePost.lastLikeDate = new Date()
                    await thePost.save();
                    await Like.create({ user: req.user._id, post: postId });
                    logger.info(`user ${req.user._id} like Post ${postId}`);
                } else{
                    return next(new ApiError(500,i18n.__('post.FoundInList') ));
                }
            }
            
            res.status(200).send({success: true});
        } catch (error) {
            logger.error(`add like  error: ${error}`);
            next(error)
        }
    },
     /*remove like  */
    async unlike(req, res, next) {
        try {
            convertLang(req)
            let {postId } = req.params;
            let like = await Like.findOne({ user: req.user._id, post: postId,deleted:false})
             /*check if  */
            if(!await Like.findOne({ user: req.user._id, post: postId,deleted:false})){
                return next(new ApiError(500, i18n.__('post.notFoundInList')));
            }
            let likes = await checkExistThenGet(like.id, Like, { deleted: false });
            logger.info(`user ${req.user._id} un like Post ${postId}`);
            //if the user make the request is not the owner
            if (likes.user != req.user._id)
                return next(new ApiError(403, i18n.__('notAllow')));
                likes.deleted = true;
            await likes.save();
             /*remove post id from user data*/
            let user = await checkExistThenGet(req.user._id, User);
            let arr = user.likedPosts;
            console.log(arr);
            for(let i = 0;i<= arr.length;i=i+1){
                if(arr[i] == postId){
                    arr.splice(i, 1);
                }
            }
            user.like = arr;
            await user.save();
            /*reduce the likes count */
            let thePost = await checkExistThenGet(postId, Post);
            thePost.likesCount = thePost.likesCount - 1;
            await thePost.save();
            res.send({success: true});
        } catch (error) {
            next(error)
        }
    },
};