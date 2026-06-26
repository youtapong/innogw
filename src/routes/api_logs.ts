import { Elysia, t } from "elysia";
import { sql } from "../db";

export const apiLogsRoutes = new Elysia({ prefix: "/api-logs" })
  // 1. Get all API logs
  .get(
    "/",
    async () => {
      try {
        const logs = await sql`
          SELECT * FROM "api_logs" ORDER BY log_id DESC
        `;
        return { success: true, data: logs };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      detail: {
        tags: ["API Logs"],
        summary: "ดึงข้อมูลบันทึก API ทั้งหมด (Get all API logs)",
      },
    }
  )

  // 2. Get API log by ID
  .get(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [log] = await sql`
          SELECT * FROM "api_logs" WHERE log_id = ${id}
        `;
        if (!log) {
          return { success: false, error: "ไม่พบข้อมูลบันทึก API นี้" };
        }
        return { success: true, data: log };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["API Logs"],
        summary: "ดึงข้อมูลบันทึก API ด้วย ID (Get API log by ID)",
      },
    }
  )

  // 3. Create a new API log
  .post(
    "/",
    async ({ body }) => {
      try {
        const insertData = { ...body };
        if (insertData.request_body) insertData.request_body = JSON.stringify(insertData.request_body);
        if (insertData.response_body) insertData.response_body = JSON.stringify(insertData.response_body);

        const allowedColumns = [
          "api_name",
          "order_ref",
          "x_request_id",
          "x_client_ip",
          "request_body",
          "response_body",
          "status_code",
          "is_success",
          "error_message"
        ];
        const insertKeys = Object.keys(insertData).filter(
          (key) => insertData[key] !== undefined && allowedColumns.includes(key)
        );

        const [newLog] = await sql`
          INSERT INTO "api_logs" ${sql(insertData, ...insertKeys)}
          RETURNING *
        `;

        return { success: true, data: newLog };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        api_name: t.String({ minLength: 1 }),
        order_ref: t.Optional(t.String()),
        x_request_id: t.Optional(t.String()),
        x_client_ip: t.Optional(t.String()),
        request_body: t.Optional(t.Any()),
        response_body: t.Optional(t.Any()),
        status_code: t.Optional(t.String()),
        is_success: t.Optional(t.Boolean()),
        error_message: t.Optional(t.String()),
      }),
      detail: {
        tags: ["API Logs"],
        summary: "สร้างบันทึก API ใหม่ (Create API log)",
      },
    }
  )

  // 4. Update API log by ID (PUT - Full Update)
  .put(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        const [existing] = await sql`SELECT log_id FROM "api_logs" WHERE log_id = ${id}`;
        if (!existing) {
          return { success: false, error: "ไม่พบข้อมูลที่ต้องการอัปเดต" };
        }

        const updateData = {
          api_name: body.api_name,
          order_ref: body.order_ref ?? null,
          x_request_id: body.x_request_id ?? null,
          x_client_ip: body.x_client_ip ?? null,
          request_body: body.request_body ? JSON.stringify(body.request_body) : null,
          response_body: body.response_body ? JSON.stringify(body.response_body) : null,
          status_code: body.status_code ?? null,
          is_success: body.is_success ?? null,
          error_message: body.error_message ?? null,
          modify_time: new Date()
        };

        const [updated] = await sql`
          UPDATE "api_logs"
          SET ${sql(updateData, ...Object.keys(updateData))}
          WHERE log_id = ${id}
          RETURNING *
        `;

        return { success: true, data: updated };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      body: t.Object({
        api_name: t.String({ minLength: 1 }),
        order_ref: t.Optional(t.Nullable(t.String())),
        x_request_id: t.Optional(t.Nullable(t.String())),
        x_client_ip: t.Optional(t.Nullable(t.String())),
        request_body: t.Optional(t.Nullable(t.Any())),
        response_body: t.Optional(t.Nullable(t.Any())),
        status_code: t.Optional(t.Nullable(t.String())),
        is_success: t.Optional(t.Nullable(t.Boolean())),
        error_message: t.Optional(t.Nullable(t.String())),
      }),
      detail: {
        tags: ["API Logs"],
        summary: "อัปเดตข้อมูลบันทึก API ทั้งหมดด้วย ID (Put API log)",
      },
    }
  )

  // 5. Update API log by ID (PATCH - Partial Update)
  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        const [existing] = await sql`SELECT log_id FROM "api_logs" WHERE log_id = ${id}`;
        if (!existing) {
          return { success: false, error: "ไม่พบข้อมูลที่ต้องการอัปเดต" };
        }

        const updateData = { ...body, modify_time: new Date() };
        if (updateData.request_body) updateData.request_body = JSON.stringify(updateData.request_body);
        if (updateData.response_body) updateData.response_body = JSON.stringify(updateData.response_body);

        const allowedColumns = [
          "api_name",
          "order_ref",
          "x_request_id",
          "x_client_ip",
          "request_body",
          "response_body",
          "status_code",
          "is_success",
          "error_message",
          "modify_time"
        ];
        const updateKeys = Object.keys(updateData).filter(
          (key) => updateData[key] !== undefined && allowedColumns.includes(key)
        );

        if (updateKeys.length === 0) {
          return { success: false, error: "ไม่มีข้อมูลสำหรับการแก้ไข" };
        }

        const [updated] = await sql`
          UPDATE "api_logs"
          SET ${sql(updateData, ...updateKeys)}
          WHERE log_id = ${id}
          RETURNING *
        `;

        return { success: true, data: updated };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      body: t.Object({
        api_name: t.Optional(t.String({ minLength: 1 })),
        order_ref: t.Optional(t.Nullable(t.String())),
        x_request_id: t.Optional(t.Nullable(t.String())),
        x_client_ip: t.Optional(t.Nullable(t.String())),
        request_body: t.Optional(t.Nullable(t.Any())),
        response_body: t.Optional(t.Nullable(t.Any())),
        status_code: t.Optional(t.Nullable(t.String())),
        is_success: t.Optional(t.Nullable(t.Boolean())),
        error_message: t.Optional(t.Nullable(t.String())),
      }),
      detail: {
        tags: ["API Logs"],
        summary: "แก้ไขข้อมูลบันทึก API บางส่วนด้วย ID (Patch API log)",
      },
    }
  )

  // 6. Delete API log by ID
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [deleted] = await sql`
          DELETE FROM "api_logs" WHERE log_id = ${id} RETURNING log_id
        `;
        if (!deleted) {
          return { success: false, error: "ไม่พบข้อมูลบันทึก API ที่ต้องการลบ" };
        }
        return { success: true, message: `ลบบันทึก API ID ${id} เรียบร้อยแล้ว` };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["API Logs"],
        summary: "ลบข้อมูลบันทึก API ด้วย ID (Delete API log)",
      },
    }
  );
