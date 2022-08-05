import express from 'express';
import { requireSignIn, requireAuth } from '../../services/passport';
import UserController from '../../controllers/user/user.controller';
import { multerSaveTo } from '../../services/multer-service';
import { parseStringToArrayOfObjectsMw } from '../../utils';
import { cache } from '../../services/caching';

const router = express.Router();


router.post('/signin',requireSignIn, UserController.signIn);
router.route('/signUp')
    .post(
        UserController.validateSignUpBody(),
        UserController.signUp
    );
router.route('/socialLogin')
    .post(
        UserController.validateSocialLoginBody(),
        UserController.socialLogin
    );

// router.route('/loginOrSignUp')
//     .post(
//         UserController.validateFirstStepBody(),
//         UserController.LoginFirstStep
//     );
router.route('/verifyPhone')
    .post(
        UserController.validateVerifyPhone(),
        UserController.verifyPhone
    );
router.route('/verifyEmail')
    .post(
        UserController.validateVerifyEmail(),
        UserController.verifyEmail
    );
router.route('/:userId/completeSignUp')
    .put(
        multerSaveTo('users').single('img'),
        parseStringToArrayOfObjectsMw('services'),
        parseStringToArrayOfObjectsMw('artistPlaceType'),
        UserController.validateComplateDataBody(true),
        UserController.completeSignUp
    );
router.route('/addUser')
    .post(
        requireAuth,
        multerSaveTo('users').single('img'),
        parseStringToArrayOfObjectsMw('services'),
        parseStringToArrayOfObjectsMw('artistPlaceType'),
        UserController.validateUserCreateBody(),
        UserController.addUser
    );

router.route('/find')
    .get(UserController.findAll); 
router.route('/lastRecent')
    .get(requireAuth,UserController.lastRecent);    
router.route('/:id/getUser')
    .get(UserController.findById);

router.route('/:userId/delete')
    .delete(requireAuth,UserController.delete);

router.route('/:userId/block')
    .put(
        requireAuth,
        UserController.block
    );
router.route('/:userId/unblock')
    .put(
        requireAuth,
        UserController.unblock
    );
router.route('/:userId/active')
    .put(
        requireAuth,
        UserController.active
    );
router.route('/:userId/dis-active')
    .put(
        requireAuth,
        UserController.disactive
    );

router.route('/logout')
    .post(
        requireAuth,
        UserController.logout
    );
router.route('/addToken')
    .post(
        requireAuth,
        UserController.addToken
    );
router.route('/updateToken')
    .put(
        requireAuth,
        UserController.updateToken
    );

router.put('/user/:userId/updateInfo',
    requireAuth,
    multerSaveTo('users').single('img'), 
    parseStringToArrayOfObjectsMw('services'),
    parseStringToArrayOfObjectsMw('artistPlaceType'),
    UserController.validateUpdatedUser(true),
    UserController.updateUser);

router.put('/user/updatePassword',
    requireAuth,
    UserController.validateUpdatedPassword(),
    UserController.updatePassword);

router.post('/sendCode',
    UserController.validateSendCode(),
    UserController.sendCodeToEmail);

router.post('/confirm-code',
    UserController.validateConfirmVerifyCode(),
    UserController.resetPasswordConfirmVerifyCode);

router.post('/reset-password',
    UserController.validateResetPassword(),
    UserController.resetPassword);

router.post('/sendCode-phone',
    UserController.validateForgetPassword(),
    UserController.forgetPasswordSms);

router.post('/confirm-code-phone',
    UserController.validateConfirmVerifyCodePhone(),
    UserController.resetPasswordConfirmVerifyCodePhone);

router.post('/reset-password-phone',
    UserController.validateResetPasswordPhone(),
    UserController.resetPasswordPhone);

router.route('/withoutPagenation/get')
    .get(UserController.getAll)

    //send notifications
router.post('/sendNotifs',
    requireAuth,
    UserController.validateNotif(),
    UserController.SendNotif
    );
router.route('/:userId/statistics')
    .get(
        
        requireAuth,
        UserController.statistics
    )
router.route('/explore')
    .get(
        //
        requireAuth,
        UserController.explore
    )
router.route('/:userId/addresses')
    .get(
        
        requireAuth,
        UserController.getAddress
    )
router.route('/:userId/addBalance')
    .put(
        requireAuth,
        UserController.addBalance
    )
export default router;
