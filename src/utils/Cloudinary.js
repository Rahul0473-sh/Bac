import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
  try {
    const response = cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded succefullly

    console.log("file is uploaded on this ", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};
