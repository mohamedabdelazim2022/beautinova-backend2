import { isInArray } from "../../helpers/CheckMethods";
import i18n from "i18n";
import moment from 'moment';

export async function transformVerifyRequest(e) {
    let value = {
        status:e.status,
        reply:e.reply,
        img:e.img,
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
