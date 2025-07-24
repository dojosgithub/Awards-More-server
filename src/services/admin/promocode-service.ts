import _, { escapeRegExp } from "lodash";
import HttpStatusCodes from "../../constants/https-status-codes";
import { IProduct, IPromo, Product, PromoCode, Quickbook } from "../../models";
import { Response } from "express";
import { Category } from "../../models/category";
import axios from "axios";
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

export const addPromocode = async (body: IPromo) => {
  const {
    code,
    createdFor,
    type,
    discountAmount,
    isNewUser,
    isProductSpecific,
    products,
    redemptionLimit,
    isredemptionLimit,
    expiryDate,
    expiryTime,
  } = body;

  const _newPromocode = {
    code,
    createdFor,
    type,
    discountAmount,
    isNewUser,
    isProductSpecific,
    products,
    isredemptionLimit,
    redemptionLimit,
    expiryDate,
    expiryTime,
  };
  const _promocode = new PromoCode(_newPromocode);
  await _promocode.save();

  return _promocode;
};

export const getAllPromocodes = async (params: paginationParams) => {
  const { page, limit, search } = params;

  const paginateOptions = {
    page,
    limit,
  };

  const pipeline: any[] = [];

  // 🔁 Convert number to string for search
  pipeline.push({
    $addFields: {
      discountAmountStr: { $toString: "$discountAmount" }
    }
  });

  // 🔍 Handle search
  if (!_.isEmpty(search) && !_.isUndefined(search)) {
    const orQueryArray = [
      {
        code: {
          $regex: escapeRegExp(search),
          $options: "i",
        },
      },
      {
        discountAmountStr: {
          $regex: escapeRegExp(search),
          $options: "i",
        },
      },
    ];

    pipeline.push({
      $match: {
        $or: orQueryArray,
      },
    });
  }

  // 📅 Sort by createdAt (descending)
  pipeline.push({
    $sort: { createdAt: -1 },
  });

  // 🎯 Project only selected fields (excluding the helper field)
  pipeline.push({
    $project: {
      code: 1,
      createdFor: 1,
      discountAmount: 1,
      type: 1,
    },
  });

  const aggregate = PromoCode.aggregate(pipeline);

  // @ts-ignore
  const _doc = await PromoCode.aggregatePaginate(aggregate, paginateOptions);

  return _doc;
};

export const editProduct = async (
  body: Partial<IProduct>,
  res: Response,
  productId: string,
  images?: string[]
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
    imageUrl: images || product.imageUrls,
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

export const getAllPromocodeProducts = async () => {
  // @ts-ignore
  const _doc = await Product.find().select("title");

  return _doc;
};
