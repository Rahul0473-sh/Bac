import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Users } from "../models/users.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const registerUser = asyncHandler(async (req, res) => {
  // steps that are nessary
  // Validation
  // check if user already exist ->email,password
  // check for images check for avatar
  // upload them to cloudinary
  //creater user object /
  // remove passowrd and refresh token from password,
  // check for usercreation
  //return for user createino
  //return response
  const { fullName, email, password, username } = req.body;
  if (
    [fullName, email, password, username].some((field) => field?.trim == "") //some method
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = Users.findOne({
    $or: [{ username }, { email }], //to check multiple variable
  });

  if (existedUser) {
    throw new ApiError(409, "User already Existed with username or email");
  }
  const avatarlocalpath = req.files?.avatar[0].path;
  const coverImagelocalpath = req.files?.coverImage[0].path;
  console.log("req files", req.files);
  // Now upload on Cloudinary
  if (!avatarlocalpath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarlocalpath);
  const coverImage = await uploadOnCloudinary(coverImagelocalpath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  const user = await Users.create({
    fullName,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage.url || "",
    password,
    email
  });

  // here i have to check that is that is it uploaded on mongodb
  const createdUser = Users.findById(user._id).select(
    "-password -refreshToken"
  );
  // now checking and as well as removing password and refresh token from password
  if (!createdUser) {
    throw new ApiError(500, "there is something wrong while registering user ");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User register Successfully"));
});
