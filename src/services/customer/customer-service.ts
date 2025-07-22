import _, { escapeRegExp } from "lodash";
import { RouteError } from "../../other/classes";
import HttpStatusCodes from "../../constants/https-status-codes";
import { Customer, ICustomer, IStaff, Staff } from "../../models";
import passwordUtil from "../../util/password-util";
import { Request, Response } from "express";
import { USER_ROLE } from "../../constants/misc";
import Email from "../../util/email-util";
import { CUSTOMER_ACCOUNT_TYPE, formatDate } from "../../util/misc";
import {
  createCustomerInQuickBooks,
  getQuickBooksSessionFromDB,
} from "../../util/quickbook-util";

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

export const addCustomer = async (body: ICustomer, res: Response) => {
  const { firstName, lastName, email, phoneNumber, address, password } = body;
  // Check user exists
  const user = await Staff.findOne({ email });
  const userExists: boolean = !_.isEmpty(user);
  if (userExists) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ message: "An account with this email already exists" });
  }
  const qbCustomerPayload = {
    DisplayName: `${firstName} ${lastName}-${formatDate()} `,
    CompanyName: "Awards and More Customer.",
    PrimaryEmailAddr: { Address: email },
    PrimaryPhone: { FreeFormNumber: phoneNumber },
  };

  const { access_token, realmId } = await getQuickBooksSessionFromDB();

  const qbRes = await createCustomerInQuickBooks(
    access_token,
    realmId,
    qbCustomerPayload
  );
  // if (!qbRes || !qbRes.Id) {
  //   return res
  //     .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
  //     .json({ message: "Failed to create customer in QuickBooks" });
  // }
  // Encrypt password
  const hashPassword: string = await passwordUtil.getHash(password);

  // Create user in db
  const _newCustomer = {
    firstName,
    lastName,
    email,
    password: hashPassword,
    phoneNumber,
    address,
    orders: [],
    account_Type: CUSTOMER_ACCOUNT_TYPE.APP,
    quickbooksId: qbRes.Customer.Id,
  };
  const _customer = new Customer(_newCustomer);
  await _customer.save();

  return _customer;
};

export const getAllCustomers = async (params: paginationParams) => {

   const { page, limit, search } = params;
 
   const paginateOptions = {
     page,
     limit,
   };
 
   const pipeline: any[] = [];
 
   // Handle search
  if (!_.isEmpty(search) && !_.isUndefined(search)) {
   const documentMatchKeys = ["firstName", "lastName", "email", "quickbooksId"];
 
   const orQueryArray = documentMatchKeys.map((key) => ({
     [key]: {
       $regex: escapeRegExp(search),
       $options: "i",
     },
   }));
 
   pipeline.push({
     $match: {
       $or: orQueryArray,
     },
   });
 }
 
   // Sort by createdAt (descending)
   pipeline.push({
     $sort: { createdAt: -1 },
   });
 
   const aggregate = Customer.aggregate(pipeline);
 
   // @ts-ignore
   const _doc = await Customer.aggregatePaginate(aggregate, paginateOptions);
 
   return _doc;
};
