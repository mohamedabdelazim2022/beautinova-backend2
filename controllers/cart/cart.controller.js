import { checkExistThenGet,isArray } from "../../helpers/CheckMethods";
import ApiResponse from "../../helpers/ApiResponse";
import User from "../../models/user/user.model";
import { checkValidations,convertLang } from "../shared/shared.controller";
import Cart from "../../models/cart/cart.model";
import ApiError from '../../helpers/ApiError';
import { body } from "express-validator/check";
import i18n from "i18n";
import Logger from "../../services/logger";
const logger = new Logger('cart '+ new Date(Date.now()).toDateString())
const populateQuery = [
    {path: 'size', model: 'size' },
    {path: 'color', model: 'color' },
    {
        path: 'product', model: 'product' ,
        populate: { path: 'category', model: 'category' },
       
    },
    
    {
        path: 'product', model: 'product' ,
        populate: { path: 'stock.size', model: 'size' },
       
    },
    {
        path: 'product', model: 'product',
        populate: { 
            path: 'stock', model: 'stock' ,
            populate: { path: 'colors.color', model: 'color' }
        },
    },
    {
        path: 'product', model: 'product' ,
        populate: { path: 'brand', model: 'brand' },
       
    },
    {
        path: 'product', model: 'product' ,
        populate: { path: 'subCategory', model: 'category' },
       
    },
];

export default {
    async findAll(req, res, next) {
        try {
            convertLang(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let { userId } = req.params;
            let query = { user: userId,deleted:false };
            let Carts = await Cart.find(query).populate(populateQuery)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit)


            const CartsCount = await Cart.countDocuments(query);
            const pageCount = Math.ceil(CartsCount / limit);

            res.send(new ApiResponse(Carts, page, pageCount, limit, CartsCount, req));
        } catch (err) {
            next(err);
        }
    },
    validateBody() {
        let validations = [
            body('color').optional(),
            body('size').optional(),
        ]
        return validations;
    },
    async create(req, res, next) {
        try {
            convertLang(req)
            let {productId} = req.params;
            const validatedBody = checkValidations(req);
            validatedBody.product = productId;
            validatedBody.user = req.user._id;
            let user = await checkExistThenGet(req.user._id, User);
            let arr = user.carts;
            var found = arr.find(e=>e == productId); 
            if(!found){
                user.carts.push(productId);
                await Cart.create({ ...validatedBody});
            }
            await user.save();
            logger.info(`add product ${validatedBody.product} to ${req.user._id} cart`);
 
            res.status(201).send({success: true,});
        } catch (error) {
            next(error)
        }
    },
    validateBodyAddMany() {
        let validations = [
            body('products').custom(vals => isArray(vals)).withMessage((value, { req}) => {
                return req.__('products.array', { value});
            })
            .isLength({ min: 1 }).withMessage((value, { req}) => {
                return req.__('products.atLeastOne', { value});
            })
            .custom(async (products, { req }) => {
                let prevProductId;
                for (let val of products) {
                    // check if it's duplicated product
                    if (prevProductId && prevProductId === val.product)
                        throw new Error(`Duplicated Product : ${val.product}`);
                    prevProductId = val.product;
                    body('product').not().isEmpty().withMessage(async(value, { req}) => {
                        return req.__('product.required', { value});
                    }).isNumeric().withMessage((value, { req}) => {
                        return req.__('product.numeric', { value});
                    })
                    body('color').optional().isNumeric().withMessage((value, { req}) => {
                        return req.__('color.numeric', { value});
                    }),
                    body('size').optional().isNumeric().withMessage((value, { req}) => {
                        return req.__('size.numeric', { value});
                    })
                }
                return true;
            })
        ];
        return validations;
    },
    async addManyProducts(req, res, next) {
        try {
            convertLang(req)
            const validatedBody = checkValidations(req);
            
            validatedBody.user = req.user._id;
            let user = await checkExistThenGet(req.user._id, User);
            let arr = user.carts;
            for (let v of validatedBody.products) {
                logger.info(`add product ${v.product} to ${req.user._id} cart`);
                var found = arr.find(e=>e == v.product); 
                if(!found){
                    user.carts.push(v.product);
                    v.user = req.user._id
                    await Cart.create({ ...v});
                }
            }
            await user.save();
            res.status(201).send({
                success: true,
            });
        } catch (error) {
            next(error)
        }
    },
    async unCart(req, res, next) {
        try {
            convertLang(req)
            let {productId,cartId} = req.params;
            logger.info(`remove  product ${productId} to ${req.user._id} cart`);
            let cart = await checkExistThenGet(cartId, Cart, { deleted: false });
            if (cart.user != req.user._id)
                return next(new ApiError(403, i18n.__('notAllow')));
            cart.deleted = true;
            await cart.save();
            let user = await checkExistThenGet(req.user._id, User);

            let arr = user.carts;
            console.log(arr);
            for(let i = 0;i<= arr.length;i=i+1){
                if(arr[i] == productId){
                    arr.splice(i, 1);
                }
            }
            user.carts = arr;
            await user.save();
            res.send({
                success: true,
            });
        } catch (error) {
            next(error)
        }
    },
    async deleteAll(req, res, next) {
        try {
            convertLang(req)
            let theUser = await checkExistThenGet(req.user._id, User);
            theUser.carts = [];
            let carts = await Cart.find({ user: req.user._id });
            for (let cart of carts ) {
                cart.deleted = true;
                await cart.save();
            }
            await theUser.save()
            res.send({
                success: true,
            });
        } catch (error) {
            next(error)
        }
    },

}