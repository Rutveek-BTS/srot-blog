import {Router} from 'express'
import {verifyJWT} from '../middleware/auth.middleware.js'
import {addComment, deleteComment, updateComment, getAllComment} from "../controllers/comment.controller.js";

const router = Router();

router.route('/:blogid').post(verifyJWT, addComment);

router.route('/:commentid').delete(verifyJWT, deleteComment);

router.route('/:commentid').patch(verifyJWT, updateComment);

router.route('/:blogid').get(verifyJWT, getAllComment);

export default router;