import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({
    limit: '16kb' // This is the limit of how much json data can be accepted
}))

app.use(express.urlencoded({ // Used to receive data from URL
    extended: true, // This handles the specials characters in URL like %20 for space, etc
    limit: '16kb' // Max size of data that is acceptable from the URL
}))

app.use(cookieParser()) // Stores and Retrieve Data from Client's Browser

// Import Routes
import userRouter from './routes/user.route.js';
import blogRouter from './routes/blog.route.js';
import followRouter from './routes/follow.route.js';
import likeRouter from './routes/like.route.js';
import commentRouter from './routes/comment.route.js';

app.use('/api/v1/user/', userRouter);
app.use('/api/v1/blog/', blogRouter);
app.use('/api/v1/follow/', followRouter);
app.use('/api/v1/like/', likeRouter);
app.use('/api/v1/comment/', commentRouter);

export { app }