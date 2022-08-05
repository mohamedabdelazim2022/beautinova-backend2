import express from 'express';
import OrderController from '../../controllers/order/order.controller';
import { requireAuth } from '../../services/passport';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/:userId/users')
    .post(
        requireAuth,
        OrderController.validateCreatedOrders(),
        OrderController.create
    );

router.route('/')
    .get(OrderController.findOrders)

router.route('/withoutPagenation/get')
    .get(OrderController.getOrders)
router.route('/findOrdersMobile')
    .get(OrderController.findOrdersMobile)
router.route('/:orderId')
    .get(OrderController.findById)
    .delete( requireAuth,OrderController.delete);

router.route('/:orderId/accept')
    .put( requireAuth,OrderController.accept)

router.route('/:orderId/refuse')
    .put( requireAuth,OrderController.refuse)
router.route('/:orderId/cancel')
    .put( requireAuth,OrderController.cancel)
router.route('/:orderId/outForDelivery')
    .put( requireAuth,OrderController.outForDelivery)

router.route('/:orderId/delivered')
    .put( requireAuth,OrderController.deliver)

router.route('/getDelivaryPrice')
    .post(
        requireAuth,
        OrderController.validateGetPrices(),
        OrderController.getPrice
    );
router.route('/address/get')
    .get(requireAuth,OrderController.findAllUserAddresses)

export default router;
