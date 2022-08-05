import fs from 'fs';
import ApiError from '../../helpers/ApiError';
import { validationResult } from 'express-validator/check';
import { matchedData } from 'express-validator/filter';
import { toImgUrl } from '../../utils';
import i18n from "i18n";
import CompletedDay from "../../models/completedDay/completedDay.model"
import City from "../../models/city/city.model";
import User from "../../models/user/user.model";
import Area from "../../models/area/area.model";
function deleteTempImages(req) {
  if (req.file || req.files) {
    let files = req.file ? Array.from(req.file) : req.files;
    for (let file of files) {
      fs.unlink(file.path, function (err) {
        if (err) return console.log(err);
        // Under Experimental 
        console.log(file.filename + ' deleted successfully');
      });
    }
  }
}

export const localeFn = (localeName) => (value, { req }) => req.__(localeName);

export function checkValidations(req) {

  const validationErrors = validationResult(req).array({ onlyFirstError: true });

  if (validationErrors.length > 0) {
    //deleteTempImages(req);
    throw new ApiError(422, validationErrors);
  }

  return matchedData(req);
}


export async function handleImgs(req, { attributeName = 'images', isUpdate = false } = {}) {
  if (req.files && req.files.length > 0 || (isUpdate && req.body[attributeName])) { // .files contain an array of 'images'  
    let images = [];
    if (isUpdate && req.body[attributeName]) {
      if (Array.isArray(req.body[attributeName]))
        images = req.body[attributeName];
      else
        images.push(req.body[attributeName]);
    }

    for (const img of req.files) {
      images.push(await toImgUrl(img));
    }
    return images;
  }
  throw new ApiError.UnprocessableEntity(`${attributeName} are required`);
}

export async function handleImg(req, { attributeName = 'img', isUpdate = false } = {}) {
  if (req.file || (isUpdate && req.body[attributeName])) {
    return req.body[attributeName] || await toImgUrl(req.file);

  }


  throw new ApiError.UnprocessableEntity(`${attributeName} is required`);
}
export function distance(lat1, lon1, lat2, lon2, unit) {
  if ((lat1 == lat2) && (lon1 == lon2)) {
      return 0;
  }
  else {
      var radlat1 = Math.PI * lat1/180;
      var radlat2 = Math.PI * lat2/180;
      var theta = lon1-lon2;
      var radtheta = Math.PI * theta/180;
      var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
          dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 180/Math.PI;
      dist = dist * 60 * 1.1515;
      if (unit=="K") { dist = dist * 1.609344 }
      if (unit=="N") { dist = dist * 0.8684 }
      return dist;
  }
}
export async function convertLang(req) {
  i18n.setLocale(req.headers['accept-language'] ?req.headers['accept-language']:"en")
}
export async function convertLangSocket(lang) {
  i18n.setLocale(lang)
}
export async function validateAddBooking(data){
  
  let validate = []
  if(!data.artist){
    validate.push(i18n.__('artist.required'))
  }else{
    if(!await User.findOne({ _id: data.artist,deleted: false})){
      validate.push(i18n.__('artist.invalid'))
    }
  }
  if(data.userId){
    if(!await User.findOne({ _id: data.userId,deleted: false})){
      validate.push(i18n.__('client.invalid'))
    }
  }
  if(!data.service){
    validate.push(i18n.__('service.required'))
  }
  if(!data.personsCount){
    validate.push(i18n.__('personsCount.required'))
  }
  if(!data.city){
    validate.push(i18n.__('city.required'))
  }else{
    if(!await City.findOne({ _id: data.city,deleted: false})){
      validate.push(i18n.__('city.invalid'))
    }
  }
  
  if(!data.date){
    validate.push(i18n.__('date.required'))
  }
  if(!data.time){
    validate.push(i18n.__('time.required'))
  }
  if(data.startDate){
     //check if day not close
      let startCheckDate = data.date+'T00:00:00.000Z'
      let endCheckDate = data.date + 'T23:59:00.000Z'
      if(await CompletedDay.findOne({deleted: false,artist:data.artist,date:{$gte:startCheckDate,$lte:endCheckDate}})){
          validate.push(i18n.__('day.closed'))
      }
  }
  if(data.startDate && data.endDate){
    if(Date.parse(data.endDate) <= Date.parse(data.startDate)){
      validate.push(i18n.__('endDate.invalid'))
    }
  }
  if(!data.destination){
    validate.push(i18n.__('destination.required'))
  }
  if(!data.area){
    validate.push(i18n.__('area.required'))
  }else{
    if(!await Area.findOne({ _id: data.area,deleted: false})){
      validate.push(i18n.__('area.invalid'))
    }
  }
  // if(!data.street){
  //   validate.push(i18n.__('street.required'))
  // }
  if(!data.placeType){
    validate.push(i18n.__('placeType.required'))
  }
  // if(!data.floor){
  //   validate.push(i18n.__('floor.required'))
  // }
  // if(!data.apartment){
  //   validate.push(i18n.__('apartment.required'))
  // }

  let validated = []
  validate.forEach(id => {
    let msg ={
      "msg":id
    }
    validated.push(msg)
  }); 
  console.log("validated",validated)
  let errors = {
    "errors": {
        "success": false,
        "msg": validated
    }
  }
  if(validated.length == 0){
    return true
  }else{
    return errors
  }

}