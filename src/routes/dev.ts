import { Elysia, t } from "elysia";
import { sql } from "../db";

export const devRoutes = new Elysia({ prefix: "/api/dev" })
  .onBeforeHandle(({ request, set }) => {
    const authHeader = request.headers.get("authorization");
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

    const devKey = process.env.dev_key || process.env.DEV_KEY;
    if (!token || token !== devKey) {
      set.status = 401;
      return {
        success: false,
        error: "Unauthorized: Invalid or missing dev key",
      };
    }
  })
  // ==================== SUCCESS ====================
  .post(
    "/success",
    async ({ body, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-success-post', ${JSON.stringify(body)}, ${clientIp}, ${requestId}, true, 'success')
        `;

        return { success: true, message: "Callback success POST received" };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Any(),
      detail: {
        tags: ["Payment - Dev"],
        summary: "Dev callback success (POST)",
      },
    },
  )
  .get(
    "/success",
    async ({ query }) => {
      console.log("Dev success GET received:", { query });
      return {
        status: "success",
        message: "Payment processed successfully via Dev",
        transaction: query,
      };
    },
    {
      detail: {
        tags: ["Payment - Dev"],
        summary: "Dev redirect success page (GET)",
      },
    },
  )
  .patch(
    "/success",
    async ({ body, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-success-patch', ${JSON.stringify(body)}, ${clientIp}, ${requestId}, true, 'success')
        `;

        return { success: true, message: "Callback success PATCH received" };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Any(),
      detail: {
        tags: ["Payment - Dev"],
        summary: "Dev callback success (PATCH)",
      },
    },
  )
  .delete(
    "/success",
    async ({ body, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-success-delete', ${JSON.stringify(body)}, ${clientIp}, ${requestId}, true, 'success')
        `;

        return { success: true, message: "Callback success DELETE received" };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Any(),
      detail: {
        tags: ["Payment - Dev"],
        summary: "Dev callback success (DELETE)",
      },
    },
  )

  // ==================== FAIL ====================
  .post(
    "/fail",
    async ({ body, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-fail-post', ${JSON.stringify(body)}, ${clientIp}, ${requestId}, false, 'fail')
        `;

        return { success: true, message: "Callback fail POST received" };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Any(),
      detail: {
        tags: ["Payment - Dev"],
        summary: "Dev callback fail (POST)",
      },
    },
  )
  .get(
    "/fail",
    async ({ query }) => {
      console.log("Dev fail GET received:", { query });
      return {
        status: "fail",
        message: "Payment failed via Dev",
        transaction: query,
      };
    },
    {
      detail: {
        tags: ["Payment - Dev"],
        summary: "Dev redirect fail page (GET)",
      },
    },
  )
  .patch(
    "/fail",
    async ({ body, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-fail-patch', ${JSON.stringify(body)}, ${clientIp}, ${requestId}, false, 'fail')
        `;

        return { success: true, message: "Callback fail PATCH received" };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Any(),
      detail: {
        tags: ["Payment - Dev"],
        summary: "Dev callback fail (PATCH)",
      },
    },
  )
  .delete(
    "/fail",
    async ({ body, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-fail-delete', ${JSON.stringify(body)}, ${clientIp}, ${requestId}, false, 'fail')
        `;

        return { success: true, message: "Callback fail DELETE received" };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Any(),
      detail: {
        tags: ["Payment - Dev"],
        summary: "Dev callback fail (DELETE)",
      },
    },
  )

  // ==================== CANCEL ====================
  .post(
    "/cancel",
    async ({ body, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-cancel-post', ${JSON.stringify(body)}, ${clientIp}, ${requestId}, false, 'cancel')
        `;

        return { success: true, message: "Callback cancel POST received" };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Any(),
      detail: {
        tags: ["Payment - Dev"],
        summary: "Dev callback cancel (POST)",
      },
    },
  )
  .get(
    "/cancel",
    async ({ query }) => {
      console.log("Dev cancel GET received:", { query });
      return {
        status: "cancel",
        message: "Payment cancelled by user",
        transaction: query,
      };
    },
    {
      detail: {
        tags: ["Payment - Dev"],
        summary: "Dev redirect cancel page (GET)",
      },
    },
  )
  .patch(
    "/cancel",
    async ({ body, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-cancel-patch', ${JSON.stringify(body)}, ${clientIp}, ${requestId}, false, 'cancel')
        `;

        return { success: true, message: "Callback cancel PATCH received" };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Any(),
      detail: {
        tags: ["Payment - Dev"],
        summary: "Dev callback cancel (PATCH)",
      },
    },
  )
  .delete(
    "/cancel",
    async ({ body, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-cancel-delete', ${JSON.stringify(body)}, ${clientIp}, ${requestId}, false, 'cancel')
        `;

        return { success: true, message: "Callback cancel DELETE received" };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Any(),
      detail: {
        tags: ["Payment - Dev"],
        summary: "Dev callback cancel (DELETE)",
      },
    },
  );
