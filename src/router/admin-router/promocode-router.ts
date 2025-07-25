import { Router } from "express";
import { productController, promocodeController } from "../../controllers/admin";
import { asyncHandler } from "../../util/async-handles";
import Paths from "./paths";
import { AuthenticateMW } from "../../middleware";
import { parser } from "../../util/cloudinary";


const promoCodeRouter: Router = Router({ mergeParams: true });

//? @api  = /add-promocode
//? @desc = add a new promocode
promoCodeRouter.post(Paths.Promocode.addPromoCode, asyncHandler(AuthenticateMW), asyncHandler(promocodeController.addPromocode));

//? @api  = /promocode-products
//? @desc = gets list of promocodes Products
promoCodeRouter.get(Paths.Promocode.promoProducts, asyncHandler(AuthenticateMW), asyncHandler(promocodeController.getAllPromocodeProducts));



//? @api  = /promocodes
//? @desc = gets list of promocodes
promoCodeRouter.get(Paths.Promocode.list, asyncHandler(AuthenticateMW), asyncHandler(promocodeController.getAllPromocodes));

//? @api  = /api/promocode/:id
//? @desc = delete promocode by ID
promoCodeRouter.delete(
  Paths.Promocode.delete,
  asyncHandler(AuthenticateMW),
  asyncHandler(promocodeController.deletePromoCode)
);



export { promoCodeRouter };
