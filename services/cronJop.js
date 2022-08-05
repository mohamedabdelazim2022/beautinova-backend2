import Schedule from 'node-schedule';
import Post from "../models/post/post.model";
import { sendNotifiAndPushNotifi } from "../services/notification-service";
import Notif from "../models/notif/notif.model";
import User from "../models/user/user.model";
import Like from "../models/like/like.model";
import Favourite from "../models/favourite/favourite.model";
import moment from 'moment';
import Logger from "../services/logger";
const logger = new Logger('cronJop '+ new Date(Date.now()).toDateString())
export function cronJop() {
    try { //    */2 * * * *
        //sec min hour day month year
        let before1Date = moment(moment(), "YYYY-MM-DD").add(-1, 'days');
        let before3Date = moment(moment(), "YYYY-MM-DD").add(-3, 'days');
        //
        let now = moment()
        let before7Date = moment(moment(), "YYYY-MM-DD").add(-6, 'days');
        let before6Date = moment(moment(), "YYYY-MM-DD").add(-5, 'days');
        Schedule.scheduleJob('*/10 * * * * *', async function(){
            Post.find({deleted:false,notifsDate:{$gte:before3Date,$lte:before1Date},sendDailyNotif:true})
            .then(async(data)=>{
                data.map(async(e) =>{
                    Post.findByIdAndUpdate(e._id,{sendDailyNotif:false},{new:true}).then((thePost)=>{
                        console.log('done update Post')
                        
                    }).catch((err)=>{
                        console.log(err);
                    })
                })
            })
            Post.find({deleted:false,sendDailyNotif:false})
            .then(async(data)=>{
                data.map(async(e) =>{
                    let likesCount = await Like.countDocuments({post:e._id,createdAt: { $gte : new Date(before1Date), $lt : new Date(now) }})
                    Post.findByIdAndUpdate(e._id,{notifsDate:new Date(),sendDailyNotif:true},{new:true}).then((thePost)=>{
                        if(likesCount> 10){
                            console.log('done update Post')
                            logger.info(`done update Post : ${thePost.id}`);
                            sendNotifiAndPushNotifi({
                                targetUser: thePost.owner, 
                                fromUser: thePost.owner, 
                                text: 'Post Interactions',
                                subject: thePost._id,
                                subjectType: likesCount+ '< number of combined likes on all posts that happened during previous day > users liked your posts',
                                info:'like'
                            });
                            let notif = {
                                "description_en":likesCount+ '< number of combined likes on all posts that happened during previous day > users liked your posts',
                                "description_ar":' من الاعجابات خلال اليوم الماضى '+likesCount+ ' لديك عدد  ',
                                "title_en":"تفاعلات المنشورات",
                                "title_ar":"Post Interactions",
                                "type":"LIKE"
                            
                            }
                            Notif.create({...notif,resource:thePost.owner,target:thePost.owner,like:like._id});
                        }
                    }).catch((err)=>{
                        console.log(err);
                    })
                })
            })
            //artist weekly notif
            User.find({deleted:false,notifsDate:{$gte:before7Date,$lte:before6Date},type:'ARTIST',sendWeeklyNotif:true})
            .then(async(data)=>{
                
                data.map(async(e) =>{
                    var now = moment();//now
                    var notifsDate = moment(e.notifsDate);
                    let days = now.diff(notifsDate, 'days');
                    console.log("artist id : ",e.id,' days : ',days)
                    if(days == 7){
                        User.findByIdAndUpdate(e._id,{sendWeeklyNotif:false},{new:true}).then((theUser)=>{
                            console.log("artist id : ",e.id,' done update artist ')
                            
                        }).catch((err)=>{
                            console.log(err);
                        })
                    }
                })
            })
            User.find({deleted:false,sendWeeklyNotif:false,type:'ARTIST'})
            .then(async(data)=>{
                data.map(async(e) =>{
                    let favCount = await Favourite.countDocuments({favPerson:e._id,createdAt: { $gte : before7Date, $lte : now }})
                    User.findByIdAndUpdate(e._id,{notifsDate:new Date(),sendWeeklyNotif:true},{new:true}).then((theUser)=>{
                        if(favCount> 10){
                            console.log('done update user',theUser.id);
                            logger.info(`done update user : ${theUser.id}`);
                            sendNotifiAndPushNotifi({
                                targetUser: theUser.id, 
                                fromUser: theUser.id, 
                                text: 'Your Profile Interactions',
                                subject: theUser.id,
                                subjectType: favCount +' <number of combined likes on the profile that happened during the previous week> users liked your profile during the last week',
                                info:'app'
                            });
                            let notif = {
                                "description_en":favCount +' <number of combined likes on the profile that happened during the previous week> users liked your profile during the last week',
                                "description_ar":'مستخدمين اعجبهم حسابك خلال الأسبوع الماضي ' + favCount,
                                "title_ar":"تفاعلات حسابك",
                                "title_en":"Your Profile Interactions",
                                "type":"APP"
                            
                            }
                            Notif.create({...notif,resource:theUser.id,target:theUser.id});
                        }
                    }).catch((err)=>{
                        console.log(err);
                    })
                })
            })
        });
    } catch (error) {
        throw error;
    }

}