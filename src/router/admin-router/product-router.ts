import { Router } from "express";
import { productController } from "../../controllers/admin";
import { asyncHandler } from "../../util/async-handles";
import Paths from "./paths";
import { AuthenticateMW } from "../../middleware";
import { parser } from "../../util/cloudinary";


const productRouter: Router = Router({ mergeParams: true });

//? @api  = /add-product
//? @desc = add a new product
productRouter.post(Paths.Product.addProduct, asyncHandler(AuthenticateMW),parser .single('file'), asyncHandler(productController.addProduct));


// //? @api  = /categories
// //? @desc = gets list of categories
// productRouter.get(Paths.Category.list, asyncHandler(AuthenticateMW), asyncHandler(categoryController.getAllCategory));

// //? @api  = category/:id
// //? @desc = edit category by ID
// productRouter.put(
//     Paths.Category.edit,
//     asyncHandler(AuthenticateMW),
//     parser.single('file'), 
//   asyncHandler(categoryController.editcategory)
// );

// //? @api  = category/:id
// //? @desc = Get a specific category by ID
// productRouter.get(Paths.Category.categoryId, asyncHandler(AuthenticateMW), asyncHandler(categoryController.getcategoryById));

// //? @api  = /api/category/:id
// //? @desc = delete category by ID
// productRouter.delete(
//   Paths.Category.delete,
//   asyncHandler(AuthenticateMW),
//   asyncHandler(categoryController.deleteCategory)
// );

export { productRouter };
