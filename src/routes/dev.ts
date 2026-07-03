import { Elysia, t } from "elysia";
import { sql } from "../db";

export const devRoutes = new Elysia({ prefix: "/api/dev" })
  // ==================== SUCCESS ====================
  .get(
    "/success",
    async ({ query, set }) => {
      const orderRef = (query as any)?.orderRef || (query as any)?.order_ref || null;
      let forwardedTo = null;

      if (orderRef) {
        const esCode = orderRef.split("-")[0];
        if (esCode) {
          const mappings = await sql`
            SELECT message_url, product_token 
            FROM "product_mapping" 
            WHERE es_code = ${esCode}
          `;

          if (mappings.length > 0 && mappings[0].message_url) {
            const { message_url, product_token } = mappings[0];
            forwardedTo = message_url;

            // Build query params
            const qParams = new URLSearchParams(query as Record<string, string>).toString();
            const redirectUrl = message_url.includes("?") 
              ? `${message_url}&${qParams}` 
              : `${message_url}?${qParams}`;

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
        status: "success",
        message: "Payment processed successfully via Dev",
        transaction: query,
        forwarded_to: forwardedTo,
      };
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
            SELECT message_url, product_token 
            FROM "product_mapping" 
            WHERE es_code = ${esCode}
          `;

          if (mappings.length > 0 && mappings[0].message_url) {
            const { message_url, product_token } = mappings[0];
            forwardedTo = message_url;

            // Build query params
            const qParams = new URLSearchParams(query as Record<string, string>).toString();
            const redirectUrl = message_url.includes("?") 
              ? `${message_url}&${qParams}` 
              : `${message_url}?${qParams}`;

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
            SELECT message_url, product_token 
            FROM "product_mapping" 
            WHERE es_code = ${esCode}
          `;

          if (mappings.length > 0 && mappings[0].message_url) {
            const { message_url, product_token } = mappings[0];
            forwardedTo = message_url;

            // Build query params
            const qParams = new URLSearchParams(query as Record<string, string>).toString();
            const redirectUrl = message_url.includes("?") 
              ? `${message_url}&${qParams}` 
              : `${message_url}?${qParams}`;

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
