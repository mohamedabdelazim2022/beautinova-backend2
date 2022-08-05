import express from 'express';
import postController from '../../controllers/post/post.controller';
import { requireAuth } from '../../services/passport';
import { multerSaveTo } from '../../services/multer-service';
import { cache } from '../../services/caching';
import { parseStringToArrayOfObjectsMw } from '../../utils';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        multerSaveTo('posts').fields([
            { name: 'img', maxCount: 1, options: false },
            { name: 'thumbnail', maxCount: 1, options: false }
        ]),
        parseStringToArrayOfObjectsMw('category'),
        postController.validateBody(),
        postController.create
    )
    .get(postController.findAll);
router.route('/importFromInsta')
    .post(
        requireAuth,
        postController.importFromInsta
    )
router.route('/withoutPagenation/get')
    .get(requireAuth,postController.findSelection);
    
router.route('/:postId')
    .put(
        requireAuth,
        multerSaveTo('posts').fields([
            { name: 'img', maxCount: 1, options: false },
            { name: 'thumbnail', maxCount: 1, options: false }
        ]),
        parseStringToArrayOfObjectsMw('category'),
        postController.validateBody(true),
        postController.update
    )
    .get( requireAuth,postController.findById)
    .delete( requireAuth,postController.delete);


router.route('/:postId/like')
    .put(
        requireAuth,
        postController.addLike
    )
router.route('/:postId/unLike')
    .put(
        requireAuth,
        postController.unlike
    )

export default router;