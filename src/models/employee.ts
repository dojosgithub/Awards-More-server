import { Schema, model, Types, Model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { USER_ROLE } from "../constants/misc";

// ----------------------------------------

export interface IEmployee {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  employeeId?: string;
  imageUrl?: string;
  password: string;
  role: USER_ROLE;
  createdAt: NativeDate;
  updatedAt: NativeDate;
}

// If you plan to add instance methods later, define them here
export interface ICustomerMethods {}

type EmployeeModel = Model<IEmployee, {}, ICustomerMethods>;

// ----------------------------------------

const employeeSchema = new Schema<IEmployee, EmployeeModel>(
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
    employeeId: {
      type: String,
    },
    imageUrl: {
      type: String,
      required: true,
      unique: true,
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

employeeSchema.set("toJSON", {
  virtuals: true, // keep virtuals
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.id; // Remove the virtual 'id'
    delete ret.password; // Optional
    return ret;
  },
});

// Plugins
employeeSchema.plugin(mongoosePaginate);

// Model
export const Employee = model<IEmployee, EmployeeModel>(
  "Employee",
  employeeSchema
);
