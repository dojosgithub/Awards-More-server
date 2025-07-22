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


//? @api  = /products
//? @desc = gets list of products
productRouter.get(Paths.Product.list, asyncHandler(AuthenticateMW), asyncHandler(productController.getAllProducts));

//? @api  = product/:id
//? @desc = edit product by ID
productRouter.put(
    Paths.Product.edit,
    asyncHandler(AuthenticateMW),
    parser.single('file'), 
  asyncHandler(productController.editProduct)
);

// //? @api  = category/:id
// //? @desc = Get a specific category by ID
// productRouter.get(Paths.Category.categoryId, asyncHandler(AuthenticateMW), asyncHandler(categoryController.getcategoryById));

//? @api  = /api/category/:id
//? @desc = delete category by ID
productRouter.delete(
  Paths.Product.delete,
  asyncHandler(AuthenticateMW),
  asyncHandler(productController.deleteProduct)
);

export { productRouter };
