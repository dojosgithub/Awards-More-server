import { Request, Response } from "express";
// import sessionUtil from "../util/session-util";
import axios from "axios";
import { IStaff } from "../../models";
import HttpStatusCodes from "../../constants/https-status-codes";
import { AuthService } from "../../services/admin";
import sessionUtil from "../../util/session-util";
import { JwtPayload } from "../../util/types";

// Messages
const Message = {
  successSignup: "Sign up successful.",
  successVerified: "Verified success",
  success: "Success",
  error: "An error occurred",
  NotFound: "User not found",
  otpSentSuccess: "OTP sent successfully.",
} as const;

export interface ISignupReq {
  body: {
    username: string;
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    phone: string;
  };
}

interface ILoginReq {
  body: {
    email: string;
    password: string;
  };
  ip: string;
}

export interface IVerifyTotp {
  body: {
    email: string;
    code: string;
    password: string;
  };
    ip: string;
}

export const signup = async (req: Request<{}, {}, IStaff>, res: Response) => {
  const body = req.body as IStaff;
  // Signup
  const user = await AuthService.signup(body, res);

  // Return
  return res
    .status(HttpStatusCodes.OK)
    .json({ data: user, message: Message.successSignup });
};

/**
 * Login a user.
 */
export const login = async (req: Request, res: Response) => {
  const body = req.body as IStaff;
  const { ip } = req;
  console.log("IP", ip);

  // Login
  const staff = await AuthService.login(body);

  const jwtPayload: JwtPayload = {
    id: staff?._id.toString(),
    email: staff?.email,
    role: staff?.role,
  };

  // // Setup Role Cookie
  // await SessionUtil.addRoleTokenCookie(res, jwtPayload);

  // Create access token & refresh token
  const tokens = await sessionUtil.generateJWTtokens(jwtPayload, ip as string);

  // Setup Refresh token Cookie
  await sessionUtil.addRefreshTokenCookie(res, tokens.refreshToken);

  return res.status(HttpStatusCodes.OK).json({ staff, token: tokens });
};

export const forgotPasswordSendCode = async (req: Request, res: Response) => {
  const body = req.body;
  const token = await AuthService.forgotPasswordSendCode(body);

  // Return
  return res
    .status(HttpStatusCodes.OK)
    .json({ token: token, message: Message.otpSentSuccess });
};

export const verifyToken = async (req: IVerifyTotp, res: Response) => {
  const { email, code, password } = req.body;
  const { ip } = req;
  console.log("Email", email);

  const user = await AuthService.verifyToken(email, code, password, ip, res);

  return res
    .status(HttpStatusCodes.OK)
    .json({ user, message: Message.success });
};
