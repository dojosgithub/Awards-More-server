import { Router, Request, Response, NextFunction } from "express";
import { customerRouter as clientRouter } from "./customer-router";



const customerRouter: Router = Router({ mergeParams: true });

// Optional: Set global headers
customerRouter.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Mount user routes using base path from constants
customerRouter.use(clientRouter);


export { customerRouter };
