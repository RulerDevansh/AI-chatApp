import mongoose, {Schema} from 'mongoose'

const connectionSchema = mongoose.Schema({
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
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
        default: 'pending',
    },

},{ timestamps: true })

const Connection = mongoose.model("Connection", connectionSchema);
export default Connection;