
import express from 'express';
import viewController from '../../controllers/view/view.controller';
import { requireAuth } from '../../services/passport';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/')
    .get(requireAuth,viewController.findAll);

export default router;