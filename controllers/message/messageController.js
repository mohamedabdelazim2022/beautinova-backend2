var Message = require('../../models/message/message.model');
var config = require('../../config');
import Notif from "../../models/notif/notif.model";
import Booking from "../../models/booking/booking.model";
import { checkExistThenGet,isInArray } from "../../helpers/CheckMethods";
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import {handleImg} from "../shared/shared.controller";
import ApiResponse from "../../helpers/ApiResponse";
import User from "../../models/user/user.model";
import {transformBooking} from "../../models/booking/transformBooking";
import Logger from "../../services/logger";
const logger = new Logger('message '+ new Date(Date.now()).toDateString())
const populateQuery = [
    {
        path: 'from', model: 'user',
        populate: { path: 'country', model: 'country' },
    },
    {
        path: 'to', model: 'user',
        populate: { path: 'country', model: 'country' },
    },
    {
        path: 'from', model: 'user',
        populate: { path: 'city', model: 'city' },
    },
    {
        path: 'to', model: 'user',
        populate: { path: 'city', model: 'city' },
    },
    {
        path: 'from', model: 'user',
        populate: { path: 'area', model: 'area' },
    },
    {
        path: 'to', model: 'user',
        populate: { path: 'area', model: 'area' },
    },
    {
        path: 'from', model: 'user',
        populate: { path: 'services.service', model: 'category' },
    },
    {
        path: 'to', model: 'user',
        populate: { path: 'services.service', model: 'category' },
    },
    {
        path: 'booking', model: 'booking',
        populate: { path: 'service', model: 'category' },
    },
];
const populateQuery2 = [
    {
        path: 'artist', model: 'user',
        populate: { path: 'country', model: 'country' },
    },
    {
        path: 'artist', model: 'user',
        populate: { path: 'city', model: 'city' },
    },
    {
        path: 'artist', model: 'user',
        populate: { path: 'area', model: 'area' },
    },
    {
        path: 'artist', model: 'user',
        populate: { path: 'services.service', model: 'category' },
    },
    {
        path: 'client', model: 'user',
        populate: { path: 'country', model: 'country' },
    },
    {
        path: 'client', model: 'user',
        populate: { path: 'city', model: 'city' },
    },
    {
        path: 'client', model: 'user',
        populate: { path: 'area', model: 'area' },
    },
    { path: 'service', model: 'category' },
    { path: 'city', model: 'city' },
    { path: 'area', model: 'area' },
];
var messageController = {
    async uploadImage(req, res, next) {
        try {
            let image = await handleImg(req);
            console.log(req.file)
            console.log(image)
            
            res.send(image);
            } catch (error) {
            next(error)
        }
    },
    
    async addnewMessage(io, nsp, data) {
        logger.info(`add message socket data  : ${data}`);
        var toRoom = 'room-' + data.toId; 
        var fromRoom = 'room-' + data.fromId;

        logger.info(`new message to room ${toRoom}`);
        var messData = { //شكل الداتا 
            to: data.toId,
            from: data.fromId,
            sent: true,
            lastMessage: true,
        }
        
        if (data.dataType != null) {
            messData.content = data.content;
            messData.dataType = data.dataType;
        }
        if(data.booking != null) {
            messData.booking = data.booking;
        }
        if(data.duration != null) {
            messData.duration = data.duration;
        }
        var query1 = { //من اليوزر الى فاتح
            to: data.toId,
            from: data.fromId,
            lastMessage: true,
            deleted: false
        }
        var query2 = { //الرسايل الى هتروح لليوزر الى فاتح
            to: data.fromId,
            from: data.toId,
            lastMessage: true,
            deleted: false
        }
        var countquery = {//عدد الرسايل
            to : data.toId , 
            deleted : false , 
            seen : false 
        }
        var Count = await Message.countDocuments(countquery);
        Count = Count + 1 ;
        Message.updateMany({ $or: [query1, query2] }, { lastMessage: false })
            .then((result1) => {
                // old v2  is  io.nsps['/chat'].adapter.rooms
                if (io.sockets.adapter.rooms[toRoom]) { //room is open 
                    messData.delivered = true;
                }
                var message = new Message(messData);
                console.log("messData",messData);
                logger.info(`messData ${messData}`);
                message.save()
                    .then(async(result2) => {
                        logger.info(`messData ${data}`);
                        console.log(data);
                        let theMessage = await Message.findById(result2._id).populate('from to')
                        let msg = {
                            seen: theMessage.seen,
                            _id: theMessage._id,
                            content: theMessage.content,
                            dataType: theMessage.dataType?theMessage.dataType:"",
                            createdAt: theMessage.incommingDate,
                            duration: theMessage.duration,
                            user: {
                                _id: theMessage.from._id,
                                fullname: theMessage.from.fullname,
                                img: theMessage.from.img
                            },
                        }
                        if(data.booking){
                            await Booking.findById(parseInt(data.booking))
                            .populate(populateQuery2).then(async(e) => {
                                console.log(e._id)
                                logger.info(`booking ${e._id}`);

                                let index =  await transformBooking(e,'ar')
                                msg.booking = index
                            })
                            
                        }
                        //دى فانكشن الايمت بتاعه اضافه رساله
                        nsp.to(toRoom).emit('newMessage', msg);
                        //هنا عشان يبعت نوتفكيشن بالرساله
                        notificationNSP.to(toRoom).emit('updateUnInformedMessage',{count : Count});
                        //
                        nsp.to(fromRoom).emit('newMessage', msg);
                        nsp.to(toRoom).emit('unseenCount',{count : Count});
                        
                        //

                        //nsp.to(fromRoom).emit('done', { data: result2 });
                        if (io.sockets.adapter.rooms[toRoom]){
                            console.log("friend is online ");
                            logger.info(`friend is online`);
                            nsp.to(fromRoom).emit('delivered', { friendId: data.toId });
                        }
                        sendNotifiAndPushNotifi({
                            targetUser: data.toId, 
                            fromUser: data.fromId, 
                            text: 'BeautiNova',
                            subject: result2._id,
                            subjectType: 'you have a new message',
                            info:'MESSAGE'
                        });
                        let notif = {
                            "description_en":'you have a new message',
                            "description_ar":"لديك رساله جديده" ,
                            "title_en":"New Message",
                            "title_ar":"رساله جديده",
                            "type":"MESSAGE"
                        }
                        Notif.create({...notif,resource:data.fromId,target:data.toId,message:result2._id});
                    })
                    .catch(err => {
                        console.log('can not save the message .')
                        logger.error(`can not save the message : ${err}`);
                        console.log(err);
                    });
            }).catch((err) => {
                console.log('can not update Last Message.');
                logger.error(`can not update Last Message : ${err}`);
                console.log(err);
            });
    },
    async getAllMessages(req, res, next) {
        let page = +req.query.page || 1, limit = +req.query.limit || 20;
        let {userId, friendId,out} = req.query;
        //user try to get other users chat
        if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type)){
            if(req.user._id != userId && req.user._id != friendId)
                return next(new ApiError(403, i18n.__('admin.auth')));
        }
        
        var query1 = {deleted: false };
        var query2 = {deleted: false}
        if (userId) {
            query1.to= userId;
            query2.from= userId;
        }
        if (friendId) {
            query1.from= friendId;
            query2.to= friendId;
        }
        
        Message.find({ $or: [query1, query2] })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate(populateQuery)
            .sort({ _id: -1 })
            .then(async data => {
                var newdata = [];
                //res.status(200).send(data);
                data.map(function (element) {
                    newdata.push({
                        seen: element.seen,
                        _id: element._id,
                        content: element.content,
                        dataType:element.dataType,
                        createdAt: element.incommingDate,
                        booking: element.booking,
                        duration:element.duration,
                        user: {
                            _id: element.from._id,
                            fullname: element.from.fullname,
                            img: element.from.img
                        },
                    });
                })
                let f = newdata;
                let friends = []
                let ids = []
                for(var i=0;i<f.length;i++){
                   let user =  f[i]
                   if(!ids.includes(user.user._id)){
                       friends.push(user)
                       ids.push(user.user._id)
                   }
                }
                console.log("Chat USers")
                console.log(friends)
                console.log(ids)
                    const messagesCount = await Message.find({ $or: [query1, query2] }).countDocuments();
                    const pageCount = Math.ceil(messagesCount / limit);
                if(out){
                    res.send(new ApiResponse(friends, page, pageCount, limit, messagesCount, req));
                } else{
                    res.send(new ApiResponse(newdata, page, pageCount, limit, messagesCount, req));
                }
               
            })
            .catch(err => {
                next(err);
            });
            
    },
    async unseenCount(req, res, next) {
        try {
            let user = req.user._id;
            let query = { deleted: false,to:user,seen:false };
            const unseenCount = await Message.countDocuments(query);
            res.status(200).send({
                unseen:unseenCount,
            });
        } catch (err) {
            next(err);
        }
    },
    updateSeen(req, res, next) {
        var myId = +req.query.userId || 0;
        var friendId = +req.query.friendId || 0;
        //user try to get other users chat
        if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type)){
            if(req.user._id != myId && req.user._id != friendId)
                return next(new ApiError(403, i18n.__('admin.auth')));
        }
        var toRoom = 'room-' + friendId;
        var query1 = {
            to: myId,
            from: friendId,
            seen: false
        };
        Message.updateMany(query1, { seen: true,informed:true, seendate: Date.now() })
            .exec()
            .then(async(data) => {
                var countquery = {
                    to : myId , 
                    deleted : false , 
                    informed : false 
                }
                var Count = await Message.countDocuments(countquery);
                //emit to update message informed
                notificationNSP.to(toRoom).emit('updateUnInformedMessage',{count : Count});
                res.status(200).send('Updated.');
            })
            .catch((err) => {
                next(err);
            });
    },
    updateSeenSocket(nsp, data) { 
        //var myId = +req.query.userId || 0 ;
        //var friendId = +req.query.friendId || 0;
        var myId = data.myId || 0;
        var friendId = data.friendId || 0;
        var toRoom = 'room-' + friendId;
        var fromRoom = 'room-' + myId;
        var query1 = {
            to: myId,
            from: friendId,
            seen: false
        };
        Message.updateMany(query1, { seen: true, informed:true , seendate: Date.now() })
            .exec()
            .then(async(result) => {
                 var countquery = {
                    to : myId , 
                    deleted : false , 
                    informed : false 
                }
                var Count = await Message.countDocuments(countquery);
                //notificationNSP.to(toRoom).emit('updateUnInformedMessage',{count : Count});
               
                nsp.to(toRoom).emit('seen', { success: true });
                nsp.to(fromRoom).emit('seen', { success: true });
            })
            .catch((err) => {
                console.log(err);
            });
    },
    async searchMsg(nsp,data) { 
        let page = data.page ? data.page:1;
        let limit = data.limit?data.limit:20;
        let id = data.id;
        let toRoom = 'room-'+data.id
        let query1 = { deleted: false ,lastMessage: true };
        if (id) query1.to = id;
        let query2 = { deleted: false , lastMessage: true };
        if (id) query2.from = id;
        //user try to get other users chat
        if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type)){
            if(req.user._id != id)
                return next(new ApiError(403, i18n.__('admin.auth')));
        }
        console.log(query1)

        let arr =[]
        await Message.find({ $or: [query1, query2] })
            .then(async(result) => {
                let fromId = [13,14]
                let toId = []
                result.map(async(e)=>{
                    fromId.push(e.from)
                    toId.push(e.to)
                })
                arr= [...fromId,...toId]
                arr = [ ...new Set(arr) ];
                arr = arr.filter(e => e !== parseInt(id))
                console.log(arr)
                
            })
            .catch((err) => {
                console.log(err);
            });
        let query = {"_id":arr}
        if(data.search) {
            Object.assign(query ,{
                $and: [
                    { $or: [
                        {fullname: { $regex: '.*' + data.search + '.*' , '$options' : 'i'  }}, 
                      ] 
                    },
                    {deleted: false},
                ]
            })
        }
        let usersId = await User.find(query).distinct("_id")
        query1.from = usersId;
        query2.to = usersId;
        console.log("users",usersId)
        await Message.find({ $or: [query1, query2] })
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(populateQuery)
        .then(async (data) => {
            const messagesCount = await Message.find({ $or: [query1, query2] }).countDocuments();
            const pageCount = Math.ceil(messagesCount / limit);
            var data1 = [];
            var unseenCount = 0;
            var queryCount = {
                deleted: false,
                to: id,
                seen: false
            }
            data1 = await Promise.all(data.map(async (element) => {
                if (element.from._id === id) {
                    queryCount.from = element.to._id;
                } else {
                    queryCount.from = element.from._id;
                }
                unseenCount = await Message.countDocuments(queryCount);
                let endChat = false;
                if(element.booking != null){
                    console.log('booking', element.booking)
                    let booking = await checkExistThenGet(element.booking._id,Booking)
                    
                    if(isInArray(["PENDING","ACCEPTED"],booking.status)){
                        endChat = false
                    }else{
                        if(booking.status==="COMPLETED"){
                            if(booking.closeDateMillSec){
                                if(booking.closeDateMillSec > Date.parse(new Date())){
                                   endChat = false
                                }else{
                                   endChat = true
                                }
                            }else{
                                endChat = true
                            }
                        }else{
                            endChat = true
                        }
                    }
                }
                element = {
                    endChat: endChat,
                    seen: element.seen,
                    incommingDate: element.incommingDate,
                    lastMessage: element.lastMessage,
                    booking: element.booking,
                    duration:element.duration,
                    _id: element.id,
                    to: element.to,
                    from: element.from,
                    content: element.content,
                    dataType:element.dataType,
                    unseenCount: unseenCount
                };
                return element;
            }));
            nsp.to(toRoom).emit('searchMsg', { data: data1 });
        })
    },
   
    async findLastContacts(req, res, next) {
        try {
            let page = +req.query.page || 1, limit = +req.query.limit || 20,
            { id } = req.query;
            let query1 = { deleted: false ,lastMessage: true };
            if (id) query1.to = id;
            let query2 = { deleted: false , lastMessage: true };
            if (id) query2.from = id;
            //user try to get other users chat
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type)){
                if(req.user._id != id)
                    return next(new ApiError(403, i18n.__('admin.auth')));
            }

            Message.find({ $or: [query1, query2] })
                .sort({ _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate(populateQuery)
                .then(async (data) => {
                    const messagesCount = await Message.find({ $or: [query1, query2] }).countDocuments();
                    const pageCount = Math.ceil(messagesCount / limit);
                    var data1 = [];
                    var unseenCount = 0;
                    var queryCount = {
                        deleted: false,
                        to: id,
                        seen: false
                    }
                    data1 = await Promise.all(data.map(async (element) => {
                        if (element.from._id === id) {
                            queryCount.from = element.to._id;
                        } else {
                            queryCount.from = element.from._id;
                        }
                        unseenCount = await Message.countDocuments(queryCount);
                        let endChat = false;
                        if(element.booking != null){
                            let booking = await checkExistThenGet(element.booking._id,Booking)
                            console.log(booking.status)
                            logger.info(`booking.status ${booking.status}`);
                            if(isInArray(["PENDING","ACCEPTED"],booking.status)){
                                endChat = false
                            }else{
                                if(booking.status==="COMPLETED"){
                                    if(booking.closeDateMillSec){
                                        if(booking.closeDateMillSec > Date.parse(new Date())){
                                           endChat = false
                                        }else{
                                           endChat = true
                                        }
                                    }else{
                                        endChat = true
                                    }
                                }else{
                                    endChat = true
                                }
                                
                            }

                        }
                        element = {
                            endChat: endChat,
                            seen: element.seen,
                            incommingDate: element.incommingDate,
                            lastMessage: element.lastMessage,
                            booking: element.booking,
                            duration:element.duration,
                            _id: element.id,
                            to: element.to,
                            from: element.from,
                            content: element.content,
                            dataType:element.dataType,
                            unseenCount: unseenCount
                        };
                        return element;
                    }));
                    res.send(new ApiResponse(data1, page, pageCount, limit, messagesCount, req));
                })

        } catch (err) {
            next(err);
        };
    },
    getOnlineUsers(nsp,data){ 
        var userId = data.id;
        var myRoom = 'room-'+userId;
        var query={
            deleted:false,
            _id: { $in : data.users } 
        };
        console.log(query);
        User.find(query).select('fullname img')
        .then((data1)=>{
            console.log(data1);
            nsp.to(myRoom).emit('onlineUsers', {data: data1});
        })
        .catch((err)=>{
            console.log(err);
        });
    },
    getMyInfo(socket,data){ 
        var userId = data.id;
        User.findByIdAndUpdate(userId,{status:true},{new: true})
        .then((data1)=>{
            console.log("ingetinfo"+data1);
            if(data1)
            {
                socket.broadcast.emit('UserOnline',data1);
            }
        })
        .catch((err)=>{
            console.log(err);
        });
    },
    changeStatus(socket,data ,check){
        var userId = data.userId;
        User.findByIdAndUpdate(userId,{status:check},{new: true})
        .then((data1)=>{
            if(check){
                console.log("in if");
                socket.broadcast.emit('online',data1);
            }
            else{
                console.log("in else");
                socket.broadcast.emit('offline',data1);
            }
        })
        .catch((err)=>{
            console.log(err);
        });
    },
    
    updateInformed(req,res,next){
        var id = +req.query.id || 0 ;
        console.log(id);
        if(!id)
        {
            next(new ApiError(404 , ' User Id Not Found . '));
        }
        var query = {
            to : id , 
            informed : false ,
            deleted : false
        }
        Message.updateMany(query , {informed:true})
            .then((data)=>{
                res.status(200).send('Updated Successfully');
            }) 
            .catch((err)=>{
                next(err);
            });
    },
    

    
};

module.exports = messageController;
