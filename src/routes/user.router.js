import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"; // this is the multer middleware
import VerifyJwt from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/registers").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1,
    }
]), registerUser); //i have toupload file overhere for that im gonna use multer

router.route("/login").post(loginUser);
router.route("/logout").post(VerifyJwt, logoutUser);
export default router;
