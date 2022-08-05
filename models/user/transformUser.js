import { isInArray } from "../../helpers/CheckMethods";
import i18n from "i18n";
import moment from 'moment';


export async function transformUser(e,lang,myUser,userId) {
    let index={
        fullname:e.fullname,
        username:e.username,
        verify:e.verify,
        phoneVerify:e.phoneVerify,
        emailVerify:e.emailVerify,
        instaVerify:e.instaVerify,
        instaUserName:e.instaUserName,
        favCount:e.favCount,
        isFavourite:userId?isInArray(myUser.favourite,e._id):false,
        img:e.img,
        email:e.email,
        phone:e.phone,
        bio:e.bio,
        type:e.type,
        active:e.active,
        online:e.online,
        lastSeen:e.lastSeen,
        createdAt:e.createdAt,
        id:e._id,
    }
    if(e.type == "SUB-ADMIN" && e.permission){
        index.permission = {
            permission:lang=="ar"?e.permission.permission_ar:e.permission.permission_en,
            page:e.permission.page,
            id:e.permission._id
        }
    }
    if(e.type == "ARTIST"){
        index.rate = e.rate;
        index.rateNumbers =e.rateNumbers;
        index.rateCount =e.rateCount;
        index.verify =e.verify;
        index.studio = e.studio
    }
    if(e.country){
        index.country = {
            countryName_en:e.country.countryName_en,
            countryName_ar:e.country.countryName_ar,
            img:e.country.img,
            id:e.country._id
        }
    }
    return index
}
export async function transformUserById(e,lang,myUser,userId){
    let index={
        fullname:e.fullname,
        balance:e.balance,
        username:e.username,
        verify:e.verify,
        phoneVerify:e.phoneVerify,
        emailVerify:e.emailVerify,
        instaVerify:e.instaVerify,
        instaUserName:e.instaUserName,
        usedCoupons:e.usedCoupons,
        isFavourite:userId?isInArray(myUser.favourite,e._id):false,
        img:e.img,
        bio:e.bio,
        email:e.email,
        phone:e.phone,
        type:e.type,
        accountType:e.accountType,
        street:e.street,
        placeType:e.placeType,
        floor:e.floor,
        apartment:e.apartment,
        active:e.active,
        online:e.online,
        lastSeen:e.lastSeen,
       
        createdAt:e.createdAt,
        id:e._id,
    }
    if(e.type == "SUB-ADMIN" && e.permission){
        index.permission = {
            permission:lang=="ar"?e.permission.permission_ar:e.permission.permission_en,
            page:e.permission.page,
            id:e.permission._id
        }
    }
    if(e.type == "ARTIST"){
        index.rate = e.rate;
        index.rateNumbers =e.rateNumbers;
        index.rateCount =e.rateCount;
        index.viewsCount =e.viewsCount;
        index.favCount =e.favCount;
        index.verify =e.verify;
        index.studio = e.studio
    }
    if(e.country){
        index.country = {
            countryName_en:e.country.countryName_en,
            countryName_ar:e.country.countryName_ar,
            img:e.country.img,
            id:e.country._id
        }
    }
    if(e.city){
        index.city = {
            cityName_en:e.city.cityName_en,
            cityName_ar:e.city.cityName_ar,
            delivaryCost:e.city.delivaryCost,
            id:e.city._id
        }
    }
    if(e.area){
        index.area = {
            areaName_en:e.area.areaName_en,
            areaName_ar:e.area.areaName_ar,
            delivaryCost:e.area.delivaryCost,
            id:e.area._id
        }
    }
    /*services*/
    let services=[]
    for (let val of e.services) {
        services.push({
            service:{ 
                categoryName_ar:val.service.categoryName_ar,
                categoryName_en:val.service.categoryName_en,
                type:val.service.type,
                img:val.service.img,
                id:val.service._id
            },
            price:val.price
        })
    }
    index.services = services
    return index
}


