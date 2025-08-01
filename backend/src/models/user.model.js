import mongoose, {Schema} from 'mongoose'
import bcrypt from 'bcrypt';

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,   
        required: true,
        minlength: 6,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    bio: {
        type: String,
        default: "Hii there!, I'am using chat-app"
    },
    profilePicture: {
        type: String,
    }
}, { timestamps: true })


userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            next();
        } catch (error) {
            next(error);
        }
    }   
    else {
        next();
    }
});

const User = mongoose.model('User', userSchema);
export default User;