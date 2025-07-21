import { Quickbook } from "../models";

export const getQuickBooksSessionFromDB = async () => {
  const session = await Quickbook.findOne().sort({ _id: -1 });

  if (!session || !session.access_token || !session.realmId) {
    throw new Error('QuickBooks session is missing or invalid.');
  }

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    realmId: session.realmId,
    expires_in: session.expires_in,
  };
};