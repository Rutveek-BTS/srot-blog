export interface userCreate{
    fName: string,
    lName: string,
    uName: string,
    email: string,
    password: string,
    avatar?: File
}

export interface userResponse extends userCreate {
    _id: string,
    coverImg: File
}

export type userLogin = Pick<userCreate, "uName" | "email" & "password">

export type userId = Pick<userResponse, "_id">