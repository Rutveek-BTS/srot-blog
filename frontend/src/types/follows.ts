export interface createFollow {
    blogger: string,
    follower: string
}

export interface followResponse extends createFollow{
    _id: string
}