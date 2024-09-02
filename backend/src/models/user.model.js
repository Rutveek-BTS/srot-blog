import mongoose, {Schema} from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new Schema(
    {
        fName: {
            type: String,
            required: [true, "First Name Required"],
            trim: true,
            index: true
        },
        lName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        uName: {
            type: String,
            required: [true, "Last Name Required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: [true, "Email Required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        password: {
            required: [true, "Password Required"]
        },
        avatar: {
            type: String,
            required: [true, "Avatar Required"],
        },
        coverImg: {
            type: String
        },
        savedBlog: [
            {
                type: Schema.Types.ObjectId,
                ref: "Blog"
            }
        ],
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next(); 
})


userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = async function(){
    jwt.sign({
        _id: this._id,
        uName: this.uName,
        email: this.email
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}

const User = mongoose.model("User", userSchema);

export default User;