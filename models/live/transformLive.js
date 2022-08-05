import { isInArray } from "../../helpers/CheckMethods";
import i18n from "i18n";
import moment from 'moment';


export async function transformLive(e,myUser) {
    let index = {
        title: e.title,
        id:e._id,
        description:e.description,
        bannar:e.bannar,
        status:e.status,
        streamKey:e.streamKey,
        videoId:e.videoId,
        startDate:e.startDate,
        endDate:e.endDate,
        startDateMillSec:e.startDateMillSec,
        endDateMillSec:e.endDateMillSec
    }
    
    if(e.owner){
        let owner={
            fullname:e.owner.fullname,
            bio:e.owner.bio,
            username:e.owner.username,
            isFavourite:isInArray(myUser.favourite,e.owner._id),
            img:e.owner.img,
            type:e.owner.type,
            online:e.owner.online,
            id:e.owner._id,
        }
        index.owner = owner
    }
    
    
   return index
}
export async function transformLiveById(e,myUser){
    let index = {
        title: e.title,
        id:e._id,
        description:e.description,
        bannar:e.bannar,
        status:e.status,
        streamKey:e.streamKey,
        videoId:e.videoId,
        startDate:e.startDate,
        endDate:e.endDate,
        startDateMillSec:e.startDateMillSec,
        endDateMillSec:e.endDateMillSec
    }
    
    if(e.owner){
        let owner={
            fullname:e.owner.fullname,
            username:e.owner.username,
            bio:e.owner.bio,
            isFavourite:isInArray(myUser.favourite,e.owner._id),
            img:e.owner.img,
            type:e.owner.type,
            online:e.owner.online,
            lastSeen:e.owner.lastSeen,
            rate:e.owner.rate,
            rateNumbers:e.owner.rateNumbers,
            rateCount:e.owner.rateCount,
            verify:e.owner.verify,
            id:e.owner._id,
        }
        index.owner = owner
    }
    return index
}
