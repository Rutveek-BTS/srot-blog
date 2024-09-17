import mongoose,{isValidObjectId} from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { uploadMultipleImages, deleteMultipleImages} from "../utils/cloudinary.js";
import Blog from "../models/blog.model.js";
import User from "../models/user.model.js";

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
    const {blogid} = req.params;

    if(!isValidObjectId(blogid)){
        throw new apiError(400, "Invalid Blog Id")
    }

    if(!req.user?._id){
        throw new apiError(400, "No User Logged In")
    }

    const blog = await Blog.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(blogid)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'author',
                foreignField: '_id',
                as: 'author',
                pipeline: [
                    {
                        $lookup: {
                            from: 'follows',
                            localField: '_id',
                            foreignField: 'blogger',
                            as: 'blogger'
                        }
                    },
                    {
                        $addFields: {
                            doFollow: {
                                $cond: {
                                    if: {
                                        $in: [new mongoose.Types.ObjectId(req.user?._id), '$blogger.follower']
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            uName: 1,
                            fName: 1,
                            lName: 1,
                            doFollow: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: 'likes',
                localField: '_id',
                foreignField: 'blog',
                as: 'likes',
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'likedBy',
                            foreignField: '_id',
                            as: 'likedBy',
                            pipeline: [
                                {
                                    $project: {
                                        uName: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            likedBy: {
                                $first: '$likedBy'
                            }
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: 'comments',
                localField: '_id',
                foreignField: 'blog',
                as: 'comments',
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'commentedBy',
                            foreignField: '_id',
                            as: 'commentedBy',
                            pipeline: [
                                {
                                    $project: {
                                        uName: 1
                                    }
                                },
                            ]
                        }
                    },
                    {
                        $addFields: {
                            commentedBy: {
                                $first: '$commentedBy'
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                author: {
                    $first: '$author'
                },
                likeCount: {
                    $size: '$likes'
                },
                commentCount: {
                    $size: '$comments'
                },
            }
        }  
    ])

    if(!blog){
        throw new apiError(400, "No Such Blog Found");
    }

    if(!blog[0].author._id.equals(req.user._id)){
        console.log('User No Author')
        if(blog[0].isPublished === false){
            throw new apiError(400, "You Are Not Authorized To View This Blog")
        }
    }

    return res
    .status(200)
    .json(new apiResponse(200, blog[0], "Blog Fetched Successfully"))
})

const getAllBlogs = asyncHandler( async (req,res)=>{
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const pipeline = [];

    if(query){
        pipeline.push({
            $search: {
                $index: "search-blogs",
                $text: {
                    $query: query,
                    $path: ["$title", "$content"]
                }
            }
        })
    }

    if(userId){
        if(!isValidObjectId(userId)){
            throw new apiError(400, "Invalid User Id");
        }

        pipeline.push({
            $match: {
                uploader: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    pipeline.push({ $match: { isPublished: true } });

    if(sortBy && sortType){
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc"? 1 : -1
            }
        });
    }else{
        pipeline.push({
            $sort: {
                createdAt: -1
            }
        })
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localFieldL: "author",
                foreignField: "_id",
                as: "author",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            uName: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$author"
        }
    )

    const blogAggregation = await Blog.aggregate(pipeline);

    if(!blogAggregation){
        throw new apiError(400, "Failed To Fetch Blogs");
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const blogs = await Blog.aggregatePaginate(blogAggregation, options);

    if(!blogs){
        throw new apiError(400, "Failed To Fetch Blogs");
    }

    return res
    .status(200)
    .json(new apiResponse(200, blogs, "Blogs Fetched Successfully"))
})

const updateBlog = asyncHandler( async (req,res)=>{
    const {blogid} = req.params;
    const {title, content} = req.body;
    const blogImgFilePaths = req.files?.blogImg; 

    if(!isValidObjectId(blogid)){
        throw new apiError(400, "Invalid Blog Id");
    }

    if(!(title && content)){
        throw new apiError(400, "Both Title And Body Required");
    }

    if(!req.user?._id){
        throw new apiError(400, "No User Logged In");
    }

    const fetchedBlog = await Blog.findById(blogid);

    if(!fetchedBlog){
        throw new apiError(400, "Something Went Wrong While Updating The Blog. Try Again.")
    }

    if(!fetchedBlog.author._id.equals(req.user._id)){
        throw new apiError(400, "You Are Not Authorized To Modify This Blog")
    }

    let blogImagesURLArray = fetchedBlog.blogImg
    
    if(blogImgFilePaths){
        const blogImagesArray = await uploadMultipleImages(blogImgFilePaths);
        
        await deleteMultipleImages(blogImagesURLArray)

        blogImagesURLArray = blogImagesArray.map( blogImages => blogImages.url)
    
        if(!blogImagesURLArray){
            await deleteMultipleImages(blogImagesURLArray);
            throw new apiError(500, "Something Went Wrong While Uploading The Blog Images. Try Again.");
        }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
        blogid,
        {
            $set: {
                title,
                content,
                blogImg: blogImagesURLArray
            }
        },
        {
            new: true
        }
    )

    if(!updatedBlog){
        throw new apiError(400, "Something Went Wrong While Updating The Blog")
    }

    return res
    .status(200)
    .json(new apiResponse(200, updatedBlog, "Blog Updated Successfully"))
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
    const {blogid} = req.params;

    if(!isValidObjectId(blogid)){
        throw new apiResponse(400, "Invalid Blog Id")
    }
    
    if(!req.user?._id){
        throw new apiError(400, "No User Logged In")
    }

    const blogSaved = await User.findByIdAndUpdate(
        req.user._id,
        {
            $addToSet: {
                savedBlog: blogid
            }
        },
        {
            new: true
        }
    )

    if(!blogSaved){
        throw new apiError(400, "Something Went Wrong While Saving THe Blog");
    }

    return res
    .status(200)
    .json(new apiResponse(200, blogSaved, "Blog Saved Successfully in the User's Account"))
})

const removeBlog = asyncHandler( async (req, res)=>{
    const {blogid} = req.params;

    if(!isValidObjectId(blogid)){
        throw new apiResponse(400, "Invalid Blog Id")
    }
    
    if(!req.user?._id){
        throw new apiError(400, "No User Logged In")
    }

    const blogRemoved = await User.findByIdAndUpdate(
        req.user._id,
        {
            $pull:{
                savedBlog: blogid
            }
        },
        {
            new: true
        }
    )

    if(!blogRemoved){
        throw new apiError(400, "Something Went Wrong While Removing The Saved Blog From User Account")
    }

    return res
    .status(200)
    .json(new apiResponse(200, blogRemoved, "Blog Removed Successfully"))
})

export {createBlog, getBlogById, getAllBlogs, updateBlog, deleteBlog, toggleBlogPublish, saveBlog, removeBlog};