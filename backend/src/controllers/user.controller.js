import apiError from "../utils/apiError.js";
import apiResponse from '../utils/apiResponse.js';
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import {deleteImage, uploadImage} from "../utils/cloudinary.js";
import fs from 'fs';
import jwt from 'jsonwebtoken';
import mongoose, { isValidObjectId } from "mongoose";

const generateAccessRefreshToken = async (userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken};

    }catch(err){
        throw new apiError(400, "Something Went Wrong While Generating Access and Refresh Token");
    }
}

const options = {
    httpOnly: true,
    secure: true
}

const registerUser = asyncHandler(async (req, res) => {
    const {fName, lName, uName, email, password} = req.body;

    if([fName, lName, uName, email, password].some( (field) => field?.trim()==="")){
        throw new apiError(401, "All Fields Are Required");
    }

    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new apiError(401, "Avatar is Required");
    }

    const existingUser = await User.findOne({
        $or: [{uName}, {email}]
    })

    if(existingUser){
        if(avatarLocalPath) fs.unlinkSync(avatarLocalPath)
        throw new apiError(401, "User Already Exists");
    }

    const avatar = await uploadImage(avatarLocalPath);

    if(!avatar){
        throw new apiError(400, "Something Went Wrong While Uploading Avatar");
    }

    const createdUser = await User.create({
        fName,
        lName,
        uName: uName.toLowerCase(),
        email,
        password,
        avatar: avatar.url
    })

    if(!createdUser){
        await deleteImage(avatar.url);
        throw new apiError(400, "Something Went Wrong With User Registration. Try Again.")
    }

    const user = await User.findById(createdUser._id).select("-password -refreshToken");

    return res
    .status(200)
    .json(new apiResponse(200, user, "User Registration Successful"));
})

const loginUser = asyncHandler( async (req, res) => {
    const {uName, email, password} = req.body;

    if(!(uName || email)){
        throw new apiError(400, "User Name or Email is Required");
    }

    if(!password){
        throw new apiError(400, "Password is Required")
    }

    const user = await User.findOne({
        $or: [{uName}, {email}]
    })

    if(!user){
        throw new apiError(400, "No Such User Found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new apiError(400, "Password Invalid");
    }

    const {accessToken, refreshToken} = await generateAccessRefreshToken(user._id);

    const loggedUser = await User.findById(user._id).select('-password -refreshToken');

    return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken,  options)
    .json(new apiResponse(200, {user: loggedUser}, "User Login Successful."))
    
})

const logoutUser = asyncHandler( async (req, res) => {
    const user = req.user;

    await User.findByIdAndUpdate(
        user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )
    
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User Logged Out Successfully"))
})

const refreshingRToken = asyncHandler( async (req, res) => {
    try{
        const incomingRefreshToken = req.cookies.refreshToken;

        if(!incomingRefreshToken){
            throw new apiError(400, "No Logged User Found")
        }

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if(!user){
            throw new apiError(400, "Invalid Refresh Token");
        }

        if(incomingRefreshToken !== user.refreshToken){
            throw new apiError(400, "Refresh Token Expired or used");
        }

        const {accessToken, refreshToken} = await generateAccessRefreshToken(user._id);

        return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(new apiResponse(200, {accessToken, refreshToken}, "Token Refreshed Successfully"))
    }catch(err){
        throw new apiError(500, err?.message || "Something went wrong from our side")
    }
})

const getUser = asyncHandler( async (req, res) => {
    const {userId} = req.params;

    if(!isValidObjectId(userId)){
        throw new apiError(400, "Not A Valid User Id")
    }

    if(!req.user?._id){
        throw new apiError(400, "No User Logged In")
    }

    const user = await User.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(userId)
          }
        },
        {
          $lookup: {
            from: 'follows',
            localField: '_id',
            foreignField: 'blogger',
            as: 'followers',
            pipeline: [
              {
                $lookup: {
                  from: 'users',
                  localField: 'follower',
                  foreignField: '_id',
                  as: 'followerDetails',
                  pipeline: [
                    {
                      $project: {
                        'uName': 1,
                        'avatar': 1
                      }
                    }
                  ]
                }
              },
              {
                $addFields: {
                    doFollow: {
                      $cond: {
                        if : {$eq: ['$follower', new mongoose.Types.ObjectId(req.user?._id)]},
                        then: true,
                        else: false
                      }
                    }
                }
              },
              {
                $project: {
                    followerDetails: 1,
                    doFollow: 1
                }
              }
            ]
          }
        },
        {
            $lookup: {
              from: 'follows',
              localField: '_id',
              foreignField: 'follower',
              as: 'followings',
              pipeline: [
                {
                  $lookup: {
                    from: 'users',
                    localField: 'blogger',
                    foreignField: '_id',
                    as: 'followingDetails',
                    pipeline: [
                      {
                        $project: {
                          'uName': 1,
                          'avatar': 1
                        }
                      }
                    ]
                  }
                },
                {
                    $addFields: {
                        doFollow: {
                          $cond: {
                            if : {$eq: ['$follower', new mongoose.Types.ObjectId(req.user?._id)]},
                            then: true,
                            else: false
                          }
                        }
                    }
                  },
                {
                    $project: {
                        followingDetails: 1,
                        doFollow: 1
                    }
                }
              ]
            }
        },
        {
          $project: {
              uName: 1,
              fName: 1,
              lName: 1,
              avatar: 1,
              coverImg: 1,
              followers: 1,
              followerCount: {
                $size: '$followers'
              },
              followings: 1,
              followingCount: {
                $size: '$followings'
              }
          }
        }
      ])
    
    if(!user){
        throw new apiError(400, "No Such User Found")
    }

    return res
    .status(200)
    .json(new apiResponse(200, user, "user Fetched Successfully"))
})

const getUserProfile = asyncHandler( async (req, res) => {
    if(!req.user?._id){
        throw new apiError(400, "No User Logged In");
    }

    const user = await User.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(req.user?._id)
          }
        },
        {
          $lookup: {
            from: 'follows',
            localField: '_id',
            foreignField: 'blogger',
            as: 'followers',
            pipeline: [
              {
                $lookup: {
                  from: 'users',
                  localField: 'follower',
                  foreignField: '_id',
                  as: 'followerDetails',
                  pipeline: [
                    {
                      $project: {
                        'uName': 1,
                        'avatar': 1
                      }
                    }
                  ]
                }
              },
              {
                $addFields: {
                    doFollow: {
                      $cond: {
                        if : {$eq: ['$follower', new mongoose.Types.ObjectId(req.user?._id)]},
                        then: true,
                        else: false
                      }
                    }
                }
              },
              {
                $project: {
                    followerDetails: 1,
                    doFollow: 1
                }
              }
            ]
          }
        },
        {
            $lookup: {
              from: 'follows',
              localField: '_id',
              foreignField: 'follower',
              as: 'followings',
              pipeline: [
                {
                  $lookup: {
                    from: 'users',
                    localField: 'blogger',
                    foreignField: '_id',
                    as: 'followingDetails',
                    pipeline: [
                      {
                        $project: {
                          'uName': 1,
                          'avatar': 1
                        }
                      }
                    ]
                  }
                },
                {
                    $project: {
                        followingDetails: 1,
                    }
                }
              ]
            }
        },
        {
          $project: {
              uName: 1,
              fName: 1,
              lName: 1,
              avatar: 1,
              coverImg: 1,
              followers: 1,
              followerCount: {
                $size: '$followers'
              },
              followings: 1
          }
        }
      ]
    )

    if(!user){
        throw new apiError(500, "Something Went Wrong While Fetching The User Details")
    }

    return res
    .status(200)
    .json(new apiResponse(200, user, "Data Fetched Successfully"))
})

const getFavouriteBlogs = asyncHandler( async (req, res) => {
    if(!req.user?._id){
        throw new apiError(400, "No User Logged In");
    }

    const blog = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: 'blogs',
                localField: 'savedBlog',
                foreignField: '_id',
                as: 'favouriteBlogs',
                pipeline: [
                    {
                        $match: {
                            isPublished: true
                        }
                    }
                ]
            }
        },
        {
            $project: {
                favouriteBlogs: 1
            }
        }
    ])

    return res
    .status(200)
    .json(new apiResponse(200, blog, "Blogs Fetched Successfully"))
})

const updateUserDetails = asyncHandler( async (req, res) => {
    const {fName, lName} = req.body;
    const currentUser = req.user;

    if(!currentUser){
        throw new apiError(400, "No User Logged In")
    }

    if(!(fName && lName)){
        throw new apiError(400, "All Field Are Required.")
    }

    const updatedUser = await User.findByIdAndUpdate(
        currentUser._id,
        {
            $set: {
                fName,
                lName
            }
        },
        {
            new: true
        }
    )

    if(!updatedUser){
        throw new apiError(500, "Error Occured While Updating The User. Try Again.")
    }

    return res
    .status(200)
    .json(new apiResponse(200, updatedUser, "User Details Updated Successfully Updated"));
})

const updateAvatar = asyncHandler( async (req, res) => {
    const currentUser = req.user;

    if(!currentUser){
        throw new apiError(400, "Not User Logged In");
    }

    const newAvatar = req.file?.path;

    if(!newAvatar){
        throw new apiError(400, "No File Found");
    }

    await deleteImage(currentUser.avatar);

    const avatar = await uploadImage(newAvatar);

    if(!avatar){
        throw new apiError(500, "Something Went Wrong While Uploading The Avatar");
    }

    const modifiedUser = await User.findByIdAndUpdate(
        currentUser._id,
        {
            $set: {
                avatar
            }
        },
        {
            new: true
        }
    )

    if(!modifiedUser){
        throw new apiError(500, "Something Went Wrong WHile Updating The User.");
    }

    return res
    .status(200)
    .json(new apiResponse(200, modifiedUser, "Avatar Updated Successfully"));
})

const updateCoverImage = asyncHandler( async (req, res) => {
    const currentUser = req.user;

    if(!currentUser){
        throw new apiError(400, "Not User Logged In");
    }

    const newCoverImg = req.file?.path;

    if(!newCoverImg){
        throw new apiError(400, "No File Found");
    }

    await deleteImage(currentUser.coverImg);

    const coverImg = await uploadImage(newCoverImg);

    if(!coverImg){
        throw new apiError(500, "Something Went Wrong While Uploading The Cover Image");
    }

    const modifiedUser = await User.findByIdAndUpdate(
        currentUser._id,
        {
            $set: {
                coverImg
            }
        },
        {
            new: true
        }
    )

    if(!modifiedUser){
        throw new apiError(500, "Something Went Wrong While Updating The User.");
    }

    return res
    .status(200)
    .json(new apiResponse(200, modifiedUser, "Cover Image Updated Successfully"));
})

const changePassword = asyncHandler( async (req, res) => {
    const currentUser = req.user;
    const {currentPassword, newPassword} = req.body;

    if(!(currentPassword && newPassword)){
        throw new apiError(400, "All Required Fields Must Be Filled.")
    }

    if(!currentUser){
        throw new apiError(400, "No User Logged In");
    }

    const userWPas = await User.findById(currentUser._id);

    if(userWPas){
        throw new apiError(500, "Couldn't Fetch the Current User.");
    }

    const isPasswordValid = await userWPas.isPasswordCorrect(currentPassword);

    if(!isPasswordValid){
        throw new apiError(400, "Invalid Current Password");
    }

    const modifiedUser = await User.findByIdAndUpdate(
        currentUser._id,
        {
            $set: {
                password: newPassword
            }
        },
        {
            new: true
        }
    )

    if(!modifiedUser){
        throw new apiError(500, "Something Went Wrong While Updating The User Password");
    }

    const user = await User.findById(modifiedUser._id).select('-password -refreshToken');

    return res
    .status(200)
    .json(new apiResponse(200, user, "User Password Updated Successfully"));
})

export {registerUser, loginUser, logoutUser, refreshingRToken, getUser, getUserProfile, getFavouriteBlogs, updateUserDetails, updateAvatar, updateCoverImage, changePassword}