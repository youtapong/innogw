import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { sql } from "./db";
import { userRoutes } from "./routes/user";
import { organizationRoutes } from "./routes/organization";
import { ssoRoutes } from "./routes/sso";
import { authPlugin } from "./middlewares/auth";
import { packageRoutes } from "./routes/package";
import { cameraRoutes } from "./routes/camera";
import { incidentRoutes } from "./routes/incident";
import { alertRoutes } from "./routes/alert";
import { apiLogsRoutes } from "./routes/api_logs";
import { custommerRoutes } from "./routes/custommer";
import { issueRoutes } from "./routes/issue";
import { orderItemsRoutes } from "./routes/order_items";
import { productMappingRoutes } from "./routes/product_mapping";
import { spatialRefSysRoutes } from "./routes/spatial_ref_sys";

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
          title: "NT-CCTV API Documentation",
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
  // 3. โหลด Authentication Plugin (สิทธิ์เข้าใช้งานสำหรับทุก Route ด้านล่างนี้)
  .use(authPlugin)
  // 4. โหลด User CRUD API Routes (Protected)
  .use(userRoutes)
  // 5. โหลด Organization CRUD API Routes (Protected)
  .use(organizationRoutes)
  // 6. โหลด Package CRUD API Routes (Protected)
  .use(packageRoutes)
  // 7. โหลด Camera CRUD API Routes (Protected)
  .use(cameraRoutes)
  // 8. โหลด AI Incident CRUD API Routes (Protected)
  .use(incidentRoutes)
  // 9. โหลด Alert Log CRUD API Routes (Protected)
  .use(alertRoutes)
  // 10. โหลด API Logs CRUD API Routes (Protected)
  .use(apiLogsRoutes)
  // 11. โหลด Customer CRUD API Routes (Protected)
  .use(custommerRoutes)
  // 12. โหลด Issue CRUD API Routes (Protected)
  .use(issueRoutes)
  // 13. โหลด Order Items CRUD API Routes (Protected)
  .use(orderItemsRoutes)
  // 14. โหลด Product Mapping CRUD API Routes (Protected)
  .use(productMappingRoutes)
  // 15. โหลด Spatial Reference System CRUD API Routes (Protected)
  .use(spatialRefSysRoutes)
  // 16. ตรวจสอบการเชื่อมต่อฐานข้อมูล (Protected)
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








