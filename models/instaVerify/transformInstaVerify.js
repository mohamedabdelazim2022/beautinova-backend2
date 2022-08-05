import { isInArray } from "../../helpers/CheckMethods";
import i18n from "i18n";
import moment from 'moment';

export async function transformInstaVerify(e) {
    let value = {
        status:e.status,
        reply:e.reply,
        instaUserName:e.instaUserName,
        id:e._id,
    }
    
    if(e.user){
        let index={
            fullname:e.user.fullname,
            username:e.user.username,
            img:e.user.img,
            id:e.user._id,
        }
        value.user = index
    }
    return value
}
