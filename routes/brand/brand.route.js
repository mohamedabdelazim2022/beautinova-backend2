
import express from 'express';
import BrandController from '../../controllers/brand/brand.controller';
import { multerSaveTo } from '../../services/multer-service';
import { requireAuth } from '../../services/passport';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        BrandController.validateBody(),
        BrandController.create
    ).get(BrandController.getAllPaginated)
router.route('/withoutPagenation/get')
    .get(BrandController.getAll);

router.route('/:brandId')
    .put(
        requireAuth,
        BrandController.validateBody(true),
        BrandController.update
    )
    .get(BrandController.getById)
    .delete(requireAuth,BrandController.delete);






export default router;
