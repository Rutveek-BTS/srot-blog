import {Router} from 'express'
import {verifyJWT} from '../middleware/auth.middleware.js'
import {toggleFollow, getAllFollowers, getAllFollowing} from "../controllers/follow.controller.js";

const router = Router();

router.route('/togglefollow/:userid').post(verifyJWT, toggleFollow);

router.route('/getallfollowers').get(verifyJWT, getAllFollowers);
router.route('/getfollowing').get(verifyJWT, getAllFollowing);

export default router;