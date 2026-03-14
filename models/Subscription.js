import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const subscriptionSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      trim: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    stripePriceId: {
      type: String,
      trim: true,
    },
    checkoutSessionId: {
      type: String,
      trim: true,
    },
    plan: {
      type: String,
      enum: ["free", "starter", "business"],
      default: "free",
    },
    status: {
      type: String,
      trim: true,
      default: "inactive",
    },
    currentPeriodEnd: {
      type: Date,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

subscriptionSchema.plugin(toJSON);

export default mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);
