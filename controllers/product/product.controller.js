import Product from "../../models/product/product.model";
import ApiResponse from "../../helpers/ApiResponse";
import Category from "../../models/category/category.model";
import { handleImgs, checkValidations ,convertLang} from "../shared/shared.controller";
import { checkExistThenGet, checkExist, isArray,isInArray } from "../../helpers/CheckMethods";
import { body } from "express-validator/check";
import User from "../../models/user/user.model";
import Report from "../../models/reports/report.model";
import { toImgUrl } from "../../utils";
import Rate from "../../models/rate/rate.model";
import Size from "../../models/size/size.model";
import Notif from "../../models/notif/notif.model";
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import ApiError from '../../helpers/ApiError';
import Cart from "../../models/cart/cart.model";
import View from "../../models/viewing/viewing.model";
import moment from 'moment'
import i18n from "i18n";
import { transformProduct,transformProductById } from "../../models/product/transformProduct";
import Stock from "../../models/product/stock.model";
import Color from "../../models/color/color.model";
import Offer from "../../models/product/offer.model";
const populateQuery = [
    { path: 'category', model: 'category' },
    { path: 'subCategory', model: 'category' },
    {
        path: 'stock', model: 'stock',
        populate: { path: 'size', model: 'size' },
    },
    {
        path: 'stock', model: 'stock',
        populate: { path: 'colors.color', model: 'color' },
    },
    { path: 'brand', model: 'brand' },
];
const populateQuery2 = [
    { path: 'user', model: 'user' }
];
const populateQuery3 = [
    { path: 'color', model: 'color' },
    { path: 'size', model: 'size' },

];
export default {
    async findAll(req, res, next) {
        
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20,
            {brand,related,id,rate,subCategory,category,available,search,visible,saleCount,top,sortByPrice,hasOffer,freeShipping,priceFrom,priceTo} = req.query;
            let query = {deleted: false };
            if(priceTo && priceFrom) {
                query = {
                    $and: [
                        {priceFrom : {$gte : priceFrom , $lte : priceTo }},
                        {deleted: false } ,
                    ]
                };
            } 
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {name_ar: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {name_en: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {description_ar: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {description_en: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                          
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            if(available =="true") query.available = true;
            if(available =="false") query.available = false;
            if(freeShipping =="true") query.freeShipping = true;
            if(freeShipping =="false") query.freeShipping = false;
            if(hasOffer =="true") query.hasOffer = true;
            if(hasOffer =="false") query.hasOffer = false;
            if(visible =="true") query.visible = true;
            if(visible =="false") query.visible = false;
            if(top =="true") query.top = true;
            if(top =="false") query.top = false;
            if (category) {
                let values = category.split(",");
                console.log(values)
                query.category = {$in:values};
            };
            if (brand) {
                let values = brand.split(",");
                console.log(values)
                query.brand = {$in:values};
            }
            if (subCategory) {
                let values = subCategory.split(",");
                console.log(values)
                query.subCategory = {$in:values};
            };
            if (related && id) query._id = {$ne:id};
            
            let sortd = {createdAt: -1}
            if (sortByPrice =="down") sortd = {priceFrom:-1};
            if (sortByPrice =="up") sortd = {priceFrom:1};
            if (rate =="down") sortd = {rate:-1};
            if (rate =="up") sortd = {rate:1};
            if (saleCount =="down") sortd = {saleCount:-1};
            if (saleCount =="up") sortd = {saleCount:1};
            /*await Product.find({deleted:false,quantity:{$lte:0}})
            .then(async(data)=>{
                data.map(async(e) =>{
                    Product.findByIdAndUpdate(e.id,{visible:false,available:false},{new:true}).then((docs)=>{
                        console.log('done update product')
                      
                    }).catch((err)=>{
                        console.log(err);
                    })
                })
            })*/
            await Product.find(query).populate(populateQuery)
                .sort(sortd)
                .limit(limit)
                .skip((page - 1) * limit).then(async (data) => {
                    var newdata = [];
                    await Promise.all(data.map(async(e) =>{
                        let index = await transformProduct(e,lang)
                        await newdata.push(index);
                    }))
                    const productsCount = await Product.countDocuments(query);
                    const pageCount = Math.ceil(productsCount / limit);
                    res.send(new ApiResponse(newdata, page, pageCount, limit, productsCount, req));
                })

            
        } catch (err) {
            next(err);
        }
    },
    async getAll(req, res, next) {
        
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let {brand,related,id,rate,subCategory,category,available,search,visible,saleCount,top,sortByPrice,hasOffer,freeShipping,priceFrom,priceTo} = req.query;
            let query = {deleted: false };
            if(priceTo && priceFrom) {
                query = {
                    $and: [
                        {priceFrom : {$gte : priceFrom , $lte : priceTo }},
                        {deleted: false } ,
                    ]
                };
            } 
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {name_ar: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {name_en: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {description_ar: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {description_en: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                          
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            if(available =="true") query.available = true;
            if(available =="false") query.available = false;
            if(freeShipping =="true") query.freeShipping = true;
            if(freeShipping =="false") query.freeShipping = false;
            if(hasOffer =="true") query.hasOffer = true;
            if(hasOffer =="false") query.hasOffer = false;
            if(visible =="true") query.visible = true;
            if(visible =="false") query.visible = false;
            if(top =="true") query.top = true;
            if(top =="false") query.top = false;
            if (category) {
                let values = category.split(",");
                console.log(values)
                query.category = {$in:values};
            };
            if (brand) {
                let values = brand.split(",");
                console.log(values)
                query.brand = {$in:values};
            }
            if (subCategory) {
                let values = subCategory.split(",");
                console.log(values)
                query.subCategory = {$in:values};
            };
            if (related && id) query._id = {$ne:id};
            
            let sortd = {createdAt: -1}
            if (sortByPrice =="down") sortd = {priceFrom:-1};
            if (sortByPrice =="up") sortd = {priceFrom:1};
            if (rate =="down") sortd = {rate:-1};
            if (rate =="up") sortd = {rate:1};
            if (saleCount =="down") sortd = {saleCount:-1};
            if (saleCount =="up") sortd = {saleCount:1};
            await Product.find(query).populate(populateQuery)
                .sort(sortd).then(async (data) => {
                    var newdata = [];
                    await Promise.all(data.map(async(e) =>{
                        let index = await transformProduct(e,lang)
                        await newdata.push(index);
                    }))
                    res.send({success:true,data:newdata});
                })

            
        } catch (err) {
            next(err);
        }
    }, 
    validateCreatedProduct(isUpdate = false) {
        
        let validations = [
            body('name_ar').not().isEmpty().withMessage((value, { req}) => {
                return req.__('name_ar.required', { value});
            }),
            body('name_en').not().isEmpty().withMessage((value, { req}) => {
                return req.__('name_en.required', { value});
            }),
            body('description_ar').not().isEmpty().withMessage((value, { req}) => {
                return req.__('description_ar.required', { value});
            }),
            body('description_en').not().isEmpty().withMessage((value, { req}) => {
                return req.__('description_en.required', { value});
            }),
           /* body('priceFrom').not().isEmpty().withMessage('price is required')
            .isNumeric().withMessage('priceFrom numeric value required'),
            body('priceTo').not().isEmpty().withMessage('priceTo is required')
            .isNumeric().withMessage('priceTo numeric value required'),*/
            body('color').optional(),
            body('price').optional(),
            body('brand').not().isEmpty().withMessage((value, { req}) => {
                return req.__('brand.required', { value});
            })
            .isNumeric().isNumeric().withMessage((value, { req}) => {
                return req.__('brand.numeric', { value});
            }),
            body('quantity').not().isEmpty().withMessage((value, { req}) => {
                return req.__('quantity.required', { value});
            }).withMessage((value, { req}) => {
                return req.__('quantity.numeric', { value});
            }),
            body('category').not().isEmpty().withMessage((value, { req}) => {
                return req.__('category.required', { value});
            })
            .isNumeric().isNumeric().withMessage((value, { req}) => {
                return req.__('category.numeric', { value});
            }),
            body('subCategory').not().isEmpty().withMessage((value, { req}) => {
                return req.__('subCategory.required', { value});
            })
            .isNumeric().isNumeric().withMessage((value, { req}) => {
                return req.__('subCategory.numeric', { value});
            }),
            
            body('freeShipping').optional(),
            body('theStock').not().isEmpty().withMessage((value, { req}) => {
                return req.__('stock.required', { value});
            })
            .isLength({ min: 1 }).withMessage((value, { req}) => {
                return req.__('stock.AtleastOne', { value});
            })
            .custom(async (stock, { req }) => {
                for (let prop of stock) {
                    convertLang(req)
                    await checkExist(prop.size, Size);
                    body('size').not().isEmpty().withMessage(async(value, { req}) => {
                        return req.__('size.required', { value});
                    }).isNumeric().withMessage((value, { req}) => {
                        return req.__('size.numeric', { value});
                    }),
                    body('price').not().isEmpty().withMessage((value, { req}) => {
                        return req.__('price.required', { value});
                    }).isNumeric().withMessage((value, { req}) => {
                        return req.__('price.numeric', { value});
                    }),
                    body('quantity').not().isEmpty().withMessage(async(value, { req}) => {
                        return req.__('quantity.required', { value});
                    }).isNumeric().withMessage((value, { req}) => {
                        return req.__('quantity.numeric', { value});
                    })
                    body('colors').optional().custom(async (colors, { req }) => {
                        for (let v of colors) {
                            convertLang(req)
                            await checkExist(v.color, Color);
                            body('color').not().isEmpty().withMessage(async(value, { req}) => {
                                return req.__('color.required', { value});
                            }).isNumeric().withMessage((value, { req}) => {
                                return req.__('color.numeric', { value});
                            }),
                            body('quantity').not().isEmpty().withMessage(async(value, { req}) => {
                                return req.__('quantity.required', { value});
                            }).isNumeric().withMessage((value, { req}) => {
                                return req.__('quantity.numeric', { value});
                            })
                           
                        }
                        return true;
                    }),
                    body('offerPrice').optional(),
                    body('offerRatio').optional(),
                    body('stockId').optional()
                }
                return true;
            }),
            
            
        ];
    
        return validations;
    },
    //[{size:1,colors:[{color:1,quantity:22}],price:1000}]
    async create(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 
            const validatedBody = checkValidations(req);
            await checkExist(validatedBody.category, Category, { deleted: false });
            let img = await handleImgs(req);
            let createdProduct = await Product.create({
                ...validatedBody,
                img: img, 
            });
            let reports = {
                "action":"Create New Product",
            };
            await Report.create({...reports, user: req.user });
            let product = await checkExistThenGet(createdProduct.id,Product, { deleted: false });
            let prices = [];
            let stockIds = []
            console.log("stock",validatedBody.theStock)
            await Promise.all(validatedBody.theStock.map(async(stock) => {
                console.log("stock2",stock)
                prices.push(stock.price)
                stock.product = createdProduct.id;
                let createdStock = await Stock.create({...stock})
                stockIds.push(createdStock._id)
            }));  
            
            //let stocks = await Stock.find({deleted:false,product:product.id}).distinct('_id')
            console.log(stockIds)
            product.stock = stockIds
            
            product.priceTo = Math.max(...prices)
            product.priceFrom = Math.min(...prices)
            await product.save();
            
            res.status(201).send({success: true,data:await Product.findById(createdProduct.id)});
            
        } catch (err) {
            next(err);
        }
    },
    async findById(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let { productId } = req.params;

            await checkExist(productId, Product,
                { deleted: false });
            await Product.findById(productId).populate(populateQuery).then(async (e) => {
                    let index = await transformProductById(e,lang)
                    res.send({success: true,data:index});
                })
            
        } catch (err) {
            next(err);
        }
    },

    async top(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));

            let {productId} = req.params;
            let product = await checkExistThenGet(productId, Product,
                {deleted: false });
            product.top = true;
            await product.save();
            let reports = {
                "action":"Top Product",
            };
            await Report.create({...reports, user: user });
        
            res.send({success: true});
            
        } catch (error) {
            next(error);
        }
    },

    async low(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 

            let {productId } = req.params;
            let product = await checkExistThenGet(productId, Product,
                {deleted: false });

            product.top = false;
            await product.save();
            let reports = {
                "action":"Low Product",
            };
            await Report.create({...reports, user: user });
            res.send({success: true});
        } catch (error) {
            next(error);
        }
    },
    async notFreeShipping(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));

            let {productId} = req.params;
            let product = await checkExistThenGet(productId, Product,
                {deleted: false });
            product.freeShipping = false;
            await product.save();
            let reports = {
                "action":"remove freeShipping Product",
            };
            await Report.create({...reports, user: user });
        
            res.send({success: true});
            
        } catch (error) {
            next(error);
        }
    },

    async freeShipping(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 

            let {productId } = req.params;
            let product = await checkExistThenGet(productId, Product,
                {deleted: false });

            product.freeShipping = true;
            await product.save();
            let reports = {
                "action":"freeShipping Product",
            };
            await Report.create({...reports, user: user });
            res.send({success: true});
        } catch (error) {
            next(error);
        }
    },
    async active(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));

            let {productId} = req.params;
            let product = await checkExistThenGet(productId, Product,
                {deleted: false });
            product.visible = true;
            product.available = true;
            await product.save();
            let reports = {
                "action":"Active Product",
            };
            await Report.create({...reports, user: user });
            res.send({success: true});
            
        } catch (error) {
            next(error);
        }
    },

    async disactive(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 

            let {productId } = req.params;
            let product = await checkExistThenGet(productId, Product,
                {deleted: false });

            product.visible = false;
            product.available = false;
            await product.save();
            let reports = {
                "action":"Dis-active Product",
            };
            await Report.create({...reports, user: user });
            res.send({success: true});
        } catch (error) {
            next(error);
        }
    },
    
    async update(req, res, next) {
        try {
            convertLang(req)
            
            let {productId } = req.params;
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 
            await checkExist(productId, Product,
                {deleted: false });

            
            const validatedBody = checkValidations(req);
            if(validatedBody.quantity > 0) {
                validatedBody.visible = true;
                validatedBody.available = true;
            }
            if (req.files) {
                if (req.files['img']) {
                    let imagesList = [];
                    for (let imges of req.files['img']) {
                        imagesList.push(await toImgUrl(imges))
                    }
                    validatedBody.img = imagesList;
                }
            }
            let prices = [];
            let stockIds = []
            await Promise.all(validatedBody.theStock.map(async(stock) => {
                prices.push(stock.price)
                if(stock.stockId){
                    stock.product = productId;
                    let updatedStock = await Stock.findByIdAndUpdate(stock.stockId, {
                        ...stock,
        
                    }, { new: true })
                    stockIds.push(updatedStock._id)
                }else{
                    stock.product = productId;
                    let createdStock = await Stock.create({...stock})
                    stockIds.push(createdStock._id)
                }
                
            }));  
            
            //let stocks = await Stock.find({deleted:false,product:product.id}).distinct('_id')
            console.log(stockIds)
            validatedBody.stock = stockIds
            validatedBody.priceTo = Math.max(...prices)
            validatedBody.priceFrom = Math.min(...prices)
            await Product.findByIdAndUpdate(productId, {
                ...validatedBody,

            }, { new: true }).populate(populateQuery);
            let reports = {
                "action":"Update Product",
            };
            await Report.create({...reports, user: req.user });
            res.status(200).send({success: true,data:await Product.findById(productId)});
        }
        catch (err) {
            next(err);
        }
    },
    validateOfferBody() {
        return [
            body('offerPrice').optional()
                .isNumeric().withMessage((value, { req}) => {
                    return req.__('offerPrice.numeric', { value});
                }),
            body('offerRatio').optional()
            .isNumeric().withMessage((value, { req}) => {
                return req.__('offerRatio.numeric', { value});
            }),
            body('size').optional()
            .isNumeric().withMessage((value, { req}) => {
                return req.__('size.numeric', { value});
            }),
            body('color').optional()
            .isNumeric().withMessage((value, { req}) => {
                return req.__('color.numeric', { value});
            }),
                
        ];

    },
    async addOffer(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 
            let {productId } = req.params;
            const validatedBody = checkValidations(req);
            //check if offer data exist
            if(!validatedBody.size && !validatedBody.color)
                return next(new ApiError(422, i18n.__('complete.data'))); 
            
            
            let index = {
                product:productId,
            }
            
            //if offer in size
            if(validatedBody.size){
                index.size = validatedBody.size
                index.offerType = "SIZE"
            }
            //if offer in color
            if(validatedBody.color){
                index.color = validatedBody.color
                index.offerType = "COLOR"
            }
            //if offer in size and color
            if(validatedBody.color && validatedBody.size){
                index.offerType = "BOTH"
            }
            //offer price and offer ratio
            if(validatedBody.size){
                let stock = await Stock.findOne({size:validatedBody.size,product:productId})
                console.log(stock)
                if(validatedBody.offerRatio && !validatedBody.offerPrice){
                    let discount = (stock.price * validatedBody.offerRatio) / 100;
                    let offerPrice = stock.price - discount;
                    index.offerPrice = offerPrice;
                    index.offerRatio = parseInt(validatedBody.offerRatio)
                    index.discountType = 'RATIO';
                }
                if(!validatedBody.offerRatio &&  validatedBody.offerPrice){
                    let ratio = (stock.price - parseInt(validatedBody.offerPrice))/ stock.price * 100;
                    index.offerPrice = parseInt(validatedBody.offerPrice);
                    index.offerRatio = ratio
                    index.discountType = 'PRICE';
                }
            }else{
                if(validatedBody.offerRatio && !validatedBody.offerPrice){
                    // let discount = (stock.price * validatedBody.offerRatio) / 100;
                    // let offerPrice = stock.price - discount;
                    index.offerPrice = 0;
                    index.discountType = 'RATIO';
                    index.offerRatio = parseInt(validatedBody.offerRatio)
                }
                if(!validatedBody.offerRatio &&  validatedBody.offerPrice){
                    //let ratio = (stock.price - validatedBody.offerPrice)/ stock.price * 100;
                    index.offerPrice = parseInt(validatedBody.offerPrice);
                    index.discountType = 'PRICE';
                    index.offerRatio = 0
                }
            }
            
            //create offer
            await Offer.create({...index})
            //determine the min and max price for product
            let prices = []
            await Stock.find({deleted:false,product:productId}).then(async (stock) =>{
                await Promise.all(stock.map(async(e)=>{
                    prices.push(e.price)
                }))
                
            })
            await Offer.find({deleted:false,product:productId}).then(async (offer) =>{
                await Promise.all(offer.map(async(e)=>{
                    prices.push(e.offerPrice)
                }))
            })
            console.log(prices)
            
            let product = await checkExistThenGet(productId, Product,{ deleted: false });

            product.hasOffer = true;
            product.priceTo = Math.max(...prices)
            product.priceFrom = Math.min(...prices)
            await product.save();
            let reports = {
                "action":"add offer",
            };
            await Report.create({...reports, user: req.user });
            res.send({success: true});
        } catch (error) {
            next(error);
        }
    },

    async removeOffer(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 
            let { offerId } = req.params;
            let offer = await checkExistThenGet(offerId, Offer, { deleted: false });
            offer.deleted = true;
            await offer.save();
            let product = await checkExistThenGet(offer.product, Product,
                { deleted: false });
            let productsOffers = await Offer.findOne({deleted: false,product:offer.product})
            if(!productsOffers){
                product.hasOffer = false;
            }
            let prices = []
            await Offer.find({deleted:false,product:offer.product}).then(async (offer) =>{
                await Promise.all(offer.map(async(e)=>{
                    prices.push(e.offerPrice)
                }))
            })
            await Stock.find({deleted:false,product:offer.product}).then(async (stock) =>{
                await Promise.all(stock.map(async(e)=>{
                    prices.push(e.price)
                }))
                
            })
            console.log(prices)
            product.priceTo = Math.max(...prices)
            product.priceFrom = Math.min(...prices)
            await product.save();
            let reports = {
                "action":"Delete offer",
            };
            await Report.create({...reports, user: req.user });
            res.send({success: true});
        } catch (error) {
            next(error);
        }
    },
    async findAllOffers(req, res, next) {

        try {
            convertLang(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let { productId } = req.params;
            let {size,color} = req.query
            let query = {deleted: false,product:productId};
            if(size) query.size = size
            if(color) query.color = color
            let productOffer = await Offer.find(query).populate(populateQuery3)
                .sort({createdAt: -1})
                .limit(limit)
                .skip((page - 1) * limit);


            const productCount = await Offer.countDocuments(query);
            const pageCount = Math.ceil(productCount / limit);

            res.send(new ApiResponse(productOffer, page, pageCount, limit, productCount, req));
        } catch (err) {
            next(err);
        }
    },
    async findOffer(req, res, next) {

        try {
            convertLang(req)
            let { productId } = req.params;
            let {size,color} = req.query
            let query = {deleted: false,product:productId};
            if(size) query.size = size
            if(color) query.color = color
            let productOffer = await Offer.findOne(query).populate(populateQuery3)
            res.send({success: true,data:productOffer});
        } catch (err) {
            next(err);
        }
    },


    async delete(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let {productId } = req.params;

            let product = await checkExistThenGet(productId, Product,
                {deleted: false });
            let catres = await Cart.find({ product: productId });
            if(catres){
                for (let cart of catres ) {
                    cart.deleted = true;
                    await cart.save();
                }
            }
            product.deleted = true
            await product.save();
            let reports = {
                "action":"Delete Product",
            };
            await Report.create({...reports, user: req.user._id });
            res.status(200).send({success: true});
        }
        catch (err) {
            next(err);
        }
    },
   
}