import mongoose, {Schema} from "mongoose";

const messageSchema = mongoose.Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    isSeen: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
},{ timestamps: true })

const Message = mongoose.model("Message", messageSchema);
export default Message;