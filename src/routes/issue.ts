import { Elysia, t } from "elysia";
import { sql } from "../db";

export const issueRoutes = new Elysia({ prefix: "/issue" })
  // 1. Get all issues
  .get(
    "/",
    async () => {
      try {
        const issues = await sql`
          SELECT * FROM "issue" ORDER BY issue_id DESC
        `;
        return { success: true, data: issues };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      detail: {
        tags: ["Issue"],
        summary: "ดึงข้อมูลปัญหาทั้งหมด (Get all issues)",
      },
    }
  )

  // 2. Get issue by ID
  .get(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [issue] = await sql`
          SELECT * FROM "issue" WHERE issue_id = ${id}
        `;
        if (!issue) {
          return { success: false, error: "ไม่พบข้อมูลปัญหานี้" };
        }
        return { success: true, data: issue };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Issue"],
        summary: "ดึงข้อมูลปัญหาด้วย ID (Get issue by ID)",
      },
    }
  )

  // 3. Create a new issue
  .post(
    "/",
    async ({ body }) => {
      try {
        const insertData = { ...body };
        const allowedColumns = [
          "item_id",
          "order_ref",
          "service_name",
          "issue_title",
          "issue_detail",
          "payment_received",
          "frontend_problem",
          "expected_behavior",
          "actual_behavior",
          "issue_status",
          "resolved_by",
          "resolved_note"
        ];
        const insertKeys = Object.keys(insertData).filter(
          (key) => insertData[key] !== undefined && allowedColumns.includes(key)
        );

        const [newIssue] = await sql`
          INSERT INTO "issue" ${sql(insertData, ...insertKeys)}
          RETURNING *
        `;

        return { success: true, data: newIssue };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        item_id: t.Integer(),
        order_ref: t.String({ minLength: 1 }),
        service_name: t.String({ minLength: 1 }),
        issue_title: t.String({ minLength: 1 }),
        issue_detail: t.Optional(t.String()),
        payment_received: t.Optional(t.Boolean()),
        frontend_problem: t.Optional(t.String()),
        expected_behavior: t.Optional(t.String()),
        actual_behavior: t.Optional(t.String()),
        issue_status: t.Optional(t.String()),
        resolved_by: t.Optional(t.String()),
        resolved_note: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Issue"],
        summary: "สร้างข้อมูลปัญหาใหม่ (Create issue)",
      },
    }
  )

  // 4. Update issue by ID (PUT - Full Update)
  .put(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        const [existing] = await sql`SELECT issue_id FROM "issue" WHERE issue_id = ${id}`;
        if (!existing) {
          return { success: false, error: "ไม่พบข้อมูลปัญหาที่ต้องการอัปเดต" };
        }

        const updateData = {
          item_id: body.item_id,
          order_ref: body.order_ref,
          service_name: body.service_name,
          issue_title: body.issue_title,
          issue_detail: body.issue_detail ?? null,
          payment_received: body.payment_received ?? true,
          frontend_problem: body.frontend_problem ?? null,
          expected_behavior: body.expected_behavior ?? null,
          actual_behavior: body.actual_behavior ?? null,
          issue_status: body.issue_status ?? 'open',
          resolved_by: body.resolved_by ?? null,
          resolved_note: body.resolved_note ?? null,
          modify_time: new Date()
        };

        const [updated] = await sql`
          UPDATE "issue"
          SET ${sql(updateData, ...Object.keys(updateData))}
          WHERE issue_id = ${id}
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
        item_id: t.Integer(),
        order_ref: t.String({ minLength: 1 }),
        service_name: t.String({ minLength: 1 }),
        issue_title: t.String({ minLength: 1 }),
        issue_detail: t.Optional(t.Nullable(t.String())),
        payment_received: t.Optional(t.Nullable(t.Boolean())),
        frontend_problem: t.Optional(t.Nullable(t.String())),
        expected_behavior: t.Optional(t.Nullable(t.String())),
        actual_behavior: t.Optional(t.Nullable(t.String())),
        issue_status: t.Optional(t.Nullable(t.String())),
        resolved_by: t.Optional(t.Nullable(t.String())),
        resolved_note: t.Optional(t.Nullable(t.String())),
      }),
      detail: {
        tags: ["Issue"],
        summary: "อัปเดตข้อมูลปัญหาทั้งหมดด้วย ID (Put issue)",
      },
    }
  )

  // 5. Update issue by ID (PATCH - Partial Update)
  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        const [existing] = await sql`SELECT issue_id FROM "issue" WHERE issue_id = ${id}`;
        if (!existing) {
          return { success: false, error: "ไม่พบข้อมูลปัญหาที่ต้องการอัปเดต" };
        }

        const updateData = { ...body, modify_time: new Date() };
        const allowedColumns = [
          "item_id",
          "order_ref",
          "service_name",
          "issue_title",
          "issue_detail",
          "payment_received",
          "frontend_problem",
          "expected_behavior",
          "actual_behavior",
          "issue_status",
          "resolved_by",
          "resolved_note",
          "modify_time"
        ];
        const updateKeys = Object.keys(updateData).filter(
          (key) => updateData[key] !== undefined && allowedColumns.includes(key)
        );

        if (updateKeys.length === 0) {
          return { success: false, error: "ไม่มีข้อมูลสำหรับการแก้ไข" };
        }

        const [updated] = await sql`
          UPDATE "issue"
          SET ${sql(updateData, ...updateKeys)}
          WHERE issue_id = ${id}
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
        item_id: t.Optional(t.Integer()),
        order_ref: t.Optional(t.String({ minLength: 1 })),
        service_name: t.Optional(t.String({ minLength: 1 })),
        issue_title: t.Optional(t.String({ minLength: 1 })),
        issue_detail: t.Optional(t.Nullable(t.String())),
        payment_received: t.Optional(t.Nullable(t.Boolean())),
        frontend_problem: t.Optional(t.Nullable(t.String())),
        expected_behavior: t.Optional(t.Nullable(t.String())),
        actual_behavior: t.Optional(t.Nullable(t.String())),
        issue_status: t.Optional(t.Nullable(t.String())),
        resolved_by: t.Optional(t.Nullable(t.String())),
        resolved_note: t.Optional(t.Nullable(t.String())),
      }),
      detail: {
        tags: ["Issue"],
        summary: "แก้ไขข้อมูลปัญหาบางส่วนด้วย ID (Patch issue)",
      },
    }
  )

  // 6. Delete issue by ID
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [deleted] = await sql`
          DELETE FROM "issue" WHERE issue_id = ${id} RETURNING issue_id
        `;
        if (!deleted) {
          return { success: false, error: "ไม่พบข้อมูลปัญหาที่ต้องการลบ" };
        }
        return { success: true, message: `ลบข้อมูลปัญหา ID ${id} เรียบร้อยแล้ว` };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Issue"],
        summary: "ลบข้อมูลปัญหาด้วย ID (Delete issue)",
      },
    }
  );
