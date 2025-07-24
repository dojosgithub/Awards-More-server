import cron from "node-cron";
import { performQuickBooksTokenRefresh } from "./quickbook-util";

export const startQuickBooksTokenRefreshJob = () => {
  cron.schedule("*/10 * * * *", async () => {
    console.log("⏰ Running QuickBooks token refresh job...");

    try {
      await performQuickBooksTokenRefresh();
    } catch (err: any) {
      console.error("❌ Failed to refresh QuickBooks token:", err.message);
    }
  });

  console.log("🟢 Cron job scheduled: Refresh QuickBooks token every 10 minutes");
};