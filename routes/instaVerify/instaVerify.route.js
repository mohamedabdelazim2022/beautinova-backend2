import express from 'express';
import InstaVerifyController from '../../controllers/instaVerify/instaVerify.controller';
import { requireAuth } from '../../services/passport';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        InstaVerifyController.validateBody(false),
        InstaVerifyController.create
    )
    .get(requireAuth,InstaVerifyController.findAll);
router.route('/withoutPagenation/get')
    .get(requireAuth,InstaVerifyController.findSelection);
    
router.route('/:id')
    .get( requireAuth,InstaVerifyController.findById)
    .delete( requireAuth,InstaVerifyController.delete);

router.route('/:id/reply')
    .put(
        requireAuth,
        InstaVerifyController.validateReplyBody(),
        InstaVerifyController.reply
    )
export default router;