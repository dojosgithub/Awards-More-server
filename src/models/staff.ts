import { Schema, model, Types, Model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { USER_ROLE } from "../constants/misc";

// ----------------------------------------

export interface IStaff {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  zip?: string;
  employeeId?: string;
  imageUrl?: string;
  password: string;
  role: USER_ROLE;
  createdAt: NativeDate;
  updatedAt: NativeDate;
}

// If you plan to add instance methods later, define them here
export interface IStaffMethods {}

export type StaffModel = Model<IStaff, {}, IStaffMethods>;

// ----------------------------------------

const staffSchema = new Schema<IStaff, StaffModel>(
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
    employeeId: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: USER_ROLE.Manager,
    },
  },
  { versionKey: false, timestamps: true }
);

// Optional: remove sensitive fields when converting to JSON

staffSchema.set("toJSON", {
  virtuals: true, // keep virtuals
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.id; // Remove the virtual 'id'
    delete ret.password; // Optional
    return ret;
  },
});

// Plugins
staffSchema.plugin(mongoosePaginate);

// Model
export const Staff = model<IStaff, StaffModel>(
  "Staff",
  staffSchema
);
