import { Elysia, t } from "elysia";
import { sql } from "../db";

export const searchOrderRefRoutes = new Elysia({ prefix: "/api/search-order-ref" })
  .get(
    "/:order_ref",
    async ({ params: { order_ref } }) => {
      try {
        const [orders, orderItems, issues, apiLogs, paymentLogs] = await Promise.all([
          sql`SELECT * FROM "orders" WHERE order_ref = ${order_ref} ORDER BY modify_time DESC`,
          sql`SELECT * FROM "order_items" WHERE order_ref = ${order_ref} ORDER BY modify_time DESC`,
          sql`SELECT * FROM "issue" WHERE order_ref = ${order_ref} ORDER BY modify_time DESC`,
          sql`SELECT * FROM "api_logs" WHERE order_ref = ${order_ref} ORDER BY modify_time DESC`,
          sql`SELECT * FROM "payment_logs" WHERE order_ref = ${order_ref} ORDER BY created_at DESC`
        ]);

        return {
          success: true,
          order_ref,
          data: {
            orders,
            order_items: orderItems,
            issue: issues,
            api_logs: apiLogs,
            payment_logs: paymentLogs.map(({ auth_token, ...rest }) => rest)
          }
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        order_ref: t.String()
      }),
      detail: {
        tags: ["Search"],
        summary: "ค้นหา order_ref ในทุก Table ตาม docs/database.md และแสดงผลตามเวลา modify_time/created_at",
      }
    }
  );
