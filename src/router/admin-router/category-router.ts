import { Router } from "express";
import { categoryController } from "../../controllers/admin";
import { asyncHandler } from "../../util/async-handles";
import Paths from "./paths";
import { AuthenticateMW } from "../../middleware";
import { parser } from "../../util/cloudinary";


const categoryRouter: Router = Router({ mergeParams: true });

//? @api  = /add-category
//? @desc = add a new category
categoryRouter.post(Paths.Category.addCategory, asyncHandler(AuthenticateMW),parser .single('file'), asyncHandler(categoryController.addCategory));


//? @api  = /categories
//? @desc = gets list of categories
categoryRouter.get(Paths.Category.list, asyncHandler(AuthenticateMW), asyncHandler(categoryController.getAllCategory));

//? @api  = category/:id
//? @desc = edit category by ID
categoryRouter.put(
    Paths.Category.edit,
    asyncHandler(AuthenticateMW),
    parser.single('file'), 
  asyncHandler(categoryController.editcategory)
);

//? @api  = category/:id
//? @desc = Get a specific category by ID
categoryRouter.get(Paths.Category.categoryId, asyncHandler(AuthenticateMW), asyncHandler(categoryController.getcategoryById));

//? @api  = /api/category/:id
//? @desc = delete category by ID
categoryRouter.delete(
  Paths.Category.delete,
  asyncHandler(AuthenticateMW),
  asyncHandler(categoryController.deleteCategory)
);

//? @api  = /category/status/:id'
//? @desc = Update category status by ID
categoryRouter.put(Paths.Category.editCategoryStatus, asyncHandler(AuthenticateMW), asyncHandler(categoryController.editCategoryStatus));


export { categoryRouter };
