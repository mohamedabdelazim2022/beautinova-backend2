
import express from 'express';
import SizeController from '../../controllers/size/size.controller';
import { requireAuth } from '../../services/passport';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        SizeController.validateBody(),
        SizeController.create
    )
    .get(SizeController.getAllPaginated);
router.route('/withoutPagenation/get')  
    .get(SizeController.getAll);
router.route('/:sizeId')
    .put(
        requireAuth,
        SizeController.validateBody(true),
        SizeController.update
    )
    .get(SizeController.getById)
    .delete( requireAuth,SizeController.delete);







export default router;