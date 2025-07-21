import { Schema, model, Types, Model } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

// ----------------------------------------

export interface ICategory {
  _id: Types.ObjectId;
  title?: string; // e.g., "sent", "draft"
  description?: string;
  imageUrl?: string;
  status?: string;
  createdAt: NativeDate;
  updatedAt: NativeDate;
}

// If you plan to add instance methods later, define them here

type categorySchema = Model<ICategory, {}>;

// ----------------------------------------

const categorySchema = new Schema<ICategory, categorySchema>(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    status: {
      type: String,
    },
  },
  { versionKey: false, timestamps: true }
);

// Optional: remove sensitive fields when converting to JSON
categorySchema.set("toJSON", {
  virtuals: true, // keep virtuals
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.id; // Remove the virtual 'id'
    delete ret.password; // Optional
    return ret;
  },
});

// Plugins
categorySchema.plugin(aggregatePaginate);

// Model
export const Category = model<ICategory, categorySchema>(
  "Category",
  categorySchema
);
