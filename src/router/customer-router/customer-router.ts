import { Router } from "express";
import { asyncHandler } from "../../util/async-handles";
import { AuthenticateMW } from "../../middleware";
import { customerController } from "../../controllers/customer";
import Paths from "./paths";


const customerRouter: Router = Router({ mergeParams: true });

//? @api  = /sign-up
//? @desc = Register a new customer

customerRouter.post(Paths.Customer.Signup, asyncHandler(customerController.addCustomer))


//? @api  = /customers
//? @desc = gets list of customers
customerRouter.get(Paths.Customer.list, asyncHandler(AuthenticateMW), asyncHandler(customerController.getAllCustomers));


//? @api  = customer/:id
//? @desc = Get a specific customer by ID
customerRouter.get(Paths.Customer.customerById, asyncHandler(AuthenticateMW), asyncHandler(customerController.getCustomerById));

export { customerRouter };
