import _, { isEmpty } from "lodash";
import { RouteError } from "../../other/classes";
import HttpStatusCodes from "../../constants/https-status-codes";
import { IStaff, Staff, TOTP } from "../../models";
import passwordUtil from "../../util/password-util";
import { Response } from "express";
import { USER_ROLE } from "../../constants/misc";
import speakeasy from "speakeasy";
import { generateOTToken, verifyTOTPToken } from "../../util/misc";
import Email from "../../util/email-util";
import sessionUtil from "../../util/session-util";
import { JwtPayload } from "../../util/types";

export const Errors = {
  Unauth: "Unauthorized",
  EmailNotFound(email: string) {
    return `User with email ${email} not found`;
  },
  EmailAlreadyExists(email: string) {
    return `An account with this email or username already exists`;
  },
  NoEmail: "Please enter a valid email",
  NoAccount: "Account does not exist",
  InvalidOrExpired: "Token is invalid or expired",
  AccountNotVerified: "Please confirm your account and try again",
  InvalidLogin: "Incorrect email or password",
  PasswordNotMactch: "Your previous password does not match",
  PrevPassShouldNotMatch:
    "Your previous password should not match with your new password",
  InvalidEmailToken: "Invalid token",
  ParamFalsey: "Param is falsey",
} as const;

interface IForgetPasswordCode {
  email: string;
}

export const signup = async (body: IStaff, res: Response) => {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    address,
    employeeId,
    password,
  } = body;

  // Check user exists
  const user = await Staff.findOne({ email });
  const userExists: boolean = !_.isEmpty(user);
  if (userExists) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ message: "An account with this email already exists" });
  }

  // Encrypt password
  const hashPassword: string = await passwordUtil.getHash(password);

  // // Create stripe customer
  // const customerCreateParams: Stripe.CustomerCreateParams = {
  //   email,
  //   name: firstname + " " + lastname,
  //   address: {
  //     city,
  //     postal_code: zip,
  //   },
  // };
  // const { id: stripeCustomer } = await stripe.customers.create(
  //   customerCreateParams
  // );

  // Create user in db
  const _newStaff = {
    firstName,
    lastName,
    email,
    password: hashPassword,
    phoneNumber,
    address,
    role: USER_ROLE.Manager,
    employeeId,
    imageUrl:
      "https://res.cloudinary.com/dojo-dev/image/upload/v1752143708/awards-and-more-dev/avatar_zmfdyk.png",
  };
  const _staff = new Staff(_newStaff);
  await _staff.save();

  return _staff;
};

interface ILoginReq {
  email: string;
  password: string;
}

/**
 * Login a user.
 */
export const login = async (body: ILoginReq) => {
  const { email, password } = body;
  // Fetch user
  const staff = await Staff.findOne({ email });

  if (_.isEmpty(staff)) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.InvalidLogin);
  }

  // Check password
  const hash = staff.password,
    pwdPassed = await passwordUtil.compare(password, hash);

  if (!pwdPassed) {
    // If password failed, wait 500ms this will increase security
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.InvalidLogin);
  }

  return staff;
};

export const forgotPasswordSendCode = async (reqBody: IForgetPasswordCode) => {
  const { email } = reqBody;

  var secret = speakeasy.generateSecret({ length: 20 }).base32;
  var token = speakeasy.totp({
    digits: 6,
    secret: secret,
    encoding: "base32",
  });

  const TOTPToken = await generateOTToken({ secret });

  // Find if the document with the phoneNumber exists in the database
  let totp = await TOTP.findOneAndUpdate({ email }, { token: TOTPToken });
  if (isEmpty(totp)) {
    await new TOTP({
      email,
      token: TOTPToken,
    }).save();
  }
  const mail = { email: email };
  const emailProps = {
    token: token,
  };
  const emailService = new Email(mail);
  await emailService.sendForgotPassword(emailProps);
  return token;
};

export const verifyToken = async (
  email: string,
  code: string,
  password: string,
  ip: string,
  res: Response
) => {
  let totp = await TOTP.findOneAndDelete({ email }).lean();
  if (!totp) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ message: "No OTP record found or it has already been used." });
  }
  if (totp) {
    let decoded = await verifyTOTPToken(totp.token as string);
    let verified = speakeasy.totp.verify({
      digits: 6,
      secret: decoded.secret,
      encoding: "base32",
      token: code,
      window: 10,
    });
    // verified in production
    if (verified) {
      const staff = await Staff.findOne({ email });
      if (!staff) {
        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: "User not found" });
      }
      const hashPassword: string = await passwordUtil.getHash(password);
      staff.password = hashPassword;
      await staff.save();

      const jwtPayload: JwtPayload = {
        id: staff?._id.toString(),
        email: staff?.email,
        role: staff?.role,
      };

      // Create access token & refresh token
      const tokens = await sessionUtil.generateJWTtokens(jwtPayload, ip);

      // Setup Refresh token Cookie
      await sessionUtil.addRefreshTokenCookie(res, tokens.refreshToken);

      return res
        .status(HttpStatusCodes.OK)
        .json({ staff, tokens, message: "Password updated successfully" });
    } else {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ message: "OTP not verified" });
    }
  }
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string,
  id: string,
  res: Response
) => {
  const staff = await Staff.findById(id);
  if (!staff) {
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ message: "Staff not found" });
  }
  const isAuthenticated = await passwordUtil.compare(
    oldPassword,
    staff.password
  );

  if (!isAuthenticated) {
    return res.status(400).json({ message: "Password does not matched" });
  }
  const hashPassword = await passwordUtil.getHash(newPassword);
  staff.password = hashPassword;
  await staff.save();
};
