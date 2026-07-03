import { Elysia, t } from "elysia";
import { sql } from "../db";

export const devRoutes = new Elysia({ prefix: "/api/dev" })
  .onBeforeHandle(async ({ request, query, body, set }) => {
    const authHeader = request.headers.get("authorization");
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

    const devKey = process.env.dev_accessKeyToken || process.env.DEV_ACCESS_KEY_TOKEN;
    if (!token || token !== devKey) {
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";

      const orderRef =
        (body as any)?.orderRef ||
        (body as any)?.order_ref ||
        (query as any)?.orderRef ||
        (query as any)?.order_ref ||
        null;
      const responseBody = {
        success: false,
        error: "Unauthorized: Invalid or missing dev key",
        received_token: token || null,
        expected_token: devKey || null,
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

      // Extract fields from body
      const reqBody = (body as any) || {};
      const statuscode = reqBody.statuscode || "200";
      const status = reqBody.status || "success";
      const result = reqBody.result || {};
      const orderRef = result.order_ref || null;
      const transactionRef = result.transaction_ref || null;
      const paymentStatus = result.payment_status || null;
      const paymentMethod =
        result.payment_method !== undefined
          ? Number(result.payment_method)
          : null;
      const paymentMethodName = result.payment_method_name || null;

      try {
        let forwardedTo: string | null = null;

        // 4. นำข้อมูล update ลง ตาราง orders
        if (orderRef) {
          await sql`
            UPDATE "orders"
            SET 
              transaction_ref = ${transactionRef},
              payment_status = ${paymentStatus},
              payment_method = ${paymentMethod},
              modify_time = CURRENT_TIMESTAMP
            WHERE order_ref = ${orderRef}
          `;

          // 5. นำ order_ref มาตัด INNS10001-1-0-0000015 เหลือ INNS10001
          const esCode = orderRef.split("-")[0];

          if (esCode) {
            // 6. หา URL , product_token ที่ได้จาก table product_mapping.message_url where es_code ='INNS10001'
            const mappings = await sql`
              SELECT message_url, product_token 
              FROM "product_mapping" 
              WHERE es_code = ${esCode}
            `;

            if (mappings.length > 0) {
              const { message_url, product_token } = mappings[0];

              // 7. ส่งต่อข้อมูลที่ได้รับ ไปที่ url และ product_token ตามที่ select ได้มา
              if (message_url) {
                forwardedTo = message_url;
                try {
                  await fetch(message_url, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${product_token || ""}`,
                      "X-Client-Ip": clientIp,
                      "X-RequestId": requestId,
                    },
                    body: JSON.stringify(reqBody),
                  });
                } catch (forwardErr: any) {
                  console.error(
                    `Failed to forward callback to message_url (${message_url}):`,
                    forwardErr.message,
                  );
                }
              }
            }
          }
        }

        const responseBody = {
          success: true,
          message: forwardedTo 
            ? `Callback success POST received and processed. Forwarded data to: ${forwardedTo}`
            : "Callback success POST received and processed. No forwarding configured.",
          data_received: reqBody,
          forwarded_to: forwardedTo,
        };

        // 3. นำข้อมูล insert ลง ตาราง api_logs
        await sql`
          INSERT INTO "api_logs" (
            api_name, 
            request_body, 
            response_body, 
            order_ref, 
            x_client_ip, 
            x_request_id, 
            is_success, 
            status_code, 
            status, 
            result_body, 
            transaction_ref, 
            payment_status, 
            payment_method, 
            payment_method_name
          )
          VALUES (
            'dev-callback-success-post', 
            ${JSON.stringify(reqBody)}, 
            ${JSON.stringify(responseBody)}, 
            ${orderRef}, 
            ${clientIp}, 
            ${requestId}, 
            true, 
            ${statuscode}, 
            ${status}, 
            ${JSON.stringify(result)}, 
            ${transactionRef}, 
            ${paymentStatus}, 
            ${paymentMethod}, 
            ${paymentMethodName}
          )
        `;

        return responseBody;
      } catch (error: any) {
        try {
          await sql`
            INSERT INTO "api_logs" (
              api_name, 
              request_body, 
              order_ref, 
              x_client_ip, 
              x_request_id, 
              is_success, 
              status_code, 
              error_message,
              status
            )
            VALUES (
              'dev-callback-success-post-error', 
              ${JSON.stringify(reqBody)}, 
              ${orderRef}, 
              ${clientIp}, 
              ${requestId}, 
              false, 
              '500', 
              ${error.message},
              'error'
            )
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
      const orderRef =
        (query as any)?.orderRef || (query as any)?.order_ref || null;

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

        // console.log("Dev success GET received:", { query });
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

  // ==================== FAIL ====================
  .post(
    "/fail",
    async ({ body, query, request }) => {
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";
      const orderRef =
        (body as any)?.orderRef ||
        (body as any)?.order_ref ||
        (query as any)?.orderRef ||
        (query as any)?.order_ref ||
        null;

      try {
        const responseBody = {
          success: true,
          message: "Callback fail POST received",
        };

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
      const orderRef =
        (query as any)?.orderRef || (query as any)?.order_ref || null;

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

        // console.log("Dev fail GET received:", { query });
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

  // ==================== CANCEL ====================
  .post(
    "/cancel",
    async ({ body, query, request }) => {
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const requestId = request.headers.get("x-request-id") || "";
      const orderRef =
        (body as any)?.orderRef ||
        (body as any)?.order_ref ||
        (query as any)?.orderRef ||
        (query as any)?.order_ref ||
        null;

      try {
        const responseBody = {
          success: true,
          message: "Callback cancel POST received",
        };

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
      const orderRef =
        (query as any)?.orderRef || (query as any)?.order_ref || null;

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

        // console.log("Dev cancel GET received:", { query });
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
  );
