import { isInArray } from "../../helpers/CheckMethods";
import i18n from "i18n";
import moment from 'moment';


export async function transformOrder(e,lang) {
    let index ={
        total:e.total,
        finalTotal:e.finalTotal,
        delivaryCost:e.delivaryCost,
        discount:e.discount,
        client:{
            fullname:e.client.fullname,
            phone:e.client.phone,
            type:e.client.type,
            id:e.client._id,
        },
        status:e.status,
        paymentSystem:e.paymentSystem,
        freeShipping:e.freeShipping,
        hasPromoCode:e.hasPromoCode,
        accept:e.accept,
        rated: e.rated,
        deliveredDateMillSec:e.deliveredDateMillSec,
        refusedDateMillSec:e.refusedDateMillSec,
        cancelDateMillSec:e.cancelDateMillSec,
        city:{
            cityName:lang=="ar"?e.city.cityName_ar:e.city.cityName_en,
            cityName_en:e.city.cityName_en,
            cityName_ar:e.city.cityName_ar,
            delivaryCost: e.city.delivaryCost,
            country: e.city.country,
            id: e.city._id,
        },
        area:{
            areaName:lang=="ar"?e.area.areaName_ar:e.area.areaName_en,
            areaName_en:e.area.areaName_en,
            areaName_ar:e.area.areaName_ar,
            delivaryCost: e.area.delivaryCost,
            city:e.area.city,
            id: e.area._id,
        },
        rated: e.rated,
        ratedProduct:[... new Set(e.ratedProduct)],
        createdAt:e.createdAt,
        id: e._id,
    }
    if(e.promoCode){
        index.promoCode={
            couponNumber:e.promoCode.couponNumber,
            id:e.promoCode._id,
        }
    }
    /*productOrders */
    let productOrders = []
    for (let val of e.productOrders) {
        let value ={
            unitCost:val.unitCost,
            size:{ 
                size:lang="ar"?val.size.size_ar:val.size.size_en,
                size_en:val.size.size_en,
                size_ar:val.size.size_ar,
                id: val.size._id,
            },
            product:{ 
                name:lang="ar"?val.product.name_ar:val.product.name_en,
                name_en:val.product.name_en,
                name_ar:val.product.name_ar,
                img:val.product.img[0],
                id: val.product._id,
            },
            count:val.count,
        }
        if(val.color){
            value.color = {
                colorName:lang="ar"?val.color.colorName_ar:val.color.colorName_en,
                colorName_en:val.color.colorName_en,
                colorName_ar:val.color.colorName_ar,
                img:val.color.img,
                id:val.color._id, 
            }
        }
        
        productOrders.push(value)
    }
    index.productOrders = productOrders
    return index
}
export async function transformOrderById(e,lang){
    let index ={
        total:e.total,
        finalTotal:e.finalTotal,
        delivaryCost:e.delivaryCost,
        discount:e.discount,
        destination:e.destination,
        address:e.address,
        street:e.street,
        placeType:e.placeType,
        floor:e.floor,
        apartment:e.apartment,
        phone:e.phone,
        client:{
            fullname:e.client.fullname,
            username:e.client.username,
            img:e.client.img,
            phone:e.client.phone,
            type:e.client.type,
            online:e.client.online,
            lastSeen:e.client.lastSeen,
            id:e.client._id,
        },
        status:e.status,
        paymentSystem:e.paymentSystem,
        hasPromoCode:e.hasPromoCode,freeShipping:e.freeShipping,
        accept:e.accept,
        reason:e.reason,
        rated: e.rated,
        deliveredDateMillSec:e.deliveredDateMillSec,
        refusedDateMillSec:e.refusedDateMillSec,
        cancelDateMillSec:e.cancelDateMillSec,
        city:{
            cityName:lang=="ar"?e.city.cityName_ar:e.city.cityName_en,
            cityName_en:e.city.cityName_en,
            cityName_ar:e.city.cityName_ar,
            delivaryCost: e.city.delivaryCost,
            country: e.city.country,
            id: e.city._id,
        },
        area:{
            areaName:lang=="ar"?e.area.areaName_ar:e.area.areaName_en,
            areaName_en:e.area.areaName_en,
            areaName_ar:e.area.areaName_ar,
            delivaryCost: e.area.delivaryCost,
            city:e.area.city,
            id: e.area._id,
        },
        rated: e.rated,
        ratedProduct:[... new Set(e.ratedProduct)],
        createdAt:e.createdAt,
        id: e._id,
    }
    if(e.promoCode){
        index.promoCode={
            couponNumber:e.promoCode.couponNumber,
            discountType:e.promoCode.discountType,
            discount:e.promoCode.discount,
            end:e.promoCode.end,
            singleTime:e.promoCode.singleTime,
            expireDate:e.promoCode.expireDate,
            expireDateMillSec:e.promoCode.expireDateMillSec,
            id:e.promoCode._id,
        }
    }
    /*productOrders */
    let productOrders = []
    for (let val of e.productOrders) {
        let value ={
            unitCost:val.unitCost,
            size:{ 
                size:lang="ar"?val.size.size_ar:val.size.size_en,
                size_en:val.size.size_en,
                size_ar:val.size.size_ar,
                id: val.size._id,
            },
            count:val.count,
        }
        //product
        if(val.product){
            let product = { 
                name:lang="ar"?val.product.name_ar:val.product.name_en,
                name_en:val.product.name_en,
                name_ar:val.product.name_ar,
                rate:val.product.rate,
                img:val.product.img[0],
                category:{
                    categoryName:lang=="ar"?val.product.category.categoryName_ar:val.product.category.categoryName_en,
                    categoryName_en:val.product.category.categoryName_en,
                    categoryName_ar:val.product.category.categoryName_ar,
                    img: val.product.category.img,
                    id: val.product.category._id,
                },
                subCategory:{
                    categoryName:lang=="ar"?val.product.subCategory.categoryName_ar:val.product.subCategory.categoryName_en,
                    categoryName_en:val.product.subCategory.categoryName_en,
                    categoryName_ar:val.product.subCategory.categoryName_ar,
                    id: val.product.subCategory._id,
                    img: val.product.subCategory.img,
                },
                brand:{
                    brandName:lang=="ar"?val.product.brand.brandName_ar:val.product.brand.brandName_en,
                    brandName_en:val.product.brand.brandName_en,
                    brandName_ar:val.product.brand.brandName_ar,
                    id: val.product.brand._id,
                    img: val.product.brand.img,
                },
                
                id: val.product._id,
            }
            let stock=[]
            for (const i of val.product.stock) {
                stock.push({
                    size:i.size,
                    colors:i.colors,
                    price:i.price,
                    id:i._id,
                })
            }
            product.stock = stock;
            value.product = product;
        }

        //color
        if(val.color){
            value.color = {
                colorName:lang="ar"?val.color.colorName_ar:val.color.colorName_en,
                colorName_en:val.color.colorName_en,
                colorName_ar:val.color.colorName_ar,
                img:val.color.img,
                id:val.color._id, 
            }
        }
        
        productOrders.push(value)
    }
    index.productOrders = productOrders
    return index
}
