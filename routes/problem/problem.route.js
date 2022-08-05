import express from 'express';
import ProblemController from '../../controllers/problem/problem.controller';
import { requireAuth } from '../../services/passport';
import { multerSaveTo } from '../../services/multer-service';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        multerSaveTo('problems').array('img',4),
        ProblemController.validateBody(),
        ProblemController.create
    )
router.route('/')
    .get(requireAuth,ProblemController.getAllPaginated);

router.route('/withoutPagenation/get')
    .get(requireAuth,ProblemController.getAll);
    
router.route('/:ProblemId')
    .put(
        requireAuth,
        ProblemController.validateBody(true),
        ProblemController.update
    )
    .get( requireAuth,ProblemController.getById)
    .delete( requireAuth,ProblemController.delete);

router.route('/:ProblemId/reply')
    .put(
        requireAuth,
        ProblemController.reply
    )
    
export default router;