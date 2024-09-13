import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import apiError from "./apiError.js"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadImage = async (localFilePath) =>{
    try{
        if(!localFilePath){
            throw new apiError(400, "Image File Not Found")
        }

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

const uploadMultipleImages = async (localFileArray) =>{
    try{
        if(!localFileArray){
            throw new apiError(400, "Image Files Not Found")
        }

        // Extracting File Path from the File Object and Storing in Array
        const localFilePathArray = localFileArray.map(localFile => localFile.path);
        
        // Initializing response array variable to push uploaded files' object in it
        let response = [];
        
        // Iterating through each path of the localFilePathArray
        for(let imagePath of localFilePathArray){
            // Uploading file on the Cloudinary
            const img = await cloudinary.uploader.upload(
                imagePath,
                {
                    resource_type: "image"
                }
            )
            // Pushing The Uploading Image Object into The Array
            response.push(img)
        }

        // Removing Files From The Local Storage
        for(let path of localFilePathArray){
            fs.unlinkSync(path);
        }

        // Returning The Response
        return response;
    }catch(err){
        // Extracting File Path from the File Object and Storing in Array
        const pathArray = localFileArray.map(localFile=>localFile.path)

        // Removing Files From The Local Storage
        for(let path of pathArray){
            fs.unlinkSync(path);
        }
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

const deleteMultipleImages = async (fileUrlArray) => {
    try {

        if(!fileUrlArray) return null;

        // Iterating through URL array to store URL Image name in Array
        const fileNameArray = fileUrlArray.map( fileUrl => {
            // Get Image Name using Image URL
            const arrayURL = fileUrl.split("/") // Makes the array of the URL. Splitting from "/"
            const imageNameExt = arrayURL.pop() // Gives the last element of the array eg. "sample.jpg"
            const imageName = imageNameExt.split(".")[0];
            return imageName;
        })        

        // Iterate through fileNameArray to destoy each file from the cloudinary
        let response = [];
        for(const fileName of fileNameArray){
            // Delete File From Cloudinary using imageName
            const res = await cloudinary.uploader.destroy(fileName, {resource_type: "image"});
            response.push(res);
        }

        return response;
    } catch (error) {
        return null;
    }
}

export {uploadImage, uploadMultipleImages, deleteImage, deleteMultipleImages};