import mongoose,{isValidObjectId} from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { uploadMultipleImages, deleteMultipleImages} from "../utils/cloudinary.js";
import Blog from "../models/blog.model.js";

const createBlog = asyncHandler( async (req,res)=>{
    const {title, content} = req.body;
    const blogImgFilePaths = req.files?.blogImg;

    if(!req.user){
        throw new apiError(400, "No User Logged In")
    }

    if(!(title && content)){
        throw new apiError(400, "Title and Content are Required");
    }

    if(!blogImgFilePaths){
        throw new apiError(400, "No Blog Image Files Found");
    }

    const blogImagesArray = await uploadMultipleImages(blogImgFilePaths);

    const blogImagesURLArray = blogImagesArray.map( blogImages => blogImages.url)
    
    if(!blogImagesURLArray){
        await deleteMultipleImages(blogImagesURLArray);
        throw new apiError(500, "Something Went Wrong While Uploading The Blog Images. Try Again.");
    }

    const blog = await Blog.create({
        title,
        content,
        blogImg: blogImagesURLArray,
        author: req.user._id
    })

    if(!blog){
        await deleteMultipleImages(blogImagesURLArray)
        throw new apiError(500, "Something Went Wrong While Posting Blog. Try Again.");
    }

    return res
    .status(200)
    .json(new apiResponse(200, blog, "Blog Posted Successfully"))
})

const getBlogById = asyncHandler( async (req,res)=>{
    
})

const getAllBlogs = asyncHandler( async (req,res)=>{
    
})

const updateBlog = asyncHandler( async (req,res)=>{
    
})

const deleteBlog = asyncHandler( async (req,res)=>{
    const {blogid} = req.params;

    if(!isValidObjectId(blogid)){
        throw new apiError(400, "Invalid Blog Id")
    }

    if(!req.user?._id){
        throw new apiError(400, "No User Logged In")
    }

    const currentBlog = await Blog.findById(blogid);

    if(!currentBlog){
        throw new apiError(400, "No SUch Blog Exists");
    }
    
    if(!currentBlog.author.equals(req.user?._id)){
        throw new apiError(400, "You Are Not Authorized To Delete This Blog")
    }

    const deleteBlogImages = await deleteMultipleImages(currentBlog.blogImg)

    if(!deleteBlogImages){
        throw new apiError(500, "Failed To Delete Blog Images")
    }

    const deletedBlog = await Blog.findByIdAndDelete(currentBlog._id);

    if(!deletedBlog){
        throw new apiError(500, "Something Went Wrong While Deleting The Blog");
    }

    return res
    .status(200)
    .json(200, {}, "Blog Deleted Successfully.")
})

const toggleBlogPublish = asyncHandler( async (req,res)=>{
    const {blogid} = req.params;

    if(!isValidObjectId(blogid)){
        throw new apiError(400, "Invalid Blog Id");
    }

    if(!req.user?._id){
        throw new apiError(400, "No User Logged In");
    }

    const currentBlog = await Blog.findById(blogid);

    if(!currentBlog){
        throw new apiError(400, "No Such Blog Exists");
    }

    if(!currentBlog.author.equals(req.user?._id)){
        throw new apiError(400, "You Are Not Authorized To Delete This Blog");
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
        blogid,
        {
            $set: {
                isPublished: !currentBlog.isPublished
            }
        },
        {
            new: true
        }
    )

    if(!updatedBlog){
        throw new apiError(500, "Something Went Wrong While Updating The Blog Status");
    }

    return res
    .status(200)
    .json(new apiResponse(200, updatedBlog, "Blog Status Updated Successfully."));
})

const saveBlog = asyncHandler( async (req, res)=>{

})

const removeBlog = asyncHandler( async (req, res)=>{
    
})

export {createBlog, getBlogById, getAllBlogs, updateBlog, deleteBlog, toggleBlogPublish, saveBlog, removeBlog};