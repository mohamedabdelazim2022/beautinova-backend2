import express from 'express';
import QuestionsController from '../../controllers/questions/questions.controller';
import { requireAuth } from '../../services/passport';
import { multerSaveTo } from '../../services/multer-service';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        QuestionsController.validateBody(),
        QuestionsController.create
    )
    .get(QuestionsController.findAll);
    
router.route('/:questionsId')
    .put(
        
        requireAuth,
        QuestionsController.validateBody(true),
        QuestionsController.update
    )
    .delete( requireAuth,QuestionsController.delete);

router.route('/:questionsId/visible')
    .put(
        requireAuth,
        QuestionsController.visible
    )

router.route('/:questionsId/hidden')
    .put(
        requireAuth,
        QuestionsController.hidden
    )
router.route('/withoutPagenation/get')
    .get(QuestionsController.getAll);

export default router;