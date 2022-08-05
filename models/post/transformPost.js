import { isInArray } from "../../helpers/CheckMethods";


export async function transformPost(e,lang,myUser,userId) {
    let index = {
        title: e.title,
        description:e.description,
        likesCount:e.likesCount,
        img:e.img,
        thumbnail:e.thumbnail,
        dataType:e.dataType,
        isLike:userId?isInArray(myUser.likedPosts,e._id):false,
        id:e._id,
        createdAt: e.createdAt
    }
  
    if(e.category){
         /*category*/
        let category=[]
        for (let val of e.category) {
            category.push({
                categoryName:lang=="ar"?val.categoryName_ar:val.categoryName_en,
                categoryName_en:val.categoryName_en,
                categoryName_ar:val.categoryName_ar,
                img:val.img,
                type:val.type,
                id: val._id,
            })
        }
        index.category = category
    }
    if(e.owner){
        let owner={
            fullname:e.owner.fullname,
            username:e.owner.username,
            isFavourite:userId?isInArray(myUser.favourite,e.owner._id):false,
            img:e.owner.img,
            online:e.owner.online,
            id:e.owner._id,//
        }
        index.owner = owner
    }
   return index
}
export async function transformPostById(e,lang,myUser,userId){
    let index = {
        title: e.title,
        description:e.description,
        likesCount:e.likesCount,
        img:e.img,
        thumbnail:e.thumbnail,
        dataType:e.dataType,
        isLike:userId?isInArray(myUser.likedPosts,e._id):false,
        id:e.id,
        createdAt:e.createdAt,
        
    }
    
    if(e.owner){
        let owner={
            fullname:e.owner.fullname,
            username:e.owner.username,
            isFavourite:userId?isInArray(myUser.favourite,e.owner._id):false,
            img:e.owner.img,
            online:e.owner.online,
            id:e.owner._id,//
        }
        index.owner = owner
    }
    if(e.category){
        /*category*/
       let category=[]
       for (let val of e.category) {
           category.push({
               categoryName:lang=="ar"?val.categoryName_ar:val.categoryName_en,
               categoryName_en:val.categoryName_en,
               categoryName_ar:val.categoryName_ar,
               img:val.img,
               type:val.type,
               id: val._id,
           })
       }
       index.category = category
    }
    return index
}
