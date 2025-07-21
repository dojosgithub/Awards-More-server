import { Schema, model, Types, Model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

// ----------------------------------------

export interface IProduct {
  _id: Types.ObjectId;
  imageUrl?: string;
  title?: string; // e.g., "sent", "draft"
  category?: Types.ObjectId;
  sku?: string;
  price?: string;
  minimumOrderQuantity?: number;
  quickbooksItemId?: string;
  createdAt: NativeDate;
  updatedAt: NativeDate;
}

// If you plan to add instance methods later, define them here

type productSchema = Model<IProduct, {}>;

// ----------------------------------------

const productSchema = new Schema<IProduct, productSchema>(
  {
    imageUrl: {
      type: String,
    },
    title: {
      type: String,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },

    sku: {
      type: String,
    },
    price: {
      type: String,
    },
    minimumOrderQuantity: {
      type: Number,
    },

    quickbooksItemId: {
      type: String,
    },
  },
  { versionKey: false, timestamps: true }
);

// Optional: remove sensitive fields when converting to JSON
productSchema.set("toJSON", {
  virtuals: true, // keep virtuals
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.id; // Remove the virtual 'id'
    delete ret.password; // Optional
    return ret;
  },
});

// Plugins
productSchema.plugin(aggregatePaginate);

// Model
export const Product = model<IProduct, productSchema>("Product", productSchema);
