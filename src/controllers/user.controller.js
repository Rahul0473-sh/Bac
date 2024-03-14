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

  const existedUser = await Users.findOne({
    $or: [{ username }, { email }], //to check multiple variable
  });
  if (existedUser) {
    throw new ApiError(409, "User already Existed with username or email");
  }
  const avatarlocalpath = req.files?.avatar[0].path;
  const coverImagelocalpath = req.files?.coverImage[0].path;

  // Now upload on Cloudinary
  if (!avatarlocalpath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarlocalpath);
  const coverImage = await uploadOnCloudinary(coverImagelocalpath);

  if (!avatar) {
    throw new ApiError(400, "Avatar url is not achived");
  }
  const user = await Users.create({
    fullName,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage.url || "",
    password,
    email,
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

const genrateAccessTokenandRefreshToken = (userid) => {
  try {
    const user = Users.findById(userid);
    const accessToken = user.genrateAccessToken();
    const refreshToken = user.genrateRefreshToken();

    // Now im storing the refresh Token and sending the accessToken to the User
    //syntax to update object of mongodb
    user.refreshToken = refreshToken;
    // when i update the this rest of all the object allso kicksin

    user.save({ validateBeforeSave: false }); // so it will helps

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while Genrating refreshtoken and accessToken"
    );
  }
};

export const loginUser = asyncHandler(async (req, res) => {
  //some steps
  //1 getdata form req.body, 2) check the user or email present, 3)check password
  //4)genrate refresh token,access token 5)send in cookies 6)

  const { password, username, email } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "Username or Email is required");
  }
  const user = await Users.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User is not registerd");
  }
  const isPassWordCorrect = user.isPassWordCorrect(password);
  if (!isPassWordCorrect) {
    throw new ApiError(401, "User credidential's are wrong");
  }
  // genrate access token and refresh token

  const { accessToken, refreshToken } = await genrateAccessTokenandRefreshToken(
    user._id
  );
  const loggedinUser = Users.findById(user._id).select(
    "-password, -refreshToken"
  );
  // send cookies
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedinUser,
          accessToken,
          refreshToken,
        },
        "User Logged in Succesfully"
      )
    );
});
export const logoutUser = asyncHandler(async (req, res) => {
  // Now i have to add my middleware so that i can get access just like req.cookie
  await Users.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{},"User logged Out SuccessFully"));
});
