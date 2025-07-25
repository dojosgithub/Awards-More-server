import { Request, Response } from "express";
import { IProduct, IStaff, Product } from "../../models";
import HttpStatusCodes from "../../constants/https-status-codes";
import {  ProductService } from "../../services/admin";

// Messages
const Message = {
  successSignup: "Sign up successful.",
  productAdded: "Product added successfully.",
  productEdit: "Product edited successfully.",
  categoryDeleted: "Category deleted successfully.",
  successVerified: "Verified success",
  success: "Success",
  error: "An error occurred",
  NotFound: "User not found",
  otpSentSuccess: "OTP sent successfully.",
} as const;

interface IReqPagination {
  query: {
    limit: string;
    page: string;
    search: string;
  };
}

interface IReqCategoryId extends Request<{ id: string }> {
  id: string;
}

export const addProduct = async (
  req: Request<{}, {}, IProduct>,
  res: Response
) => {
  const body = req.body as IProduct; // Parsed form fields
 const files = req.files as Express.Multer.File[];
 const imageUrls = files.map(file => file.path);

  // const body = req.body as IStaff
  // Signup
  const user = await ProductService.addProduct(body, res, imageUrls);

  // Return
  return res
    .status(HttpStatusCodes.OK)
    .json({ data: user, message: Message.productAdded });
};

export const getAllProducts = async (req: IReqPagination, res: Response) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || "";

  // List members in pagination
  const list = await ProductService.getAllProducts({ page, limit, search });

  return res.status(HttpStatusCodes.OK).json(list);
};

export const editProduct = async (req: Request, res: Response) => {
  const { id: productId } = req.params;
  const body = req.body as Partial<IStaff>;
 const files = req.files as Express.Multer.File[];
 const imageUrls = files.map(file => file.path);

  const updatedProduct = await ProductService.editProduct(
    body,
    res,
    productId,
    imageUrls
  );

  return res
    .status(HttpStatusCodes.OK)
    .json({ data: updatedProduct, message: Message.productEdit });
};

export const getProductById = async (req: IReqCategoryId, res: Response) => {
  const { id: productId } = req.params;

  const product = await Product.findById(productId);
  if (!product)
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ success: false, message: "Product not found" });
  res.status(HttpStatusCodes.OK).json({ success: true, data: product });
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id: categoryId } = req.params;

  await ProductService.deleteProduct(categoryId, res);

  return res
    .status(HttpStatusCodes.OK)
    .json({ message: Message.categoryDeleted });
};

export const getAllProductsCategory = async (req: IReqPagination, res: Response) => {

  // List members in pagination
  const list = await ProductService.getAllProductsCategory();

  return res.status(HttpStatusCodes.OK).json(list);
};