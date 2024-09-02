import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const followSchema = new Schema(
    {
        blogger: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        follower: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

followSchema.plugin(mongooseAggregatePaginate);

const Follow = mongoose.model("Follow", followSchema);

export default Follow;