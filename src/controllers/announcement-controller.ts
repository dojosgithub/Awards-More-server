import { Request, Response } from "express";
import HttpStatusCodes from "../constants/https-status-codes";
import { AnnouncementService} from "../services";
import { IAnnouncement } from "../models/announcement";

// Messages
const Message = {
  successSignup: "Announcement added successfully.",
  successVerified: "Verified success",
  success: "Success",
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

export const addAnnouncement = async (req: Request, res: Response) => {
  const body = req.body as IAnnouncement;

  const announcement = await AnnouncementService.addAnnouncement(body);

  return res.status(HttpStatusCodes.OK).json({
    announcement,
    message: Message.successSignup,
  });
};

export const getAllAnnouncements = async (req: IReqPagination, res: Response) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;

  // List members in pagination
  const list = await AnnouncementService.getAllAnnouncements({ page, limit });

  return res.status(HttpStatusCodes.OK).json(list);
};


