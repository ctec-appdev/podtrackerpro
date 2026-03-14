import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const webhookEventSchema = mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    eventId: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
webhookEventSchema.plugin(toJSON);

export default mongoose.models.WebhookEvent ||
  mongoose.model("WebhookEvent", webhookEventSchema);
