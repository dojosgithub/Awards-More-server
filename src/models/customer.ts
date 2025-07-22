import { Schema, model, Types, Model } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { USER_ROLE } from "../constants/misc";

// ----------------------------------------

export interface ICustomer {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  password: string;
  quickbooksId: string;
  account_Type: string;
  orders?: [];
  role: USER_ROLE;
  createdAt: NativeDate;
  updatedAt: NativeDate;
}

// If you plan to add instance methods later, define them here
export interface ICustomerMethods {}

type CustomerModel = Model<ICustomer, {}, ICustomerMethods>;

// ----------------------------------------

const customerSchema = new Schema<ICustomer, CustomerModel>(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
    },
    address: {
      type: String,
    },
    quickbooksId: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    account_Type: {
      type: String,
    },
     orders: {
      type: [],
    },
    role: {
      type: String,
      default: USER_ROLE.Customer,
    },
  },
  { versionKey: false, timestamps: true }
);

// Optional: remove sensitive fields when converting to JSON

customerSchema.set("toJSON", {
  virtuals: true, // keep virtuals
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.id; // Remove the virtual 'id'
    delete ret.password; // Optional
    return ret;
  },
});

// Plugins
customerSchema.plugin(aggregatePaginate);

// Model
export const Customer = model<ICustomer, CustomerModel>(
  "Customer",
  customerSchema
);
