import express from 'express';
import FavouriteController from '../../controllers/favourite/favourite.controller';
import { requireAuth } from '../../services/passport';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/:favPersonId/fav')
    .post(
        requireAuth,
        FavouriteController.create
    );
router.route('/')
    .get(requireAuth,FavouriteController.findAll);
    
router.route('/:favPersonId')
    .delete( requireAuth,FavouriteController.unFavourite);







export default router;