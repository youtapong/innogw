import { Elysia, t } from "elysia";
import { sql } from "../db";

export const aihubRoutes = new Elysia({ prefix: "/api/aihub" })
  // 1. Background (Server to Server)
  .post(
    "/dev",
    async ({ body, request }) => {
      try {
        const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
        const requestId = request.headers.get("x-request-id") || "";

        // Log the callback into api_logs
        await sql`
          INSERT INTO "api_logs" (api_name, request_body, x_client_ip, x_request_id, is_success)
          VALUES ('aihub-callback-dev', ${JSON.stringify(body)}, ${clientIp}, ${requestId}, true)
        `;

        return { success: true, message: "Callback received" };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Any(),
      detail: {
        tags: ["Payment - AIHub"],
        summary: "AIHub server-to-server callback (Dev)",
      },
    }
  )

  // 2. Foreground (Redirect success)
  .get(
    "/dev/success",
    async ({ query, body }) => {
      console.log("AIHub dev/success received:", { query, body });
      return {
        status: "success",
        message: "Payment processed successfully via AIHub",
        transaction: query
      };
    },
    {
      detail: {
        tags: ["Payment - AIHub"],
        summary: "AIHub redirect success page (Dev)",
      },
    }
  )

  // 3. Foreground (Redirect fail)
  .get(
    "/dev/fail",
    async ({ query, body }) => {
      console.log("AIHub dev/fail received:", { query, body });
      return {
        status: "fail",
        message: "Payment failed via AIHub",
        transaction: query
      };
    },
    {
      detail: {
        tags: ["Payment - AIHub"],
        summary: "AIHub redirect fail page (Dev)",
      },
    }
  )

  // 4. Foreground (Redirect cancel)
  .get(
    "/dev/cancel",
    async ({ query, body }) => {
      console.log("AIHub dev/cancel received:", { query, body });
      return {
        status: "cancel",
        message: "Payment cancelled by user",
        transaction: query
      };
    },
    {
      detail: {
        tags: ["Payment - AIHub"],
        summary: "AIHub redirect cancel page (Dev)",
      },
    }
  );
