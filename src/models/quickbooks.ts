import { Schema, model, Types } from "mongoose";

// ----------------------------------------

export interface IQuickBooks {

  access_token: string;
  refresh_token: string;
  realmId?: string;
  expires_in?: string;

}

// Schema
const quickbookSchema = new Schema<IQuickBooks>(
  {
    access_token: String,
    refresh_token: String,
    realmId: String,
    expires_in: String,
  },
  { versionKey: false, timestamps: true }
);


quickbookSchema.set("toJSON", {
  virtuals: true, // keep virtuals
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.id;        // Remove the virtual 'id'
    delete ret.password;  // Optional
    return ret;
  },
});

export const Quickbook = model("Quickbook", quickbookSchema);
