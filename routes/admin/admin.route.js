import express from 'express';
import adminController from '../../controllers/admin/admin.controller';
import { cache } from '../../services/caching';

const router = express.Router();
router.route('/lastUsers')
    .get(adminController.getLastUser);


router.route('/count')
    .get(adminController.count);





export default router;
