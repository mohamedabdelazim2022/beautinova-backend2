import Question from "../../models/questions/questions.model";
import Report from "../../models/reports/report.model";
import ApiError from '../../helpers/ApiError';
import { checkExist, checkExistThenGet,isInArray } from "../../helpers/CheckMethods";
import { checkValidations,convertLang } from "../shared/shared.controller";
import { body } from "express-validator/check";
import ApiResponse from "../../helpers/ApiResponse";
import i18n from "i18n";

export default {
//get with pagenation
    async findAll(req, res, next) {

        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20,
            {visible}=req.query;
            let query = {deleted: false };
            if(visible == "true") query.visible = true
            if(visible == "false") query.visible = false
            await Question.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit)
                .then(async (data) => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push({
                            question:lang=="ar"?e.question_ar:e.question_en,
                            answer: lang=="ar"?e.answer_ar:e.answer_en,
                            answer_ar:e.answer_ar,
                            answer_en:e.answer_en,
                            question_en:e.question_en,
                            question_ar:e.question_ar,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    const questionsCount = await Question.countDocuments(query);
                    const pageCount = Math.ceil(questionsCount / limit);

                    res.send(new ApiResponse(newdata, page, pageCount, limit, questionsCount, req));
                })
            
        } catch (err) {
            next(err);
        }
    },
    //get without pagenation
    async getAll(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let{visible}=req.query;
            let query = {deleted: false };
            if(visible == "true") query.visible = true
            if(visible == "false") query.visible = false
            
            
            await Question.find(query)
                .then( data => {
                    var newdata = [];
                    data.map(async(e) =>{
                        
                        newdata.push({
                            question:lang=="ar"?e.question_ar:e.question_en,
                            answer: lang=="ar"?e.answer_ar:e.answer_en,
                            answer_ar:e.answer_ar,
                            answer_en:e.answer_en,
                            question_en:e.question_en,
                            question_ar:e.question_ar,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    res.send({
                        success:true,
                        questions:newdata
                    });
                })
        } catch (err) {
            next(err);
        }
    },

    validateBody(isUpdate = false) {
        let validations = [
            body('question_ar').not().isEmpty().withMessage((value, { req}) => {
                return req.__('question_ar.required', { value});
            }),
            body('question_en').not().isEmpty().withMessage((value, { req}) => {
                return req.__('question_en.required', { value});
            }),
            body('answer_ar').not().isEmpty().withMessage((value, { req}) => {
                return req.__('answer_ar.required', { value});
            }),
            body('answer_en').not().isEmpty().withMessage((value, { req}) => {
                return req.__('answer_en.required', { value});
            }),
        ];
        
        return validations;
    },

    async create(req, res, next) {

        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
    
            const validatedBody = checkValidations(req);
           
            let createdquestions = await Question.create({ ...validatedBody});

            let reports = {
                "action":"Create Question ",
            };
              await Report.create({...reports, user: user });
            res.status(200).send({success: true,question:createdquestions});
        } catch (err) {
            next(err);
        }
    },

    async update(req, res, next) {

        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));

            let { questionsId } = req.params;
            await checkExist(questionsId, Question, { deleted: false });

            const validatedBody = checkValidations(req);
            let updatedquestions = await Question.findByIdAndUpdate(questionsId, {
                ...validatedBody,
            }, { new: true });
            let reports = {
                "action":"Update Question ",
            };
              await Report.create({...reports, user: user });
            res.status(200).send({success: true,question:updatedquestions});
        }
        catch (err) {
            next(err);
        }
    },
   
    async delete(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
                
            let { questionsId } = req.params;
            let questions = await checkExistThenGet(questionsId, Question, { deleted: false });
            questions.deleted = true;
            await questions.save();
            
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
    async visible(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
                
            let { questionsId } = req.params;
            let questions = await checkExistThenGet(questionsId, Question, { deleted: false });
            questions.visible = true;
            await questions.save();
            
            res.status(200).send({success:true});

        }
        catch (err) {
            next(err);
        }
    },
    async hidden(req, res, next) {
        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
                
            let { questionsId } = req.params;
            let questions = await checkExistThenGet(questionsId, Question, { deleted: false });
            questions.visible = false;
            await questions.save();
            
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
};