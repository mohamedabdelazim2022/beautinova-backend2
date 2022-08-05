import { isInArray } from "../../helpers/CheckMethods";
import i18n from "i18n";
import moment from 'moment';


export async function transformProduct(e,lang) {
    let index ={
        name:lang=="ar"?e.name_ar:e.name_en,
        name_en:e.name_en,
        name_ar:e.name_ar,
        priceFrom:e.priceFrom,
        priceTo:e.priceTo,
        quantity:e.quantity,
        viewsCount:e.viewsCount,
        img:e.img,
        hasOffer:e.hasOffer,
        freeShipping:e.freeShipping,
        sallCount:e.sallCount,
        available:e.available,
        visible:e.visible,
        rate:e.rate,
        createdAt:e.createdAt,
        id: e._id,
    }
    if(e.category){
        index.category = {
            categoryName:lang=="ar"?e.category.categoryName_ar:e.category.categoryName_en,
            categoryName_en:e.category.categoryName_en,
            categoryName_ar:e.category.categoryName_ar,
            img: e.category.img,
            id: e.category._id,
        }
    }
    if(e.subCategory){
        index.subCategory = {
            categoryName:lang=="ar"?e.subCategory.categoryName_ar:e.subCategory.categoryName_en,
            categoryName_en:e.subCategory.categoryName_en,
            categoryName_ar:e.subCategory.categoryName_ar,
            id: e.subCategory._id,
            img: e.subCategory.img,
        }
    }
    if(e.brand){
        index.brand ={
            brandName:lang=="ar"?e.brand.brandName_ar:e.brand.brandName_en,
            brandName_en:e.brand.brandName_en,
            brandName_ar:e.brand.brandName_ar,
            id: e.brand._id,
            img: e.brand.img,
        }
    }
    /*stock */
    let stock = []
    for (let val of e.stock) {
        let value ={
            price:val.price,
            quantity:val.quantity,
            hasOffer:val.hasOffer,
            offerRatio:val.offerRatio,
            offerPrice:val.offerPrice,
            id:val._id,
        }
        if(val.size){
            value.size = { 
                size:lang="ar"?val.size.size_ar:val.size.size_en,
                size_en:val.size.size_en,
                size_ar:val.size.size_ar,
                id: val.size._id,
            }
        }
        if(val.colors){
            /*color*/
            let colors=[]
            for (let i of val.colors) {
                let theColor = {
                    quantity:i.quantity
                }
                if(i.color){
                    theColor.color = {
                        colorName:lang="ar"?i.color.colorName_ar:i.color.colorName_en,
                        colorName_en:i.color.colorName_en,
                        colorName_ar:i.color.colorName_ar,
                        img:i.color.img,
                        id:i.color._id, 
                    }
                }
                colors.push(theColor)
            }
            value.colors = colors
        }
        
        stock.push(value)
    }
    index.stock = stock
    return index
}
export async function transformProductById(e,lang){
    let index ={
        name:lang=="ar"?e.name_ar:e.name_en,
        name_en:e.name_en,
        name_ar:e.name_ar,
        priceFrom:e.priceFrom,
        priceTo:e.priceTo,
        quantity:e.quantity,
        img:e.img,
        description_ar:e.description_ar,
        description_en:e.description_en,
        description:lang=="ar"?e.description_ar:e.description_en,
        hasOffer:e.hasOffer,
        freeShipping:e.freeShipping,
        sallCount:e.sallCount,
        viewsCount:e.viewsCount,
        available:e.available,
        visible:e.visible,
        rateNumbers:e.rateNumbers,
        rateCount:e.rateCount,
        rate:e.rate,
        createdAt:e.createdAt,
        id: e._id,
    }
    if(e.category){
        index.category = {
            categoryName:lang=="ar"?e.category.categoryName_ar:e.category.categoryName_en,
            categoryName_en:e.category.categoryName_en,
            categoryName_ar:e.category.categoryName_ar,
            img: e.category.img,
            id: e.category._id,
        }
    }
    if(e.subCategory){
        index.subCategory = {
            categoryName:lang=="ar"?e.subCategory.categoryName_ar:e.subCategory.categoryName_en,
            categoryName_en:e.subCategory.categoryName_en,
            categoryName_ar:e.subCategory.categoryName_ar,
            id: e.subCategory._id,
            img: e.subCategory.img,
        }
    }
    if(e.brand){
        index.brand ={
            brandName:lang=="ar"?e.brand.brandName_ar:e.brand.brandName_en,
            brandName_en:e.brand.brandName_en,
            brandName_ar:e.brand.brandName_ar,
            id: e.brand._id,
            img: e.brand.img,
        }
    }
    /*stock */
    let stock = []
    for (let val of e.stock) {
        let value ={
            id:val._id,
            price:val.price,
            quantity:val.quantity,
            hasOffer:val.hasOffer,
            offerRatio:val.offerRatio,
            offerPrice:val.offerPrice,
        }
        if(val.size){
            value.size = { 
                size:lang="ar"?val.size.size_ar:val.size.size_en,
                size_en:val.size.size_en,
                size_ar:val.size.size_ar,
                id: val.size._id,
            }
        }
        if(val.colors){
            /*color*/
            let colors=[]
            for (let i of val.colors) {
                let theColor = {
                    quantity:i.quantity
                }
                if(i.color){
                    theColor.color = {
                        colorName:lang="ar"?i.color.colorName_ar:i.color.colorName_en,
                        colorName_en:i.color.colorName_en,
                        colorName_ar:i.color.colorName_ar,
                        img:i.color.img,
                        id:i.color._id, 
                    }
                }
                colors.push(theColor)
            }
            value.colors = colors
        }
        
        stock.push(value)
    }
    index.stock = stock
    return index
}
