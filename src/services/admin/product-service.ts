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
import { getQuickBooksSessionFromDB } from "../../util/quickbook-util";

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
  const {
    title,
    description,
    category,
    sku,
    price,
    minimumOrderQuantity,
    qtyOnHand,
  } = body;

  const qbSession = await Quickbook.findOne().sort({ createdAt: -1 });
  if (!qbSession) {
    return res
      .status(HttpStatusCodes.UNAUTHORIZED)
      .json({ message: "QuickBooks authentication not found" });
  }
  const { access_token, realmId } = qbSession;

  const itemPayload = {
    Name: title,
    Sku: sku,
    Type: "Inventory", // or 'Service'
    TrackQtyOnHand: true,
    QtyOnHand: qtyOnHand || 0,
    InvStartDate: new Date().toISOString().split("T")[0],
    IncomeAccountRef: {
      value: "79", // ✅ Hardcoded "Sales of Product Income" for Sandbox — change if needed
      name: "Sales of Product Income",
    },
    AssetAccountRef: {
      value: "81", // ✅ "Inventory Asset" default in Sandbox
      name: "Inventory Asset",
    },
    ExpenseAccountRef: {
      value: "80", // ✅ "Cost of Goods Sold"
      name: "Cost of Goods Sold",
    },
    UnitPrice: price,
    Description: description,
  };

  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://quickbooks.api.intuit.com"
      : "https://sandbox-quickbooks.api.intuit.com";

  let quickbooksItemId = null;

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

  const { data } = await makeRequest();
  quickbooksItemId = data?.Item?.Id;
  // Create product in db
  const _newProduct = {
    title,
    description,
    category,
    sku,
    price,
    minimumOrderQuantity,
    quickbooksItemId,
    qtyOnHand,
    imageUrl:
      image ||
      "https://res.cloudinary.com/dojo-dev/image/upload/v1752143708/awards-and-more-dev/avatar_zmfdyk.png",
  };
  const _product = new Product(_newProduct);
  await _product.save();

  return _product;
};

export const getAllProducts = async (params: paginationParams) => {
  const { page, limit, search } = params;

  const paginateOptions = {
    page,
    limit,
  };

  const pipeline: any[] = [];

  // Handle search
  if (!_.isEmpty(search) && !_.isUndefined(search)) {
    const documentMatchKeys = ["title", "sku"];

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

    pipeline.push(
    {
      $lookup: {
        from: "categories", // this should match your actual MongoDB collection name
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true, // In case category is missing
      },
    },
    {
      $project: {
        imageUrl: 1,
        title: 1,
        sku: 1,
        price: 1,
        minimumOrderQuantity: 1,
        description: 1,
        quickbooksItemId: 1,
        qtyOnHand: 1,
        createdAt: 1,
        category: {
          _id: 1,
          title: 1,
        },
      },
    }
  );

  const aggregate = Product.aggregate(pipeline);

  // @ts-ignore
  const _doc = await Product.aggregatePaginate(aggregate, paginateOptions);

  return _doc;
};

export const editProduct = async (
  body: Partial<IProduct>,
  res: Response,
  productId: string,
  image?: string
) => {
  const product = await Product.findById(productId);
  if (!product) {
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ message: "Product not found" });
  }
  const { access_token, realmId } = await getQuickBooksSessionFromDB();

  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://quickbooks.api.intuit.com"
      : "https://sandbox-quickbooks.api.intuit.com";
  /**
   * 🔁 Step 1: Fetch the corresponding Item from QuickBooks
   */
  const findItem = async () => {
    return axios.get(
      `${baseUrl}/v3/company/${realmId}/query?query=select * from Item where Name = '${product.title}'`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      }
    );
  };

  const qbItemRes = await findItem();
  const qbItem = qbItemRes.data.QueryResponse.Item?.[0];

  if (!qbItem) {
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ message: "Product in QuickBook not found" });
  }

  const qiuickbooksPayload = {
    Id: qbItem.Id,
    SyncToken: qbItem.SyncToken,
    Name: body.title || qbItem.Name,
    Sku: body.sku || qbItem.Sku,
    QtyOnHand: body.qtyOnHand || qbItem.QtyOnHand,
    UnitPrice: body.price || qbItem.UnitPrice,
    InvStartDate: qbItem.InvStartDate,
    Type: "Inventory",
    TrackQtyOnHand: true,
    IncomeAccountRef: qbItem.IncomeAccountRef,
    AssetAccountRef: qbItem.AssetAccountRef,
    ExpenseAccountRef: qbItem.ExpenseAccountRef,
    Description: body.description || qbItem.Description,
  };

  await axios.post(
    `${baseUrl}/v3/company/${realmId}/item?minorversion=75`,
    qiuickbooksPayload,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  const payload = {
    ...body,
    imageUrl: image || product.imageUrl,
  };

  const _doc = await Product.findByIdAndUpdate(
    productId,
    { $set: payload },
    { new: true }
  );

  return _doc;
};

export const deleteProduct = async (productId: string, res: Response) => {
  const product = await Product.findById(productId);
  if (!product) {
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ message: "Product not found" });
  }
  try {
    // 2. Get QuickBooks session
    const { access_token, realmId } = await getQuickBooksSessionFromDB();

    const baseUrl =
      process.env.NODE_ENV === "production"
        ? "https://quickbooks.api.intuit.com"
        : "https://sandbox-quickbooks.api.intuit.com";

    // 3. Fetch QuickBooks item (to get SyncToken)
    const { data } = await axios.get(
      `${baseUrl}/v3/company/${realmId}/item/${product.quickbooksItemId}`, // assuming you store QB item id
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      }
    );

    const existingItem = data.Item;

    // 4. Mark item inactive
    const deletePayload = {
      Id: existingItem.Id,
      SyncToken: existingItem.SyncToken,
      Name: existingItem.Name,
      Active: false,
      Type: existingItem.Type, // required
      IncomeAccountRef: existingItem.IncomeAccountRef || {
        value: "79", // fallback example; you can fetch actual account list if needed
      },
    };

    // 5. Send update to QuickBooks
    await axios.post(
      `${baseUrl}/v3/company/${realmId}/item?minorversion=75`,
      deletePayload,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    // 6. If successful, delete from your DB
    await Product.findByIdAndDelete(productId);

    return res
      .status(HttpStatusCodes.OK)
      .json({ message: "Product deleted from both QuickBooks and database" });
  } catch (error: any) {
    console.error(
      "QuickBooks deletion failed:",
      error?.response?.data || error.message
    );
    return res.status(HttpStatusCodes.BAD_REQUEST).json({
      message:
        "Failed to delete product from QuickBooks. Product not removed from database.",
      quickbooksError: error?.response?.data?.Fault || error.message,
    });
  }
};
