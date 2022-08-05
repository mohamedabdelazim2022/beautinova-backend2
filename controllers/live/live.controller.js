import ApiResponse from "../../helpers/ApiResponse";
import Report from "../../models/reports/report.model";
import ApiError from '../../helpers/ApiError';
import { checkExist, checkExistThenGet, isImgUrl ,isInArray} from "../../helpers/CheckMethods";
import { handleImg, checkValidations,convertLang,convertLangSocket } from "../shared/shared.controller";
import { body } from "express-validator/check";
import Live from "../../models/live/live.model";
import User from "../../models/user/user.model";
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import Notif from "../../models/notif/notif.model";
import Comment from "../../models/comment/comment.model";
import i18n from "i18n";
import { transformLive, transformLiveById } from "../../models/live/transformLive";
import Logger from "../../services/logger";
const logger = new Logger('live '+ new Date(Date.now()).toDateString())
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
];
const populateQueryComment = [
    {path:'user', model: 'user'}
]
export default {

    async findAll(req, res, next) {

        try {
            convertLang(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let {owner,status,startDate,endDate,search,end} = req.query
            let query = {deleted: false };
            if(search) {
                Object.assign(query, {
                    $and: [
                        { $or: [
                            {title: { $regex: '.*' + search + '.*' , '$options' : 'i'  }}, 
                            {description: { $regex: '.*' + search + '.*', '$options' : 'i'  }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                }
                )
            }
            if(owner) query.owner = owner;
            if(status) query.status = status;
            if(startDate && endDate){
                Object.assign(query, {"startDateMillSec": {$gte :Date.parse( startDate) , $lte : Date.parse(endDate) }})//
            }
            if(end == "true") {
                Object.assign(query, {"endDateMillSec": {$lte : Date.parse(new Date()) }})//

            }
            if(end == "false") {
                Object.assign(query, {"endDateMillSec": {$gte : Date.parse(new Date()) }})//
            }
            let myUser = await checkExistThenGet(req.user._id, User)
            await Live.find(query).populate(populateQuery)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit).then(async(data)=>{
                    let newdata =[]
                    await Promise.all(data.map(async(e)=>{
                        let index = await transformLive(e,myUser)
                        newdata.push(index)
                    }))
                    const livesCount = await Live.countDocuments(query);
                    const pageCount = Math.ceil(livesCount / limit);

                    res.send(new ApiResponse(newdata, page, pageCount, limit, livesCount, req));
                })

        } catch (err) {
            next(err);
        }
    },
    async findSelection(req, res, next) {
        try {
            convertLang(req)
            let {owner,status,startDate,endDate,search,end} = req.query
            let query = {deleted: false };
            if(search) {
                Object.assign(query, {
                    $and: [
                        { $or: [
                            {title: { $regex: '.*' + search + '.*' , '$options' : 'i'  }}, 
                            {description: { $regex: '.*' + search + '.*', '$options' : 'i'  }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                }
                )
            }
            if(owner) query.owner = owner;
            if(status) query.status = status;
            if(startDate && endDate){
                Object.assign(query, {"startDateMillSec": {$gte :Date.parse( startDate) , $lte : Date.parse(endDate) }})//
            }
            if(end == "true") {
                Object.assign(query, {"endDateMillSec": {$gte : Date.parse(new Date()) }})//

            }
            if(end == "false") {
                Object.assign(query, {"endDateMillSec": {$lte : Date.parse(new Date()) }})//
            }
            let myUser = await checkExistThenGet(req.user._id, User)
            await Live.find(query).populate(populateQuery)
                .sort({ createdAt: -1 })
                .then(async(data)=>{
                    let newdata =[]
                    await Promise.all(data.map(async(e)=>{
                        let index = await transformLive(e,myUser)
                        newdata.push(index)
                    }))
                    res.send({success:true,data:newdata});
                })
        } catch (err) {
            next(err);
        }
    },

    validateBody(isUpdate = false) {
        let validations = [
            body('title').not().isEmpty().withMessage((value, { req}) => {
                return req.__('title.required', { value});
            }),
            body('description').not().isEmpty().withMessage((value, { req}) => {
                return req.__('description.required', { value});
            }),
            body('startDate').not().isEmpty().withMessage((value, { req}) => {
                return req.__('startDate.required', { value});
            }),
            body('endDate').not().isEmpty().withMessage((value, { req}) => {
                return req.__('endDate.required', { value});
            }),
            body('streamKey').optional(),
            body('videoId').optional(),

        ];
       
        if (isUpdate)
        validations.push([
            body('bannar').optional().custom(val => isImgUrl(val)).withMessage((value, { req}) => {
                return req.__('img.syntax', { value});
            })
        ]);

        return validations;
    },

    async create(req, res, next) {

        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","ARTIST"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let user = req.user;
            const validatedBody = checkValidations(req);
            validatedBody.owner = req.user._id;
            validatedBody.startDateMillSec = Date.parse(validatedBody.startDate)
            validatedBody.endDateMillSec = Date.parse(validatedBody.endDate)
            logger.error(`validatedBody live : ${validatedBody}`);
            let createdLive = await Live.create({ ...validatedBody});
            logger.info(`create live ${createdLive.id}`);
            let users = await User.find({'type':['ADMIN','SUB-ADMIN']});
            users.forEach(async(user) => {
                sendNotifiAndPushNotifi({
                    targetUser: user.id, 
                    fromUser: req.user._id, 
                    text: 'Beauti Nova',
                    subject: createdLive,
                    subjectType: 'New Live Request',
                    info:'live'
                });
                let notif = {
                    "description_en":'New Live Request',
                    "description_ar":'تحديث بخصوص البث',
                    "title_ar":"  تحديث بخصوص البث",
                    "title_en":"New Live Request",
                    "type":"LIVE"
                }
                await Notif.create({...notif,resource:req.user._id,target:user.id,live:createdLive.id});
            })
            let reports = {
                "action":"Create Live",
            };
            await Report.create({...reports, user: user });
            res.status(201).send(createdLive);
        } catch (err) {
            logger.error(`create live error: ${error}`);
            next(err);
        }
    },


    async findById(req, res, next) {
        try {
            convertLang(req)
            let { liveId } = req.params;
            await checkExist(liveId, Live, { deleted: false });
            let myUser = await checkExistThenGet(req.user._id, User)
            await Live.findById(liveId).populate(populateQuery)
                .sort({ createdAt: -1 })
                .then(async(e)=>{
                    let index = await transformLiveById(e,myUser)
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
            let user = req.user
            let { liveId } = req.params;
            let live = await checkExistThenGet(liveId, Live, { deleted: false });
            logger.info(`update live ${live.id}`);
            //user is not the owner of live
            if(req.user.type =="ARTIST" && req.user._id != live.owner)
                return next(new ApiError(403, i18n.__('admin.auth')));
            const validatedBody = checkValidations(req);
            if (req.file) {
                let image = await handleImg(req, { attributeName: 'bannar', isUpdate: true });
                validatedBody.bannar = image;
            }
            let updatedLive = await Live.findByIdAndUpdate(liveId, {
                ...validatedBody,
            }, { new: true });
            let reports = {
                "action":"Update Live",
            };
            await Report.create({...reports, user: user });
            res.status(200).send(updatedLive);
        }
        catch (err) {
            next(err);
        }
    },
    async cancel(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","ARTIST"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let user = req.user;
            let { liveId } = req.params;
            let live = await checkExistThenGet(liveId, Live, { deleted: false });
            logger.info(`cancel live ${live.id}`);
            //user is not the owner of live
            if(req.user.type =="ARTIST" && req.user._id != live.owner)
                return next(new ApiError(403, i18n.__('admin.auth')));
            live.status = 'CANCEL';
            await live.save();
            let users = await User.find({'type':['ADMIN','SUB-ADMIN']});
            users.forEach(async(user) => {
                sendNotifiAndPushNotifi({
                    targetUser: user.id, 
                    fromUser: req.user._id, 
                    text: 'Beauti Nova',
                    subject: live,
                    subjectType: ' Live Request has been canceled',
                    info:'live'
                });
                let notif = {
                    "description_en":'New Live Has been canceled',
                    "description_ar":'تحديث بخصوص البث',
                    "title_ar":"  تحديث بخصوص البث",
                    "title_en":"Live Request Status",
                    "type":"LIVE"
                }
                await Notif.create({...notif,resource:req.user._id,target:user.id,live:live.id});
            })
          
            let reports = {
                "action":" Live is Canceled",
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});

        }
        catch (err) {
            logger.error(`cancel live error: ${error}`);
            next(err);
        }
    },
    async reject(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let user = req.user;
            let { liveId } = req.params;
            let live = await checkExistThenGet(liveId, Live, { deleted: false });
            live.status = 'REJECTED';
            live.reason = req.body.reason?req.body.reason:""
            await live.save();
            sendNotifiAndPushNotifi({
                targetUser: live.owner, 
                fromUser: live.owner, 
                text: 'Live Request',
                subject: live.id,
                subjectType: 'Unfortunately your request was not approved'
            });
            let notif = {
                "description_en":'Unfortunately your request was not approved',
                "description_ar":"طلب البث الخاص بك تم رفضه" ,
                "title_en":"Live Request",
                "title_ar":"تحديث بخصوص البث ",
                "type":"LIVE"
            }
            await Notif.create({...notif,resource:live.owner,target:live.owner,live:live.id});
            let reports = {
                "action":" Live is Rejected",
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
    async accept(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let user = req.user;
            let { liveId } = req.params;
            let live = await checkExistThenGet(liveId, Live, { deleted: false });
            let artist = await checkExistThenGet(live.artist, User, { deleted: false });
            if (req.file) {
                let image = await handleImg(req, { attributeName: 'bannar'});
                live.bannar = image;
            }
            live.status = 'ACCEPTED';
            await live.save();
            sendNotifiAndPushNotifi({
                targetUser: live.owner, 
                fromUser: live.owner, 
                text: 'Live Request',
                subject: live.id,
                subjectType: 'Your live request is accepted'
            });
            let notif = {
                "description_en":'Your live request is accepted',
                "description_ar":"طلب البث الخاص بك تم الموافقه عليه" ,
                "title_en":"Live Request",
                "title_ar":"تحديث بخصوص البث ",
                "type":"LIVE"
            }
            await Notif.create({...notif,resource:live.owner,target:live.owner,live:live.id});
            //send notifs to users
            let users = await User.find({'type':['USER','ARTIST']});
            users.forEach(async(user) => {
                sendNotifiAndPushNotifi({////////
                    targetUser: user.id, 
                    fromUser: req.user._id, 
                    text: 'Catch '+ req.user.fullname + ' Live ',
                    subject: live.id,
                    subjectType: 'Catch '+req.user.fullname + ' live now talking about ' + live.title,
                    info:'LIVE'
                });
                let notif = {
                    "description_en":'Catch' + artist.fullname+ 'live on ' +moment(live.startDate).format('L')+ ' at '+ moment(live.startDate).format('LTS') + 'talking about ' + live.title,
                    "description_ar": 'بث جديد فى انتظارك',
                    "title_en":'Catch '+ req.user.fullname + ' Live ',
                    "title_ar": "كن اول الحاضرين فى هذا البث ",
                    "type":"LIVE"
                }
                await Notif.create({...notif,resource:req.user._id,target:user.id,live:live.id});
            });
            let reports = {
                "action":" Live is Accepted",
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
    async start(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","ARTIST"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            
            let user = req.user;
            let { liveId } = req.params;
            let live = await checkExistThenGet(liveId, Live, { deleted: false });
            logger.info(`start live ${live.id}`);
            //user is not the owner of live
            if(req.user.type =="ARTIST" && req.user._id != live.owner)
                return next(new ApiError(403, i18n.__('admin.auth')));

            live.status = 'STARTED';
            if(req.body.streamKey)
                live.streamKey = req.body.streamKey;
            if(req.body.videoId)
                live.videoId = req.body.videoId;
            await live.save();
            //send notifs to users
            let users = await User.find({'type':['USER','ARTIST']});
            users.forEach(async(user) => {
                sendNotifiAndPushNotifi({////////
                    targetUser: user.id, 
                    fromUser: req.user._id, 
                    text: req.user.fullname + 'is Live now!',
                    subject: live.id,
                    subjectType: 'Catch '+req.user.fullname + ' live now talking about ' + live.title,
                    info:'LIVE'
                });
                let notif = {
                    "description_en":'Catch '+req.user.fullname + ' live now talking about ' + live.title,
                    "description_ar": 'بث جديد فى انتظارك',
                    "title_en":artist.fullname + " is Live now!",
                    "title_ar": "بث جديد فى انتظارك",
                    "type":"LIVE"
                }
                await Notif.create({...notif,resource:req.user._id,target:user.id,live:live.id});
            });
            let reports = {
                "action":" Live is started",
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
    async end(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","ARTIST"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let user = req.user;
            let { liveId } = req.params;
            let live = await checkExistThenGet(liveId, Live, { deleted: false });
            logger.info(`end live ${live.id}`);
            //user is not the owner of live
            if(req.user.type =="ARTIST" && req.user._id != live.owner)
                return next(new ApiError(403, i18n.__('admin.auth')));
            if(req.body.viewersCount){
                live.viewersCount = req.body.viewersCount
            }
            live.status = 'ENDED';
            await live.save();
          
            let reports = {
                "action":" Live is Ended",
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});

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
            let { liveId } = req.params;
            let live = await checkExistThenGet(liveId, Live, { deleted: false });
            //user is not the owner of live
            if(req.user.type =="ARTIST" && req.user._id != live.owner)
                return next(new ApiError(403, i18n.__('admin.auth')));
            live.deleted = true;
            await live.save();
            let reports = {
                "action":"Delete Live",
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
    
    async AddComment(io, nsp, data,socket) { 
        try {
            logger.info(`add comment socket data  : ${data}`);
            var userId = data.userId;
            let theLang = data.lang?data.lang:"ar"
            convertLangSocket(theLang)
            let lang = i18n.getLocale(theLang) 
            var toRoom = 'room-' + data.userId;          
            let theComment = {
                user:data.userId,
                comment:data.comment,
                live:data.liveId,
            }
            Comment.create({...theComment}).then((data1)=>{
                Comment.findById(data1._id).populate(populateQueryComment)
                .then((e)=>{
                    logger.info(`add comment on live ${data1._id}`);
                    let index = {
                        comment:e.comment,
                        id:e._id,
                        user:{
                            fullname:e.user.fullname,
                            username:e.user.username,
                            img:e.user.img,                           
                            online:e.user.online,
                            id:e.user._id,
                        }
                    }
                    console.log("e._id",e._id)
                    //nsp.to(toRoom).emit('AddComment', index);
                    socket.emit('AddComment', index)
                    socket.broadcast.emit('AddComment', index)
                    io.emit('AddComment',index);
                })

            })   
            

        } 
        catch (err) {
            console.log(err);
        }
    },
};