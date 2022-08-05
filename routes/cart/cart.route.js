import express from 'express';
import CartController from '../../controllers/cart/cart.controller';
import { requireAuth } from '../../services/passport';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/:productId/products')
    .post(
        requireAuth,
        CartController.validateBody(),
        CartController.create
    );
router.route('/addMany')
    .post(
        requireAuth,
        CartController.validateBodyAddMany(),
        CartController.addManyProducts
    );
router.route('/:userId/get')
    .get(CartController.findAll);
    

router.route('/:cartId/products/:productId')
    .delete( requireAuth,CartController.unCart);

router.route('/deleteAll')
    .delete( requireAuth,CartController.deleteAll);



export default router;