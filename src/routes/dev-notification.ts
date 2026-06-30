import { Elysia, t } from "elysia";
import { sql } from "../db";

export const devNotificationRoutes = new Elysia({ prefix: "/api/dev/notification" })
  .onBeforeHandle(async ({ request, set }) => {
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const devKey = process.env.dev_key || process.env.DEV_KEY;
    if (!token || token !== devKey) {
      const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
      const requestId = request.headers.get("x-request-id") || "";

      try {
        await sql`
          INSERT INTO "api_logs" (api_name, request_body, x_client_ip, x_request_id, is_success, error_message, status_code)
          VALUES ('dev-notification-auth-failed', ${JSON.stringify({ url: request.url, token_provided: token ? token.substring(0, 10) + "..." : null })}, ${clientIp}, ${requestId}, false, 'Unauthorized: Invalid or missing dev key', '401')
        `;
      } catch (err) {
        console.error("Failed to log dev-notification auth error:", err);
      }

      set.status = 401;
      return { success: false, error: "Unauthorized: Invalid or missing dev key" };
    }
  })
  .post(
    "/",
    async ({ body, request }) => {
      try {
        const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, x_client_ip, x_request_id, is_success)
          VALUES ('dev-notification-callback-post', ${JSON.stringify(body)}, ${clientIp}, ${requestId}, true)
        `;

        return { success: true, message: "Notification callback POST received" };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Any(),
      detail: {
        tags: ["Payment - Dev Notification"],
        summary: "Dev Notification callback (POST)",
      },
    }
  )
  .get(
    "/",
    async ({ query, request }) => {
      const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
      const requestId = request.headers.get("x-request-id") || "";

      try {
        await sql`
          INSERT INTO "api_logs" (api_name, request_body, x_client_ip, x_request_id, is_success)
          VALUES ('dev-notification-get', ${JSON.stringify(query)}, ${clientIp}, ${requestId}, true)
        `;
      } catch (err) {
        console.error("Failed to log dev-notification get:", err);
      }

      console.log("Dev Notification GET received:", { query });
      return {
        status: "success",
        message: "Dev Notification query received",
        transaction: query
      };
    },
    {
      detail: {
        tags: ["Payment - Dev Notification"],
        summary: "Dev Notification GET details",
      },
    }
  )
  .patch(
    "/",
    async ({ body, request }) => {
      try {
        const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, x_client_ip, x_request_id, is_success)
          VALUES ('dev-notification-callback-patch', ${JSON.stringify(body)}, ${clientIp}, ${requestId}, true)
        `;

        return { success: true, message: "Notification callback PATCH received" };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Any(),
      detail: {
        tags: ["Payment - Dev Notification"],
        summary: "Dev Notification callback (PATCH)",
      },
    }
  )
  .delete(
    "/",
    async ({ body, request }) => {
      try {
        const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, x_client_ip, x_request_id, is_success)
          VALUES ('dev-notification-callback-delete', ${JSON.stringify(body)}, ${clientIp}, ${requestId}, true)
        `;

        return { success: true, message: "Notification callback DELETE received" };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Any(),
      detail: {
        tags: ["Payment - Dev Notification"],
        summary: "Dev Notification callback (DELETE)",
      },
    }
  );
