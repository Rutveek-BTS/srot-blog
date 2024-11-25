export interface blogCreate{
    title: string,
    content: string,
    blogImg: File,
    author: string,
}

export interface blogResponse extends blogCreate{
    _id: boolean,
    isPublished: boolean
}

export type blogUpdate = Omit<blogCreate, "author">

export type blogId = Pick<blogResponse, "_id">