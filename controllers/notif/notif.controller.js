import User from "../../models/user/user.model";
import { checkExistThenGet, checkExist} from "../../helpers/CheckMethods";
import Notif from "../../models/notif/notif.model";
import ApiResponse from "../../helpers/ApiResponse";
import moment from "moment";

export default {
    async find(req, res, next) {
        try {
            let user = req.user._id;
            await checkExist(req.user._id, User);
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let {type,groupByDate} = req.query;
            let query = { deleted: false,target:user };
            if(type) query.type = type;
            let notifs = await Notif.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit);
            

            if(groupByDate){
                let curr = moment().format("YYYY-MM-DD")
                let dailyFrom = curr + 'T00:00:00.000Z';
                let dailyTo= curr + 'T23:59:00.000Z';
                console.log(dailyFrom, dailyTo)
                let query1 = { 
                    deleted: false,target:user ,
                    createdAt: { $gte : new Date(dailyFrom), $lte : new Date(dailyTo) }
                };
                if(type) query1.type = type;
                let dailyNotifs = await Notif.find(query1)
                    .sort({ createdAt: -1 });
                let yasterday = moment().add(-1, 'd').format('YYYY-MM-DD')
                let yasterdayFrom = yasterday + 'T00:00:00.000Z';
                let yasterdayTo= yasterday + 'T23:59:00.000Z';
                let query2 = { 
                    deleted: false,target:user ,
                    createdAt: { $gte : new Date(yasterdayFrom), $lte : new Date(yasterdayTo) }
                };
                if(type) query2.type = type;
                let yasterdayNotifs = await Notif.find(query2)
                    .sort({ createdAt: -1 })
                let oldTo =moment().add(-2, 'd').format('YYYY-MM-DD')
                let oldFrom = moment().add(-1, 'Y').format('YYYY-MM-DD')
                let query3 = { 
                    deleted: false,target:user ,
                    createdAt: { $gte : new Date(oldFrom), $lte : new Date(oldTo) }
                };
                if(type) query3.type = type;
                let oldNotifs = await Notif.find(query3)
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .skip((page - 1) * limit);
                notifs = {
                    oldNotifs:oldNotifs
                }
                if(page == 1){
                    notifs.dailyNotifs = dailyNotifs
                    notifs.yesterdayNotifs = yasterdayNotifs
                }
               
            }
            const notifsCount = await Notif.countDocuments(query);
            const pageCount = Math.ceil(notifsCount / limit);
            res.send(new ApiResponse(notifs, page, pageCount, limit, notifsCount, req));
            
        } catch (err) {
            next(err);
        }
    },
    async findNotifs(req, res, next) {
        try {
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let query = { deleted: false,adminNotif:true };
            let notifs = await Notif.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit);
	   
            const notifsCount = await Notif.countDocuments(query);
            const pageCount = Math.ceil(notifsCount / limit);

            res.send(new ApiResponse(notifs, page, pageCount, limit, notifsCount, req));
        } catch (err) {
            next(err);
        }
    },
    async findNotifsWithoutPagenation(req, res, next) {
        try {
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let query = { deleted: false };
            let notifs = await Notif.find(query)
                .sort({ createdAt: -1 })
            res.send({success:true,data:notifs});
        } catch (err) {
            next(err);
        }
    },
    async unreadCount(req, res, next) {
        try {
            let user = req.user._id;
            await checkExist(req.user._id, User);
            let query = { deleted: false,target:user,read:false };
            const unreadCount = await Notif.countDocuments(query);
            res.status(200).send({
                unread:unreadCount,
            });
        } catch (err) {
            next(err);
        }
    },
    async read(req, res, next) {
        try {
            let { notifId} = req.params;
            let notif = await checkExistThenGet(notifId, Notif);
            notif.read = true;
            await notif.save();
            res.send('notif read');
        } catch (error) {
            next(error);
        }
    },

    async unread(req, res, next) {
        try {
            let { notifId} = req.params;
            let notif = await checkExistThenGet(notifId, Notif);
            notif.read = false;
            await notif.save();
            res.send('notif unread');
        } catch (error) {
            next(error);
        }
    },
    async delete(req, res, next) {
        try {
            let { notifId} = req.params;
            let notif = await checkExistThenGet(notifId, Notif);
            notif.deleted = true;
            await notif.save();
            res.send('notif deleted');
        } catch (error) {
            next(error);
        }
    },
    async deleteAll(req, res, next) {
        try {
            let notifs = await Notif.find({target :req.user._id });
            for (let notif of notifs ) {
                notif.deleted = true;
                await notif.save();
            }
            res.send('notifs deleted');
        } catch (error) {
            next(error);
        }
    },

}