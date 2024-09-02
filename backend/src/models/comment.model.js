import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        blog: {
            type: Schema.Types.ObjectId,
            ref: "Blog"
        },
        content: {
            type: String,
            required: [true, "Comment Content Required"]
        },
        commentedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

commentSchema.plugin(mongooseAggregatePaginate);

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;