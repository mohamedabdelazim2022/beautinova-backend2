import { checkExistThenGet, isLng, isLat, isArray, isNumeric,isInArray } from "../../helpers/CheckMethods";
import ApiResponse from "../../helpers/ApiResponse";
import Order from "../../models/order/order.model";
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import Notif from "../../models/notif/notif.model"
import { body } from "express-validator/check";
import Product from "../../models/product/product.model";
import { ValidationError } from "mongoose";
import { checkValidations ,convertLang} from "../shared/shared.controller";
import ApiError from "../../helpers/ApiError";
import User from "../../models/user/user.model";
import Report from "../../models/reports/report.model";
import City from "../../models/city/city.model";
import Area from "../../models/area/area.model";
import Cart from "../../models/cart/cart.model";
import Address from "../../models/address/address.model";
import Coupon from "../../models/coupon/coupon.model";
import i18n from "i18n";
import Setting from "../../models/setting/setting.model"
import Stock from "../../models/product/stock.model";
import Offer from "../../models/product/offer.model";
import { transformOrder, transformOrderById } from "../../models/order/transformOrder";
import moment from 'moment'
import Logger from "../../services/logger";
const logger = new Logger('orders '+ new Date(Date.now()).toDateString())
const populateQuery = [
    {
        path: 'client', model: 'user',
        populate: { path: 'country', model: 'country' }
    },
    { path: 'city', model: 'city' },
    { path: 'area', model: 'area' },
    { path: 'promoCode', model: 'coupon' },
    {
        path: 'productOrders.product', model: 'product',
        populate: { path: 'category', model: 'category' }
    },
    {
        path: 'productOrders.product', model: 'product',
        populate: { path: 'subCategory', model: 'category' }
    },
    {
        path: 'productOrders.product', model: 'product',
        populate: { 
            path: 'stock', model: 'stock' ,
        },
    },
    {
        path: 'productOrders.product', model: 'product',
        populate: { path: 'brand', model: 'brand' }
    },
    {
        path: 'productOrders.color', model: 'color',
    },
    {
        path: 'productOrders.size', model: 'size',
    },
];
const populateQuery2 = [
    { path: 'city', model: 'city' },
    { path: 'area', model: 'area' },
]
const populateProduct = [
    {
        path: 'stock', model: 'stock',
    }
];
function validatedestination(location) {
    if (!isLng(location[0]))
        throw new ValidationError.UnprocessableEntity({ keyword: 'location', message: 'location[0] is invalid lng' });
    if (!isLat(location[1]))
        throw new ValidationError.UnprocessableEntity({ keyword: 'location', message: 'location[1] is invalid lat' });
}

export default {
    async findOrders(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20
                ,{search, status,client,paymentSystem ,accept,start,end} = req.query
                , query = {deleted: false };
            if(start && end) {
                let from = start + 'T00:00:00.000Z';
                let to= end + 'T23:59:00.000Z';
                console.log( from)
                query = { 
                    createdAt: { $gt : new Date(from), $lt : new Date(to) }
                };
            } 
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {client: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            if (status) query.status = status;
            if (accept) query.accept = accept;
            if (client) query.client = client;
            if (paymentSystem) query.paymentSystem = paymentSystem;

            await Order.find(query).populate(populateQuery)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit).skip((page - 1) * limit).then(async (data) =>{
                    let newdate = [];
                    await Promise.all(data.map(async(e)=>{
                        let index = await transformOrder(e,lang)
                        newdate.push(index)
                    }))
                    const ordersCount = await Order.countDocuments(query);
                    const pageCount = Math.ceil(ordersCount / limit);
        
                    res.send(new ApiResponse(newdate, page, pageCount, limit, ordersCount, req));
                })
        } catch (err) {
            next(err);
        }
    },
    async getOrders(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let {search, status,client,paymentSystem ,accept,start,end} = req.query
                , query = {deleted: false };
            if(start && end) {
                let from = start + 'T00:00:00.000Z';
                let to= end + 'T23:59:00.000Z';
                console.log( from)
                query = { 
                    createdAt: { $gt : new Date(from), $lt : new Date(to) }
                };
            } 
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {client: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            if (status) query.status = status;
            if (accept) query.accept = accept;
            if (client) query.client = client;
            if (paymentSystem) query.paymentSystem = paymentSystem;

            await Order.find(query).populate(populateQuery)
                .sort({ createdAt: -1 }).then(async (data) =>{
                    let newdate = [];
                    await Promise.all(data.map(async(e)=>{
                        let index = await transformOrder(e,lang)
                        newdate.push(index)
                    }))
                    res.send({success: true,data:newdate});
                })

            
        } catch (err) {
            next(err);
        }
    },
    //get for mobile only
    async findOrdersMobile(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20
                ,{search, status,client,paymentSystem ,accept,start,end,groupByDate} = req.query
                , query = {deleted: false };
            if(start && end) {
                let from = start + 'T00:00:00.000Z';
                let to= end + 'T23:59:00.000Z';
                console.log( from)
                query = { 
                    createdAt: { $gt : new Date(from), $lt : new Date(to) }
                };
            } 
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {client: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            if (status) query.status = status;
            
            if (accept) query.accept = accept;
            if (client) query.client = client;
            if (paymentSystem) query.paymentSystem = paymentSystem;
            await Order.find(query).populate(populateQuery)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit).then(async (data) =>{
                    let dailyOrders = [];
                    let weeklyOrders = [];
                    let oldOrders = [];
                    let orders = [];
                    await Promise.all(data.map(async(e)=>{
                        let index = await transformOrder(e,lang)
                        if(groupByDate=="true"){
                            let curr = moment().format("YYYY-MM-DD")
                            let dailyFrom = curr + 'T00:00:00.000Z';
                            let dailyTo= curr + 'T23:59:00.000Z';
                             //this week
                            let startWeek = moment(new Date()).startOf('week').add(-1, 'd').format('YYYY-MM-DD')
                            var endWeek =  moment(new Date()).endOf('week').add(-1, 'd').format('YYYY-MM-DD');
                            
                            if(Date.parse(e.createdAt)>=Date.parse(dailyFrom) && Date.parse(e.createdAt)<=Date.parse(dailyTo)){
                                dailyOrders.push(index);
                            }else{
                                if(Date.parse(e.createdAt)>=Date.parse(startWeek) && Date.parse(e.createdAt)<=Date.parse(endWeek)){
                                    weeklyOrders.push(index);
                                }else{
                                    oldOrders.push(index);
                                }
                            }
                        }else{
                            orders.push(index);
                        }
                    }))
                    if(groupByDate=="true"){
                        orders = {
                            dailyOrders: dailyOrders,
                            weeklyOrders:weeklyOrders,
                            oldOrders:oldOrders
                        }
                    }
                    const ordersCount = await Order.countDocuments(query);
                    const pageCount = Math.ceil(ordersCount / limit);
                    res.send(new ApiResponse(orders, page, pageCount, limit, ordersCount, req));
                    
                })
            
        } catch (err) {
            next(err);
        }
    },
    validateGetPrices() {
        let validations = [
            body('city').not().isEmpty().withMessage((value, { req}) => {
                return req.__('city.required', { value});
            }).isNumeric().isNumeric().withMessage((value, { req}) => {
                return req.__('city.numeric', { value});
            }),
            body('area').not().isEmpty().withMessage((value, { req}) => {
                return req.__('area.required', { value});
            }).isNumeric().isNumeric().withMessage((value, { req}) => {
                return req.__('area.numeric', { value});
            }),
            body('promoCode').optional(),
            body('productOrders').custom(vals => isArray(vals)).withMessage((value, { req}) => {
                return req.__('productOrders.array', { value});
            })
            .isLength({ min: 1 }).withMessage((value, { req}) => {
                return req.__('productOrders.atLeastOne', { value});
            })
            .custom(async (productOrders, { req }) => {
                // check if it's duplicated product
                const uniqueValues = new Set(productOrders.map(v => v.product));
                if (uniqueValues.size < productOrders.length) {
                    throw new Error(`Duplicated Product : ${productOrder.product}`);
                }
                    
                let prevProductId;
                for (let productOrder of productOrders) {
                    
                    prevProductId = productOrder.product;
                    let productDetail = await checkExistThenGet(productOrder.product, Product);
                    if(productOrder.count > productDetail.quantity)
                            throw new Error(req.__('edit.productCount'));
                    // check if count is a valid number 
                    if (!isNumeric(productOrder.count))
                        throw new Error(`Product: ${productOrder.product} has invalid count: ${productOrder.count}!`);
                    
                }
                return true;
            }),
        ];
        return validations;
    },
    async getPrice(req, res, next) {
        try {
            convertLang(req)
            
            const validatedBody = checkValidations(req);
            let total = 0;
            let delivaryCost =0
            let finalTotal = 0;
            let freeShipping = false;
            for (let singleProduct of validatedBody.productOrders) {
                let productDetail = await checkExistThenGet(singleProduct.product, Product,{populate:populateProduct});
                if(productDetail.freeShipping == true) {
                    freeShipping = true;
                }else{
                    freeShipping = false;
                }
                //
                let itemStock = productDetail.stock.findIndex( v => v.size == singleProduct.size)
                if(itemStock != -1){
                    itemStock = productDetail.stock[itemStock]
                }else{
                    return next(new ApiError(500, i18n.__('size.notFound')));
                }
                if(!itemStock){
                    return next(new ApiError(500, i18n.__('size.notFound')));
                }
                let hasOffer = false
                let sizeOffer = await Offer.findOne({product:singleProduct.product,deleted:false,size:singleProduct.size})
                let productOfferPrice = 0;
                
                if(sizeOffer){
                    hasOffer=true
                    let offerPrice = sizeOffer.offerPrice
                    productOfferPrice = offerPrice
                }
                if(singleProduct.color){
                    let colorOffer = await Offer.findOne({product:singleProduct.product,deleted:false,color:singleProduct.color})
                    if(colorOffer){
                        if(colorOffer.discountType =="RATIO"){
                            let offerPrice = itemStock.price - (itemStock.price * colorOffer.offerRatio ) /100;
                            if(offerPrice < productOfferPrice){
                                productOfferPrice = offerPrice
                            }
                        }else{
                            let offerPrice = colorOffer.offerPrice ;
                            if(offerPrice < productOfferPrice){
                                productOfferPrice = offerPrice
                            }
                        }
                        
                        hasOffer=true
                    }
                    
                }
                if(hasOffer==true){//start from here
                    total += productOfferPrice * singleProduct.count;
                } else{
                    total += itemStock.price * singleProduct.count;
                }                
                console.log(singleProduct.count +""+productDetail.quantity)
                if(singleProduct.count > productDetail.quantity){
                    return next(new ApiError(500, i18n.__('edit.productCount')));
                }
 
            }
            let promoCode = false;
            let discount = 0;
            let discountRatio = 0
            if(validatedBody.promoCode){
                if(await Coupon.findOne({deleted:false,end:false,couponNumber: { $regex: validatedBody.promoCode, '$options' : 'i'  },expireDateMillSec:{$gte:Date.parse(new Date())}})){
                    let coupon = await Coupon.findOne({deleted:false,end:false,couponNumber: { $regex: validatedBody.promoCode, '$options' : 'i'  }})
                    if(coupon.discountType == "RATIO"){
                        discount = (total * coupon.discount) / 100;
                        discountRatio = coupon.discount
                        total = total - discount
                    }else{
                        discount = coupon.discount
                        total = discount > total? 0 :total - discount
                    }
                    
                    promoCode = true
                }else{
                    return next(new ApiError(500, i18n.__('wrong.promoCode')));
                }
            }else{
                validatedBody.total = total;
            }
            let city = await checkExistThenGet(validatedBody.city, City);
            delivaryCost = city.delivaryCost
            let area = await checkExistThenGet(validatedBody.area, Area);
            if(area.delivaryCost != 0){
                delivaryCost = area.delivaryCost;
            }
             
             //
            let setting = await Setting.findOne({deleted:false})
            if(freeShipping == false){
                if(total >= setting.freeShipping){
                    //delivaryCost = 0
                    freeShipping = true;
                }
            }
            
            //freeShipping enable ,reason is (total > freeShippingCost or all product in order has freeShipping)
            if(freeShipping == true){
                delivaryCost = 0
            }
            finalTotal = total + delivaryCost;
            //
            res.send({
                success: true,
                productsCost:total,
                delivaryCost:delivaryCost,
                finalTotal:finalTotal,
                promoCode:promoCode,
                discountRatio:discountRatio,
                discount:discount,
                freeShipping:freeShipping
            });
        } catch (error) {
            next(error)
        }
    }, 
    validateCreatedOrders() {
        let validations = [
            body('destination').not().isEmpty().withMessage((value, { req}) => {
                return req.__('destination.required', { value});
            }),
            body('paymentSystem').not().isEmpty().withMessage((value, { req}) => {
                return req.__('paymentSystem.required', { value});
            }),
            body('phone').not().isEmpty().withMessage((value, { req}) => {
                return req.__('phone.required', { value});
            }),
            body('street').not().isEmpty().withMessage((value, { req}) => {
                return req.__('street.required', { value});
            }),
            body('placeType').not().isEmpty().withMessage((value, { req}) => {
                return req.__('placeType.required', { value});
            }),
            body('floor').not().isEmpty().withMessage((value, { req}) => {
                return req.__('floor.required', { value});
            }),
            body('apartment').not().isEmpty().withMessage((value, { req}) => {
                return req.__('apartment.required', { value});
            }),
            body('address').not().isEmpty().withMessage((value, { req}) => {
                return req.__('address.required', { value});
            }),
            body('city').not().isEmpty().withMessage((value, { req}) => {
                return req.__('city.required', { value});
            }).isNumeric().isNumeric().withMessage((value, { req}) => {
                return req.__('city.numeric', { value});
            }),
            body('area').not().isEmpty().withMessage((value, { req}) => {
                return req.__('area.required', { value});
            }).isNumeric().isNumeric().withMessage((value, { req}) => {
                return req.__('area.numeric', { value});
            }),
            body('promoCode').optional(),
            body('newAddress').optional(),
            body('productOrders').custom(vals => isArray(vals)).withMessage((value, { req}) => {
                return req.__('productOrders.array', { value});
            })
            .isLength({ min: 1 }).withMessage((value, { req}) => {
                return req.__('productOrders.atLeastOne', { value});
            })
            .custom(async (productOrders, { req }) => {
                // check if it's duplicated product
                const uniqueValues = new Set(productOrders.map(v => v.product));
                if (uniqueValues.size < productOrders.length) {
                    throw new Error(`Duplicated Product : ${productOrder.product}`);
                }
                let prevProductId;
                for (let productOrder of productOrders) {
                    prevProductId = productOrder.product;
                    let productDetail = await checkExistThenGet(productOrder.product, Product);
                    if(productOrder.count > productDetail.quantity)
                            throw new Error(req.__('edit.productCount'));
                    // check if count is a valid number 
                    if (!isNumeric(productOrder.count))
                        throw new Error(`Product: ${productOrder.product} has invalid count: ${productOrder.count}!`);
                    
                }
                return true;
            }),
        ];
        return validations;
    }, 
    async create(req, res, next) {
        try {
            convertLang(req)
            const validatedBody = checkValidations(req);
            logger.error(`validatedBody order : ${validatedBody}`);
            let theUser = await checkExistThenGet(req.user._id, User, { deleted: false })
            //check if user is block
            if (theUser.block == true)
                return next(new ApiError(500, i18n.__('user.block')));
            //check coupon validation
            if(validatedBody.promoCode){
                logger.info(`promoCode  : ${promoCode}`);
                let promoCode = await Coupon.findOne({deleted:false,end:false,couponNumber: { $regex: validatedBody.promoCode, '$options' : 'i'  }})
                if(promoCode){
                    console.log("theUser",theUser.usedCoupons)
                    logger.info(`theUser  used coupons: ${theUser.usedCoupons}`);
                    var found = theUser.usedCoupons.find((e) => e == promoCode._id)
                    if(found){
                        if(promoCode.singleTime === true)
                            return next(new ApiError(500, i18n.__('used.promoCode'))); 
                    }
                }else{
                    return next(new ApiError(500, i18n.__('wrong.promoCode'))); 
                }
            }
            let freeShipping = false;
            validatedestination(validatedBody.destination);
            validatedBody.destination = { type: 'Point', coordinates: [+req.body.destination[0], +req.body.destination[1]] };
            let total = 0;
            for (let singleProduct of validatedBody.productOrders) {
                let productDetail = await checkExistThenGet(singleProduct.product, Product,{populate:populateProduct});
                //check if product has free shipping
                if(freeShipping == false && productDetail.freeShipping == true) {
                    freeShipping = true;
                }
                //search about product size in product stock
                console.log("productDetail",productDetail.stock)
                logger.info(`productDetail stock : ${productDetail.stock}`);
                let itemStock = productDetail.stock.findIndex( v => v.size == singleProduct.size)
                if(itemStock != -1){
                    itemStock = productDetail.stock[itemStock]
                }else{
                    return next(new ApiError(500, i18n.__('size.notFound')));
                }
                //if size not exist in stock
                console.log("itemStock",itemStock)
                logger.info(`itemStock : ${itemStock}`);
                if(!itemStock){
                    return next(new ApiError(500, i18n.__('size.notFound')));
                }
                //check offer 
                let hasOffer = false
                //offer on size
                let sizeOffer = await Offer.findOne({product:singleProduct.product,deleted:false,size:singleProduct.size})
                let productOfferPrice = 0;
                if(sizeOffer){
                    hasOffer=true
                    let offerPrice = sizeOffer.offerPrice
                    productOfferPrice = offerPrice
                }
                //offer on color
                if(singleProduct.color){
                    let colorOffer = await Offer.findOne({product:singleProduct.product,deleted:false,color:singleProduct.color})
                    if(colorOffer){
                        if(colorOffer.discountType =="RATIO"){
                            let offerPrice = itemStock.price - (itemStock.price * colorOffer.offerRatio ) /100;
                            if(offerPrice < productOfferPrice){
                                productOfferPrice = offerPrice
                            }
                        }else{
                            let offerPrice = colorOffer.offerPrice ;
                            if(offerPrice < productOfferPrice){
                                productOfferPrice = offerPrice
                            }
                        }
                        hasOffer=true
                    }
                    
                }
                //if offer
                if(hasOffer==true){
                    logger.info(`hasOffer : `);
                    total += productOfferPrice * singleProduct.count;
                } else{
                    total += itemStock.price * singleProduct.count;
                }   
                //add unit cost of product to products orders
                let productIndex =  validatedBody.productOrders.findIndex( v => v.product == singleProduct.product)
                
                validatedBody.productOrders[productIndex].unitCost = hasOffer==true?productOfferPrice:itemStock.price;
                
                console.log(singleProduct.count," ",productDetail.quantity)
                logger.info(`singleProduct count : ${singleProduct.count} and productDetail.quantity : ${productDetail.quantity}`);
                //if product quantity is exist in product
                if(singleProduct.count <= productDetail.quantity){
                    //if size quantity is exist in stock
                    if(singleProduct.count <= itemStock.quantity){
                        itemStock.quantity = itemStock.quantity - singleProduct.count
                    }else{
                        return next(new ApiError(500, i18n.__('edit.productCount')));
                    }
                    ////if color quantity is exist in stock
                    if(singleProduct.color){
                        let colorIndex =  itemStock.colors.findIndex( v => v.color == singleProduct.color)
                        if(colorIndex == -1){
                            return next(new ApiError(500, i18n.__('color.notExist')));
                        }
                        let theColor = itemStock.colors[colorIndex];
                        if(singleProduct.count <= theColor.quantity){
                            theColor.quantity = theColor.quantity - singleProduct.count;
                            itemStock.colors.splice(colorIndex, 1);
                            itemStock.colors.push(theColor);
                        }else{
                            return next(new ApiError(500, i18n.__('edit.productCount')));
                        }
                    }
                    await itemStock.save();
                    let newQuantity = productDetail.quantity - singleProduct.count;
                    productDetail.quantity = newQuantity;
                    productDetail.sallCount = productDetail.sallCount + singleProduct.count
                    if(newQuantity <= 0){
                        //productDetail.available = false;
                        //productDetail.visible = false
                    }
                    await productDetail.save();
                    
                } else{
                    return next(new ApiError(500, i18n.__('edit.productCount')));
                }
            }     
            console.log("total ", total)
            logger.info(`total : ${total} `);
            //if coupon exist
            if(validatedBody.promoCode){
                let promoCode = await Coupon.findOne({deleted:false,end:false,couponNumber: { $regex: validatedBody.promoCode, '$options' : 'i'  }})
                if(promoCode){
                    theUser.usedCoupons.push(promoCode)
                    await theUser.save();
                    if(promoCode.discountType == "RATIO"){
                        let discount = (total * promoCode.discount) / 100;
                        total = total - discount
                    }else{
                        let discount = promoCode.discount
                        total = discount > total? 0 :total - discount
                    }
                    validatedBody.promoCode = promoCode.id
                    validatedBody.hasPromoCode = true
                    validatedBody.discount = promoCode.discount
                }else{
                    return next(new ApiError(500, i18n.__('wrong.promoCode'))); 
                }
            }else{
                validatedBody.total = total;
            }
            //delivery cost
            let city = await checkExistThenGet(validatedBody.city, City);
            validatedBody.delivaryCost = city.delivaryCost
            let area = await checkExistThenGet(validatedBody.area, Area);
            if(area.delivaryCost != 0){
                validatedBody.delivaryCost = area.delivaryCost;
            }
            //check if there is free shipping in any order from admin panel
            let setting = await Setting.findOne({deleted:false})
            if(freeShipping ==false){
                if(total >= setting.freeShipping){
                    //validatedBody.delivaryCost = 0
                    validatedBody.freeShipping = true;
                    freeShipping = true;
                }
            }
            
            //freeShipping enable ,reason is (total > freeShippingCost or all product in order has freeShipping)
            if(freeShipping == true){
                validatedBody.delivaryCost = 0
                validatedBody.freeShipping = true;
            }
            validatedBody.total = total
            validatedBody.finalTotal = total + validatedBody.delivaryCost;
            validatedBody.paymentSystem = validatedBody.paymentSystem;
            //create order
            logger.info(`order data  : ${validatedBody} `);
            let createdOrder = await Order.create({ ...validatedBody,client: req.user});
            //remove user cart
            theUser.carts = [];
            let carts = await Cart.find({ user: req.user._id });
            for (let cart of carts ) {
                cart.deleted = true;
                await cart.save();
            }
            await theUser.save();
            //send notifs to admin
            let users = await User.find({'type':['ADMIN','SUB-ADMIN']});
            users.forEach(async(user) => {
                sendNotifiAndPushNotifi({////////
                    targetUser: user.id, 
                    fromUser: req.user._id, 
                    text: 'new notification',
                    subject: createdOrder.id,
                    subjectType: 'new order',
                    info:'order'
                });
                let notif = {
                    "description_en":'New order ',
                    "description_ar":'طلب جديد',
                    "title_en":"New Order",
                    "title_ar":"طلب جديد",
                    "type":"ORDER"
                }
                await Notif.create({...notif,resource:req.user._id,target:user.id,order:createdOrder.id});
            });
            //send notif to client
            sendNotifiAndPushNotifi({
                targetUser: req.user._id, 
                fromUser: 'BeautiNova', 
                text: ' Order placed! ',
                subject: createdOrder.id,
                subjectType: 'Your order is placed and will be delivered within 3 business days!',
                info:'order'
            });
            let notif = {
                "title_en":' Order placed! ',
                "title_ar":'جارى تنفيذ طلبك',
                "description_en":"Your order is placed and will be delivered within 3 business days!",
                "description_ar":"طلبك تحت الاجراء وسيتم التوصيل خلال 3 ايام عمل",
                "type":"ORDER"
            }
            await Notif.create({...notif,resource:req.user,target:req.user._id,order:createdOrder.id});
            //check if order has new address
            if(validatedBody.newAddress == "true"){
                Address.create({
                    user:req.user._id,
                    city:validatedBody.city,
                    area:validatedBody.area,
                    phone:validatedBody.phone,
                    address:validatedBody.address,
                    street:validatedBody.street,
                    placeType:validatedBody.placeType,
                    floor:validatedBody.floor,
                    apartment:validatedBody.apartment,                
                })
            }
            let reports = {
                "action":"Create New Order",
            };
            await Report.create({...reports, user: req.user });
            res.status(201).send(await Order.populate(createdOrder, populateQuery));
        } catch (err) {
            logger.error(`create order error  : ${err} `);
            next(err);
            
        }
    },
    //find one
    async findById(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let {orderId } = req.params;
            await Order.findById(orderId).populate(populateQuery)
                .sort({ createdAt: -1 }).then(async (e) =>{
                    let index = await transformOrderById(e,lang)
                    res.send({success: true,data:index});
                })
        } catch (err) {
            next(err);
        }
    },
    //accept
    async accept(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 
            let { orderId } = req.params;
            let order = await checkExistThenGet(orderId, Order);
            if (['DELIVERED'].includes(order.status))
                return next(new ApiError(500, i18n.__('status.notPending')));
            for (let singleProduct of order.productOrders) {
                let productDetail = await checkExistThenGet(singleProduct.product, Product);
                //search about product size in product stock
                let itemStock = await Stock.findOne({product:singleProduct.product,size:singleProduct.size,deleted:false})
                //add count to quantity in stock
                itemStock.quantity = itemStock.quantity + singleProduct.count
                ////add count to color quantity  in stock
                if(singleProduct.color){
                    let colorIndex =  itemStock.colors.findIndex( v => v.color == singleProduct.color)
                    let theColor = itemStock.colors[colorIndex];
                    theColor.quantity = theColor.quantity + singleProduct.count;
                    itemStock.colors.splice(colorIndex, 1);
                    itemStock.colors.push(theColor);
                }
                await itemStock.save();
                let newQuantity = productDetail.quantity + singleProduct.count;
                productDetail.quantity = newQuantity;
                productDetail.sallCount = productDetail.sallCount - singleProduct.count
                //productDetail.available = true;
                //productDetail.visible = true
                await productDetail.save();
            }  
            order.status = 'ACCEPTED';
            await order.save();
            sendNotifiAndPushNotifi({
                targetUser: order.client, 
                fromUser: req.user, 
                text: 'new notification',
                subject: order.id,
                subjectType: 'BeautiNova accept your order'
            });
            let notif = {
                "description_en":'BeautiNova accept your order',
                "description_ar":'تم قبول طلبك',
                "title_ar":"جارى توصيل الطلب",
                "title_en":"Delivery in Progress",
                "type":"ORDER"
            }
            await Notif.create({...notif,resource:req.user,target:order.client,order:order.id});
            let reports = {
                "action":"Accept Order",
            };
            await Report.create({...reports, user: req.user });
            res.status(200).send({success: true});
        } catch (error) {
            logger.info(`accept order : ${orderId} error : ${error}`);
            next(error)
        }
    },
    //cancel
    async cancel(req, res, next) {
        try {
            convertLang(req)
            let { orderId } = req.params;
            let order = await checkExistThenGet(orderId, Order, { deleted: false });
            if (['DELIVERED','OUT-FOR-DELIVERY'].includes(order.status))
                return next(new ApiError(500, i18n.__('notAllow')));
            order.status = 'CANCELED';
            logger.info(`user ${req.user._id} change status of order : ${orderId} to refused`);
            for (let singleProduct of order.productOrders) {
                logger.info(`singleProduct : ${singleProduct}`);
                let productDetail = await checkExistThenGet(singleProduct.product, Product);
                //search about product size in product stock
                let itemStock = await Stock.findOne({product:singleProduct.product,size:singleProduct.size,deleted:false})
                console.log("itemStock",itemStock)
                logger.info(`itemStock : ${itemStock}`);
                //add count to quantity in stock
                itemStock.quantity = itemStock.quantity + singleProduct.count

                ////add count to color quantity  in stock
                if(singleProduct.color){
                    logger.info(`product color ${singleProduct.color}`);
                    let colorIndex =  itemStock.colors.findIndex( v => v.color == singleProduct.color)
                    if(colorIndex == -1){
                        return next(new ApiError(500, i18n.__('color.notExist')));
                    }
                    if(colorIndex){
                        let theColor = itemStock.colors[colorIndex];
                        theColor.quantity = theColor.quantity + singleProduct.count;
                        itemStock.colors.splice(colorIndex, 1);
                        itemStock.colors.push(theColor);
                    }
                    logger.info(`colorIndex ${colorIndex}`);
                    
                }
                await itemStock.save();
                let newQuantity = productDetail.quantity + singleProduct.count;
                productDetail.quantity = newQuantity;
                productDetail.sallCount = productDetail.sallCount - singleProduct.count
                //productDetail.available = true;
                //productDetail.visible = true
                await productDetail.save();
            }    
            order.cancelDateMillSec = Date.parse(new Date())
            await order.save();
            //send notification
            sendNotifiAndPushNotifi({
                targetUser: order.client, 
                fromUser: req.user, 
                text: 'Order Cancelled 😞 ',
                subject: order.id,
                subjectType: 'Your order is cancelled! you can reorder anytime from My Orders Page.'
            });
            let notif = {
                "description_en":'Your order is cancelled! you can reorder anytime from My Orders Page.',
                "description_ar":'تم الغاء طلبك ! يمكنك اعاده الطلب فى اى وقت',
                "title_en": 'Order Cancelled 😞 ',
                "title_ar":'قام العميل بالغاء الطلب' ,
                "type":"ORDER"
            }
            await Notif.create({...notif,resource:req.user,target:order.client,order:order.id});
            let reports = {
                "action":"cancel Order",
            };
            await Report.create({...reports, user: req.user });
            res.status(200).send({success: true});
        } catch (error) {
            logger.error(`cancel order error : ${error}`);
            next(error)
        }
    },
    //refused
    async refuse(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 
            let { orderId } = req.params;
            let order = await checkExistThenGet(orderId, Order);
            if (['DELIVERED','OUT-FOR-DELIVERY'].includes(order.status))
                return next(new ApiError(500, i18n.__('notAllow')));
            order.status = 'REFUSED';
            order.accept = false
            logger.info(`user ${req.user._id} change status of order : ${orderId} to refused`);

            if(req.body.reason) order.reason = req.body.reason
            //return order to quantity
            for (let singleProduct of order.productOrders) {
                let productDetail = await checkExistThenGet(singleProduct.product, Product);
                //search about product size in product stock
                let itemStock = await Stock.findOne({product:singleProduct.product,size:singleProduct.size,deleted:false})
                //add count to quantity in stock
                itemStock.quantity = itemStock.quantity + singleProduct.count
                ////add count to color quantity  in stock
                if(singleProduct.color){
                    logger.info(`product color ${singleProduct.color}`);
                    let colorIndex =  itemStock.colors.findIndex( v => v.color == singleProduct.color)
                    if(colorIndex == -1)
                        return next(new ApiError(500, i18n.__('color.notExist')));
                    
                    if(colorIndex){
                        let theColor = itemStock.colors[colorIndex];
                        theColor.quantity = theColor.quantity + singleProduct.count;
                        itemStock.colors.splice(colorIndex, 1);
                        itemStock.colors.push(theColor);
                    }
                    logger.info(`colorIndex ${colorIndex}`);
                    
                }
                await itemStock.save();
                let newQuantity = productDetail.quantity + singleProduct.count;
                productDetail.quantity = newQuantity;
                productDetail.sallCount = productDetail.sallCount - singleProduct.count
                //productDetail.available = true;
                //productDetail.visible = true
                await productDetail.save();
            }  
            order.refusedDateMillSec = Date.parse(new Date())
            await order.save();
            sendNotifiAndPushNotifi({
                targetUser: order.client, 
                fromUser: req.user, 
                text: 'Order cancelled! ',
                subject: order.id,
                subjectType: req.body.reason
            });
            let notif = {
                "description_en":req.body.reason,
                "description_ar":req.body.reason,
                "title_en": 'Order cancelled! ',
                "title_ar":'  تم رفض  طلبك بسبب' ,
                "type":"ORDER"
            }
            await Notif.create({...notif,resource:req.user,target:order.client,order:order.id});
            let reports = {
                "action":"Refuse Order",
            };
            await Report.create({...reports, user: req.user });
            res.status(200).send({success: true});
        } catch (error) {
            logger.error(`refused order error : ${error}`);
            next(error)
        }
    },
    //out for delivery
    async outForDelivery(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let { orderId } = req.params;
            let order = await checkExistThenGet(orderId, Order);
            order.status = 'OUT-FOR-DELIVERY';
            order.outForDeliveryDateMillSec = Date.parse(new Date())
            await order.save();
            logger.info(`user ${req.user._id} change status of order : ${orderId} to out for Delivery`);
            sendNotifiAndPushNotifi({
                targetUser: order.client, 
                fromUser: req.user, 
                text: 'Order is out for delivery! ',
                subject: order.id,
                subjectType: ' Your goodies are on their way! 😍'
            });
            let notif = {
                "description_en":'Your goodies are on their way! 😍',
                "description_ar":' بدأ توصيل طلبك',
                "title_en": 'Order is out for delivery! ',
                "title_ar":' بدأ توصيل طلبك' ,
                "type":"ORDER"
            }
            Notif.create({...notif,resource:req.user,target:order.client,order:order.id});
            let reports = {
                "action":"Order Out For DELIVERY",
            };
            await Report.create({...reports, user: req.user });
            res.status(200).send({success: true});
        } catch (error) {
            next(error)
        }
    },
    //order is delivered
    async deliver(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let { orderId } = req.params;
            let order = await checkExistThenGet(orderId, Order);
            order.status = 'DELIVERED';
            order.deliveredDateMillSec = Date.parse(new Date())
            await order.save();
            logger.info(`user ${req.user._id} change status of order : ${orderId} to  Delived`);
            //send notification
            sendNotifiAndPushNotifi({
                targetUser: order.client, 
                fromUser: req.user, 
                text: 'Order Delivered 😍 ',
                subject: order.id,
                subjectType: "Your order is Delivered, don't forget to leave a review for the Beautinova community!"
            });
            let notif = {
                "description_en":"Your order is Delivered, don't forget to leave a review for the Beautinova community!",
                "description_ar":'تم توصيل طلبك لا تنسى ان تترك تقييمك',
                "title_en": 'Order Delivered 😍 ',
                "title_ar":' تم توصيل طلبك' ,
                "type":"ORDER"
            }
            Notif.create({...notif,resource:req.user,target:order.client,order:order.id});
            let reports = {
                "action":"Order DELIVERED",
            };
            await Report.create({...reports, user: req.user });
            res.status(200).send({success: true});
        } catch (error) {
            next(error)
        }
    },
    //delete order
    async delete(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 
            let { orderId } = req.params;
            let order = await checkExistThenGet(orderId, Order);
            order.deleted = true;
            await order.save();
            logger.info(`user ${req.user._id} delete order : ${orderId} `);
            let reports = {
                "action":"Delete Order",
            };
            await Report.create({...reports, user: req.user });
            res.status(200).send({success: true});
        } catch (error) {
            next(error)
        }
    },
    async findAllUserAddresses(req, res, next) {
        try {
            convertLang(req)
            let addresses = await Address.find({user:req.user._id,deleted: false})
                .sort({ createdAt: -1 }).populate(populateQuery2)
            res.send(addresses);
        } catch (err) {
            next(err);
        }
    },
    //check if there's an order not rated from client
    async getOrderToRate(socket,nsp,data){ 
        try {
            var userId = data.userId;
            var toRoom = 'room-'+userId;
            await Order.findOne({status:'DELIVERED',client:userId,deleted:false,rated:false})
            .select('productOrders').populate(populateQuery).then(async(data2)=>{
                console.log(data2.productOrders)
               let products = [];
                data2.productOrders.map(async(e)=>{
                   products.push({
                       img: e.product.img[0],
                       id:e.product.id,
                   })
                })
                Order.findOneAndUpdate({status:'DELIVERED',client:userId,deleted:false,rated:false},{rated:true},{new: true})
                .then((data1)=>{
                    console.log('done')
                    nsp.to(toRoom).emit('orderRate', {data:products,order:data2._id});
                })
                .catch((err)=>{
                    console.log(err);
                });
            })
           
        }catch (error) {
            console.log(error);
        }
    },
}