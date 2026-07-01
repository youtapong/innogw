import { Elysia, t } from "elysia";
import { sql } from "../db";
import { product_token_decode, orderRef_create } from "../utils/crypto";

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

        // Successfully authorized! Use esCode from decoded token to prevent foreign key violations
        const reqEsCode = esCode;
        const reqInnoSub1 = (body as any)?.inno_sub1 !== undefined ? (body as any).inno_sub1 : 0;
        const reqInnoSub2 = (body as any)?.inno_sub2 !== undefined ? (body as any).inno_sub2 : 0;
        const paymentType = (body as any)?.payment_type || "dev";

        console.log(`[transaction-orderRef] Authorized token for es_code: ${esCode}`);
        console.log(`[transaction-orderRef] Request body data: esCode=${reqEsCode}, inno_sub1=${reqInnoSub1}, inno_sub2=${reqInnoSub2}, payment_type=${paymentType}`);

        // 1 ส่งข้อมูลไป @src/utils/crypto.ts function orderRef_create(esCode,inno_sub1,inno_sub2) ได้ค่า orderRef
        const newOrderRef = await orderRef_create(reqEsCode, reqInnoSub1, reqInnoSub2);
        console.log(`[transaction-orderRef] Generated new orderRef: ${newOrderRef}`);

        // Map paymentType to integer: 0=dev, 1=prod
        const paymentTypeInt = paymentType === "prod" || paymentType === 1 || paymentType === "1" ? 1 : 0;

        // 2. Insert to table orders order_ref= orderRef, inno_sub1, inno_sub2 , filed อื่น ถ้าไม่มีค่าอะไรใส่ 0 ไปก่อน
        console.log(`[transaction-orderRef] Inserting new order into "orders" table...`);
        await sql`
          INSERT INTO "orders" (
            order_ref,
            es_code,
            inno_sub1,
            inno_sub2,
            channel_product_code,
            channel_service_code,
            document_type_code,
            tax_id_type,
            mobile,
            payment_type
          ) VALUES (
            ${newOrderRef},
            ${reqEsCode},
            ${reqInnoSub1},
            ${reqInnoSub2},
            '0',
            '0',
            '0',
            '0',
            '0',
            ${paymentTypeInt}
          )
        `;
        console.log(`[transaction-orderRef] Successfully inserted into "orders" table.`);

        // 3. ส่งค่า เป็น json กลับไป
        const responseBody = {
          status: "success",
          payment_type: paymentType,
          orderRef: newOrderRef
        };

        console.log(`[transaction-orderRef] Response body:`, responseBody);

        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status_code)
          VALUES ('transaction-orderRef-success', ${JSON.stringify(body || {})}, ${JSON.stringify(responseBody)}, ${newOrderRef}, ${clientIp}, ${requestId}, true, '200')
        `;

        return responseBody;
      } catch (error: any) {
        console.error(`[transaction-orderRef] Error encountered:`, error.message);
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
