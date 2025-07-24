// src/index.ts
import express, { Request, Response, NextFunction }  from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import {connectToDB} from "./config/db-connection"
import cors from "cors";
import { adminRouter } from './router/admin-router';
import { customerRouter } from './router/customer-router';
import { logErrors, logRequests } from './middleware';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
// const HOST = parseInt(process.env.HOST, 10)
const HOST = '0.0.0.0'

// CORS
app.use(
  cors({
    credentials: true,
    origin: true,
    optionsSuccessStatus: 200,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    preflightContinue: false,
    // allowedHeaders: [
    //   "Authorization",
    //   "Content-Type",
    //   "Origin",
    //   "Accept",
    //   "Access-Control-Allow-Request-Method",
    // ],
    exposedHeaders: ['Content-Disposition'],
  })
);

// Will be used in production to restrict origins
// const allowedOrigins = ["https://yourapp.com", "https://admin.yourapp.com"];

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//     methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
//     optionsSuccessStatus: 200,
//   })
// );

app.use(express.json());
app.use(logRequests);

app.use(express.urlencoded({ extended: true }));

// ✅ session must be here BEFORE routes
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // set to true if using https
    httpOnly: true,
    sameSite: 'lax'
  }
}));
// app.use(router)
app.use('/api/admin', adminRouter);
app.use('/api/customer', customerRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
  console.warn(`⚠️ 404 Not Found - ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Not Found' });
});

app.use(logErrors); 

// app.get('/', (_req, res) => {
//   res.send('Hello from TypeScript + MongoDB!');
// });

app.get("/ping", (_req, res) => {
    res.send("Ping successfull awards 😊");
  });

const startServer = async () => {
  await connectToDB();

  app.listen(PORT,HOST, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

startServer();
