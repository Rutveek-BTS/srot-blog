import {Router} from 'express'
import {verifyJWT} from '../middleware/auth.middleware.js'
import {toggleLike, getBlogLikes} from "../controllers/like.controller.js";

const router = Router();

router.route('/:blogid').post(verifyJWT, toggleLike);

router.route('/getbloglikes/:blogid').get(verifyJWT, getBlogLikes);

export default router;