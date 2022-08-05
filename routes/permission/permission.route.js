import express from 'express';
import PermissionController from '../../controllers/permission/permission.controller';
import { multerSaveTo } from '../../services/multer-service';
import { requireAuth } from '../../services/passport';
import { cache } from '../../services/caching'

const router = express.Router();


router.route('/')
    .post(
        requireAuth,
        PermissionController.validatePermissionBody(),
        PermissionController.create
    )
    .get(cache(10),requireAuth,PermissionController.findAll);

router.route('/withoutPagenation/get')
    .get(cache(10),requireAuth,PermissionController.getAll);

router.route('/:PermissionId')
    .put(
        requireAuth,
        PermissionController.validatePermissionBody(true),
        PermissionController.update
    )
    .get(cache(10),PermissionController.getById)
    .delete(requireAuth,PermissionController.delete);




export default router;