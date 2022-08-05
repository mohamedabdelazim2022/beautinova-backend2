import express from 'express';
import CouponController from '../../controllers/coupon/coupon.controller';
import { requireAuth } from '../../services/passport';
import { multerSaveTo } from '../../services/multer-service';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/')
    .post(
        requireAuth, 
        CouponController.validateBody(),
        CouponController.create
    )
    .get(requireAuth,CouponController.findAll);
router.route('/withoutPagenation/get')
    .get(requireAuth, CouponController.findAllWithoutPagenation);

router.route('/:couponId')
    .put(
        requireAuth,
        CouponController.validateBody(true),
        CouponController.update
    )
    .get(requireAuth,CouponController.findById)
    .delete( requireAuth,CouponController.delete);

    router.route('/:couponId/end')
    .put(
        requireAuth,
        CouponController.end
    )
    router.route('/:couponId/reused')
    .put(
        requireAuth,
        CouponController.reused
    )

router.route('/checkValidateCoupon')
    .post(
        requireAuth,
        CouponController.checkValidateCoupon
    )



export default router;