import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    image: {
      type: String,
    },
    customerId: {
      type: String,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      index: true,
    },
    priceId: {
      type: String,
    },
    stripePriceId: {
      type: String,
    },
    subscriptionStatus: {
      type: String,
      default: "inactive",
    },
    hasAccess: {
      type: Boolean,
      default: false,
    },
    plan: {
      type: String,
      enum: ["free", "starter", "business"],
      default: "free",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

userSchema.plugin(toJSON);

export default mongoose.models.User || mongoose.model("User", userSchema);
