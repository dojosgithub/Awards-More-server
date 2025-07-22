import { Request, Response } from "express";
// import sessionUtil from "../util/session-util";
import { Customer, IStaff, Staff } from "../../models";
import HttpStatusCodes from "../../constants/https-status-codes";
import { EmployeeService } from "../../services/admin";
import { JwtPayload } from "../../util/types";
import sessionUtil from "../../util/session-util";
import { CustomerService } from "../../services/customer";

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

export const addCustomer = async (
  req: Request,
  res: Response
) => {
  const body = req.body 


  // const body = req.body as IStaff
  // Signup
  const user = await CustomerService.addCustomer(body, res);

  // Return
  return res
    .status(HttpStatusCodes.OK)
    .json({ data: user, message: Message.successSignup });
};

export const getAllCustomers = async (req: IReqPagination, res: Response) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || "";

  // List members in pagination
  const list = await CustomerService.getAllCustomers({ page, limit, search });

  return res.status(HttpStatusCodes.OK).json(list);
};

export const getCustomerById = async (req: IReqUsersId, res: Response) => {
  const { id: customerId } = req.params;

  const customer = await Customer.findById(customerId);
  if (!customer)
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ success: false, message: "Customer not found" });
  res.status(HttpStatusCodes.OK).json({ success: true, data: customer });
};

