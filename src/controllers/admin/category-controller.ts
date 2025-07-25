import { Request, Response } from "express";
import { IStaff } from "../../models";
import HttpStatusCodes from "../../constants/https-status-codes";
import { CategoryService } from "../../services/admin";
import { Category, ICategory } from "../../models/category";

// Messages
const Message = {
  successSignup: "Sign up successful.",
  categoryAdded: "Category added successfully.",
  categoryEdit: "Category edited successfully.",
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

interface ICategoryStatus {
  status: string;
}

export const addCategory = async (
  req: Request<{}, {}, ICategory>,
  res: Response
) => {
  const body = req.body as ICategory; // Parsed form fields
  const imageUrl = (req.file as any)?.path;

  // const body = req.body as IStaff
  // Signup
  const category = await CategoryService.addCategory(body, res, imageUrl);

  // Return
  return res
    .status(HttpStatusCodes.OK)
    .json({ data: category, message: Message.categoryAdded });
};

export const getAllCategory = async (req: IReqPagination, res: Response) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || "";

  // List members in pagination
  const list = await CategoryService.getAllCategories({ page, limit, search });

  return res.status(HttpStatusCodes.OK).json(list);
};

export const editcategory = async (req: Request, res: Response) => {
  const { id: categoryId } = req.params;
  const body = req.body as Partial<ICategory>;
  const imageUrl = req.file?.path as string | undefined;

  const updatedUser = await CategoryService.editCategory(
    body,
    res,
    categoryId,
    imageUrl
  );

  return res
    .status(HttpStatusCodes.OK)
    .json({ data: updatedUser, message: Message.categoryEdit });
};

export const getcategoryById = async (req: IReqCategoryId, res: Response) => {
  const { id: categoryId } = req.params;

  const category = await Category.findById(categoryId);
  if (!category)
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ success: false, message: "Category not found" });
  res.status(HttpStatusCodes.OK).json({ success: true, data: category });
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { id: categoryId } = req.params;

  await CategoryService.deletecategory(categoryId);

  return res
    .status(HttpStatusCodes.OK)
    .json({ message: Message.categoryDeleted });
};

export const editCategoryStatus = async (req: Request, res: Response) => {
  const { id: categoryId } = req.params;
  const { status } = req.body as any;

  console.log("editCategoryStatus", status, categoryId);

  const updatedUser = await CategoryService.editCategoryStatus(
    status,
    res,
    categoryId,
  );

  return res
    .status(HttpStatusCodes.OK)
    .json({ data: updatedUser, message: Message.categoryEdit });
};