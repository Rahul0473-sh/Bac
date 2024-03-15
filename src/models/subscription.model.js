import mongoose, { Schema } from "mongoose";

const subscriptionSchema = Schema({
  subscriber: {
    type: Schema.Types.ObjectId,
    ref: "Users",
  },
  channel: {
    type: Schema.Types.ObjectId,
    ref: "Users",
  },
},{timeStamps:true});
export const subscription = mongoose.model("subscription", subscriptionSchema);
