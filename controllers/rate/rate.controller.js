
import Product from "../../models/product/product.model";
import User from "../../models/user/user.model";
import i18n from "i18n";
import { body } from "express-validator/check";
import { checkValidations,convertLang } from "../shared/shared.controller";
import ApiError from "../../helpers/ApiError";
import { checkExist } from "../../helpers/CheckMethods";
import ApiResponse from "../../helpers/ApiResponse";
import { checkExistThenGet,isInArray } from "../../helpers/CheckMethods";
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import Notif from "../../models/notif/notif.model";
import Rate from "../../models/rate/rate.model";
import Order from "../../models/order/order.model";
import Logger from "../../services/logger";
const logger = new Logger('rate '+ new Date(Date.now()).toDateString())
const populateQuery = [
    {
        path: 'user', model: 'user',
        populate: { path: 'city', model: 'city' },
    },
];
export default {
    //rate validatedBody
    ratValidateBody(isUpdate = false) {
        let validations = [
            body('comment').optional(),
            body('rate').not().isEmpty().withMessage((value, { req}) => {
                return req.__('rate.required', { value});
            })
            .isNumeric().withMessage((value, { req}) => {
                return req.__('rate.numeric', { value});
            }).isLength({min:1}).withMessage((value, { req}) => {
                return req.__('rate.atLeast', { value}); 
            }),
            body('product').optional().isNumeric().withMessage((value, { req}) => {
                return req.__('product.numeric', { value});
            }),
            body('order').optional(),
            body('artist').optional().isNumeric().withMessage((value, { req}) => {
                return req.__('artist.numeric', { value});
            })
            
            
        ];
        return validations;
    },
    //rate artist or adveristment
    async create(req, res, next) {
        try {
            convertLang(req)
            const validatedBody = checkValidations(req);
            if(validatedBody.comment){
                validatedBody.haveComment = true;
            }else{
                validatedBody.haveComment = false;
            }
            let rated //the value rated on
            if(validatedBody.artist){
                validatedBody.rateOn="ARTIST"
                rated = await checkExistThenGet(validatedBody.artist, User, { deleted: false });
            }
            if(validatedBody.product){
                validatedBody.rateOn="PRODUCT"
                rated = await checkExistThenGet(validatedBody.product, Product, { deleted: false });
                if(validatedBody.order){
                    let order = await checkExistThenGet(validatedBody.order, Order, { deleted: false })
                    let productsOrder = []
                    for (const product of order.productOrders) {
                        productsOrder.push(product.product)
                    }
                    let arr = order.ratedProduct;
                    var found = arr.find(function(element) {
                        return element == validatedBody.product;
                    });
                    if(!found){
                        arr.push(validatedBody.product);
                        order.ratedProduct.push(validatedBody.product);
                    }
                    if(arr.length == productsOrder.length){
                        order.rated = true
                    }
                    await order.save();
                    
                    //ratedProduct
                }
            }
           
            validatedBody.user = req.user._id;
            logger.error(`validatedBody rate : ${validatedBody}`);
            let rateCreated = await Rate.create({ ...validatedBody });
            logger.info(`rateCreated   ${rateCreated.id}`);
            // add the new rate to artist or adveristment rate
            let newRate = rated.rateCount + parseInt(validatedBody.rate);
            rated.rateCount = newRate;
            rated.rateNumbers = rated.rateNumbers + 1;
            let totalDegree = rated.rateNumbers * 5; 
            let degree = newRate * 100
            let ratePrecent = degree / totalDegree;
            let rate = ratePrecent / 20
            rated.rate = parseInt(rate)//Math.ceil(parseInt(rate));
            await rated.save();
            //if artist send notification to artist
            if(validatedBody.artist){
                sendNotifiAndPushNotifi({
                    targetUser: validatedBody.artist, 
                    fromUser: req.user, 
                    text: 'Beauti Nova',
                    subject: rateCreated.id,
                    subjectType: req.user.username + ' add comment on your profile',
                    info:'user'
                });
                let notif = {
                    "description_en":req.user.username + ' add comment your profile',
                    "description_ar":'  بعمل  تعليق على صفحتك'+ req.user.username +' قام',
                    "title_ar":"لديك تقييم جديد",
                    "title_en":"new rate",
                    "type":"RATE"
                }
                await Notif.create({...notif,resource:req.user,target:validatedBody.artist,rate:rateCreated.id});
            }
                
            
            return res.status(200).send({
                success:true,
                rateCreated:rateCreated
            });
        } catch (error) {
            logger.error(`create rate error: ${error}`);
            next(error);
        }
    },
    async getById(req, res, next) {
        try {
            convertLang(req)
            let { rateId } = req.params;
            
            await checkExist(rateId, Rate, { deleted: false });

            let rate = await Rate.findById(rateId)
            return res.status(200).send({
                success:true,
                rate:rate
            });
        } catch (error) {
            next(error);
        }
    },
    //update rate comment or value
    async update(req, res, next) {
        try {
            convertLang(req)           
            let user = req.user;
            let { rateId } = req.params;
            const validatedBody = checkValidations(req);
            let theRate = await checkExistThenGet(rateId,Rate,{deleted:false})
            //user is not the owner of rate and not admin
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type)){
                if(req.user._id != theRate.user){
                    return next(new ApiError(403, i18n.__('admin.auth')));
                }
            }
            let rated 
            if(theRate.rateOn =="ARTIST"){
                rated = await checkExistThenGet(theRate.artist, User, { deleted: false });
            }
            if(theRate.rateOn =="PRODUCT"){
                rated = await checkExistThenGet(theRate.product, Product, { deleted: false });
            }
           
            let rateUpdated = await Rate.findByIdAndUpdate(rateId, { ...validatedBody });

            let newRate = rated.rateCount + parseInt(validatedBody.rate - theRate.rate);
            rated.rateCount = newRate;
            //rated.rateNumbers = rated.rateNumbers + 1;
            let totalDegree = rated.rateNumbers * 5; 
            let degree = newRate * 100
            let ratePrecent = degree / totalDegree;
            let rate = ratePrecent / 20
            rated.rate = parseInt(rate);//Math.ceil(parseInt(rate));
            await rated.save();
            return res.status(200).send({
                success:true,
                rateUpdated: await Rate.findById(rateId)
            });
        } catch (error) {
            next(error);
        }
    },
    //get without pagenation
    async getAll(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req) 
            let {product,artist,userId} = req.query
            let query={deleted:false,haveComment: true}
            if(haveComment) query.haveComment = true

            if(artist){
                query.artist = artist
                query.rateOn = 'ARTIST'
            }
            if(product){
                query.product = product
                query.rateOn = 'PRODUCT'
            }
            let myUser
            if(userId){
                myUser = await checkExistThenGet(userId,User,{deleted:false})
            }
            await Rate.find(query)
            .populate(populateQuery)
            .then(async(data)=>{
                let newdata = []
                data.map(async(e) =>{
                    let value ={
                        rateOn: e.rateOn,
                        rate: e.rate,
                        comment: e.comment,
                        id: e._id,
                        
                        user:{
                            fullname:e.user.fullname,
                            img:e.user.img?e.user.img:"",
                            type:e.user.type,
                            online:e.user.online,
                            id:e.user._id, 
                        }
                    }
                    await newdata.push(value)
                })
                res.status(200).send({
                    success:true,
                    rates:newdata
                });
            })
        } catch (error) {
            next(error);
        }
    },
    //get with pagenation
    async getAllPaginated(req, res, next) {
        try {   
            convertLang(req)      
            let lang = i18n.getLocale(req)   
            let page = +req.query.page || 1, limit = +req.query.limit || 20,
            {date,product,artist,userId} = req.query
            let query={deleted:false,haveComment: true}
            if(artist){
                query.artist = artist
                query.rateOn = 'ARTIST'
            }
            if(product){
                query.product = product
                query.rateOn = 'PRODUCT'
            }
            let myUser
            if(userId){
                myUser = await checkExistThenGet(userId,User,{deleted:false})
            }
            await Rate.find(query)
            .populate(populateQuery)
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })
            .then(async(data)=>{
                let newdata = []
                data.map(async(e) =>{
                    let value ={
                        rateOn: e.rateOn,
                        rate: e.rate,
                        comment: e.comment,
                        id: e._id,
                        user:{
                            fullname:e.user.fullname,
                            img:e.user.img?e.user.img:"",
                            type:e.user.type,
                            online:e.user.online,
                            id:e.user._id, 
                        }
                    }
                    await newdata.push(value)
                })
                let count = await Rate.countDocuments(query);

                const pageCount = Math.ceil(count / limit);
                res.send(new ApiResponse(newdata, page, pageCount, limit, count, req));
            })
            
        } catch (error) {
            next(error);
        }
    },

    //delete
    async delete(req, res, next) {
        
        try {
            convertLang(req)
            
            let { rateId } = req.params;
            let theRate = await checkExistThenGet(rateId, Rate,{deleted:false});
            //user is not the owner of rate and not admin
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type)){
                if(req.user._id != theRate.user){
                    return next(new ApiError(403, i18n.__('admin.auth')));
                }
            }
            
            theRate.deleted = true;
            let rated 
            if(theRate.rateOn =="ARTIST"){
                rated = await checkExistThenGet(theRate.artist, User, { deleted: false });
            }
            if(theRate.rateOn =="PRODUCT"){
                rated = await checkExistThenGet(theRate.product, Product, { deleted: false });
            }
            let newRate = rated.rateCount - parseInt(theRate.rate);
            rated.rateCount = newRate;
            rated.rateNumbers = rated.rateNumbers - 1;
            let totalDegree = rated.rateNumbers * 5; 
            let degree = newRate * 100
            if(degree != 0){
                let ratePrecent = degree / totalDegree;
                let rate = ratePrecent / 20
                rated.rate = parseInt(rate);//Math.ceil(parseInt(rate));
            }else{
                rated.rate = 0
            }
            await rated.save();
            await theRate.save();
            res.send({success: true});

        } catch (err) {
            next(err);
        }
    },


}