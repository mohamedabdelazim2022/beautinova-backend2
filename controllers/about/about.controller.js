import ApiResponse from "../../helpers/ApiResponse";
import About from "../../models/about/about.model";
import Report from "../../models/reports/report.model";
import ApiError from '../../helpers/ApiError';
import { ValidationError } from "mongoose";
import i18n from "i18n";
import { checkExist, checkExistThenGet, isImgUrl , isLng, isLat ,isInArray} from "../../helpers/CheckMethods";
import { handleImg, checkValidations ,convertLang} from "../shared/shared.controller";
import { body } from "express-validator/check";
function validatedestination(location) {
    if (!isLng(location[0]))
        throw new ValidationError.UnprocessableEntity({ keyword: 'location', message: 'location[0] is invalid lng' });
    if (!isLat(location[1]))
        throw new ValidationError.UnprocessableEntity({ keyword: 'location', message: 'location[1] is invalid lat' });
}
export default {

    async findAll(req, res, next) {

        try {
            convertLang(req)
            let lang= i18n.getLocale(req)
            let query = {deleted: false };
            await About.find(query).then(async(data) => {
                let newdata = [];
                await Promise.all(data.map(async(e)=>{
                    let index = {
                        aboutUs:lang=="ar"?e.aboutUs_ar:e.aboutUs_en,
                        aboutUs_en:e.aboutUs_en,
                        aboutUs_ar:e.aboutUs_ar,
                        email:e.email,
                        address:e.address,
                        phone:e.phone,
                        id:e.id,
                    }
                    newdata.push(index)
                }))
                return res.send(newdata);
            })
        } catch (err) {
            next(err);
        }
    },

    validateBody(isUpdate = false) {
        let validations = [
            body('aboutUs_ar').not().isEmpty().withMessage((value, { req}) => {
                return req.__('aboutUs_ar.required', { value});
            }),
            body('aboutUs_en').not().isEmpty().withMessage((value, { req}) => {
                return req.__('aboutUs_en.required', { value});
            }),
            body('email').not().isEmpty().withMessage((value, { req}) => {
                return req.__('email.required', { value});
            }),
            body('address').not().isEmpty().withMessage((value, { req}) => {
                return req.__('address.required', { value});
            }),
            body('phone').not().isEmpty().withMessage((value, { req}) => {
                return req.__('phone.required', { value});
            }),
            
        ];
        return validations;
    },

    async create(req, res, next) {

        try {
            convertLang(req)
            let user = req.user;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));

            const validatedBody = checkValidations(req);
           
            let createdAbout = await About.create({ ...validatedBody});

            let reports = {
                "action":"Create About Us",
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
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
           
            let { aboutId } = req.params;
            await checkExist(aboutId, About, { deleted: false });
            const validatedBody = checkValidations(req);

            let updatedAbout = await About.findByIdAndUpdate(aboutId, {
                ...validatedBody,
            }, { new: true });
            let reports = {
                "action":"Update About Us",
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
            let { aboutId } = req.params;
            let about = await checkExistThenGet(aboutId, About, { deleted: false });
            about.deleted = true;
            await about.save();
            
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
};