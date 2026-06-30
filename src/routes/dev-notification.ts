import { Elysia, t } from "elysia";
import { sql } from "../db";

export const devNotificationRoutes = new Elysia({ prefix: "/api/dev/notification" })
  .onBeforeHandle(async ({ request, query, body, set }) => {
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const devKey = process.env.dev_key || process.env.DEV_KEY;
    if (!token || token !== devKey) {
      const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
      const requestId = request.headers.get("x-request-id") || "";

      const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;
      const responseBody = { success: false, error: "Unauthorized: Invalid or missing dev key" };

      try {
        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, error_message, status_code)
          VALUES ('dev-notification-auth-failed', ${JSON.stringify({ url: request.url, token_provided: token ? token.substring(0, 10) + "..." : null })}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'Unauthorized: Invalid or missing dev key', '401')
        `;
      } catch (err) {
        console.error("Failed to log dev-notification auth error:", err);
      }

      set.status = 401;
      return responseBody;
    }
  })
  .post(
    "/",
    async ({ body, query, request }) => {
      const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
      const requestId = request.headers.get("x-request-id") || "";
      const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;

      try {
        const responseBody = { success: true, message: "Notification callback POST received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status_code)
          VALUES ('dev-notification-callback-post', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, '200')
        `;

        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status_code, error_message)
            VALUES ('dev-notification-callback-post-error', ${JSON.stringify(body)}, ${orderRef}, ${clientIp}, ${requestId}, false, '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log POST notification error:", dbErr);
        }
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
      const orderRef = (query as any)?.orderRef || (query as any)?.order_ref || null;

      try {
        const responseBody = {
          status: "success",
          message: "Dev Notification query received",
          transaction: query
        };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status_code)
          VALUES ('dev-notification-get', ${JSON.stringify(query)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, '200')
        `;

        console.log("Dev Notification GET received:", { query });
        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status_code, error_message)
            VALUES ('dev-notification-get-error', ${JSON.stringify(query)}, ${orderRef}, ${clientIp}, ${requestId}, false, '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log dev-notification get error:", dbErr);
        }
        return { success: false, error: error.message };
      }
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
    async ({ body, query, request }) => {
      const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
      const requestId = request.headers.get("x-request-id") || "";
      const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;

      try {
        const responseBody = { success: true, message: "Notification callback PATCH received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status_code)
          VALUES ('dev-notification-callback-patch', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, '200')
        `;

        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status_code, error_message)
            VALUES ('dev-notification-callback-patch-error', ${JSON.stringify(body)}, ${orderRef}, ${clientIp}, ${requestId}, false, '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log PATCH notification error:", dbErr);
        }
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
    async ({ body, query, request }) => {
      const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
      const requestId = request.headers.get("x-request-id") || "";
      const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;

      try {
        const responseBody = { success: true, message: "Notification callback DELETE received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status_code)
          VALUES ('dev-notification-callback-delete', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, '200')
        `;

        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status_code, error_message)
            VALUES ('dev-notification-callback-delete-error', ${JSON.stringify(body)}, ${orderRef}, ${clientIp}, ${requestId}, false, '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log DELETE notification error:", dbErr);
        }
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
