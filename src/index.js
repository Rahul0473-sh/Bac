import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config();

// Define routes before starting the server
app.get("/", (req, res) => {
  res.send("Hello, this is the root path!");
});

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("connection failed due to this", error);
    });
    app.listen(process.env.PORT || 9000, () =>
      console.log(`server is listening on this ${process.env.PORT}`)
    );
  })
  .catch((err) => console.log("MongDB Connect fail", err));
