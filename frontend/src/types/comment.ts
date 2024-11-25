export interface commentCreate{
    blog: string,
    content: string,
    commentedBy: string
}

export interface commentResponse extends commentCreate{
    _id: string
}

export type commentId = Pick<commentResponse, "_id">

export type commentUpdate = commentResponse