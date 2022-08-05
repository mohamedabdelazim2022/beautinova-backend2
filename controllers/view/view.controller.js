import Report from "../../models/reports/report.model";
import ApiResponse from "../../helpers/ApiResponse";

import View from "../../models/viewing/viewing.model"
import User from "../../models/user/user.model";
import Product from "../../models/product/product.model";
import Post from "../../models/post/post.model";
import Compare from "../../models/compare/compare.model";

import { checkExistThenGet, isInArray} from "../../helpers/CheckMethods";
import {convertLang,convertLangSocket } from "../shared/shared.controller";
import i18n from "i18n";
import moment from "moment";
const populateQuery = [
    {
        path: 'artist', model: 'user',
        populate: { path: 'country', model: 'country' },
    },
    {
        path: 'artist', model: 'user',
        populate: { path: 'city', model: 'city' },
    },
    {
        path: 'artist', model: 'user',
        populate: { path: 'area', model: 'area' },
    },
    {
        path: 'artist', model: 'user',
        populate: { path: 'services.service', model: 'category' },
    },
    {
        path: 'user', model: 'user',
        populate: { path: 'country', model: 'country' },
    },
    {
        path: 'user', model: 'user',
        populate: { path: 'city', model: 'city' },
    },
    {
        path: 'user', model: 'user',
        populate: { path: 'area', model: 'area' },
    },
    {
        path: 'user', model: 'user',
        populate: { path: 'services.service', model: 'category' },
    },
    {
        path: 'product', model: 'product',
        populate: { path: 'category', model: 'category' }
    },
    {
        path: 'product', model: 'product',
        populate: { path: 'subCategory', model: 'category' }
    },
    {
        path: 'product', model: 'product',
        populate: { path: 'sizes.size', model: 'size' }
    },
    {
        path: 'product', model: 'product',
        populate: { path: 'color', model: 'color' }
    },
    {
        path: 'product', model: 'product',
        populate: { path: 'brand', model: 'brand' }
    },
];
const populateQuery2 = [
    {
        path: 'country', model: 'country',
    },
    {
        path: 'city', model: 'city',
    },
    {
        path: 'area', model: 'area',
    },
    {
        path: 'services.service', model: 'category',
    },
];
export default {
    //get with pagenation
    async findAll(req, res, next) {

        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20,
            {product,artist,user}=req.query;
            let query = {deleted: false };
            if(product) query.product = product
            if(artist) query.artist = artist
            if(user) query.user = user
            console.log(query)
            let views = await View.find(query).populate(populateQuery)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit)
            const count = await View.countDocuments(query);
            const pageCount = Math.ceil(count / limit);
            res.send(new ApiResponse(views, page, pageCount, limit, count, req)); 
            
        } catch (err) {
            next(err);
        }
    },
    
    //view  info
    async view(io, nsp, data) { 
        try {
            var userId = data.userId;
            var viewOnId = data.viewOnId;
            var relatedTo = data.relatedTo?data.relatedTo:'PRODUCT';
            let theLang = data.lang?data.lang:"ar"
            let startDate = Date.parse(data.startDate)?Date.parse(data.startDate):Date.parse(new Date())
            let endDate = Date.parse(data.endDate)?Date.parse(data.endDate):Date.parse(new Date())
            var start = moment(data.startDate);//now
            var end = moment(data.endDate);
            let duration = end.diff(start, 'seconds');
            convertLangSocket(theLang)
            let lang = i18n.getLocale(theLang) 
            var toRoom = 'room-' + data.userId;          
            if(isInArray(["PRODUCT","ARTIST","POST"],relatedTo)){
                //if Product
                if(relatedTo == "PRODUCT"){ 
                    let theProduct = await checkExistThenGet(viewOnId, Product, { deleted: false });
                    let arr2 = theProduct.viewers;
                    let found2 = arr2.find(e => e == userId)
                    if(!found2){
                        theProduct.viewsCount = theProduct.viewsCount + 1;
                        theProduct.viewers.push( data.userId);
                        await View.create({
                            relatedTo:'PRODUCT',
                            startDateMillSec:startDate,
                            endDateMillSec:endDate,
                            duration:duration,
                            product:viewOnId, 
                            user: userId 
                        });
                    }
                    await theProduct.save();

                    nsp.to(toRoom).emit('view', {data:i18n.__('done'),success:true}); 
                    let reports = {
                        "action":"View Product",
                    };
                    await Report.create({...reports, user: userId });
                }
                //if artist
                if(relatedTo == "ARTIST"){ 
                    let theArtist = await checkExistThenGet(viewOnId, User, { deleted: false });
                    let arr2 = theArtist.viewers;
                    let found2 = arr2.find(e => e == userId)
                    if(!found2){
                        theArtist.viewsCount = theArtist.viewsCount + 1;
                        theArtist.viewers.push( data.userId);
                        await View.create({
                            relatedTo:'ARTIST',
                            startDateMillSec:startDate,
                            endDateMillSec:endDate,
                            duration:duration,
                            artist:viewOnId, 
                            user: userId 
                        });
                    }
                    await theArtist.save();
                    nsp.to(toRoom).emit('view', {data:i18n.__('done'),success:true});
                    let reports = {
                        "action":"View artist",
                    };
                    await Report.create({...reports, user: userId });
                }
                //if post
                if(relatedTo == "POST"){ 
                    let thePost = await checkExistThenGet(viewOnId, Post, { deleted: false });
                    let arr2 = thePost.viewers;
                    let found2 = arr2.find(e => e == userId)
                    if(!found2){
                        thePost.viewsCount = thePost.viewsCount + 1;
                        thePost.viewers.push( data.userId);
                        await View.create({
                            relatedTo:'POST',
                            startDateMillSec:startDate,
                            endDateMillSec:endDate,
                            duration:duration,
                            artist:viewOnId, 
                            user: userId 
                        });
                    }
                    await thePost.save();
                    nsp.to(toRoom).emit('view', {data:i18n.__('done'),success:true});
                    let reports = {
                        "action":"View post",
                    };
                    await Report.create({...reports, user: userId });
                }
            }else{
                nsp.to(toRoom).emit('view', {data:i18n.__('invalid.type')});
            }
            

        } 
        catch (err) {
            console.log(err);
        }
    },
    //compare  
    async compare(io, nsp, data) { 
        try {
            var userId = data.userId;
            var artistId = data.artistId;
            let theLang = data.lang?data.lang:"ar"
            convertLangSocket(theLang)
            let lang = i18n.getLocale(theLang) 
            var toRoom = 'room-' + data.userId; 
            
            await Compare.create({
                artist:artistId, 
                user: userId 
            });   
            let myUser = await checkExistThenGet(data.userId, User)
            let posts =[]
            await Post.find({deleted: false,owner:artistId}).limit(3).then(async(data1)=>{
                data1.map(async(e)=>{
                    posts.push({
                        title: e.title,
                        description:e.description,
                        dataType:e.dataType,
                        likesCount:e.likesCount,
                        img:e.img,
                        isLike:isInArray(myUser.likedPosts,e._id),
                    })
                })
                
            }).catch(err => {
                console.log(err)
            })
            await User.findById(artistId).populate(populateQuery2)
            .then(async(e)=>{
                let index={
                    fullname:e.fullname,
                    username:e.username,
                    studio:e.studio,
                    emailVerify:e.emailVerify,
                    isFavourite:isInArray(myUser.favourite,e._id),
                    phoneVerify:e.phoneVerify,
                    img:e.img,
                    bio:e.bio,
                    email:e.email,
                    phone:e.phone,
                    type:e.type,
                    accountType:e.accountType,
                    online:e.online,
                    lastSeen:e.lastSeen,
                    rate:e.rate,
                    rateNumbers:e.rateNumbers,
                    rateCount:e.rateCount,
                    viewsCount:e.viewsCount,
                    favCount:e.favCount,
                    verify:e.verify,
                    posts:posts,
                    _id:e._id,
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
                nsp.to(toRoom).emit('compare', {data:index,success:true});
            })       
               

        } 
        catch (err) {
            console.log(err);
        }
    },
    //get comparing artists data
    //get artists data  
    async getArtists(io, nsp, data) { 
        try {
            var artists = data.artists;
            let theLang = data.lang?data.lang:"ar"
            convertLangSocket(theLang)
            let lang = i18n.getLocale(theLang) 
            var toRoom = 'room-' + data.userId; 
            let myUser = await checkExistThenGet(data.userId, User)
            let newdata = []
            await User.find({_id:artists}).populate(populateQuery2)
            .then(async(data1)=>{
                await Promise.all(data1.map(async(e)=>{
                    let posts =[]
                    await Post.find({deleted: false,owner:e._id}).limit(3).then(async(data1)=>{
                        await Promise.all(data1.map(async(e1)=>{
                            posts.push({
                                title: e1.title,
                                description:e1.description,
                                likesCount:e1.likesCount,
                                img:e1.img,
                                dataType:e.dataType,
                                isLike:isInArray(myUser.likedPosts,e1._id),
                            })
                        }))
                    })
                    let index={
                        posts:posts,
                        fullname:e.fullname,
                        username:e.username,
                        isFavourite:isInArray(myUser.favourite,e._id),
                        emailVerify:e.emailVerify,
                        img:e.img,
                        bio:e.bio,
                        email:e.email,
                        phone:e.phone,
                        type:e.type,
                        accountType:e.accountType,
                        online:e.online,
                        lastSeen:e.lastSeen,
                        rate:e.rate,
                        rateNumbers:e.rateNumbers,
                        rateCount:e.rateCount,
                        viewsCount:e.viewsCount,
                        favCount:e.favCount,
                        verify:e.verify,
                        _id:e._id,
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
                    newdata.push(index)
                }))
                nsp.to(toRoom).emit('getArtists', {data:newdata,success:true});   

            })   
            

        } 
        catch (err) {
            console.log(err);
        }
    },
  
};