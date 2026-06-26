import { Elysia, t } from "elysia";
import { sql } from "../db";

export const spatialRefSysRoutes = new Elysia({ prefix: "/spatial-ref-sys" })
  // 1. Get all spatial reference systems
  .get(
    "/",
    async () => {
      try {
        const systems = await sql`
          SELECT * FROM "spatial_ref_sys" ORDER BY srid ASC LIMIT 100
        `;
        return { success: true, data: systems };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      detail: {
        tags: ["Spatial Reference Systems"],
        summary: "ดึงข้อมูลระบบอ้างอิงพิกัดสูงสุด 100 รายการ (Get spatial ref systems, limit 100)",
      },
    }
  )

  // 2. Get spatial reference system by SRID
  .get(
    "/:srid",
    async ({ params: { srid } }) => {
      try {
        const [system] = await sql`
          SELECT * FROM "spatial_ref_sys" WHERE srid = ${srid}
        `;
        if (!system) {
          return { success: false, error: "ไม่พบข้อมูลระบบอ้างอิงพิกัดนี้" };
        }
        return { success: true, data: system };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        srid: t.Numeric(),
      }),
      detail: {
        tags: ["Spatial Reference Systems"],
        summary: "ดึงข้อมูลระบบอ้างอิงพิกัดด้วย SRID (Get spatial ref system by SRID)",
      },
    }
  )

  // 3. Create a new spatial reference system
  .post(
    "/",
    async ({ body }) => {
      try {
        const insertData = { ...body };
        const allowedColumns = [
          "srid",
          "auth_name",
          "auth_srid",
          "srtext",
          "proj4text"
        ];
        const insertKeys = Object.keys(insertData).filter(
          (key) => insertData[key] !== undefined && allowedColumns.includes(key)
        );

        const [newSystem] = await sql`
          INSERT INTO "spatial_ref_sys" ${sql(insertData, ...insertKeys)}
          RETURNING *
        `;

        return { success: true, data: newSystem };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        srid: t.Integer(),
        auth_name: t.Optional(t.String()),
        auth_srid: t.Optional(t.Integer()),
        srtext: t.Optional(t.String()),
        proj4text: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Spatial Reference Systems"],
        summary: "สร้างข้อมูลระบบอ้างอิงพิกัดใหม่ (Create spatial ref system)",
      },
    }
  )

  // 4. Update spatial reference system by SRID (PUT - Full Update)
  .put(
    "/:srid",
    async ({ params: { srid }, body }) => {
      try {
        const [existing] = await sql`SELECT srid FROM "spatial_ref_sys" WHERE srid = ${srid}`;
        if (!existing) {
          return { success: false, error: "ไม่พบข้อมูลที่ต้องการอัปเดต" };
        }

        const updateData = {
          auth_name: body.auth_name ?? null,
          auth_srid: body.auth_srid ?? null,
          srtext: body.srtext ?? null,
          proj4text: body.proj4text ?? null
        };

        const [updated] = await sql`
          UPDATE "spatial_ref_sys"
          SET ${sql(updateData, ...Object.keys(updateData))}
          WHERE srid = ${srid}
          RETURNING *
        `;

        return { success: true, data: updated };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        srid: t.Numeric(),
      }),
      body: t.Object({
        auth_name: t.Optional(t.Nullable(t.String())),
        auth_srid: t.Optional(t.Nullable(t.Integer())),
        srtext: t.Optional(t.Nullable(t.String())),
        proj4text: t.Optional(t.Nullable(t.String())),
      }),
      detail: {
        tags: ["Spatial Reference Systems"],
        summary: "อัปเดตข้อมูลระบบอ้างอิงพิกัดทั้งหมดด้วย SRID (Put spatial ref system)",
      },
    }
  )

  // 5. Update spatial reference system by SRID (PATCH - Partial Update)
  .patch(
    "/:srid",
    async ({ params: { srid }, body }) => {
      try {
        const [existing] = await sql`SELECT srid FROM "spatial_ref_sys" WHERE srid = ${srid}`;
        if (!existing) {
          return { success: false, error: "ไม่พบข้อมูลที่ต้องการอัปเดต" };
        }

        const updateData = { ...body };
        const allowedColumns = [
          "auth_name",
          "auth_srid",
          "srtext",
          "proj4text"
        ];
        const updateKeys = Object.keys(updateData).filter(
          (key) => updateData[key] !== undefined && allowedColumns.includes(key)
        );

        if (updateKeys.length === 0) {
          return { success: false, error: "ไม่มีข้อมูลสำหรับการแก้ไข" };
        }

        const [updated] = await sql`
          UPDATE "spatial_ref_sys"
          SET ${sql(updateData, ...updateKeys)}
          WHERE srid = ${srid}
          RETURNING *
        `;

        return { success: true, data: updated };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        srid: t.Numeric(),
      }),
      body: t.Object({
        auth_name: t.Optional(t.Nullable(t.String())),
        auth_srid: t.Optional(t.Nullable(t.Integer())),
        srtext: t.Optional(t.Nullable(t.String())),
        proj4text: t.Optional(t.Nullable(t.String())),
      }),
      detail: {
        tags: ["Spatial Reference Systems"],
        summary: "แก้ไขข้อมูลระบบอ้างอิงพิกัดบางส่วนด้วย SRID (Patch spatial ref system)",
      },
    }
  )

  // 6. Delete spatial reference system by SRID
  .delete(
    "/:srid",
    async ({ params: { srid } }) => {
      try {
        const [deleted] = await sql`
          DELETE FROM "spatial_ref_sys" WHERE srid = ${srid} RETURNING srid
        `;
        if (!deleted) {
          return { success: false, error: "ไม่พบข้อมูลที่ต้องการลบ" };
        }
        return { success: true, message: `ลบข้อมูลระบบอ้างอิงพิกัด SRID ${srid} เรียบร้อยแล้ว` };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        srid: t.Numeric(),
      }),
      detail: {
        tags: ["Spatial Reference Systems"],
        summary: "ลบข้อมูลระบบอ้างอิงพิกัดด้วย SRID (Delete spatial ref system)",
      },
    }
  );
