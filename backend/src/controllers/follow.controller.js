import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import User from "../models/user.model.js";
import Follow from "../models/follow.model.js";
import mongoose, {isValidObjectId} from "mongoose";

const toggleFollow = asyncHandler( async (req, res)=>{
    const {userid} = req.params;

    if(!isValidObjectId(userid)){
        throw new apiError(400, "Invalid User Id");
    }

    if(!req.user?._id){
        throw new apiError(400, "No User Logged In");
    }

    const currentUser = await Follow.findOne({
        blogger: userid,
        follower: req.user?._id
    })

    if(currentUser){
        await Follow.findByIdAndDelete(currentUser._id);
        return res
        .status(200)
        .json(new apiResponse(200, {}, "Blogger Unfollowed Successfully"));
    }

    const newFollow = await Follow.create({
        blogger: userid,
        follower: req.user?._id
    })

    if(!newFollow){
        throw new apiError(500, "Something Went Wrong While Following The User");
    }

    return res
    .status(200)
    .json(new apiResponse(200, newFollow, "Blogger Followed Successfully"))
})

const getAllFollowers = asyncHandler( async (req, res)=>{
    const {userid} = req.params;
    
    if(!isValidObjectId(userid)){
        throw new apiError(400, "Invalid User Id")
    }

    if(!req.user?._id){
        throw new apiError(400, "No User Logged In")
    }

    const followers = await Follow.aggregate([
        {
            $match: {
                blogger: new mongoose.Types.ObjectId(userid)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'follower',
                foreignField: '_id',
                as: 'followerDetails',
                pipeline: [
                    {
                        $addFields: {
                            followerDetails: {
                                $first: '$followerDetails'
                            }
                        }
                    },
                    {
                        $project: {
                            uName: 1,
                            fName: 1,
                            lName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        }
    ])
    
    if(!followers){
        throw new apiError(400, "Something Went Wrong While Fetching The Followers")
    }

    return res
    .status(200)
    .json(new apiResponse(200, followers, 'Followers Fetched Successfully'))
})

const getAllFollowing = asyncHandler( async (req, res)=>{
    const {userid} = req.params;
    
    if(!isValidObjectId(userid)){
        throw new apiError(400, "Invalid User Id")
    }

    if(!req.user?._id){
        throw new apiError(400, "No User Logged In")
    }

    const followings = await Follow.aggregate([
        {
            $match: {
                follower: new mongoose.Types.ObjectId(userid)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'blogger',
                foreignField: '_id',
                as: 'followingDetails',
                pipeline: [
                    {
                        $project: {
                            uName: 1,
                            fName: 1,
                            lName: 1, 
                            avatar: 1
                        }
                    }
                ]
            }
        }
    ])

    if(!followings){
        throw new apiError(400, "Something Went Wrong While Fetching Followings")
    }

    return res
    .status(200)
    .json(new apiResponse(200, followings, "Followings Fetched Successfully"))
})

export {toggleFollow, getAllFollowers, getAllFollowing}