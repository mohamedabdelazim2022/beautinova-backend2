import express from 'express';
import AnoncementController from '../../controllers/anoncement/anoncement.controller';
import { requireAuth } from '../../services/passport';
import { multerSaveTo } from '../../services/multer-service';
import { parseStringToArrayOfObjectsMw } from '../../utils';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        multerSaveTo('anoncement').single('img'),
        parseStringToArrayOfObjectsMw('category'),
        AnoncementController.validateBody(),
        AnoncementController.create
    )
    .get(AnoncementController.findAll);
router.route('/withoutPagenation/get')
    .get(requireAuth,AnoncementController.findSelection);
    
router.route('/:anonId')
    .put(
        requireAuth,
        multerSaveTo('anoncement').single('img'),
        parseStringToArrayOfObjectsMw('category'),
        AnoncementController.validateBody(true),
        AnoncementController.update
    )
    .get(AnoncementController.findById)
    .delete( requireAuth,AnoncementController.delete);

router.route('/:anonId/beFirst')
    .put(
        requireAuth,
        AnoncementController.beFirst
    )


export default router;