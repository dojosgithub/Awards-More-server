import _, { escapeRegExp } from "lodash";
import { RouteError } from "../../other/classes";
import HttpStatusCodes from "../../constants/https-status-codes";
import { IProduct, IStaff, Product, Quickbook, Staff } from "../../models";
import passwordUtil from "../../util/password-util";
import { Request, Response } from "express";
import { USER_ROLE } from "../../constants/misc";
import Email from "../../util/email-util";
import { Category, ICategory } from "../../models/category";
import { CATEGORY_STATUS } from "../../util/misc";
import axios from "axios";
import { refreshQuickBooksToken } from "../../util/refresh-quickbooks-token";

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

export const addProduct = async (
  body: IProduct,
  res: Response,
  image: string
) => {
  const { title, description, category, sku, price, minimumOrderQuantity, qtyOnHand } = body;

  const qbSession = await Quickbook.findOne().sort({ createdAt: -1 });
  if (!qbSession) {
    return res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: 'QuickBooks authentication not found' });
  }
  const { access_token, realmId } = qbSession;

    const itemPayload =   {
        Name: title,
        Sku: sku,
        Type: 'Inventory', // or 'Service'
        TrackQtyOnHand: true,
        QtyOnHand: qtyOnHand || 0,
        InvStartDate: new Date().toISOString().split('T')[0],
       IncomeAccountRef: {
      value: "79", // ✅ Hardcoded "Sales of Product Income" for Sandbox — change if needed
      name: "Sales of Product Income"
    },
    AssetAccountRef: {
      value: "81", // ✅ "Inventory Asset" default in Sandbox
      name: "Inventory Asset"
    },
    ExpenseAccountRef: {
      value: "80", // ✅ "Cost of Goods Sold"
      name: "Cost of Goods Sold"
    },
        UnitPrice: price,
      }

      const baseUrl = process.env.NODE_ENV === "development"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";

      // 2. Create product/item
 const makeRequest = async () => {
    return axios.post(
      `${baseUrl}/v3/company/${realmId}/item?minorversion=75`,
      itemPayload,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
  };

 await makeRequest()

  // Create product in db
  const _newProduct = {
    title,
    description,
    category,
    sku,
    price,
    minimumOrderQuantity,
    qtyOnHand,
    imageUrl:
      image ||
      "https://res.cloudinary.com/dojo-dev/image/upload/v1752143708/awards-and-more-dev/avatar_zmfdyk.png",
  };
  const _product = new Product(_newProduct);
  await _product.save();

  return _product;
};

export const getAllCategories = async (params: paginationParams) => {
  const { page, limit, search } = params;

  const paginateOptions = {
    page,
    limit,
  };

  const pipeline: any[] = [];

  // Handle search
 if (!_.isEmpty(search) && !_.isUndefined(search)) {
  const documentMatchKeys = ["title"];

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

  const aggregate = Category.aggregate(pipeline);

  // @ts-ignore
  const _doc = await Category.aggregatePaginate(aggregate, paginateOptions);

  return _doc;
};

export const editEmployee = async (
  body: Partial<IStaff>,
  res: Response,
  categoryId: string,
  image?: string
) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ message: "Category not found" });
  }

  const payload = {
    ...body,
    imageUrl: image || category.imageUrl,
  };

  const _doc = await Category.findByIdAndUpdate(
    categoryId,
    { $set: payload },
    { new: true }
  );

  return _doc;
};

export const deletecategory = async (categoryId: string) => {
  const category = await Category.findByIdAndDelete(categoryId);

  if (!category) {
    throw new Error("Category not found");
  }
};
