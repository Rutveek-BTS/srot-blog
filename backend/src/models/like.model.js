import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema(
    {
        blog: {
            type: Schema.Types.ObjectId,
            ref: "Blog"
        },
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

likeSchema.plugin(mongooseAggregatePaginate);

const Like = mongoose.model("Like", likeSchema);

export default Like;