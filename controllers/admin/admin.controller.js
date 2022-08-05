import ApiError from "../../helpers/ApiError";
import User from "../../models/user/user.model";
import Anoncement from "../../models/anoncement/anoncement.model";
import Problem from "../../models/problem/problem.model";
import Message from "../../models/contact/contact.model";
import Product from "../../models/product/product.model";
import Order from "../../models/order/order.model";
import { isInArray} from "../../helpers/CheckMethods";

const populateQuery = [
    { path: 'country', model: 'country' },
    { path: 'city', model: 'city' },
];
export default {
    async getLastUser(req, res, next) {
        try {
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let query = {
              deleted: false
            };
            let sortd = {createdAt: -1}
            let lastUser = await User.find(query).populate(populateQuery)
                .sort(sortd)
                .limit(10);

            res.send(lastUser);
        } catch (error) {
            next(error);
        }
    },
  
    async count(req,res, next) {
        try {
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let query = { deleted: false };
            let {category} = req.query
            if(category) query.category = category
            const usersCount = await User.countDocuments({deleted: false,type:'USER'});
            const adminCount = await User.countDocuments({deleted: false,type:'ADMIN'});
            const artistsCount = await User.countDocuments({deleted: false,type:'ARTIST'});
            const anoncementCount = await Anoncement.countDocuments({deleted:false});
            const productsCount = await Product.countDocuments({deleted:false});
            const problemCount = await Problem.countDocuments({deleted:false});
            const messagesCount = await Message.countDocuments({deleted:false,reply:false});
            const pendingOrdersCount = await Order.countDocuments({deleted:false,status:'PENDING'});
            const topUserRate = await User.find({deleted: false,type:'ARTIST'}).sort({rate:-1}).limit(1)
            const topProductsRate = await Product.find({deleted: false}).sort({rate:-1}).limit(10)
            const topProductSale = await Product.find({deleted: false}).sort({saleCount:-1}).limit(1)
            res.status(200).send({
                usersCount:usersCount,
                adminCount:adminCount,
                artistsCount:artistsCount,
                anoncementCount:anoncementCount,
                problemCount:problemCount,
                productsCount:productsCount,
                messagesCount:messagesCount,
                pendingOrdersCount:pendingOrdersCount,
                topUserRate:topUserRate[0],
                topProductSale:topProductSale[0],
                topProductRate:topProductsRate[0],
                topProductsRate:topProductsRate
                
            });
        } catch (err) {
            next(err);
        }
        
    },
    
}