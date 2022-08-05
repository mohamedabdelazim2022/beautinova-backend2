import { checkExist, checkExistThenGet } from "../../helpers/CheckMethods";
import ApiResponse from "../../helpers/ApiResponse";
import User from "../../models/user/user.model";
import Favourite from "../../models/favourite/favourite.model";
import ApiError from '../../helpers/ApiError';
import Notif from "../../models/notif/notif.model";
import i18n from "i18n";
import { convertLang} from "../shared/shared.controller";
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import {transformUser} from "../../models/user/transformUser"
import Logger from "../../services/logger";
const logger = new Logger('favourite '+ new Date(Date.now()).toDateString())
const populateQuery = [
    { path: 'country', model: 'country' },
    {
        path: 'services.service', model: 'category',
    },
];
export default {
    async findAll(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let { userId,favPerson,alphabeticalOrder ,search,verify,accountType } = req.query;
            //my favourite list (userId = my id)
            //who add favPerson to favourite list (favPerson = favPerson id)
            let query = { deleted:false };
            if(userId) query.user = userId;
            /*determine selected data */
            let item = 'favPerson';

            if(favPerson){
                query.favPerson = favPerson;
                item = 'user'
            }
            let sortd = { createdAt: -1 }
            if(alphabeticalOrder == "true"){
                sortd = {username: 1}
            }
            
             
            let usersIds = await Favourite.find(query)
                .distinct(item)
            let query2 = {deleted:false}
            query2._id = { $in: usersIds}

             /*search by name */
             if(search) {
                Object.assign(query2 ,{
                    $and: [
                        { $or: [
                            {fullname: { $regex: '.*' + search + '.*' , '$options' : 'i'  }}, 
                            {username: { $regex: '.*' + search + '.*', '$options' : 'i'  }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                })
            }
            if (verify=="true") query.verify = true;
            if (verify=="false") query.verify = false;
            if(accountType) query.accountType = accountType;
            console.log(query2)
             /*get data by ids selectd */
            let myUser = await checkExistThenGet(req.user._id, User)
            await User.find(query2)
            .populate(populateQuery)
            .then(async(data)=>{
                let newdate = []
                await Promise.all(data.map(async(e)=>{
                    let index = await transformUser(e,lang,myUser,req.user._id)
                    newdate.push(index)
                }))
                
                const usersCount = await User.countDocuments(query);
                const pageCount = Math.ceil(usersCount / limit);
                res.send(new ApiResponse(newdate, page, pageCount, limit, usersCount, req));
            })
            
            
        } catch (err) {
            next(err);
        }
    },
     /*add favPerson to favourite list */
    async create(req, res, next) { 
        try {
            convertLang(req)
            let {favPersonId} = req.params
            await checkExist (favPersonId,User,{deleted:false})
            let user = await checkExistThenGet(req.user._id, User);
            logger.info(`user  ${req.user._id} add artist ${favPersonId} to fav list`);
            if(!await Favourite.findOne({ user: req.user._id, favPerson: favPersonId,deleted:false})){
                let arr = user.favourite;
                var found = arr.find(function(element) {
                    return element == favPersonId;
                }); 
                if(!found){
                    let thefavPerson = await checkExistThenGet(favPersonId, User);
                    user.favourite.push(favPersonId);
                    await user.save();
                    thefavPerson.favCount = thefavPerson.favCount + 1;
                    await thefavPerson.save();
                    
                    let favourite =  await Favourite.create({ user: req.user._id, favPerson: favPersonId });
                    sendNotifiAndPushNotifi({
                        targetUser: favPersonId, 
                        fromUser: req.user._id, 
                        text: 'BeautiNova',
                        subject: favourite._id,
                        subjectType: 'Someone add you to his favourite list',
                        info:'favourite'
                    });
                    let notif = {
                        "description_en":'Someone add you to his favourite list',
                        "description_ar":'اضافك شخص ماالى قائمته المفضله',
                        "title_ar":"لديك اعجاب جديد",
                        "title_en":"New Like",
                        "type":"FAVOURITE"
                       
                    }
                    Notif.create({...notif,resource:req.user._id,target:thefavPerson,favourite:favourite._id});
                } else{
                    return next(new ApiError(500,i18n.__('user.FoundInList') ));
                }
            }
            
            res.status(200).send({success: true});
        } catch (error) {
            logger.error(`add to favourite error ${error}` );
            next(error)
        }
    },
     /*remove favPerson to favourite list */
    async unFavourite(req, res, next) {
        try {
            convertLang(req)
            let {favPersonId } = req.params;
            logger.info(`user  ${req.user._id} remove artist ${favPersonId} to fav list`);
            let favourite = await Favourite.findOne({ user: req.user._id, favPerson: favPersonId,deleted:false})
             /*check if  */
            if(!await Favourite.findOne({ user: req.user._id, favPerson: favPersonId,deleted:false})){
                return next(new ApiError(500, i18n.__('user.notFoundInList')));
            }
            let favourites = await checkExistThenGet(favourite.id, Favourite, { deleted: false });
            if (favourites.user != req.user._id)
                return next(new ApiError(500, i18n.__('notAllow')));
                favourites.deleted = true;
            await favourites.save();
             /*remove favPerson id from user data*/
            let user = await checkExistThenGet(req.user._id, User);
            let arr = user.favourite;
            console.log(arr);
            logger.info(`arr : ${arr}`);
            for(let i = 0;i<= arr.length;i=i+1){
                if(arr[i] == favPersonId){
                    arr.splice(i, 1);
                }
            }
            user.favourite = arr;
            await user.save();
            /*reduce the fav count */
            let thefavPerson = await checkExistThenGet(favPersonId, User);
            thefavPerson.favCount = thefavPerson.favCount - 1;
            await thefavPerson.save();
            res.send({success: true});
        } catch (error) {
            logger.error(`remove favourite error ${error}` );
            next(error)
        }
    },

}