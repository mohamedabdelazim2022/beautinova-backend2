import express from 'express';
import ProductController from '../../controllers/product/product.controller';
import { multerSaveTo } from '../../services/multer-service';
import { requireAuth } from '../../services/passport';
import { parseStringToArrayOfObjectsMw } from '../../utils';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        multerSaveTo('products').array('img',10),
        parseStringToArrayOfObjectsMw('theStock'),
        parseStringToArrayOfObjectsMw('color'),
        ProductController.validateCreatedProduct(),
        ProductController.create
    ).get(ProductController.findAll);

router.route('/withoutPagenation/get')
    .get(ProductController.getAll);

router.route('/:productId')
    .get(ProductController.findById)
    .put(
        requireAuth,
        multerSaveTo('products').fields([
            { name: 'img', maxCount: 10, options: false }
        ]),
        parseStringToArrayOfObjectsMw('theStock'),
        parseStringToArrayOfObjectsMw('color'),
        ProductController.validateCreatedProduct(true),
        ProductController.update
    )
    .delete(requireAuth,ProductController.delete);

router.route('/:productId/active')
    .put(
        requireAuth,
        ProductController.active
    )

router.route('/:productId/dis-active')
    .put(
        requireAuth,
        ProductController.disactive
    )

router.route('/:productId/top')
    .put(
        requireAuth,
        ProductController.top
    )

router.route('/:productId/low')
    .put(
        requireAuth,
        ProductController.low
    )
router.route('/:productId/enableFreeShipping')
    .put(
        requireAuth,
        ProductController.freeShipping
    )

router.route('/:productId/disableFreeShipping')
    .put(
        requireAuth,
        ProductController.notFreeShipping
    )

router.route('/:productId/offer')
    .put(
        requireAuth,
        ProductController.validateOfferBody(),
        ProductController.addOffer
    )
router.route('/:offerId/offer')
    .delete( requireAuth,ProductController.removeOffer);
router.route('/:productId/findAll/offers')
    .get(
        requireAuth,
        ProductController.findAllOffers
    )
router.route('/:productId/offers')
    .get(
        requireAuth,
        ProductController.findOffer
    )


export default router;
