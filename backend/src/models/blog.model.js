import mongoose, {Schema} from 'mongoose'
import mongoosePaginateAggregate from "mongoose-aggregate-paginate-v2"

const blogSchema = new Schema(
    {
        title:{
            type: String,
            required: [true, "Blog Title Required"]
        },
        content: {
            type: String,
            required: [true, "Blog Content Required"]
        },
        blogImg: [{
            type: String,
            required: [true, "Blog Images Required"]
        }],
        author: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

blogSchema.plugin(mongoosePaginateAggregate);

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;