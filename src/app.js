import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

export const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "16kb" })); // Now parser does'nt require for this
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser()); // cookies access from user's browser
app.use(express.json);

import userRouter from "./routes/user.router.js";
// router declartion
app.use("/users",userRouter)
