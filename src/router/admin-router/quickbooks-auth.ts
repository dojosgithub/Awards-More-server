import { Router } from "express";
import { authController } from "../../controllers/admin";
import { asyncHandler } from "../../util/async-handles";
import Paths from "./paths";


const quickbooksAuthRouter: Router = Router({ mergeParams: true });

//? @api  = /signup
//? @desc = Register a new user
quickbooksAuthRouter.get(Paths.Auth.auth.login, asyncHandler(authController.quickbooksLogin));
quickbooksAuthRouter.get(Paths.Auth.auth.callback, asyncHandler(authController.quickbooksLogin));

// quickbooksAuthRouter.get(Paths.Auth.auth.callback, asyncHandler(authController.quickbooksLoginCallback));

// quickbooksAuthRouter.post(Paths.Auth.login, asyncHandler(authController.login));

// quickbooksAuthRouter.post(Paths.Auth.forgotPassword, asyncHandler(authController.forgotPasswordSendCode));

// quickbooksAuthRouter.post(Paths.Auth.verify, asyncHandler(authController.verifyToken));

export { quickbooksAuthRouter };
