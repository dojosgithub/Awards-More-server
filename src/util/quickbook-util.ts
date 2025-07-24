import { Quickbook } from "../models";
import axios from "axios";
import { Request, Response } from "express";
import qs from "qs";

export const performQuickBooksTokenRefresh = async () => {
  const session = await Quickbook.findOne();
  if (!session) throw new Error("QuickBooks session not found");

  const response = await axios.post(
    "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    qs.stringify({
      grant_type: "refresh_token",
      refresh_token: session.refresh_token,
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

  const { access_token, refresh_token, expires_in } = response.data;

  session.access_token = access_token;
  session.refresh_token = refresh_token;
  session.expires_in = (Date.now() + expires_in * 1000).toString();
  await session.save();

  console.log("✅ QuickBooks token refreshed.");
};

export const getQuickBooksSessionFromDB = async () => {
  const session = await Quickbook.findOne().sort({ createdAt: -1 });

  if (!session || !session.access_token || !session.realmId) {
    throw new Error("QuickBooks session is missing or invalid.");
  }

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    realmId: session.realmId,
    expires_in: session.expires_in,
  };
};

export const createCustomerInQuickBooks = async (
  accessToken: string,
  realmId: string,
  customerData: any
) => {
  const url =
    process.env.NODE_ENV === "production"
      ? `https://quickbooks.api.intuit.com/v3/company/${realmId}/customer?minorversion=65`
      : `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/customer?minorversion=65`;
  try {
    const response = await axios.post(url, customerData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    // console.log("✅ Customer created in QuickBooks:", response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      "QuickBooks Error:",
      JSON.stringify(error.response?.data, null, 2)
    );
    throw error;
  }
};
