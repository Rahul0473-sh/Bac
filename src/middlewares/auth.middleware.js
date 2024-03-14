import { Users } from "../models/users.model.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";

const VerifyJwt = async (req, res, next) => {
try {
      const token =
        req.cookie || req.headers("Authorization").replace("Bearer ", "");
      if (!token) {
        throw new ApiError(401, "Unauthorize request");
      }
      // Now check function is valid or not using using jwt function
      const decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // it return me a payload that i used while making access token
      const user = await Users.findById(decodedUser._id);
      if (!user) {
        throw new ApiError(401, "Invalid access Token");
      }
      req.user = user;
      next();
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid access Token");
}
};

export default VerifyJwt;