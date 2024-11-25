export interface likeCreate {
    blog: string,
    likedBy: string
}

export interface likeResponse extends likeCreate{
    _id: string
}

export type likeId = Pick<likeResponse, "_id">