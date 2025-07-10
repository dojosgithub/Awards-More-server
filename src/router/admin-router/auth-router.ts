import { Router } from "express";
import { authController } from "../../controllers/admin";
import { asyncHandler } from "../../util/async-handles";
import Paths from "./paths";


const authRouter: Router = Router({ mergeParams: true });

//? @api  = /signup
//? @desc = Register a new user
authRouter.post(Paths.Auth.Signup, asyncHandler(authController.signup));

authRouter.post(Paths.Auth.login, asyncHandler(authController.login));

export { authRouter };
