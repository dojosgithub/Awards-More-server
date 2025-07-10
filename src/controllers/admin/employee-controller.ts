import { Request, Response } from "express";
// import sessionUtil from "../util/session-util";
import { IStaff } from "../../models";
import HttpStatusCodes from "../../constants/https-status-codes";
import { EmployeeService } from "../../services/admin";


// Messages
const Message = {
  successSignup: "Sign up successful.",
  successVerified: "Verified success",
  success: "Success",
  error: "An error occurred",
  NotFound: "User not found",
} as const;

export const addEmployee = async (req: Request<{}, {}, IStaff>, res: Response) => {
    const body = req.body as IStaff
  // Signup
  const user = await EmployeeService.addEmployee(body, res);

  // Return
  return res
    .status(HttpStatusCodes.OK)
    .json({ data:user, message: Message.successSignup });
};
