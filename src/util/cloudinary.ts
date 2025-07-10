// src/utils/cloudinary.ts or upload.ts
import { v2 as cloudinary } from 'cloudinary';
import multer, { StorageEngine } from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Request } from 'express';
import envVariables from '../constants/env-variables';
// import { File } from 'multer'; // If needed

// Configure Cloudinary
cloudinary.config({
  cloud_name: envVariables.Cloudinary.CloudName,
  api_key: envVariables.Cloudinary.ApiKey,
  api_secret: envVariables.Cloudinary.ApiSecret,
});

// Define CloudinaryStorage with strong typing
const storage: StorageEngine = new CloudinaryStorage({
  cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    const extension = file.originalname.split('.').pop();
    return {
      folder: process.env.NODE_ENV === 'development' ? 'awards-and-more-dev' : 'awards-and-more',
      resource_type: 'auto',
      format: extension, // File format (e.g. jpg, png)
      public_id: Date.now().toString(),
      transformation: [{ flags: 'attachment' }],
    };
  },
});

// Export multer parser
export const parser = multer({ storage });
