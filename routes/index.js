import express from 'express';
import userRoute from './user/user.route';
import ReportRoute  from './reports/report.route';
import NotifRoute  from './notif/notif.route';
import AboutRoute  from './about/about.route';
import AdminRoute  from './admin/admin.route';
import favouriteRoute  from './favourite/favourite.route';
import problemRoute  from './problem/problem.route';
import anoncementRoute  from './anoncement/anoncement.route';
import countryRoute  from './country/country.route';
import citiesRoute  from './city/city.route';
import categoryRoute  from './category/category.route';
import messageRoute  from './message/message.route';
import contactRoute  from './contact/contact.route';
import questionsRoute  from './questions/questions.route';
import colorRoute  from './color/color.route';
import sizesRoute  from './size/size.route';
import brandsRoute  from './brand/brand.route';
import productsRoute  from './product/product.route';
import ordersRoute  from './order/order.route';
import couponRoute  from './coupon/coupon.route';
import cartRoute  from './cart/cart.route';
import settingRoute  from './setting/setting.route';
import postRoute  from './post/post.route';
import liveRoute  from './live/live.route';
import bookingRoute  from './booking/booking.route';
import viewRoute  from './viewing/viewing.route';
import rateRoute  from './rate/rate.route';
import permissionRoute  from './permission/permission.route';
import instaVerifyRoute  from './instaVerify/instaVerify.route';
import verifyRequestRoute  from './verifyRequest/verifyRequest.route';

import { requireAuth } from '../services/passport';

const router = express.Router();
router.use('/instaVerify', instaVerifyRoute);
router.use('/verifyRequest', verifyRequestRoute);

router.use('/permission', permissionRoute);
router.use('/', userRoute);
router.use('/booking',bookingRoute);
router.use('/views',viewRoute);
router.use('/post',postRoute);
router.use('/live',liveRoute);
router.use('/coupons',couponRoute);
router.use('/contact-us',contactRoute);
router.use('/questions',questionsRoute);
router.use('/reports',requireAuth, ReportRoute);
router.use('/notif',requireAuth, NotifRoute);
router.use('/admin',requireAuth, AdminRoute);
router.use('/messages',requireAuth, messageRoute);
router.use('/about',AboutRoute);
router.use('/cities',citiesRoute);
router.use('/favourite',favouriteRoute);
router.use('/setting',settingRoute);
router.use('/rate',rateRoute);

router.use('/problems',problemRoute);
router.use('/categories',categoryRoute);
router.use('/cart',cartRoute);

router.use('/anoncement',anoncementRoute);
router.use('/countries',countryRoute);
router.use('/color',colorRoute);
router.use('/size',sizesRoute);
router.use('/brand',brandsRoute);
router.use('/products',productsRoute);
router.use('/orders',ordersRoute);

export default router;
