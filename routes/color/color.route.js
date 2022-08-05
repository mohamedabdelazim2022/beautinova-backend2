
import express from 'express';
import ColorController from '../../controllers/color/color.controller';
import { multerSaveTo } from '../../services/multer-service';
import { requireAuth } from '../../services/passport';
import { cache } from '../../services/caching';
import { parseStringToArrayOfObjectsMw } from '../../utils';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        multerSaveTo('Colors').single('img'),
        ColorController.validateBody(),
        ColorController.create
    )
    .get(ColorController.getAllPaginated);
router.route('/withoutPagenation/get')
    .get(ColorController.getAll);
router.route('/:colorId')
    .put(
        requireAuth,
        multerSaveTo('Colors').single('img'),
        ColorController.validateBody(true),
        ColorController.update
    )
    .get(ColorController.getById)
    .delete(requireAuth,ColorController.delete);






export default router;
