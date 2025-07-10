import mongoose from "mongoose";
import logger from "jet-logger";
import dotenv from "dotenv";
import { Staff } from "../models";
import passwordUtil from "../util/password-util";
import { USER_ROLE } from "../constants/misc";

dotenv.config();

export const mongodbOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: true,
  maxPoolSize: 1000,
};

const connectionString = process.env.MONGO_URI as string;

export const connectToDB = () => {
  mongoose.connect(connectionString, mongodbOptions);
  const db = mongoose.connection;

  db.on("error", async function (error) {
    logger.err("[❌ database] Connection error " + error);
    process.exit();
  });
  db.once("open", async function () {
    // logger.info("[🔌 database] Connected Successfully ✅");
    // try {
    // logger.info("[🌱 seeding] Started");
    //   await seedData();
    //   logger.info("[🌱 seeding] Ended");
    // } catch (error) {
    //   console.error("[🌱 seeding] Error", error);
    // }
  });
};

async function seedData() {
try {
    const existingStaff = await Staff.findOne({ email: process.env.SYSTEM_ADMIN_EMAIL });

    if (existingStaff) {
      console.log('✅ System admin already exists.');
      return;
    }

    const hashedPassword = await passwordUtil.getHash(
      process.env.SYSTEM_ADMIN_PASSWORD || 'SuperSecure123!'
    );

    const adminUser = {
      firstName: 'Fatik',
      lastName: 'Khan',
      email: process.env.SYSTEM_ADMIN_EMAIL!,
      phoneNumber: '+923480263143',
      address: 'Admin Block, Main Office',
      country: 'Pakistan',
      state: 'Sindh',
      city: 'Karachi',
      zip: '75300',
      imageUrl:  "https://res.cloudinary.com/dojo-dev/image/upload/v1752143708/awards-and-more-dev/avatar_zmfdyk.png", 
      password: hashedPassword,
      role: USER_ROLE.Admin,

    };

    await new Staff(adminUser).save();
    console.log('✅ System admin seeded successfully.');
  } catch (err) {
    console.error('❌ Error seeding system admin:', err);
  }
}
