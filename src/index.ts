import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { sql } from "./db";
import { userRoutes } from "./routes/user";
import { ssoRoutes } from "./routes/sso";
import { authPlugin } from "./middlewares/auth";
import { apiLogsRoutes } from "./routes/api_logs";
import { custommerRoutes } from "./routes/custommer";
import { issueRoutes } from "./routes/issue";
import { orderItemsRoutes } from "./routes/order_items";
import { productMappingRoutes } from "./routes/product_mapping";
import { spatialRefSysRoutes } from "./routes/spatial_ref_sys";
import { devRoutes } from "./routes/dev";
import { devNotificationRoutes } from "./routes/dev-notification";
import { transactionRoutes } from "./routes/transaction-orderRef";


const app = new Elysia()
  // 1. เรียกใช้งาน Swagger plugin
  .use(
    swagger({
      scalarConfig: {
        theme: "alternate",
        darkMode: true,
      },
      documentation: {
        info: {
          title: "innovation-Gateway",
          version: "1.0.0",
        },
        security: [
          {
            BearerAuth: [],
          },
        ],
        components: {
          securitySchemes: {
            BearerAuth: {
              type: "http",
              scheme: "bearer",
            },
          },
        },
      },
    }),
  )
  // 2. โหลด Public SSO Login Routes (ไม่ต้องผ่าน Auth)
  .use(ssoRoutes)
  // 3. โหลด Public Payment Gateway Routes (ไม่ต้องผ่าน Auth)
  .use(devRoutes)
  .use(devNotificationRoutes)
  .use(transactionRoutes)
  // 4. โหลด Authentication Plugin (สิทธิ์เข้าใช้งานสำหรับทุก Route ด้านล่างนี้)
  .use(authPlugin)
  // 5. โหลด User CRUD API Routes (Protected)
  .use(userRoutes)
  // 5. โหลด API Logs CRUD API Routes (Protected)
  .use(apiLogsRoutes)
  // 6. โหลด Customer CRUD API Routes (Protected)
  .use(custommerRoutes)
  // 7. โหลด Issue CRUD API Routes (Protected)
  .use(issueRoutes)
  // 8. โหลด Order Items CRUD API Routes (Protected)
  .use(orderItemsRoutes)
  // 9. โหลด Product Mapping CRUD API Routes (Protected)
  .use(productMappingRoutes)
  // 10. โหลด Spatial Reference System CRUD API Routes (Protected)
  .use(spatialRefSysRoutes)
  // 11. ตรวจสอบการเชื่อมต่อฐานข้อมูล (Protected)
  .get("/db-status", async () => {
    try {
      const result = await sql`SELECT version(), now()`;
      return {
        status: "connected",
        database: "postgresql",
        details: result[0],
      };
    } catch (error: any) {
      return {
        status: "error",
        message: error.message,
      };
    }
  }, {
    detail: {
      tags: ["System"],
      summary: "ตรวจสอบการเชื่อมต่อฐานข้อมูล",
    },
  })
  .listen(3000);








