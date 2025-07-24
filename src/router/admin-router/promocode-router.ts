import { Router } from "express";
import { productController, promocodeController } from "../../controllers/admin";
import { asyncHandler } from "../../util/async-handles";
import Paths from "./paths";
import { AuthenticateMW } from "../../middleware";
import { parser } from "../../util/cloudinary";


const promoCodeRouter: Router = Router({ mergeParams: true });

//? @api  = /add-product
//? @desc = add a new product
promoCodeRouter.post(Paths.Promocode.addPromoCode, asyncHandler(AuthenticateMW), asyncHandler(promocodeController.addPromocode));


//? @api  = /products
//? @desc = gets list of products
// promoCodeRouter.get(Paths.Product.list, asyncHandler(AuthenticateMW), asyncHandler(productController.getAllProducts));

//? @api  = product/:id
//? @desc = edit product by ID
// promoCodeRouter.put(
//     Paths.Product.edit,
//     asyncHandler(AuthenticateMW),
//     parser.array('files', 10),
//   asyncHandler(productController.editProduct)
// );

//? @api  = category/:id
//? @desc = Get a specific category by ID
// promoCodeRouter.get(Paths.Product.productById, asyncHandler(AuthenticateMW), asyncHandler(productController.getProductById));

//? @api  = /api/category/:id
//? @desc = delete category by ID
// promoCodeRouter.delete(
//   Paths.Product.delete,
//   asyncHandler(AuthenticateMW),
//   asyncHandler(productController.deleteProduct)
// );

//? @api  = /product-category
//? @desc = gets list of products category
// promoCodeRouter.get(Paths.Product.prductCategory, asyncHandler(AuthenticateMW), asyncHandler(productController.getAllProductsCategory));


export { promoCodeRouter };
