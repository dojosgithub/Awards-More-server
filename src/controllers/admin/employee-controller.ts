import { Request, Response } from "express";
// import sessionUtil from "../util/session-util";
import { IStaff, Staff } from "../../models";
import HttpStatusCodes from "../../constants/https-status-codes";
import { EmployeeService } from "../../services/admin";
import { JwtPayload } from "../../util/types";
import sessionUtil from "../../util/session-util";

// Messages
const Message = {
  successSignup: "Sign up successful.",
  successVerified: "Verified success",
  successEdit: "Employee edited successfully!",
  success: "Success",
  deleteSuccess: "Employee deleted sucessfully",
  error: "An error occurred",
  NotFound: "User not found",
} as const;

interface IReqPagination {
  query: {
    limit: string;
    page: string;
    search: string;
  };
}

interface IReqUsersId extends Request<{ id: string }> {
  id: string;
}

interface SessionRequest extends Request {
  _session?: {
    id?: string; // adjust based on your JWT payload
    [key: string]: any;
  };
}

export const addEmployee = async (
  req: Request<{}, {}, IStaff>,
  res: Response
) => {
  const body = req.body as IStaff; // Parsed form fields
  const imageUrl = (req.file as any)?.path;

  // const body = req.body as IStaff
  // Signup
  const user = await EmployeeService.addEmployee(body, res, imageUrl);

  // Return
  return res
    .status(HttpStatusCodes.OK)
    .json({ data: user, message: Message.successSignup });
};

export const getAllEmployees = async (req: IReqPagination, res: Response) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || "";

  // List members in pagination
  const list = await EmployeeService.getAllEmployees({ page, limit, search });

  return res.status(HttpStatusCodes.OK).json(list);
};

export const getEmployeeById = async (req: IReqUsersId, res: Response) => {
  const { id: userId } = req.params;

  const user = await Staff.findById(userId);
  if (!user)
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ success: false, message: "Employee not found" });
  res.status(HttpStatusCodes.OK).json({ success: true, data: user });
};

export const editEmployee = async (req: Request, res: Response) => {
  const { id: userId } = req.params;
  const body = req.body as Partial<IStaff>;
  const imageUrl = req.file?.path as string | undefined;

  const updatedUser = await EmployeeService.editEmployee(
    body,
    res,
    userId,
    imageUrl
  );

  return res
    .status(HttpStatusCodes.OK)
    .json({ data: updatedUser, message: Message.successEdit });
};

export const deleteEmployee = async (req: Request, res: Response) => {
  const { id: employeeId } = req.params;

  await EmployeeService.deleteEmployee(employeeId);

  return res
    .status(HttpStatusCodes.OK)
    .json({ message: Message.deleteSuccess });
};

export const profile = async (req: SessionRequest, res: Response) => {
  const staffId = req._session?.id;
  const { ip } = req;

  if (!staffId) {
    return res
      .status(HttpStatusCodes.UNAUTHORIZED)
      .json({ message: "Unauthorized: No user ID" });
  }

  const staff = await Staff.findById(staffId).select("-password").lean();
  if (!staff) {
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ message: "User not found" });
  }

  const jwtPayload: JwtPayload = {
    id: staff?._id.toString(),
    email: staff?.email,
    role: staff?.role,
  };

  const tokens = await sessionUtil.generateJWTtokens(jwtPayload, ip as string);

  // Setup Refresh token Cookie
  await sessionUtil.addRefreshTokenCookie(res, tokens.refreshToken);
  const user = {
    ...staff,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };

  return res.status(HttpStatusCodes.OK).json({
    message: "Profile fetched successfully",
    user,
  });
};
