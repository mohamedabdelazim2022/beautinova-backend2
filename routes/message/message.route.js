var express = require('express');
var router = express.Router();
var messageController = require('../../controllers/message/messageController');
import { requireAuth } from '../../services/passport';
import { multerSaveTo } from '../../services/multer-service';
import { cache } from '../../services/caching';

/* GET users listing. */
router.get('/',messageController.getAllMessages);
router.route('/unseenCount')
    .get(requireAuth,messageController.unseenCount);

router.get('/lastContacts',messageController.findLastContacts);
router.put('/',messageController.updateSeen);
router.put('/updateInformed',messageController.updateInformed);

router.route('/upload')
    .post( 
        requireAuth,
            multerSaveTo('chats').single('img'),
            messageController.uploadImage
        )  
module.exports = router;