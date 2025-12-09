
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    roomType: {
      type: String,
      enum: ["private", "event"],
      default: "private",
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: false,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // For private messages receiver is present; for event/group messages receiver is null
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    message: {
      type: String,
      required: true,
    },
    isReadBy: {
      // store array of userIds who have read this message (useful for group read receipts)
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ event: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
