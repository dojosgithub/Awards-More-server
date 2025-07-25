import { Request, Response } from "express";
// import sessionUtil from "../util/session-util";
import axios from "axios";
import { IStaff, Quickbook } from "../../models";
import HttpStatusCodes from "../../constants/https-status-codes";
import { AuthService } from "../../services/admin";
import sessionUtil from "../../util/session-util";
import { JwtPayload } from "../../util/types";
import qs from "qs";

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
export interface IChangePassword {
  params: { id: string };
  body: {
    oldPassword: string;
    newPassword: string;
  };
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

export const changePassword = async (req: IChangePassword, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.params;
  console.log('running');

  await AuthService.changePassword(oldPassword, newPassword, id, res);

  return res
    .status(HttpStatusCodes.OK)
    .json({ message: "Password updated successfully" });
};
/////// quickbooks auth ////////////

export const quickbooksLogin = async (req: Request, res: Response) => {
  const { code, realmId } = req.query;

  // Step 1: No code → start OAuth flow
  if (!code || !realmId) {
    const queryParams = qs.stringify({
      client_id: process.env.QB_CLIENT_ID,
      redirect_uri: process.env.QB_REDIRECT_URI,
      response_type: "code",
      scope: "com.intuit.quickbooks.accounting openid profile email",
      state: "admin123", // Optional state param
    });

    const authUrl = `https://appcenter.intuit.com/connect/oauth2?${queryParams}`;
    return res.redirect(authUrl);
  }
  const tokenRes = await axios.post(
    "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    qs.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.QB_REDIRECT_URI,
    }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const { access_token, refresh_token, expires_in } = tokenRes.data;

  let quickbooksSession = {
    access_token: access_token,
    refresh_token: refresh_token,
    realmId: realmId,
    expires_in: Date.now() + expires_in * 1000,
  };
  await Quickbook.findOneAndUpdate(
    {}, // Match any existing document
    quickbooksSession,
    {
      upsert: true, // Create if not exists
      new: true, // Return the updated document
      setDefaultsOnInsert: true,
    }
  );
  console.log("✅ QuickBooks Auth Success", quickbooksSession);
  res.send("QuickBooks authorization successful. You can close this tab.");
};

// export const quickbooksLoginCallback = async (req: Request, res: Response) => {
//   const { code, realmId } = req.query;

//   const tokenRes = await axios.post(
//     "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
//     qs.stringify({
//       grant_type: "authorization_code",
//       code,
//       redirect_uri: process.env.QB_REDIRECT_URI,
//     }),
//     {
//       headers: {
//         Authorization:
//           "Basic " +
//           Buffer.from(
//             `${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
//           ).toString("base64"),
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//     }
//   );
//   const { access_token, refresh_token, expires_in } = tokenRes.data;

//   let quickbooksSession = {
//     access_token: access_token,
//     refresh_token: refresh_token,
//     realmId: realmId,
//     expires_at: Date.now() + expires_in * 1000,
//   };
//   console.log("✅ QuickBooks Auth Success", quickbooksSession);
//   res.send("QuickBooks authorization successful. You can close this tab.");
// };
