import ApiResponse from "../../helpers/ApiResponse";
import Report from "../../models/reports/report.model";
import ApiError from '../../helpers/ApiError';
import { checkExist, checkExistThenGet,isLng, isLat ,isInArray} from "../../helpers/CheckMethods";
import {  checkValidations,convertLang,validateAddBooking,convertLangSocket } from "../shared/shared.controller";
import { body } from "express-validator/check";
import Booking from "../../models/booking/booking.model";
import CompletedDay from "../../models/completedDay/completedDay.model";
import User from "../../models/user/user.model";
import i18n from "i18n";
import moment from "moment";
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import Notif from "../../models/notif/notif.model"
import { transformBooking, transformBookingById } from "../../models/booking/transformBooking";
import City from "../../models/city/city.model";
import Category from "../../models/category/category.model";
import Area from "../../models/area/area.model";
import Logger from "../../services/logger";
const logger = new Logger('booking '+ new Date(Date.now()).toDateString())
function validatedestination(location) {
    if (!isLng(location[0]))
        throw new Error(i18n.__('invalid.lng'));
    if (!isLat(location[1]))
    throw new Error(i18n.__('invalid.lat'));
}
const populateQuery = [
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
export default {
    async findAll(req, res, next) {

        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let {artist,status,startDate,endDate,client,service,type,search} = req.query
            let query = {deleted: false };
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {client: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {artist: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            if(client) query.client = client;
            if(artist) query.artist = artist;
            if(status) query.status = status;
            if(type=="UPCOMING") query.status = {$in:["PENDING","ACCEPTED"]}
            if(type=="PAST") query.status = {$nin:["PENDING","ACCEPTED"]}
            if(service) query.service = service;
            if(startDate && endDate){
                Object.assign(query, {"startDateMillSec": {$gte :Date.parse( startDate) , $lte : Date.parse(endDate) }})//
            }
            await Booking.find(query).populate(populateQuery)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit).then(async(data)=>{
                    let newdata = []
                    await Promise.all(data.map(async(e)=>{
                        let index = await transformBooking(e,lang)
                        newdata.push(index)
                    }))
                    const bookingsCount = await Booking.countDocuments(query);
                    const pageCount = Math.ceil(bookingsCount / limit);
                    res.send(new ApiResponse(newdata, page, pageCount, limit, bookingsCount, req));
                })
           
        } catch (err) {
            next(err);
        }
    },
    async findSelection(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let {artist,status,startDate,endDate,client,service,type,search} = req.query
            let query = {deleted: false };
            if(search) {
                query = {
                    $and: [
                        { $or: [
                            {client: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                            {artist: { $regex: '.*' + search + '.*' , '$options' : 'i' }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            if(client) query.client = client;
            if(artist) query.artist = artist;
            if(status) query.status = status;
            if(type=="UPCOMING") query.status = {$in:["PENDING","ACCEPTED"]}
            if(type=="PAST") query.status = {$nin:["PENDING","ACCEPTED"]}
            if(service) query.service = service;
            if(startDate && endDate){
                Object.assign(query, {"startDateMillSec": {$gte :Date.parse( startDate) , $lte : Date.parse(endDate) }})//
            }
            await Booking.find(query).populate(populateQuery)
                .sort({ createdAt: -1 }).then(async(data)=>{
                    let newdata = []
                    await Promise.all(data.map(async(e)=>{
                        let index = await transformBooking(e,lang)
                        newdata.push(index)
                    }))
                    res.send({success: true,data:newdata});
                })
        } catch (err) {
            next(err);
        }
    },
    async bookingCount(req, res, next) {
        try {
            convertLang(req)
            let {artist,status,startDate,endDate,client,service,type} = req.query
            let query = {deleted: false };
            if(client) query.client = client;
            if(artist) query.artist = artist;
            if(status) query.status = status
            if(type=="UPCOMING") query.status = {$in:["PENDING","ACCEPTED"]}
            if(type=="PAST") query.status = {$nin:["PENDING","ACCEPTED"]}
            if(service) query.service = service;
            if(startDate && endDate){
                Object.assign(query, {"startDateMillSec": {$gte :Date.parse( startDate) , $lte : Date.parse(endDate) }})//
            }
            let bookingsCount = await Booking.countDocuments(query);
            res.send({success: true,bookingsCount: bookingsCount});
        } catch (err) {
            next(err);
        }
    },
    async findById(req, res, next) {
        try {
            convertLang(req)
            let { bookingId } = req.params;
            await checkExist(bookingId, Booking, { deleted: false });
            let booking = await Booking.findById(bookingId).populate(populateQuery)
            res.send(booking);
        } catch (err) {
            next(err);
        }
    },
    validateBody(isUpdate = false) {
        let validations = [
            body('artist').not().isEmpty().withMessage((value, { req}) => {
                return req.__('artist.required', { value});
            }).custom(async (value, { req }) => {
                if (!await User.findOne({_id:value,deleted:false}))
                    throw new Error(req.__('artist.invalid'));
                else
                    return true;
            }),
            body('service').not().isEmpty().withMessage((value, { req}) => {
                return req.__('service.required', { value});
            }).isNumeric().isNumeric().withMessage((value, { req}) => {
                return req.__('service.numeric', { value});
            }).custom(async (value, { req }) => {
                if (!await Category.findOne({_id:value,deleted:false}))
                    throw new Error(req.__('service.invalid'));
                else
                    return true;
            }),
            body('personsCount').not().isEmpty().withMessage((value, { req}) => {
                return req.__('personsCount.required', { value});
            }).isNumeric().withMessage((value, { req}) => {
                return req.__('personsCount.numeric', { value});
            }),
            body('notes').optional(),
            body('date').not().isEmpty().withMessage((value, { req}) => {
                return req.__('date.required', { value});
            }),
            body('time').not().isEmpty().withMessage((value, { req}) => {
                return req.__('time.required', { value});
            }),
            body('destination').not().isEmpty().withMessage((value, { req}) => {
                return req.__('destination.required', { value});
            }),
            body('type').not().isEmpty().withMessage((value, { req}) => {
                return req.__('type.required', { value});
            }).isIn(['ARTIST-BOOKING','CLIENT-BOOKING',]).withMessage((value, { req}) => {
                    return req.__('type.invalid', { value});
            }),
            body('placeType').not().isEmpty().withMessage((value, { req}) => {
                return req.__('placeType.required', { value});
            }),
            
            body('address').optional(),            
            body('city').not().isEmpty().withMessage((value, { req}) => {
                return req.__('city.required', { value});
            }).isNumeric().isNumeric().withMessage((value, { req}) => {
                return req.__('city.numeric', { value});
            }).custom(async (value, { req }) => {
                if (!await City.findOne({_id:value,deleted:false}))
                    throw new Error(req.__('city.invalid'));
                else
                    return true;
            }),
            body('area').not().isEmpty().withMessage((value, { req}) => {
                return req.__('area.required', { value});
            }).isNumeric().isNumeric().withMessage((value, { req}) => {
                return req.__('area.numeric', { value});
            }).custom(async (value, { req }) => {
                if (!await Area.findOne({_id:value,deleted:false}))
                    throw new Error(req.__('area.invalid'));
                else
                    return true;
            }),
            body('clientName').optional(),
            body('startDate').optional(),
            body('endDate').optional(),
             
        ];

        return validations;
    },
    async create(req, res, next) {

        try {
            convertLang(req)
            let user = req.user;
           
            const validatedBody = checkValidations(req);
            logger.error(`validatedBody booking : ${validatedBody}`);
            validatedestination(validatedBody.destination);
            
            validatedBody.destination = { type: 'Point', coordinates: [+req.body.destination[0], +req.body.destination[1]] };
            //start date
            if(validatedBody.startDate) {
                validatedBody.startDateMillSec = Date.parse(validatedBody.startDate)
            }else{
                console.log("Invalid start date")
                logger.info(`Invalid start date`);
                let fullDate = validatedBody.date +" "+ validatedBody.time;
                console.log(fullDate);
                logger.info(`fullDate: ${fullDate}`);
                validatedBody.startDate = moment(moment(fullDate, 'YYYY-MM-DD h:m A').format())//.add(2, 'hours').format()
                validatedBody.startDateMillSec = Date.parse(moment(fullDate, 'YYYY-MM-DD h:m A').format())
            }
            //check if day not close
            let startCheckDate = validatedBody.date+'T00:00:00.000Z'
            let endCheckDate = validatedBody.date + 'T23:59:00.000Z'
            if(await CompletedDay.findOne({deleted: false,artist:validatedBody.artist,date:{$gte:startCheckDate,$lte:endCheckDate}})){
                return next(new ApiError(400, i18n.__('day.closed')))
            }
            //booking type
            if(validatedBody.type ==="CLIENT-BOOKING"){
                logger.info(`client booking`);
                validatedBody.client = req.user._id
            }else{
                logger.info(`artist booking`);
                validatedBody.status = "ACCEPTED"
                if(!validatedBody.clientName)
                    return next(new ApiError(422, i18n.__('clientName.required')))
                //check if endDate is grater than startDate
                if(Date.parse(validatedBody.endDate) <= Date.parse(validatedBody.startDate)){
                    return next(new ApiError(400, i18n.__('endDate.invalid')))
                }
                validatedBody.endDateMillSec = Date.parse(validatedBody.endDate)
                //check if there's a booking or not
                
                if(await Booking.findOne({deleted: false,artist: validatedBody.artist,status: 'ACCEPTED',
                    startDateMillSec: {$gte :Date.parse(validatedBody.startDate) , $lte : Date.parse(validatedBody.endDate) }
                })){
                    return next(new ApiError(400, i18n.__('anotherBooking.exist')))
                }
    
                //booking in the same duration 
                let oldBookings = await Booking.find({
                    deleted: false,
                    artist: validatedBody.artist,
                    startDateMillSec: {$gte :Date.parse(validatedBody.startDate) , $lte : Date.parse(validatedBody.endDate) }
                })
                for (let i of oldBookings) {
                    i.status = "REJECTED";
                    if(i.type === "CLIENT-BOOKING"){
                        sendNotifiAndPushNotifi({
                            targetUser: i.client, 
                            fromUser: i.artist, 
                            text: 'new notification',
                            subject: i.id,
                            subjectType: 'your booking request has been rejected',
                            info: 'booking'
                        });
                        let notif = {
                            "description_en":'your booking request has been rejected',
                            "description_ar":"طلب الحجز الخاص بك تم رفضه" ,
                            "title_en":"booking update",
                            "title_ar":"تحديث بخصوص حجزك ",
                            "type":"BOOKING"
                        }
                        await Notif.create({...notif,resource:i.artist,target:i.client,booking:i.id});
                        
                    }
                    let reports = {
                        "action":" booking is Rejected",
                    };
                    await Report.create({...reports, user: req.user._id });
                    await i.save();
                }

            }
            logger.info(`validatedBody: ${validatedBody}`);
            let createdbooking = await Booking.create({ ...validatedBody});
            logger.info(`create booking : ${createdbooking.id}`);
            let reports = {
                "action":"Create booking",
            };
            await Report.create({...reports, user: user });
            res.status(201).send({success: true,data:createdbooking});
        } catch (err) {
            logger.error(` booking arr : ${err}`);
            next(err);
        }
    },
    //add using socket
    async AddBooking(socket,data,nsp){
        logger.info(`add booking socket data  : ${data}`);
        let theLang = data.lang?data.lang:"ar"
        convertLangSocket(theLang)
        let lang = i18n.getLocale(theLang) 
        //console.log("vv",validateAddBooking(data))
        var toRoom = 'room-' + data.userId; 
        //if no error in data
        logger.info(` booking  : ${validateAddBooking(data)}`);
        if(await validateAddBooking(data) == true){
            let bookingData = {
                startDate:data.startDate,
                artist:data.artist,
                service:data.service,
                personsCount:data.personsCount,
                date:data.date,
                time:data.time,
                destination:data.destination,
                placeType:data.placeType,
                city:data.city,
                area:data.area,
            }
            if(data.type != null){
                bookingData.type = data.type
                if(data.type ==="CLIENT-BOOKING"){
                    bookingData.client = data.userId
                }else{
                    bookingData.status = "ACCEPTED"
                    bookingData.endDateMillSec = Date.parse(data.endDate)
                    bookingData.clientName = data.clientName?data.clientName:""
            
                }
            }else{
                bookingData.client = data.userId
                bookingData.type = "CLIENT-BOOKING"
            }
            if(data.address != null){
                bookingData.address = data.address
            }
            if(data.notes != null){
                bookingData.notes = data.notes
            }
            if (data.destination != null) {
                bookingData.destination = data.destination;
                bookingData.destination = { type: 'Point', coordinates: [+data.destination[0], +data.destination[1]] };
            }
            if(data.startDate == null){
                let fullDate = data.date +" "+ data.time;
                console.log(fullDate);
                logger.info(` fullDate  : ${fullDate}`);
                bookingData.startDate = moment(moment(fullDate, 'YYYY-MM-DD h:m A').format())//.add(2, 'hours').format()
                bookingData.startDateMillSec = Date.parse(moment(fullDate, 'YYYY-MM-DD h:m A').format())
    
            }else{
                bookingData.startDate = data.startDate
                bookingData.startDateMillSec = Date.parse(data.startDate)
            }
            logger.info(` bookingData  : ${bookingData}`);
            Booking.create({...bookingData}).then((data1)=>{
                Booking.findById(data1._id).populate(populateQuery)
                .then(async(e)=>{
                    let index = await transformBooking(e,lang)
                    console.log("e._id",e._id)
                    logger.info(` booking id   : ${e._id}`);
                    if(data.type ==="CLIENT-BOOKING"){
                        let theClient = await checkExistThenGet(data.userId, User)
                        //send notification to artist
                        sendNotifiAndPushNotifi({
                            targetUser: data.artist, 
                            fromUser: data.userId, 
                            text: 'Booking Request ✌️',
                            subject: data._id,
                            subjectType: theClient.fullname + ' just sent you a booking request, view it now by clicking on the notification',
                            info:'booking'
                        });
                        let notif = {
                            "description_en":theClient.fullname + ' just sent you a booking request, view it now by clicking on the notification ',
                            "description_ar":'طلب حجز جديد فى انتظارك',
                            "title_en":'Booking Request ✌️',
                            "title_ar":'طلب حجز جديد',
                            "type":"BOOKING"
                        }
                        Notif.create({...notif,resource:data.userId,target:data.artist,booking:e._id});
                        let toArtist = 'room-'+data.artist
                        console.log(toArtist)
                        logger.info(` toArtist   : ${toArtist}`);
                        nsp.to(toArtist).emit('AddBooking', {data:index});
                    }
                    nsp.to(toRoom).emit('AddBooking', {success:true});
                })

            })            

        }else{
            console.log('error')
            logger.error(`add booking error   : ${error}`);
            nsp.to(toRoom).emit('AddBooking', {data:await validateAddBooking(data)});
        }

    },
    async update(req, res, next) {
        try {
            convertLang(req)
            let user = req.user
            let { bookingId } = req.params;
            let booking = await checkExistThenGet(bookingId, Booking, { deleted: false });
            
            //artist is not the artist of booking
            if(req.user.type =="ARTIST" && req.user._id != booking.artist)
                return next(new ApiError(403, i18n.__('notAllow')));
            //client is not the client of booking
            if(req.user.type =="USER" && req.user._id != booking.artist)
                return next(new ApiError(403, i18n.__('notAllow')));
            const validatedBody = checkValidations(req);
            logger.error(`validatedBody update booking : ${validatedBody}`);
            validatedestination(validatedBody.destination);
            validatedBody.destination = { type: 'Point', coordinates: [+req.body.destination[0], +req.body.destination[1]] };
            //start date
            if(validatedBody.startDate) {
                validatedBody.startDateMillSec = Date.parse(validatedBody.startDate)
            }else{
                let fullDate = validatedBody.date +" "+ validatedBody.time;
                console.log(fullDate);
                console.log(moment(fullDate, 'YYYY-MM-DD h:m A').format());
                validatedBody.startDate = moment(moment(fullDate, 'YYYY-MM-DD h:m A').format())//.add(2, 'hours').format()
                validatedBody.startDateMillSec = Date.parse(moment(fullDate, 'YYYY-MM-DD h:m A').format())
            }
            //check if day not close
            let startCheckDate = validatedBody.date+'T00:00:00.000Z'
            let endCheckDate = validatedBody.date + 'T23:59:00.000Z'
            if(await CompletedDay.findOne({deleted: false,artist:validatedBody.artist,date:{$gte:startCheckDate,$lte:endCheckDate}})){
                return next(new ApiError(400, i18n.__('day.closed')))
            }
            //booking type
            if(validatedBody.type ==="CLIENT-BOOKING"){
                validatedBody.client = req.user._id
            }else{
                validatedBody.status = "ACCEPTED"
                if(Date.parse(validatedBody.endDate) <= Date.parse(validatedBody.startDate)){
                    return next(new ApiError(400, i18n.__('endDate.invalid')))
                }
                validatedBody.endDateMillSec = Date.parse(validatedBody.endDate)
                //check if there's another booking  or not
                if(await Booking.findOne({_id:{$ne:bookingId},deleted: false,artist: validatedBody.artist,status: 'ACCEPTED',
                    startDateMillSec: {$gte :Date.parse(validatedBody.startDate) , $lte : Date.parse(validatedBody.endDate) }
                })){
                    return next(new ApiError(400, i18n.__('anotherBooking.exist')))
                }

            }
            let updatedbooking = await Booking.findByIdAndUpdate(bookingId, {
                ...validatedBody,
            }, { new: true });
            let reports = {
                "action":"Update booking",
            };
            await Report.create({...reports, user: user });
            res.status(200).send(updatedbooking);
        }
        catch (err) {
            logger.error(`Update booking error   : ${err}`);
            next(err);
        }
    },
    async cancel(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","CLIENT"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let user = req.user;
            let { bookingId } = req.params;
            let booking = await checkExistThenGet(bookingId, Booking, { deleted: false });
            //client is not the owner of booking
            if(req.user.type =="USER" && req.user._id != booking.client)
                return next(new ApiError(403, i18n.__('notAllow')));
            booking.status = 'CANCEL';
            await booking.save();
            logger.info(` user ${req.user._id} canceled booking  : ${bookingId}`);
            let theClient = await checkExistThenGet(booking.client, User)
            //send notification to artist
            sendNotifiAndPushNotifi({
                targetUser: booking.artist, 
                fromUser: booking.userId, 
                text: 'Booking Cancellation ',
                subject: booking.id,
                subjectType: theClient.fullname + ' cancelled the booking request ',
                info:'booking'
            });
            let notif = {
                "description_en":theClient.fullname + ' cancelled the booking request ',
                "description_ar":'طلب الحجز تم الغائه',
                "title_en":'Booking Cancellation ',
                "title_ar":'طلب الحجز تم الغائه',
                "type":"BOOKING"
            }
            await Notif.create({...notif,resource:booking.client,target:booking.artist,booking:booking._id});
            let reports = {
                "action":" booking is Canceled",
            };
            await Report.create({...reports, user: user });
            res.status(204).send();

        }
        catch (err) {
            logger.error(` cancel booking err  : ${err}`);
            next(err);
        }
    },
    async CancelRequest(socket,nsp,data){ 
        
        try {
            logger.info(`cancel booking socket data  : ${data}`);
            let theLang = data.lang?data.lang:"ar"
            convertLangSocket(theLang)
            let lang = i18n.getLocale(theLang) 
            var userId = data.userId;
            var toRoom = 'room-'+userId;
            Booking.findById(data.booking).then(async(booking)=>{
                if(booking.status == 'COMPLETED'){
                    nsp.to(toRoom).emit('CancelRequest', {data:i18n.__('notAllow')});
                }else{
                    Booking.findByIdAndUpdate(data.booking,{status:'CANCEL'},{new:true}).then(async(docs)=>{
                        logger.info(` user ${data.client} canceled booking  : ${data.booking}`);
                        let theClient = await checkExistThenGet(data.client, User)
                        //send notification to artist
                        sendNotifiAndPushNotifi({
                            targetUser: booking.artist, 
                            fromUser: data.userId, 
                            text: 'Booking Cancellation ',
                            subject: data.booking,
                            subjectType: theClient.fullname +  ' cancelled the booking request ',
                            info:'booking'
                        });
                        let notif = {
                            "description_en":theClient.fullname +  ' cancelled the booking request ',
                            "description_ar":'طلب الحجز تم الغائه',
                            "title_en":'Booking Cancellation ',
                            "title_ar":'طلب الحجز تم الغائه',
                            "type":"BOOKING"
                        }
                        Notif.create({...notif,resource:data.userId,target:booking.artist,booking:booking._id});
                        let reports = {
                            "action":"Client Cancel booking",
                        };
                        Report.create({...reports, user: userId });
                        let toArtist = 'room-'+booking.artist 
                        nsp.to(toArtist).emit('CancelRequest', {success:true});
                     }).catch((err)=>{
                        console.log(err);
                     })
                }
            }).catch(error=>{
                console.log(error);
            })
        }catch (error) {
            logger.error(`cancel booking error  : ${error}`);
            console.log(error);
        }
    },
    async reject(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","ARTIST"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let user = req.user;
            let { bookingId } = req.params;
            let booking = await checkExistThenGet(bookingId, Booking, { deleted: false });
            //artist is not the artist of booking
            if(req.user.type =="ARTIST" && req.user._id != booking.artist)
                return next(new ApiError(403, i18n.__('notAllow')));
            booking.reason = req.body.reason?req.body.reason:"";
            booking.reasonType = req.body.reasonType?req.body.reasonType:""
            booking.status = 'REJECTED';
            await booking.save();
            logger.info(` user ${req.user._id} reject booking  : ${bookingId}`);
            if(booking.type === "CLIENT-BOOKING"){
                sendNotifiAndPushNotifi({
                    targetUser: booking.client, 
                    fromUser: booking.artist, 
                    text: req.user.fullname + " 's Booking Status",
                    subject: booking.id,
                    subjectType: 'Unfortunately, your booking was rejected. The following reason was provided by the artist: '+
                    req.body.reason + 'You can check other available artists by clicking here ',
                    info: 'booking'
                });
                let notif = {
                    "description_en":'Unfortunately, your booking was rejected. The following reason was provided by the artist: '+
                    req.body.reason + 'You can check other available artists by clicking here ',
                    "description_ar":"طلب الحجز الخاص بك تم رفضه" ,
                    "title_en":req.user.fullname + " 's Booking Status",
                    "title_ar":"تحديث بخصوص حجزك ",
                    "type":"BOOKING"
                }
                await Notif.create({...notif,resource:booking.artist,target:booking.client,booking:booking.id});    
            }
            let reports = {
                "action":" booking is Rejected",
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
    async rejectSocket(socket,nsp,data){ 
        
        try {
            logger.info(`reject booking socket data  : ${data}`);
            let theLang = data.lang?data.lang:"ar"
            convertLangSocket(theLang)
            let lang = i18n.getLocale(theLang) 
            var userId = data.userId;
            var toRoom = 'room-'+userId;
            let reason =data.reason?data.reason:""
            let reasonType = data.reasonType?data.reasonType:"";
            
            Booking.findById(data.booking).populate(populateQuery).then(async(booking)=>{
                let artist = await checkExistThenGet(booking.artist,User, { deleted: false })
                if(booking.status == 'COMPLETED'){
                    nsp.to(toRoom).emit('RejectRequest', {data:i18n.__('notAllow')});
                }else{
                    Booking.findByIdAndUpdate(data.booking,{status:'REJECTED',reason:reason},{new:true}).then(async(e)=>{
                        logger.info(` user ${data.client} reject booking  : ${data.booking}`);
                        let index = await transformBookingById(e,lang)
                        //send notification to artist
                        sendNotifiAndPushNotifi({
                            targetUser: booking.client, 
                            fromUser: booking.artist, 
                            text: artist.fullname + " 's Booking Status",
                            subject: booking.id,
                            subjectType: 'Unfortunately, your booking was rejected. The following reason was provided by the artist: '+
                            data.reason + 'You can check other available artists by clicking here ',
                            info: 'booking'
                        });
                        let notif = {
                            "description_en":'Unfortunately, your booking was rejected. The following reason was provided by the artist: '+
                            data.reason + 'You can check other available artists by clicking here ',
                            "description_ar":"طلب الحجز الخاص بك تم رفضه" ,
                            "title_en":artist.fullname + " 's Booking Status",
                            "title_ar":"تحديث بخصوص حجزك ",
                            "type":"BOOKING"
                        }
                        Notif.create({...notif,resource:data.userId,target:booking.client,booking:booking._id});
                        let reports = {
                            "action":"Artist Reject booking",
                        };
                        Report.create({...reports, user: userId });
                        let toClient = 'room-'+booking.client 
                        nsp.to(toClient).emit('RejectRequest', {success:true,booking:index});
                     }).catch((err)=>{
                        console.log(err);
                     })
                }
            }).catch(error=>{
                logger.info(` error  : ${error}`);
                console.log(error);
            })
        }catch (error) {
            logger.info(` error  : ${error}`);
            console.log(error);
        }
    },
    validateAcceptedBody(isUpdate = false) {
        let validations = [
            body('endDate').not().isEmpty().withMessage((value, { req}) => {
                return req.__('endDate.required', { value});
            }),
        ];

        return validations;
    },
    async accept(req, res, next) {
        try {
            convertLang(req)
            const validatedBody = checkValidations(req);
            if(!isInArray(["ADMIN","SUB-ADMIN","ARTIST"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let user = req.user;
            let { bookingId } = req.params;
           
            let booking = await checkExistThenGet(bookingId, Booking, { deleted: false });
            //artist is not the artist of booking
            if(req.user.type =="ARTIST" && req.user._id != booking.artist)
                return next(new ApiError(403, i18n.__('notAllow')));

            if(Date.parse(req.body.endDate) <= Date.parse(booking.startDate)){
                return next(new ApiError(400, i18n.__('endDate.invalid')))
            }

            //booking in the same duration 
            let oldBookings = await Booking.find({
                deleted: false,
                artist: booking.artist,
                startDateMillSec: {$gte :Date.parse(booking.startDate) , $lte : Date.parse(req.body.endDate) }
            })
            for (let i of oldBookings) {
                i.status = "REJECTED";
                sendNotifiAndPushNotifi({
                    targetUser: i.client, 
                    fromUser: i.artist, 
                    text: 'new notification',
                    subject: i.id,
                    subjectType: 'your booking request has been rejected',
                    info: 'booking'
                });
                let notif = {
                    "description_en":'your booking request has been rejected',
                    "description_ar":"طلب الحجز الخاص بك تم رفضه" ,
                    "title_en":"booking update",
                    "title_ar":"تحديث بخصوص حجزك ",
                    "type":"BOOKING"
                }
                await Notif.create({...notif,resource:i.artist,target:i.client,booking:i.id});
                let reports = {
                    "action":" booking is Rejected",
                };
                await Report.create({...reports, user: user });
                await i.save();
            }
            //
            booking.endDateMillSec = Date.parse(validatedBody.endDate)
            booking.endDate = validatedBody.endDate
            console.log(validatedBody.endDate)
            booking.status = 'ACCEPTED';
            await booking.save();
            logger.info(` user ${req.user._id} accept booking  : ${bookingId}`);
            sendNotifiAndPushNotifi({
                targetUser: booking.client, 
                fromUser: booking.artist, 
                text: 'new notification',
                subject: booking.id,
                subjectType: 'your booking request has been accepted',
                info: 'booking'
            });
            let notif = {
                "description_en":'your booking request has been accepted',
                "description_ar":"طلب الحجز الخاص بك تم الموافقه عليه" ,
                "title_en":"booking update",
                "title_ar":"تحديث بخصوص الحجز ",
                "type":"BOOKING"
            }
            await Notif.create({...notif,resource:booking.artist,target:booking.client,booking:booking.id});
            let reports = {
                "action":" booking is Accepted",
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});

        }
        catch (err) {
            logger.error(` err  : ${err}`);
            next(err);
        }
    },
    async acceptSocket(socket,nsp,data){ 
        
        try {
            logger.info(`accept booking socket data  : ${data}`);
            let theLang = data.lang?data.lang:"ar"
            convertLangSocket(theLang)
            let lang = i18n.getLocale(theLang) 
            var userId = data.userId;
            var toRoom = 'room-'+userId;
            Booking.findById(data.booking).populate(populateQuery).then(async(booking)=>{
                if(booking.status == 'COMPLETED' ){
                    nsp.to(toRoom).emit('AcceptRequest', {data:i18n.__('notAllow')});
                }else{
                    
                    Booking.findByIdAndUpdate(data.booking,{status:'ACCEPTED',endDate:data.endDate,endDateMillSec:Date.parse(data.endDate)},{new:true}).then(async(booking)=>{
                        console.log('done')
                        logger.info(` artist ${data.artist} accept booking  : ${data.booking}`);
                        let index = await transformBookingById(booking,lang)
                        //booking in the same duration 
                        let oldBookings = await Booking.find({
                            deleted: false,
                            artist: booking.artist,
                            startDateMillSec: {$gte :Date.parse(booking.startDate) , $lte : Date.parse(data.endDate) }
                        })
                        for (let i of oldBookings) {
                            i.status = "REJECTED";
                            sendNotifiAndPushNotifi({
                                targetUser: i.client, 
                                fromUser: i.artist, 
                                text: 'new notification',
                                subject: i.id,
                                subjectType: 'your booking request has been rejected',
                                info: 'booking'
                            });
                            let notif = {
                                "description_en":'your booking request has been rejected',
                                "description_ar":"طلب الحجز الخاص بك تم رفضه" ,
                                "title_en":"booking update",
                                "title_ar":"تحديث بخصوص حجزك ",
                                "type":"BOOKING"
                            }
                            await Notif.create({...notif,resource:i.artist,target:i.client,booking:i.id});
                            let reports = {
                                "action":" booking is Rejected",
                            };
                            await Report.create({...reports, user: i.artist });
                            await i.save();
                        }
                        //
                        //send notification to artist
                        sendNotifiAndPushNotifi({
                            targetUser: booking.client, 
                            fromUser: data.userId, 
                            text: 'BeautiNova',
                            subject: 'Your Booking Request Has Been Accepted',
                            subjectType: ' Booking Request',
                            info:'booking'
                        });
                        let notif = {
                            "description_en":'Your Booking Request Has Been Accepted',
                            "description_ar":'طلب الحجز الخاص بك تم قبوله',
                            "title_en":'Booking Request Accepted',
                            "title_ar":'طلب الحجز تم قبوله',
                            "type":"BOOKING"
                        }
                        Notif.create({...notif,resource:data.userId,target:booking.client,booking:booking._id});
                        let reports = {
                            "action":"Artist Accept booking",
                        };
                        Report.create({...reports, user: userId });
                        let toClient = 'room-'+booking.client 
                        nsp.to(toClient).emit('AcceptRequest', {success:true,booking:index});
                     }).catch((err)=>{
                        console.log(err);
                     })
                }
            }).catch(error=>{
                console.log(error);
                logger.info(` error  : ${error}`);
            })
        }catch (error) {
            logger.info(` error  : ${error}`);
            console.log(error);
        }
    },
    async complete(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","ARTIST"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let user = req.user;
            let { bookingId } = req.params;
            let booking = await checkExistThenGet(bookingId, Booking, { deleted: false });
            //artist is not the artist of booking
            if(req.user.type =="ARTIST" && req.user._id != booking.artist)
                return next(new ApiError(403, i18n.__('notAllow')));
            booking.status = 'COMPLETED';
            let closeDate = moment(new Date()).add(1, 'd').format()
            booking.closeDateMillSec = Date.parse(closeDate)
            booking.closeDate = closeDate
            await booking.save();
            logger.info(` user ${data.artist} complete booking  : ${bookingId}`);
            if(booking.type ==="CLIENT-BOOKING"){
                sendNotifiAndPushNotifi({
                    targetUser: booking.client, 
                    fromUser: booking.artist, 
                    text: 'new notification',
                    subject: booking.id,
                    subjectType: 'your booking request has been completed',
                    info: 'booking'
                });
                let notif = {
                    "description_en":'your booking request has been completed',
                    "description_ar":"طلب الحجز الخاص بك تم اكتماله" ,
                    "title_en":"booking update",
                    "title_ar":"تحديث بخصوص حجزك ",
                    "type":"BOOKING"
                }
                await Notif.create({...notif,resource:booking.artist,target:booking.client,booking:booking.id});
            }
            let reports = {
                "action":" booking is Completed",
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
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            
            let user = req.user;
            let { bookingId } = req.params;
            let booking = await checkExistThenGet(bookingId, Booking, { deleted: false });
            booking.deleted = true;
            await booking.save();
            let reports = {
                "action":"Delete booking",
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
    async addArtistNote(req, res, next) {
        try {
            convertLang(req)
            let { bookingId } = req.params;
            let booking = await checkExistThenGet(bookingId, Booking, { deleted: false });
            //client is not the owner of booking
            if(req.user.type =="USER" && req.user._id != booking.client)
                return next(new ApiError(403, i18n.__('notAllow')));
            let arr = booking.artistNotes;
            arr.push(req.body.artistNotes);
            booking.artistNotes = arr;
            await booking.save();
            logger.info(` user ${req.user._id} add notes to booking: ${bookingId}`);
            res.status(200).send({success: true});
        }
        catch (err) {
            next(err);
        }
    },
    async completedDay(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","ARTIST"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let user = req.user;
            let startDate = req.body.date +'T00:00:00.000Z';
            let endDate = req.body.date +'T23:59:00.000Z';
            if(!await CompletedDay.findOne({deleted: false,
                artist: req.user._id,
                date:{$gte:new Date(startDate),$lte:new Date(endDate)}})){
                await CompletedDay.create({
                    artist: req.user._id,
                    date: req.body.date
                })
                let reports = {
                    "action":"Make day completed",
                };
                await Report.create({...reports, user: user });
            }
            logger.info(` artist ${req.user._id} close day  : ${req.body.date}`);
            res.status(200).send({success: true});
        }
        catch (err) {
            next(err);
        }
    },
    async openDay(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","ARTIST"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let user = req.user;
            let startDate = req.body.date +'T00:00:00.000Z';
            let endDate = req.body.date +'T23:59:00.000Z';
            if(await CompletedDay.findOne({deleted: false,artist: req.user._id,date:{$gte:new Date(startDate),$lte:new Date(endDate)}})){
                let theDay = await CompletedDay.findOne({deleted: false,artist: req.user._id,date:{$gte:new Date(startDate),$lte:new Date(endDate)}})
                theDay.deleted = true
                await theDay.save();
                let reports = {
                    "action":"Make day completed",
                };
                await Report.create({...reports, user: user });
            }
            logger.info(` artist ${req.user._id} open day  : ${req.body.date}`);
            res.status(200).send({success: true});
        }
        catch (err) {
            next(err);
        }
    },
    async calendar(req, res, next) {
        try {
            let {artistId} = req.params;
            convertLang(req)
            let {startDate} = req.query;
            if(!startDate) startDate = new Date();
            var begin = moment(startDate).format("YYYY-MM-01");
            var end = moment(startDate).format("YYYY-MM-") + moment(startDate).daysInMonth();
            end = end +'T23:59:59.000Z'
            console.log(begin)
            console.log(end)
            logger.info(` begin  : ${begin}`);
            logger.info(` end  : ${end}`);
            let booking = await Booking.find({
                deleted: false,
                artist:artistId,
                startDateMillSec:{$gte :Date.parse( begin) , $lte : Date.parse(end) },
                status:{$in:['ACCEPTED','COMPLETED']}
            }).distinct('startDate')
            logger.info(` booking  : ${booking}`);
            let completedDays = await CompletedDay.find({deleted: false,artist:artistId}).distinct('date')
            res.status(200).send({
                success: true,
                bookingDays:booking,
                completedDays:completedDays
            });

        }
        catch (err) {
            next(err);
        }
    },
    async dayBooking(req, res, next) {
        try {
            let {artistId} = req.params;
            convertLang(req)
            let {startDate} = req.query;
            let d1 = moment(startDate).format('YYYY-MM-DD')
            let startDay = d1 +'T00:00:00.000Z'
            let endDay = d1 +'T23:59:59.000Z'
            let booking = await Booking.find({
                deleted: false,
                artist:artistId,
                startDateMillSec:{$gte :Date.parse( startDay) , $lte : Date.parse(endDay) },
                status:{$in:['ACCEPTED','COMPLETED']}
            }).select('startDate endDate').sort({startDate:1})
            console.log(booking)
            logger.info(` booking  : ${booking}`);
            let times = []
            let start = 0
            for (let i = 0; i < booking.length; i++) {
                let hour = moment(booking[i].startDate).hour()//2
                console.log(hour)
                logger.info(` hour  : ${hour}`);
                let startMinute = moment(booking[i].startDate).minutes()
                console.log(startMinute)
                logger.info(` startMinute  : ${startMinute}`);
                if(startMinute < 9){
                    startMinute = '0'+startMinute
                }
                let endMinute = moment(booking[i].endDate).minutes()
                console.log(endMinute)
                logger.info(` endMinute  : ${endMinute}`);
                if(endMinute < 9){
                    endMinute = '0'+endMinute
                }
                if(start == 0){
                    let theStart = start
                    if(theStart < 9){
                        theStart = '0'+theStart
                    }
                    let time ={
                        status:'EMPTY',
                        start:theStart+ ':00',
                        end :moment(booking[i].startDate).format('HH')  + ':'+ startMinute
                    }
                    times.push(time);
                    let timeFull ={
                        status:'FULL',
                        start:moment(booking[i].startDate).format('HH')  + ':'+ startMinute,
                        end :moment(booking[i].endDate).format('HH')  + ':'+ endMinute
                    }
                    times.push(timeFull);
                    start = moment(booking[i].endDate).hour()
                }else{
                    console.log("start",start)
                    logger.info(` start  : ${start}`);
                    console.log("hour",hour)
                    logger.info(` hour  : ${hour}`);
                    let theHour = hour
                    if(theHour < 9){
                        theHour = '0'+theHour
                    }
                    if(start == hour){
                        let time ={
                            status:'FULL',
                            start:theHour + ':'+startMinute,
                            end :moment(booking[i].endDate).format('HH')  + ':'+ endMinute
                        }
                        times.push(time);
                        start = moment(booking[i].endDate).hour()
                    }else{
                        let theStart = start
                        if(theStart < 9){
                            theStart = '0'+theStart
                        }
                        let time ={
                            status:'EMPTY',
                            start:theStart  + ':00',
                            end :moment(booking[i].startDate).format('HH') + ':'+ startMinute
                        }
                        let timeFull ={
                            status:'FULL',
                            start:moment(booking[i].startDate).format('HH')  + ':'+ startMinute,
                            end :moment(booking[i].endDate).format('HH')  + ':'+ endMinute
                        }
                        times.push(time);
                        times.push(timeFull);
                        start = moment(booking[i].endDate).hour()
                    }
                }
                console.log(booking.length)
                logger.info(` booking.length  : ${booking.length}`);
                console.log(i)
                logger.info(` i  : ${i}`);
                if(i==booking.length -1){
                    let theStart = start
                    if(theStart < 9){
                        theStart = '0'+theStart
                    }
                    let time ={
                        status:'EMPTY',
                        start:theStart  + ':'+ startMinute,
                        end :'23:59'
                    }
                    times.push(time);
                }
            }
            res.status(200).send(times);

        }
        catch (err) {
            next(err);
        }
    },
    async dayBookingSocket(socket,data,nsp) {
        try {
            let artistId = data.artistId
            let theLang = data.lang?data.lang:"ar"
            convertLangSocket(theLang)
            let lang = i18n.getLocale(theLang) 
            var userId = data.userId;
            var toRoom = 'room-'+userId;
            let startDate = data.startDate?data.startDate:new Date();
            let d1 = moment(startDate).format('YYYY-MM-DD')
            let startDay = d1 +'T00:00:00.000Z'
            let endDay = d1 +'T23:59:59.000Z'
            let booking = await Booking.find({
                deleted: false,
                artist:artistId,
                startDateMillSec:{$gte :Date.parse( startDay) , $lte : Date.parse(endDay) },
                status:{$in:['ACCEPTED','COMPLETED']}
            }).select('startDate endDate').sort({startDate:1})
            console.log(booking)
            let times = []
            let start = 0
            for (let i = 0; i < booking.length; i++) {
                let hour = moment(booking[i].startDate).format('HH')//2
                console.log(hour)
                let startMinute = moment(booking[i].startDate).minutes()
                console.log(startMinute)
                if(startMinute < 9){
                    startMinute = '0'+startMinute
                }
                let endMinute = moment(booking[i].endDate).minutes()
                console.log(endMinute)
                if(endMinute < 9){
                    endMinute = '0'+endMinute
                }
                if(start == 0){
                    let time ={
                        status:'EMPTY',
                        start:start+ ':00',
                        end :moment(booking[i].startDate).format('HH')  + ':'+ startMinute
                    }
                    times.push(time);
                    let timeFull ={
                        status:'FULL',
                        start:moment(booking[i].startDate).format('HH')  + ':'+ startMinute,
                        end :moment(booking[i].endDate).format('HH')  + ':'+ endMinute
                    }
                    times.push(timeFull);
                    start = moment(booking[i].endDate).format('HH')
                }else{
                    console.log("start",start)
                    console.log("hour",hour)

                    if(start == hour){
                        let time ={
                            status:'FULL',
                            start:hour + ':'+startMinute,
                            end :moment(booking[i].endDate).format('HH')  + ':'+ endMinute
                        }
                        times.push(time);
                        start = moment(booking[i].endDate).format('HH')
                    }else{
                        let time ={
                            status:'EMPTY',
                            start:start  + ':00',
                            end :moment(booking[i].startDate).format('HH') + ':'+ startMinute
                        }
                        let timeFull ={
                            status:'FULL',
                            start:moment(booking[i].startDate).format('HH')  + ':'+ startMinute,
                            end :moment(booking[i].endDate).format('HH')  + ':'+ endMinute
                        }
                        times.push(time);
                        times.push(timeFull);
                        start = moment(booking[i].endDate).format('HH')
                    }
                }
                console.log(booking.length)
                console.log(i)
                if(i==booking.length -1){
                    let time ={
                        status:'EMPTY',
                        start:start  + ':'+ startMinute,
                        end :'23:59'
                    }
                    times.push(time);
                }
            }
            nsp.to(toRoom).emit('DayTimes', {data:times});
        } catch (error) {
            console.log(error);
        }
    },
};