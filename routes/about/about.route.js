import express from 'express';
import AboutController from '../../controllers/about/about.controller';
import { requireAuth } from '../../services/passport';
import { parseStringToArrayOfObjectsMw } from '../../utils';
import { multerSaveTo } from '../../services/multer-service';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        AboutController.validateBody(),
        AboutController.create
    )
    .get(AboutController.findAll);
    
router.route('/:aboutId')
    .put(
        requireAuth,
        AboutController.validateBody(true),
        AboutController.update
    )
    .delete( requireAuth,AboutController.delete);


export default router;