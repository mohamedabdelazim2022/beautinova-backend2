import express from 'express';
import bookingController from '../../controllers/booking/booking.controller';
import { requireAuth } from '../../services/passport';
import { multerSaveTo } from '../../services/multer-service';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        bookingController.validateBody(),
        bookingController.create
    )
    .get(requireAuth,bookingController.findAll);
router.route('/withoutPagenation/get')
    .get(requireAuth,bookingController.findSelection);
router.route('/bookingCount/get')
    .get(requireAuth,bookingController.bookingCount);
router.route('/:bookingId')
    .put(
        requireAuth,
        bookingController.validateBody(true),
        bookingController.update
    )
    .get( requireAuth,bookingController.findById)
    .delete( requireAuth,bookingController.delete);


router.route('/:bookingId/accept')
    .put(
        requireAuth,
        bookingController.validateAcceptedBody(),
        bookingController.accept
    )
router.route('/:bookingId/reject')
    .put(
        requireAuth,
        bookingController.reject
    )
router.route('/:bookingId/cancel')
    .put(
        requireAuth,
        bookingController.cancel
    )
router.route('/:bookingId/complete')
    .put(
        requireAuth,
        bookingController.complete
    )
router.route('/:bookingId/addArtistNote')
    .put(
        requireAuth,
        bookingController.addArtistNote
    )
    
router.route('/:artistId/calendar')
    .get(
        bookingController.calendar
    )
router.route('/:artistId/dayBooking')
    .get(
        bookingController.dayBooking
    )
router.route('/closeDay')
    .post(
        requireAuth,
        bookingController.completedDay
    )
router.route('/openDay')
    .post(
        requireAuth,
        bookingController.openDay
    )

export default router;