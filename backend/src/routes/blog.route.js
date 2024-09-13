import {Router} from 'express'
import {verifyJWT} from '../middleware/auth.middleware.js'
import {createBlog, getBlogById, getAllBlogs, updateBlog, deleteBlog, toggleBlogPublish, saveBlog, removeBlog} from "../controllers/blog.controller.js";
import {upload} from '../middleware/multer.middleware.js'

const router = Router();

router.route('/createblog').post(verifyJWT, upload.fields([
    {
        name: 'blogImg',
        maxCount: 3
    }
]), createBlog);

router.route('/getblog').get(verifyJWT, getAllBlogs);
router.route('/getblog/:blogid').get(verifyJWT, getBlogById);

router.route('/deleteblog/:blogid').delete(verifyJWT, deleteBlog);

router.route('/updateblog/:blogid').patch(verifyJWT, updateBlog);
router.route('/toggleblogpublish/:blogid').patch(verifyJWT, toggleBlogPublish);
router.route('/bsave/:blogId').patch(verifyJWT, saveBlog)
router.route('/bremove/:blogId').patch(verifyJWT, removeBlog)

export default router;