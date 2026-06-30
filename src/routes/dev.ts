import { Elysia, t } from "elysia";
import { sql } from "../db";

export const devRoutes = new Elysia({ prefix: "/api/dev" })
  .onBeforeHandle(async ({ request, query, body, set }) => {
    const authHeader = request.headers.get("authorization");
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

    const devKey = process.env.dev_key || process.env.DEV_KEY;
    if (!token || token !== devKey) {
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";

      const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;
      const responseBody = {
        success: false,
        error: "Unauthorized: Invalid or missing dev key",
      };

      try {
        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, error_message, status_code)
          VALUES ('dev-auth-failed', ${JSON.stringify({ url: request.url, token_provided: token ? token.substring(0, 10) + "..." : null })}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'Unauthorized: Invalid or missing dev key', '401')
        `;
      } catch (err) {
        console.error("Failed to log auth error:", err);
      }

      set.status = 401;
      return responseBody;
    }
  })
  // ==================== SUCCESS ====================
  .post(
    "/success",
    async ({ body, query, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;
        const responseBody = { success: true, message: "Callback success POST received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-success-post', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, 'success')
        `;

        return responseBody;
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
    async ({ query, request }) => {
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";

      const orderRef = (query as any)?.orderRef || (query as any)?.order_ref || null;
      const responseBody = {
        status: "success",
        message: "Payment processed successfully via Dev",
        transaction: query,
      };

      try {
        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-redirect-success-get', ${JSON.stringify(query)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, 'success')
        `;
      } catch (err) {
        console.error("Failed to log dev success get:", err);
      }

      console.log("Dev success GET received:", { query });
      return responseBody;
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
    async ({ body, query, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;
        const responseBody = { success: true, message: "Callback success PATCH received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-success-patch', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, 'success')
        `;

        return responseBody;
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
    async ({ body, query, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;
        const responseBody = { success: true, message: "Callback success DELETE received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-success-delete', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, 'success')
        `;

        return responseBody;
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
    async ({ body, query, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;
        const responseBody = { success: true, message: "Callback fail POST received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-fail-post', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'fail')
        `;

        return responseBody;
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
    async ({ query, request }) => {
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";

      const orderRef = (query as any)?.orderRef || (query as any)?.order_ref || null;
      const responseBody = {
        status: "fail",
        message: "Payment failed via Dev",
        transaction: query,
      };

      try {
        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-redirect-fail-get', ${JSON.stringify(query)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'fail')
        `;
      } catch (err) {
        console.error("Failed to log dev fail get:", err);
      }

      console.log("Dev fail GET received:", { query });
      return responseBody;
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
    async ({ body, query, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;
        const responseBody = { success: true, message: "Callback fail PATCH received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-fail-patch', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'fail')
        `;

        return responseBody;
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
    async ({ body, query, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;
        const responseBody = { success: true, message: "Callback fail DELETE received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-fail-delete', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'fail')
        `;

        return responseBody;
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
    async ({ body, query, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;
        const responseBody = { success: true, message: "Callback cancel POST received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-cancel-post', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'cancel')
        `;

        return responseBody;
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
    async ({ query, request }) => {
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";

      const orderRef = (query as any)?.orderRef || (query as any)?.order_ref || null;
      const responseBody = {
        status: "cancel",
        message: "Payment cancelled by user",
        transaction: query,
      };

      try {
        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-redirect-cancel-get', ${JSON.stringify(query)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'cancel')
        `;
      } catch (err) {
        console.error("Failed to log dev cancel get:", err);
      }

      console.log("Dev cancel GET received:", { query });
      return responseBody;
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
    async ({ body, query, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;
        const responseBody = { success: true, message: "Callback cancel PATCH received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-cancel-patch', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'cancel')
        `;

        return responseBody;
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
    async ({ body, query, request }) => {
      try {
        const clientIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;
        const responseBody = { success: true, message: "Callback cancel DELETE received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status)
          VALUES ('dev-callback-cancel-delete', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'cancel')
        `;

        return responseBody;
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
