import _, { escapeRegExp } from "lodash";
import { Member } from "../models";
import { PROMOTION_STATUS, tick } from "../util/misc";
import { IPromotion, Promotion } from "../models/promotion";

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
}

export const addPromotions = async (body: IPromotion) => {
  console.log("Adding promotion", body);
  const status =
    body.sendInstant === false
      ? PROMOTION_STATUS.SCHEDULED
      : PROMOTION_STATUS.SENT;
  const newPromotion = new Promotion({
    ...body,
    status,
  });

  await newPromotion.save();
  return newPromotion;
};

export const getAllPromotions = async (params: paginationParams) => {
  const { page, limit } = params;

  let searchQuery = {};
  const paginateOptions = {
    page,
    limit,
    sort: { createdAt: -1 },
    // select: "-lifetimePoints -totalVisits",
  };

  // @ts-ignore
  const _doc = await Promotion.paginate(searchQuery, paginateOptions);

  return _doc;
};

export const getAllAudience = async () => {
  const members = await Member.find({});
  return [{ name: "All Members", length: members.length }];
};

export const getLastSentPromotion = async () => {
  const lastPromotion = await Promotion.findOne({}).sort({ sendDateTime: -1 });
  // .select('description validity deliveredTo visits redemptionViaText'); // Only get description and validity

  return lastPromotion;
};
