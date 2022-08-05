import express from 'express';
import verifyRequestController from '../../controllers/verifyRequest/verifyRequest.controller';
import { requireAuth } from '../../services/passport';
import { cache } from '../../services/caching';
import { multerSaveTo } from '../../services/multer-service';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        multerSaveTo('users').array('img',4),
       // verifyRequestController.validateBody(),
        verifyRequestController.create
    )
    .get(requireAuth,verifyRequestController.findAll);
router.route('/withoutPagenation/get')
    .get(requireAuth,verifyRequestController.findSelection);
    
router.route('/:id')
    .get( requireAuth,verifyRequestController.findById)
    .delete( requireAuth,verifyRequestController.delete);

router.route('/:id/reply')
    .put(
        requireAuth,
        verifyRequestController.validateReplyBody(),
        verifyRequestController.reply
    )
export default router;