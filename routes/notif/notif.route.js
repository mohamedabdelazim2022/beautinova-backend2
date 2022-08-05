import express from 'express';
import NotifController from '../../controllers/notif/notif.controller';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/')
    .get(NotifController.find);
router.route('/getNotifs/get')
    .get(NotifController.findNotifs);
router.route('/withoutPagenation/get')
    .get(NotifController.findNotifsWithoutPagenation);
router.route('/unreadCount')
    .get(NotifController.unreadCount);
router.route('/:notifId/delete')
    .delete(NotifController.delete);
router.route('/deleteAll')
    .delete(NotifController.deleteAll);
router.route('/:notifId/read')
    .put(NotifController.read)

    
router.route('/:notifId/unread')
    .put(NotifController.unread)
export default router;