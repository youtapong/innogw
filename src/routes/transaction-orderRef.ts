import { Elysia, t } from "elysia";
import { sql } from "../db";
import { product_token_decode } from "../utils/crypto";

export const transactionRoutes = new Elysia({ prefix: "/transaction" })
  .post(
    "/orderRef",
    async ({ headers, body, request, set }) => {
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";
      const orderRef = (body as any)?.orderRef || (body as any)?.order_ref || null;

      // Extract authorization header
      const authHeader = headers["authorization"];
      const token =
        authHeader && authHeader.startsWith("Bearer ")
          ? authHeader.slice(7)
          : authHeader;

      if (!token) {
        set.status = 401;
        const responseBody = { success: false, error: "Unauthorized: Missing Bearer Token" };

        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, error_message, status_code)
            VALUES ('transaction-orderRef-unauthorized', ${JSON.stringify(body || {})}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'Unauthorized: Missing Bearer Token', '401')
          `;
        } catch (err) {
          console.error("Failed to log transaction auth failure:", err);
        }
        return responseBody;
      }

      try {
        // Decode token
        const decodedArray = product_token_decode(token);
        if (!decodedArray || decodedArray.length < 1 || !decodedArray[0]) {
          set.status = 401;
          const responseBody = { success: false, error: "Unauthorized: Invalid token format" };

          await sql`
            INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, error_message, status_code)
            VALUES ('transaction-orderRef-unauthorized', ${JSON.stringify(body || {})}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'Unauthorized: Invalid token format', '401')
          `;
          return responseBody;
        }

        const esCode = decodedArray[0];

        // Check if token matches product_mapping.product_token where es_code = output(0)
        const [mapping] = await sql`
          SELECT product_token FROM "product_mapping" WHERE es_code = ${esCode}
        `;

        if (!mapping || mapping.product_token !== token) {
          set.status = 401;
          const responseBody = { success: false, error: "Unauthorized: Token mismatch or not found" };

          await sql`
            INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, error_message, status_code)
            VALUES ('transaction-orderRef-unauthorized', ${JSON.stringify(body || {})}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'Unauthorized: Token mismatch or not found', '401')
          `;
          return responseBody;
        }

        // Successfully authorized!
        const responseBody = {
          success: true,
          message: "Transaction authorized successfully",
          es_code: esCode
        };

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status_code)
          VALUES ('transaction-orderRef-success', ${JSON.stringify(body || {})}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, '200')
        `;

        return responseBody;
      } catch (error: any) {
        set.status = 500;
        const responseBody = { success: false, error: error.message };

        try {
          await sql`
            INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, error_message, status_code)
            VALUES ('transaction-orderRef-error', ${JSON.stringify(body || {})}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, ${error.message}, '500')
          `;
        } catch (dbErr) {
          console.error("Failed to log internal error:", dbErr);
        }
        return responseBody;
      }
    },
    {
      body: t.Any(),
      detail: {
        tags: ["Transaction"],
        summary: "Verify transaction order reference",
      },
    }
  );
