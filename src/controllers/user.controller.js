import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Users } from "../models/users.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

export const registerUser = asyncHandler(async (req, res) => {
  // steps that are nessary
  // Validation
  // check if user already exist ->email,password
  // check for images check for avatar
  // upload them to cloudinary
  //creater user object
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
  console.log(req.files);
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

const genrateAccessTokenandRefreshToken = async (userid) => {
  try {
    const user = await Users.findById(userid);
    const accessToken = user.genrateAccessToken();
    const refreshToken = user.genrateRefreshToken();

    // Now im storing the refresh Token and sending the accessToken to the User
    //syntax to update object of mongodb
    user.refreshToken = refreshToken;
    // when i update  this, rest of all the object allso kicksin

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
  const isPassWordCorrect = user.isPassWordCorrect(password); // injected method can use only by instace of model
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
    .json(new ApiResponse(200, {}, "User logged Out SuccessFully"));
});
export const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorize request");
    }
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await Users.findById(decodedToken._id);
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or Used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { refreshToken, accessToken } =
      await genrateAccessTokenandRefreshToken();
    res
      .status(201)
      .cookie("refreshToken", refreshAccessToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        ApiResponse(
          200,
          {
            refreshToken,
            accessToken,
          },
          "Refresh Token genrated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh Token");
  }
});

export const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  // Remember that i will add middleware in this route
  const user = await Users.findById(req.user?._id);

  const isPassWordCorrect = await user.isPassWordCorrect(oldPassword);

  if (!isPassWordCorrect) {
    throw new ApiError(400, "old Password isn't correct");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return res.status(200).json(ApiResponse(200, {}, "Password is changed"));
});
export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(ApiResponse(200, req.user, "User information fetched SuccessFully"));
});
export const upadateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, username } = req.body;
  if (!fullName || !username) {
    throw new ApiResponse(400, "All fields are required");
  }
  const user = await Users.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true, // it will return you the update value in the object
    }
  ).select("-password");

  return res
    .status(200)
    .json(ApiResponse(200, user, "UserName and fullName changed Successfully"));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const avatarlocalpath = req.file?.path;
  if (!avatarlocalpath) {
    throw new ApiError(400, "File isn't recived");
  }
  const avatar = await uploadOnCloudinary(avatarlocalpath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on Cloudinary");
  }
  const user = await Users.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(ApiResponse(200, user, "Avatar file changed successFully"));
});
export const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImagelocalpath = req.file?.path;
  if (!coverImagelocalpath) {
    throw new ApiError(400, "File isn't recived");
  }
  const coverImage = await uploadOnCloudinary(coverImagelocalpath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on Cloudinary");
  }
  const user = await Users.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(ApiResponse(200, user, "coverImage file changed successFully"));
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim) {
    throw new ApiError(400, "Username is missing");
  }
  const channel=await Users.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "Subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedto",
      },
    },
    {
      $addFields: {
        subsciberCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedto",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        // it allows you to return limited values of objects
        fullName: 1,
        username: 1,
        subsciberCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email:1
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(200,
      ApiResponse(200, channel[0], "data fetched SuccessFully")
    )
  }
});

