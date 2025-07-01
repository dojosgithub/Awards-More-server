import { Router } from "express";
import { activityController } from "../controllers";
import { AuthenticateMW } from "../middleware";
import { asyncHandler } from "../util/async-handles";
import PathsV1 from "./paths";

const activityRouter: Router = Router({ mergeParams: true });

//? @api  = /api/activity
//? @desc = get all activities
activityRouter.get(PathsV1.Activity.list, asyncHandler(activityController.getAllActivities));


export { activityRouter };
