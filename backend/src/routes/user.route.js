import { Router } from "express"
import {verifyJWT} from '../middleware/auth.middleware.js'
import {upload} from '../middleware/multer.middleware.js'
import {registerUser, loginUser, logoutUser, refreshingRToken, getUser, getUserProfile, getFavouriteBlogs, updateUserDetails, updateAvatar, updateCoverImage, changePassword} from '../controllers/user.controller.js'

const router = Router();

router.route('/register').post(
    upload.single('avatar'),
    registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/refreshingtoken').post(refreshingRToken);

router.route('/getuser/:userId').get(verifyJWT, getUser);
router.route('/').get(verifyJWT, getUserProfile);
router.route('/favouriteblogs').get(verifyJWT, getFavouriteBlogs);

router.route('/updateuser').patch(verifyJWT, updateUserDetails);
router.route('/updateavatar').patch(verifyJWT, upload.single('avatar'), updateAvatar);
router.route('/updatecoverimage').patch(verifyJWT, upload.single('coverImg'), updateCoverImage);
router.route('/changepassword').patch(verifyJWT, changePassword);

export default router;