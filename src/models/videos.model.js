import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const Videos_schema = new Schema(
  {
    thumbnail: {
      type: String,
      required: true,
    },
    videoFile: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    Title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number, // get from cloudinary
      required: true,
    },
  },
  { timestamps: true }
);

Videos_schema.plugin(mongooseAggregatePaginate);
export const Videos = mongoose.model("Videos", Videos_schema);
