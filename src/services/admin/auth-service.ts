import _ from "lodash";
import { RouteError } from "../../other/classes";
import HttpStatusCodes from "../../constants/https-status-codes";
import { IStaff, Staff } from "../../models";
import passwordUtil from "../../util/password-util";
import { Request, Response } from "express";
import { USER_ROLE } from "../../constants/misc";

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

export const signup = async (body: IStaff, res: Response) => {
  const { firstName,lastName, email, phoneNumber, address, employeeId, password } =
    body;

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
    imageUrl : "https://res.cloudinary.com/dojo-dev/image/upload/v1752143708/awards-and-more-dev/avatar_zmfdyk.png",
  };
  const _staff = new Staff(_newStaff);
  await _staff.save();

  return _staff;
};

interface ILoginReq {
    email: string;
    password: string;
  };

/**
 * Login a user.
 */
export const login = async (body:ILoginReq) => {
    const {email, password} = body
    // Fetch user
    const staff = await Staff.findOne({ email });

    if (_.isEmpty(staff))
      throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.InvalidLogin);

    // Check password
    const hash = staff.password ?? "",
      pwdPassed = await passwordUtil.compare(password, hash);

    if (!pwdPassed) {
      // If password failed, wait 500ms this will increase security
      throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.InvalidLogin);
    }

    return staff;
  };
