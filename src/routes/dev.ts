import { Elysia, t } from "elysia";
import { sql } from "../db";

export const devRoutes = new Elysia({ prefix: "/api/dev" })
  // ==================== SUCCESS ====================
  .get(
    "/success",
    async ({ query, set, request }) => {
      const orderRef = (query as any)?.orderRef || (query as any)?.order_ref || null;
      let forwardedTo = null;
      const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
      const requestId = request.headers.get("x-request-id") || "";

      if (orderRef) {
        const esCode = orderRef.split("-")[0];
        if (esCode) {
          const mappings = await sql`
            SELECT bank_url, product_token 
            FROM "product_mapping" 
            WHERE es_code = ${esCode}
          `;

          if (mappings.length > 0 && mappings[0].bank_url) {
            const { bank_url, product_token } = mappings[0];
            forwardedTo = bank_url;

            // Ensure bank_url ends with a slash before appending 'success'
            const baseUrl = bank_url.endsWith("/") ? bank_url : `${bank_url}/`;

            // Build query params
            const qParams = new URLSearchParams(query as Record<string, string>).toString();
            const redirectUrl = `${baseUrl}success?${qParams}`;

            // Forward via backend GET request with product_token
            try {
              await fetch(redirectUrl, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${product_token || ""}`,
                },
              });
            } catch (err: any) {
              console.error("Failed to forward GET callback:", err.message);
            }

            const responseBody = {
              status: "redirect",
              message: "Redirecting client browser",
              forwarded_to: forwardedTo,
              redirect_url: redirectUrl,
            };

            // Log to api_logs
            try {
              await sql`
                INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status_code)
                VALUES ('dev-success-redirect', ${JSON.stringify(query)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, '302')
              `;
            } catch (dbErr) {
              console.error("Failed to log dev-success redirect:", dbErr);
            }

            // Redirect the client browser
            set.redirect = redirectUrl;
            return;
          }
        }
      }

      const responseBody = {
        status: "success",
        message: "Payment processed successfully via Dev",
        transaction: query,
        forwarded_to: forwardedTo,
      };

      // Log to api_logs
      try {
        await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status_code)
          VALUES ('dev-success', ${JSON.stringify(query)}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, '200')
        `;
      } catch (dbErr) {
        console.error("Failed to log dev-success:", dbErr);
      }

      return responseBody;
    },
    {
      detail: {
        tags: ["Payment - Dev"],
        summary: "Dev redirect success page (GET)",
      },
    },
  )

  // ==================== FAIL ====================
  .get(
    "/fail",
    async ({ query, set }) => {
      const orderRef = (query as any)?.orderRef || (query as any)?.order_ref || null;
      let forwardedTo = null;

      if (orderRef) {
        const esCode = orderRef.split("-")[0];
        if (esCode) {
          const mappings = await sql`
            SELECT bank_url, product_token 
            FROM "product_mapping" 
            WHERE es_code = ${esCode}
          `;

          if (mappings.length > 0 && mappings[0].bank_url) {
            const { bank_url, product_token } = mappings[0];
            forwardedTo = bank_url;

            // Ensure bank_url ends with a slash before appending 'fail'
            const baseUrl = bank_url.endsWith("/") ? bank_url : `${bank_url}/`;

            // Build query params
            const qParams = new URLSearchParams(query as Record<string, string>).toString();
            const redirectUrl = `${baseUrl}fail?${qParams}`;

            // Forward via backend GET request with product_token
            try {
              await fetch(redirectUrl, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${product_token || ""}`,
                },
              });
            } catch (err: any) {
              console.error("Failed to forward GET callback:", err.message);
            }

            // Redirect the client browser
            set.redirect = redirectUrl;
            return;
          }
        }
      }

      return {
        status: "fail",
        message: "Payment failed via Dev",
        transaction: query,
        forwarded_to: forwardedTo,
      };
    },
    {
      detail: {
        tags: ["Payment - Dev"],
        summary: "Dev redirect fail page (GET)",
      },
    },
  )

  // ==================== CANCEL ====================
  .get(
    "/cancel",
    async ({ query, set }) => {
      const orderRef = (query as any)?.orderRef || (query as any)?.order_ref || null;
      let forwardedTo = null;

      if (orderRef) {
        const esCode = orderRef.split("-")[0];
        if (esCode) {
          const mappings = await sql`
            SELECT bank_url, product_token 
            FROM "product_mapping" 
            WHERE es_code = ${esCode}
          `;

          if (mappings.length > 0 && mappings[0].bank_url) {
            const { bank_url, product_token } = mappings[0];
            forwardedTo = bank_url;

            // Ensure bank_url ends with a slash before appending 'cancel'
            const baseUrl = bank_url.endsWith("/") ? bank_url : `${bank_url}/`;

            // Build query params
            const qParams = new URLSearchParams(query as Record<string, string>).toString();
            const redirectUrl = `${baseUrl}cancel?${qParams}`;

            // Forward via backend GET request with product_token
            try {
              await fetch(redirectUrl, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${product_token || ""}`,
                },
              });
            } catch (err: any) {
              console.error("Failed to forward GET callback:", err.message);
            }

            // Redirect the client browser
            set.redirect = redirectUrl;
            return;
          }
        }
      }

      return {
        status: "cancel",
        message: "Payment cancelled by user",
        transaction: query,
        forwarded_to: forwardedTo,
      };
    },
    {
      detail: {
        tags: ["Payment - Dev"],
        summary: "Dev redirect cancel page (GET)",
      },
    },
  );
