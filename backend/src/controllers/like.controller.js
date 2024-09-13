import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import User from "../models/user.model.js";
import Like from "../models/like.model.js";
import mongoose, {isValidObjectId} from "mongoose";

const toggleLike = asyncHandler( async (req, res)=>{
    const {blogid} = req.params;

    if(!isValidObjectId(blogid)){
        throw new apiError(400, "Invalid Blog Id");
    }

    if(!req.user?._id){
        throw new apiError(400, "No User Logged In");
    }

    const currentlike = await Like.findOne({
        blog: blogid,
        likedBy: req.user?._id
    })

    if(currentlike){
        await Like.findByIdAndDelete(currentlike._id)

        return res
        .status(200)
        .json(new apiError(200, {}, "Unlike Blog Successful"))
    }

    const newLike = await Like.create({
        blog: blogid,
        likedBy: req.user?._id
    })

    return res
    .status(200)
    .json(new apiResponse(200, newLike, "Like Blog Successful"))
})

const getUserBlogLikes = asyncHandler( async (req, res)=>{

})

const getBlogLikes = asyncHandler( async (req, res)=>{
    
})

export {toggleLike, getUserBlogLikes, getBlogLikes}