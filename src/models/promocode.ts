import { Schema, model, Types, Model } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

// ----------------------------------------

export interface IPromo {
  _id: Types.ObjectId;
  code?: string; // e.g., "sent", "draft"
  createdFor?: string;
  type?: string;
  discountAmount?: number;
  isNewUser?: boolean;
  isActive?: boolean;
  users?: Types.ObjectId[];
  isProductSpecific?: boolean;
  products?: Types.ObjectId[];
  redeemptionLimit?: number;
  expiryDate?: Date;
  expiryTime?: string;
  createdAt: NativeDate;
  updatedAt: NativeDate;
}

// If you plan to add instance methods later, define them here

type promoCodeSchema = Model<IPromo, {}>;

// ----------------------------------------

const promoCodeSchema = new Schema<IPromo, promoCodeSchema>(
  {
    code: {
      type: String,
      required: true,
    },
    createdFor: {
      type: String,
    },
    type: {
      type: String,
    },
    discountAmount: {
      type: Number,
    },
    isNewUser: {
      type: Boolean,
    },
    isActive: {
      type: Boolean,
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isProductSpecific: {
      type: Boolean,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    redeemptionLimit: {
      type: Number,
    },
    expiryDate: {
      type: Date,
    },
    expiryTime: {
      type: String,
    },
  },
  { versionKey: false, timestamps: true }
);

// Optional: remove sensitive fields when converting to JSON
promoCodeSchema.set("toJSON", {
  virtuals: true, // keep virtuals
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.id; // Remove the virtual 'id'
    delete ret.password; // Optional
    return ret;
  },
});

// Plugins
promoCodeSchema.plugin(aggregatePaginate);

// Model
export const PromoCode = model<IPromo, promoCodeSchema>(
  "PromoCode",
  promoCodeSchema
);
