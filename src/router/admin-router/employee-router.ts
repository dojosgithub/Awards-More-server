import { Router } from "express";
import { employeeController } from "../../controllers/admin";
import { asyncHandler } from "../../util/async-handles";
import Paths from "./paths";
import { parser } from "../../util/cloudinary";
import { AuthenticateMW } from "../../middleware";


const employeeRouter: Router = Router({ mergeParams: true });

//? @api  = /add-employee
//? @desc = Register a new emplyee

employeeRouter.post(Paths.employee.addEmployee,asyncHandler(AuthenticateMW), parser.single('file'), asyncHandler(employeeController.addEmployee))


//? @api  = /employees
//? @desc = gets list of employees
employeeRouter.get(Paths.employee.list, asyncHandler(AuthenticateMW), asyncHandler(employeeController.getAllEmployees));


//? @api  = employee/:id
//? @desc = Get a specific employee by ID
employeeRouter.get(Paths.employee.employeeById, asyncHandler(AuthenticateMW), asyncHandler(employeeController.getEmployeeById));

//? @api  = employee/:id
//? @desc = edit employee by ID
employeeRouter.put(
    Paths.employee.edit,
    asyncHandler(AuthenticateMW),
    parser.single('file'), 
  asyncHandler(employeeController.editEmployee)
);

//? @api  = /api/employee/:id
//? @desc = update reward by ID
employeeRouter.delete(
  Paths.employee.delete,
  asyncHandler(AuthenticateMW),
  asyncHandler(employeeController.deleteEmployee)
);

//? @api  = /employees
//? @desc = gets list of employees
employeeRouter.get(Paths.employee.profile, asyncHandler(AuthenticateMW), asyncHandler(employeeController.profile));



export { employeeRouter };
