import ApiResponse from "../../helpers/ApiResponse";
import Problem from "../../models/problem/problem.model";
import Report from "../../models/reports/report.model";
import ApiError from '../../helpers/ApiError';
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import Notif from "../../models/notif/notif.model"
import User from "../../models/user/user.model";
import { checkExist, checkExistThenGet, isImgUrl ,isInArray} from "../../helpers/CheckMethods";
import { checkValidations,convertLang } from "../shared/shared.controller";
import { body } from "express-validator/check";
import i18n from "i18n";
import Logger from "../../services/logger";
const logger = new Logger('problem '+ new Date(Date.now()).toDateString())
const populateQuery = [
    
    {
        path: 'user', model: 'user',
    },
    {
        path: 'review', model: 'rate',
        populate: { 
            path: 'user', model: 'user' ,
        },
    },
   
];
export default {
    validateBody(isUpdate = false) {
        let validations = [
            body('problemType').not().isEmpty().withMessage((value, { req}) => {
                return req.__('problemType.required', { value});
            }),
            body('description').not().isEmpty().withMessage((value, { req}) => {
                return req.__('description.required', { value});
            }),
            body('review').optional()
            .isNumeric().withMessage((value, { req}) => {
                return req.__('review.numeric', { value});
            })
            

        ];
        if (isUpdate)
        validations.push([
            body('img').optional().custom(val => isImgUrl(val)).withMessage((value, { req}) => {
                return req.__('img.syntax', { value});
            })
        ]);
        return validations;
    },

    async create(req, res, next) {

        try {
            convertLang(req)
            let user = req.user;    
            const validatedBody = checkValidations(req);
            validatedBody.user = req.user._id;
            if(validatedBody.review){
                validatedBody.relatedTo = "REVIEW"
            }
                
            let createdProblem = await Problem.create({ ...validatedBody});
            logger.info(`create problem   ${createdProblem.id}`);
            let users = await User.find({'type':['ADMIN','SUB-ADMIN']});
            users.forEach(async(user) => {
                sendNotifiAndPushNotifi({
                    targetUser: user.id, 
                    fromUser: req.user._id, 
                    text: 'Beauti Nova',
                    subject: createdProblem,
                    subjectType: 'New Report',
                    info:'problem'
                });
                let notif = {
                    "description_en":'New Report',
                    "description_ar":'بلاغ جديد',
                    "title_ar":"  بلاغ جديد",
                    "title_en":"New Report",
                    "type":"PROBLEM"
                }
                await Notif.create({...notif,resource:req.user._id,target:user.id,problem:createdProblem.id});
            })
            let reports = {
                "action":"Create Problem",
            };
            await Report.create({...reports, user: user });
            res.status(201).send({success: true});
        } catch (err) {
            next(err);
        }
    },

    async update(req, res, next) {

        try {
            convertLang(req)
            let user = req.user;
            let { ProblemId } = req.params;
            await checkExist(ProblemId, Problem, { deleted: false });

            const validatedBody = checkValidations(req);
            await Problem.findByIdAndUpdate(ProblemId, {
                ...validatedBody,
            }, { new: true });
            let reports = {
                "action":"Update Problem",
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
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let { ProblemId } = req.params;
            let problem = await checkExistThenGet(ProblemId, Problem, { deleted: false });
            problem.deleted = true;
            await problem.save();
            let reports = {
                "action":"Delete Problem",
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
    async reply(req, res, next) { 
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
                
            let { ProblemId } = req.params;
            let problem = await checkExistThenGet(ProblemId, Problem, { deleted: false });
            problem.reply = true;
            problem.replyText = req.body.replyText;
            problem.replyDateMillSec = Date.parse(new Date())
            await problem.save();
            sendNotifiAndPushNotifi({
                targetUser: problem.user, 
                fromUser: req.user._id, 
                text: 'Beautinova Community Guidelines ',
                subject: problem.id,
                subjectType: req.body.replyText,//' BeautiNova reply on your Complaint',
                info:'problem'
            });
            let notif = {
                "description_en":req.body.replyText,
                "description_ar":req.body.replyText,
                "title_ar":"Beautinova Community Guidelines ",
                "title_en":"Beautinova Community Guidelines ",
                "type":"PROBLEM"

            }
            Notif.create({...notif,resource:req.user._id,target:problem.user,problem:problem.id});
            let reports = {
                "action":'reply on Problem'
            };
            await Report.create({...reports, user: user });
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },

    async getAllPaginated(req, res, next) {
        try {    
            convertLang(req)
            let lang = i18n.getLocale(req)       
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let {user,review,relatedTo,search} = req.query;
            let query = { deleted: false };
            if(user) query.user = user
            if(relatedTo) query.relatedTo = relatedTo
            if(review) query.review = review
            if(search) {
                Object.assign(query, {
                    $and: [
                        { $or: [
                            {description: { $regex: '.*' + search + '.*' , '$options' : 'i'  }}, 
                            {problemType: { $regex: '.*' + search + '.*', '$options' : 'i'  }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                }
                )
            }
            await Problem.find(query).populate(populateQuery)
                .limit(limit)
                .skip((page - 1) * limit).sort({ _id: -1 })
                .then(async (data) => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push(e)
                    })
                    const count = await Problem.countDocuments({deleted: false });
                    const pageCount = Math.ceil(count / limit);
                    res.send(new ApiResponse(newdata, page, pageCount, limit, count, req));
                })
        } catch (error) {
            next(error);
        }
    },
    async getAll(req, res, next) {
        try {    
            convertLang(req)
            let lang = i18n.getLocale(req)  
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let {user,review,relatedTo,search} = req.query;
            let query = { deleted: false };
            if(user) query.user = user
            if(relatedTo) query.relatedTo = relatedTo
            if(review) query.review = review
            if(search) {
                Object.assign(query, {
                    $and: [
                        { $or: [
                            {description: { $regex: '.*' + search + '.*' , '$options' : 'i'  }}, 
                            {problemType: { $regex: '.*' + search + '.*', '$options' : 'i'  }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                }
                )
            }
            await Problem.find(query).populate(populateQuery).sort({ _id: -1 })
                .then(async (data) => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push(e)
                    })
                    res.send({success: true,data:newdata});
                })
        } catch (error) {
            next(error);
        }
    },
    async getById(req, res, next) {
        try {    
            convertLang(req)
            let lang = i18n.getLocale(req)     
            let {ProblemId} = req.params
            await Problem.findById(ProblemId).populate(populateQuery)
                .then(async (e) => {
                    let index = e 
                    res.send({success: true,data:index});
                })
        } catch (error) {
            next(error);
        }
    },



}