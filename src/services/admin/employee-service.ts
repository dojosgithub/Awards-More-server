import _, { escapeRegExp } from "lodash";
import { RouteError } from "../../other/classes";
import HttpStatusCodes from "../../constants/https-status-codes";
import { IStaff, Staff } from "../../models";
import passwordUtil from "../../util/password-util";
import { Request, Response } from "express";
import { USER_ROLE } from "../../constants/misc";
import Email from "../../util/email-util";

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

interface paginationParams {
  page: number;
  limit: number;
  search: string;
}

export const addEmployee = async (
  body: IStaff,
  res: Response,
  image: string
) => {
  const { firstName, lastName, email, phoneNumber, address, employeeId } = body;
  let password = "SecurePass@123";
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
      image ||
      "https://res.cloudinary.com/dojo-dev/image/upload/v1752143708/awards-and-more-dev/avatar_zmfdyk.png",
  };
  const _staff = new Staff(_newStaff);
  await _staff.save();

  const emailProps = {
  email: email,
  password: password,
  firstName : firstName, // Optional if using default user.email
  lastName : lastName, // Optional if using default user.email

};
 const emailService = new Email(_staff);
 await emailService.sendAdminLoginCredentials(emailProps);

  return _staff;
};

export const getAllEmployees = async (params: paginationParams) => {
  const { page, limit, search } = params;

  let searchQuery = {};
  const paginateOptions = {
    page,
    limit,
    sort: { createdAt: -1 },
    // select: "-lifetimePoints -totalVisits",
  };

  if (!_.isEmpty(search) && !_.isUndefined(search)) {
    const documentMatchKeys = ["firstName", "lastName"];
    const ORqueryArray = documentMatchKeys.map((key) => ({
      [key]: { $regex: new RegExp(escapeRegExp(search), "gi") },
    }));

    searchQuery = {
      ...searchQuery,
      $and: [
        {
          $or: ORqueryArray,
        },
      ],
    };
  }

  // @ts-ignore
  const _doc = await Staff.paginate(searchQuery, paginateOptions);

  return _doc;
};

export const editEmployee = async (
  body: Partial<IStaff>,
  res: Response,
  userId: string,
  image?: string
) => {
  const staffs = await Staff.findById(userId);
  if (!staffs) {
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ message: "Staff member not found" });
  }

  const payload = {
    ...body,
    imageUrl: image || staffs.imageUrl,
  };

  const staff = await Staff.findByIdAndUpdate(
    userId,
    { $set: payload },
    { new: true }
  );

  return staff;
};

export const deleteEmployee = async (employeeId: string) => {
  const employee = await Staff.findByIdAndDelete(employeeId);

  if (!employee) {
    throw new Error("Employee not found");
  }

};
