import express from 'express';
import liveController from '../../controllers/live/live.controller';
import { requireAuth } from '../../services/passport';
import { multerSaveTo } from '../../services/multer-service';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        multerSaveTo('live').single('img'),
        liveController.validateBody(),
        liveController.create
    )
    .get(requireAuth,liveController.findAll);
router.route('/withoutPagenation/get')
    .get(requireAuth,liveController.findSelection);
    
router.route('/:liveId')
    .put(
        requireAuth,
        multerSaveTo('live').single('img'),
        liveController.validateBody(true),
        liveController.update
    )
    .get( requireAuth,liveController.findById)
    .delete( requireAuth,liveController.delete);

router.route('/:liveId/accept')
    .put(
        requireAuth,
        multerSaveTo('live').single('bannar'),
        liveController.accept
    )
router.route('/:liveId/reject')
    .put(
        requireAuth,
        liveController.reject
    )
router.route('/:liveId/cancel')
    .put(
        requireAuth,
        liveController.cancel
    )
router.route('/:liveId/start')
    .put(
        requireAuth,
        liveController.start
    )
router.route('/:liveId/end')
    .put(
        requireAuth,
        liveController.end
    )


export default router;