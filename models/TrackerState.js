import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const trackerStateSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    niches: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    keywords: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    trends: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    briefs: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    seo: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    inventory: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    performance: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

trackerStateSchema.plugin(toJSON);

export default mongoose.models.TrackerState || mongoose.model("TrackerState", trackerStateSchema);
