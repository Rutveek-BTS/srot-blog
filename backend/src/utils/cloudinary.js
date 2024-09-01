import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    API_KEY: process.env.CLOUDINARY_API_KEY,
    API_SECRET: process.env.CLOUDINARY_API_SECRET
})

const uploadImage = async (localFilePath) =>{
    try{
        if(!localFilePath) return null

        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "image"
            }
        )

        fs.unlinkSync(localFilePath);
        return response;
    }catch(err){
        fs.unlinkSync(localFilePath);
        return null;
    }
}

const uploadVideo = async (localFilePath) =>{
    try{
        if(!localFilePath) return null

        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "video"
            }
        )

        fs.unlinkSync(localFilePath);
        return response;
    }catch(err){
        fs.unlinkSync(localFilePath);
        return null;
    }
}

const deleteImage = async (fileUrl) => {
    try {
        if(!fileUrl) return null;

        // Get Image Name using Image URL
        const arrayURL = fileUrl.split("/") // Makes the array of the URL. Splitting from "/"
        const imageNameExt = arrayURL.pop() // Gives the last element of the array eg. "sample.jpg"
        const imageName = imageNameExt.split(".")[0];

        // Delete File From Cloudinary using imageName
        const response = await cloudinary.uploader.destroy(imageName, {resource_type: "image"})

        return response;
    } catch (error) {
        return null;
    }
}

const deleteVideo = async (fileUrl) => {
    try {
        if(!fileUrl) return null;

        // Get Image Name using Video URL
        const arrayURL = fileUrl.split("/") // Makes the array of the URL. Splitting from "/"
        const videoNameExt = arrayURL.pop() // Gives the last element of the array eg. "sample.mp4"
        const videoName = videoNameExt.split(".")[0];

        // Delete File From Cloudinary using imageName
        const response = await cloudinary.uploader.destroy(videoName, {resource_type: "video"})

        return response;
    } catch (error) {
        return null;
    }
}

export {uploadImage, uploadVideo, deleteImage, deleteVideo};