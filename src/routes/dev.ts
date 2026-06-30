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
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";
      const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;

      try {
        const responseBody = { success: true, message: "Callback success POST received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code)
          VALUES ('dev-callback-success-post', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, 'success', '200')
        `;

        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code, error_message)
            VALUES ('dev-callback-success-post-error', ${JSON.stringify(body)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'success', '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log POST success error:", dbErr);
        }
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

      try {
        const responseBody = {
          status: "success",
          message: "Payment processed successfully via Dev",
          transaction: query,
        };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code)
          VALUES ('dev-redirect-success-get', ${JSON.stringify(query)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, 'success', '200')
        `;

        console.log("Dev success GET received:", { query });
        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code, error_message)
            VALUES ('dev-redirect-success-get-error', ${JSON.stringify(query)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'success', '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log dev success get error:", dbErr);
        }
        return { success: false, error: error.message };
      }
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
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";
      const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;

      try {
        const responseBody = { success: true, message: "Callback success PATCH received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code)
          VALUES ('dev-callback-success-patch', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, 'success', '200')
        `;

        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code, error_message)
            VALUES ('dev-callback-success-patch-error', ${JSON.stringify(body)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'success', '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log PATCH success error:", dbErr);
        }
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
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";
      const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;

      try {
        const responseBody = { success: true, message: "Callback success DELETE received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code)
          VALUES ('dev-callback-success-delete', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, 'success', '200')
        `;

        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code, error_message)
            VALUES ('dev-callback-success-delete-error', ${JSON.stringify(body)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'success', '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log DELETE success error:", dbErr);
        }
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
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";
      const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;

      try {
        const responseBody = { success: true, message: "Callback fail POST received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code)
          VALUES ('dev-callback-fail-post', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'fail', '200')
        `;

        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code, error_message)
            VALUES ('dev-callback-fail-post-error', ${JSON.stringify(body)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'fail', '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log POST fail error:", dbErr);
        }
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

      try {
        const responseBody = {
          status: "fail",
          message: "Payment failed via Dev",
          transaction: query,
        };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code)
          VALUES ('dev-redirect-fail-get', ${JSON.stringify(query)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'fail', '200')
        `;

        console.log("Dev fail GET received:", { query });
        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code, error_message)
            VALUES ('dev-redirect-fail-get-error', ${JSON.stringify(query)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'fail', '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log dev fail get error:", dbErr);
        }
        return { success: false, error: error.message };
      }
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
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";
      const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;

      try {
        const responseBody = { success: true, message: "Callback fail PATCH received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code)
          VALUES ('dev-callback-fail-patch', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'fail', '200')
        `;

        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code, error_message)
            VALUES ('dev-callback-fail-patch-error', ${JSON.stringify(body)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'fail', '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log PATCH fail error:", dbErr);
        }
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
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";
      const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;

      try {
        const responseBody = { success: true, message: "Callback fail DELETE received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code)
          VALUES ('dev-callback-fail-delete', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'fail', '200')
        `;

        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code, error_message)
            VALUES ('dev-callback-fail-delete-error', ${JSON.stringify(body)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'fail', '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log DELETE fail error:", dbErr);
        }
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
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";
      const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;

      try {
        const responseBody = { success: true, message: "Callback cancel POST received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code)
          VALUES ('dev-callback-cancel-post', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'cancel', '200')
        `;

        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code, error_message)
            VALUES ('dev-callback-cancel-post-error', ${JSON.stringify(body)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'cancel', '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log POST cancel error:", dbErr);
        }
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

      try {
        const responseBody = {
          status: "cancel",
          message: "Payment cancelled by user",
          transaction: query,
        };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code)
          VALUES ('dev-redirect-cancel-get', ${JSON.stringify(query)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'cancel', '200')
        `;

        console.log("Dev cancel GET received:", { query });
        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code, error_message)
            VALUES ('dev-redirect-cancel-get-error', ${JSON.stringify(query)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'cancel', '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log dev cancel get error:", dbErr);
        }
        return { success: false, error: error.message };
      }
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
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";
      const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;

      try {
        const responseBody = { success: true, message: "Callback cancel PATCH received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code)
          VALUES ('dev-callback-cancel-patch', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'cancel', '200')
        `;

        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code, error_message)
            VALUES ('dev-callback-cancel-patch-error', ${JSON.stringify(body)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'cancel', '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log PATCH cancel error:", dbErr);
        }
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
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";
      const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || (query as any)?.orderRef || (query as any)?.order_ref || null;

      try {
        const responseBody = { success: true, message: "Callback cancel DELETE received" };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code)
          VALUES ('dev-callback-cancel-delete', ${JSON.stringify(body)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'cancel', '200')
        `;

        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, order_ref, x_client_ip, x_request_id, is_success, status, status_code, error_message)
            VALUES ('dev-callback-cancel-delete-error', ${JSON.stringify(body)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'cancel', '500', ${error.message})
          `;
        } catch (dbErr) {
          console.error("Failed to log DELETE cancel error:", dbErr);
        }
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
