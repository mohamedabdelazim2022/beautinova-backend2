import { isInArray } from "../../helpers/CheckMethods";
import i18n from "i18n";
import moment from 'moment';



export async function transformBooking(e,lang,myUser,userId) {
    let index = {
        status:e.status,
        clientName:e.clientName?e.clientName:"",
        id:e._id,
        personsCount:e.personsCount,
        notes:e.notes,
        artistNotes:e.artistNotes,
        type:e.type,
        date:e.date,
        time:e.time,
        startDateMillSec:e.startDateMillSec,
        endDateMillSec:e.endDateMillSec,
        startDate:e.startDate,
        endDate:e.endDate,
        reason:e.reason,
        destination:e.destination,
        address:e.address,
        placeType:e.placeType,
        city:e.city,
        area:e.area,
        
        
    }
    if(e.service){
        index.service = { 
            categoryName:lang=="ar"?e.service.categoryName_ar:e.service.categoryName_en,
            categoryName_ar:e.service.categoryName_ar,
            categoryName_en:e.service.categoryName_en,
            type:e.service.type,
            img:e.service.img,
            id:e.service._id
        }
    }
    if(e.client){
        index.client = {
            fullname:e.client.fullname,
            username:e.client.username,
            img:e.client.img,
            phone:e.client.phone,
            type:e.client.type,
            online:e.client.online,
            lastSeen:e.client.lastSeen,
            id:e.client._id,
        }
    }
    if(e.artist){
        let artist={
            fullname:e.artist.fullname,
            username:e.artist.username,
            isFavourite:userId?isInArray(myUser.favourite,e.owner._id):false,
            img:e.artist.img,
            phone:e.artist.phone,
            type:e.artist.type,
            online:e.artist.online,
            lastSeen:e.artist.lastSeen,
            rate:e.artist.rate,
            rateNumbers:e.artist.rateNumbers,
            rateCount:e.artist.rateCount,
            id:e.artist._id,
        }
        index.artist = artist
    }
    
    return index
}
export async function transformBookingById(e,myUser,userId) {
    let index = {
        status:e.status,
        id:e._id,
        type:e.type,
        clientName:e.clientName?e.clientName:"",
        personsCount:e.personsCount,
        notes:e.notes,
        artistNotes:e.artistNotes,
        date:e.date,
        time:e.time,
        startDateMillSec:e.startDateMillSec,
        endDateMillSec:e.endDateMillSec,
        startDate:e.startDate,
        endDate:e.endDate,
        reason:e.reason,
        destination:e.destination,
        address:e.address,
        placeType:e.placeType,
        city:e.city,
        area:e.area
        
    }
    if(e.service){
        index.service = { 
            categoryName:lang=="ar"?e.service.categoryName_ar:e.service.categoryName_en,
            categoryName_ar:e.service.categoryName_ar,
            categoryName_en:e.service.categoryName_en,
            type:e.service.type,
            img:e.service.img,
            id:e.service._id
        }
    }
    if(e.client){
        index.client = {
            fullname:e.client.fullname,
            username:e.client.username,
            img:e.client.img,
            phone:e.client.phone,
            type:e.client.type,
            online:e.client.online,
            lastSeen:e.client.lastSeen,
            id:e.client._id,
        }
    }
    if(e.artist){
        let artist={
            fullname:e.artist.fullname,
            username:e.artist.username,
            isFavourite:userId?isInArray(myUser.favourite,e.owner._id):false,
            img:e.artist.img,
            phone:e.artist.phone,
            type:e.artist.type,
            online:e.artist.online,
            lastSeen:e.artist.lastSeen,
            rate:e.artist.rate,
            rateNumbers:e.artist.rateNumbers,
            rateCount:e.artist.rateCount,
            id:e.artist._id,
        }
    
        index.artist = artist
    }
   return index
}
