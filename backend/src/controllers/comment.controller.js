import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import User from "../models/user.model.js";
import Comment from "../models/comment.model.js";
import mongoose, {isValidObjectId} from "mongoose";

const addComment = asyncHandler( async (req, res)=>{
    const {content} = req.body;
    const {blogid} = req.params;

    if(!isValidObjectId(blogid)){
        throw new apiError(400, "Invalid Blog Id");
    }

    if(!req.user?._id){
        throw new apiError(400, "No User Logged In");
    }

    if(!content){
        throw new apiError(400, "Content is Required");
    }

    const comment = await Comment.create({
        blog: blogid,
        content,
        commentedBy: req.user?._id
    })

    if(!comment){
        throw new apiError(500, "Something Went Wrong While Posting The Comment");
    }

    return res
    .status(200)
    .json(new apiResponse(200, comment, "Comment Posting Successful"))
})

const deleteComment = asyncHandler( async (req, res)=>{
    const {commentid} = req.params;

    if(!isValidObjectId(commentid)){
        throw new apiError(400, "Invalid Comment Id");
    }

    if(!req.user?._id){
        throw new apiError(400, "No User Logged In");
    }

    const currentComment = await Comment.findById(commentid);

    if(!currentComment.commentedBy.equals(req.user?._id)){
        throw new apiError(400, "You Are Not Authorized To Delete The Comment");
    }

    const comment = await Comment.findByIdAndDelete(currentComment._id)

    if(!comment){
        throw new apiError(500, "Something Went Wrong While Updating The Comment");
    }

    return res
    .status(200)
    .json(200, comment, "Comment Delete Successful")
})

const updateComment = asyncHandler( async (req, res)=>{
    const {content} = req.body;
    const {commentid} = req.params;

    if(!isValidObjectId(commentid)){
        throw new apiError(400, "Invalid Comment Id");
    }

    if(!req.user?._id){
        throw new apiError(400, "No User Logged In");
    }

    if(!content){
        throw new apiError(400, "Content is Required");
    }

    const currentComment = await Comment.findById(commentid);

    if(!currentComment.commentedBy.equals(req.user?._id)){
        throw new apiError(400, "You Are Not Authorized To Update The Comment");
    }

    const comment = await Comment.findByIdAndUpdate(
        currentComment._id,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if(!comment){
        throw new apiError(500, "Something Went Wrong While Updating The Comment");
    }

    return res
    .status(200)
    .json(new apiResponse(200, comment, "Comment Update Successful"))
})

const getAllComment = asyncHandler( async (req, res)=>{
    const {blogid} = req.params;

    if(!isValidObjectId(blogid)){
        throw new apiError(400, "Invalid Blog Id")
    }

    if(!req.user?._id){
        throw new apiError(400, "No User Logged In")
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                blog: new mongoose.Types.ObjectId(blogid)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'commentedBy',
                foreignField: '_id',
                as: 'commentedBy',
                pipeline: [
                    {
                        $project: {
                            uName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                commentedBy: {
                    $first: '$commentedBy'
                }
            }
        },
        {
            $project: {
                content: 1,
                commentedBy: 1,
                createdAt: 1
            }
        }
    ])

    if(!comments){
        throw new apiError(500, "Something Went Wrong While Fetching Comments")
    }
    
    return res
    .status(200)
    .json(new apiResponse(200, comments, "Comments Fetched Successfully"))
})

export {addComment, deleteComment, updateComment, getAllComment};