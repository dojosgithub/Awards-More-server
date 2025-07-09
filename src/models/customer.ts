import { Schema, model, Types, Model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { USER_ROLE } from "../constants/misc";

// ----------------------------------------

export interface ICustomer {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  zip?: string;
  password: string;
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
    name: {
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
    country: {
      type: String,
    },
    state: {
      type: String,
      required: true,
      unique: true,
    },
    city: {
      type: String,
    },
    zip: {
      type: String,
    },
    password: {
      type: String,
      required: true,
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
    delete ret.id;        // Remove the virtual 'id'
    delete ret.password;  // Optional
    return ret;
  },
});

// Plugins
customerSchema.plugin(mongoosePaginate);

// Model
export const Customer = model<ICustomer, CustomerModel>("Customer", customerSchema);
