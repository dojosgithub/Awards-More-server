import { Router, Request, Response, NextFunction } from "express";
import { authRouter } from "./auth-router";
import { employeeRouter } from "./employee-router";


const adminRouter: Router = Router({ mergeParams: true });

// Optional: Set global headers
adminRouter.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Mount user routes using base path from constants
adminRouter.use(authRouter);
adminRouter.use(employeeRouter);

export { adminRouter };
