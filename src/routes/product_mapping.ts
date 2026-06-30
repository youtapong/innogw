import { Elysia, t } from "elysia";
import { sql } from "../db";
import { product_token_encode } from "../utils/crypto";

export const productMappingRoutes = new Elysia({ prefix: "/product-mapping" })
  // 1. Get all product mappings
  .get(
    "/",
    async () => {
      try {
        const mappings = await sql`
          SELECT * FROM "product_mapping" ORDER BY id DESC
        `;
        return { success: true, data: mappings };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      detail: {
        tags: ["Product Mapping"],
        summary: "ดึงข้อมูลการจับคู่ผลิตภัณฑ์ทั้งหมด (Get all product mappings)",
      },
    }
  )

  // 2. Get product mapping by ID
  .get(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [mapping] = await sql`
          SELECT * FROM "product_mapping" WHERE id = ${id}
        `;
        if (!mapping) {
          return { success: false, error: "ไม่พบข้อมูลการจับคู่ผลิตภัณฑ์นี้" };
        }
        return { success: true, data: mapping };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Product Mapping"],
        summary: "ดึงข้อมูลการจับคู่ผลิตภัณฑ์ด้วย ID (Get product mapping by ID)",
      },
    }
  )

  // 3. Create a new product mapping
  .post(
    "/",
    async ({ body }) => {
      try {
        const token = product_token_encode(body.es_code);
        const insertData = { ...body, product_token: token };

        const allowedColumns = [
          "es_code",
          "product_name",
          "hana_account_code",
          "hana_product_code",
          "hana_sub_product_code",
          "hana_revenue_type",
          "ecc_account_code",
          "ecc_account_name",
          "ecc_product_code",
          "ecc_product_name",
          "channel_product_code",
          "channel_service_code",
          "product_token"
        ];
        const insertKeys = Object.keys(insertData).filter(
          (key) => insertData[key] !== undefined && allowedColumns.includes(key)
        );

        const [newMapping] = await sql`
          INSERT INTO "product_mapping" ${sql(insertData, ...insertKeys)}
          RETURNING *
        `;

        return { success: true, data: newMapping };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        es_code: t.String({ minLength: 1 }),
        product_name: t.String({ minLength: 1 }),
        hana_account_code: t.Optional(t.String()),
        hana_product_code: t.Optional(t.String()),
        hana_sub_product_code: t.Optional(t.String()),
        hana_revenue_type: t.Optional(t.String()),
        ecc_account_code: t.Optional(t.String()),
        ecc_account_name: t.Optional(t.String()),
        ecc_product_code: t.Optional(t.String()),
        ecc_product_name: t.Optional(t.String()),
        channel_product_code: t.Optional(t.String()),
        channel_service_code: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Product Mapping"],
        summary: "สร้างข้อมูลการจับคู่ผลิตภัณฑ์ใหม่ (Create product mapping)",
      },
    }
  )

  // 4. Update product mapping by ID (PUT - Full Update)
  .put(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        const [existing] = await sql`SELECT id FROM "product_mapping" WHERE id = ${id}`;
        if (!existing) {
          return { success: false, error: "ไม่พบข้อมูลที่ต้องการอัปเดต" };
        }

        const token = product_token_encode(body.es_code);

        const updateData = {
          es_code: body.es_code,
          product_name: body.product_name,
          hana_account_code: body.hana_account_code ?? '44100101',
          hana_product_code: body.hana_product_code ?? '209020001',
          hana_sub_product_code: body.hana_sub_product_code ?? '0',
          hana_revenue_type: body.hana_revenue_type ?? '2',
          ecc_account_code: body.ecc_account_code ?? '50412000',
          ecc_account_name: body.ecc_account_name ?? 'รายได้บริการด้านนวัตกรรม',
          ecc_product_code: body.ecc_product_code ?? 'G030xx',
          ecc_product_name: body.ecc_product_name ?? 'บริการด้านวิจัยและนวัตกรรม',
          channel_product_code: body.channel_product_code ?? 'SPC60001',
          channel_service_code: body.channel_service_code,
          product_token: token,
          modify_time: new Date()
        };

        const [updated] = await sql`
          UPDATE "product_mapping"
          SET ${sql(updateData, ...Object.keys(updateData))}
          WHERE id = ${id}
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
        es_code: t.String({ minLength: 1 }),
        product_name: t.String({ minLength: 1 }),
        hana_account_code: t.Optional(t.Nullable(t.String())),
        hana_product_code: t.Optional(t.Nullable(t.String())),
        hana_sub_product_code: t.Optional(t.Nullable(t.String())),
        hana_revenue_type: t.Optional(t.Nullable(t.String())),
        ecc_account_code: t.Optional(t.Nullable(t.String())),
        ecc_account_name: t.Optional(t.Nullable(t.String())),
        ecc_product_code: t.Optional(t.Nullable(t.String())),
        ecc_product_name: t.Optional(t.Nullable(t.String())),
        channel_product_code: t.Optional(t.Nullable(t.String())),
        channel_service_code: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Product Mapping"],
        summary: "อัปเดตข้อมูลการจับคู่ผลิตภัณฑ์ทั้งหมดด้วย ID (Put product mapping)",
      },
    }
  )

  // 5. Update product mapping by ID (PATCH - Partial Update)
  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        const [existing] = await sql`SELECT id, es_code FROM "product_mapping" WHERE id = ${id}`;
        if (!existing) {
          return { success: false, error: "ไม่พบข้อมูลที่ต้องการอัปเดต" };
        }

        const activeEsCode = body.es_code || existing.es_code;
        const token = product_token_encode(activeEsCode);

        const updateData = { ...body, product_token: token, modify_time: new Date() };
        const allowedColumns = [
          "es_code",
          "product_name",
          "hana_account_code",
          "hana_product_code",
          "hana_sub_product_code",
          "hana_revenue_type",
          "ecc_account_code",
          "ecc_account_name",
          "ecc_product_code",
          "ecc_product_name",
          "channel_product_code",
          "channel_service_code",
          "product_token",
          "modify_time"
        ];
        const updateKeys = Object.keys(updateData).filter(
          (key) => updateData[key] !== undefined && allowedColumns.includes(key)
        );

        if (updateKeys.length === 0) {
          return { success: false, error: "ไม่มีข้อมูลสำหรับการแก้ไข" };
        }

        const [updated] = await sql`
          UPDATE "product_mapping"
          SET ${sql(updateData, ...updateKeys)}
          WHERE id = ${id}
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
        es_code: t.Optional(t.String({ minLength: 1 })),
        product_name: t.Optional(t.String({ minLength: 1 })),
        hana_account_code: t.Optional(t.Nullable(t.String())),
        hana_product_code: t.Optional(t.Nullable(t.String())),
        hana_sub_product_code: t.Optional(t.Nullable(t.String())),
        hana_revenue_type: t.Optional(t.Nullable(t.String())),
        ecc_account_code: t.Optional(t.Nullable(t.String())),
        ecc_account_name: t.Optional(t.Nullable(t.String())),
        ecc_product_code: t.Optional(t.Nullable(t.String())),
        ecc_product_name: t.Optional(t.Nullable(t.String())),
        channel_product_code: t.Optional(t.Nullable(t.String())),
        channel_service_code: t.Optional(t.String({ minLength: 1 })),
      }),
      detail: {
        tags: ["Product Mapping"],
        summary: "อัปเดตข้อมูลการจับคู่ผลิตภัณฑ์บางส่วนด้วย ID (Patch product mapping)",
      },
    }
  )

  // 6. Delete product mapping by ID
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [existing] = await sql`SELECT id FROM "product_mapping" WHERE id = ${id}`;
        if (!existing) {
          return { success: false, error: "ไม่พบข้อมูลที่ต้องการลบ" };
        }

        await sql`
          DELETE FROM "product_mapping" WHERE id = ${id}
        `;

        return { success: true, message: "ลบข้อมูลการจับคู่ผลิตภัณฑ์เรียบร้อยแล้ว" };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Product Mapping"],
        summary: "ลบข้อมูลการจับคู่ผลิตภัณฑ์ด้วย ID (Delete product mapping)",
      },
    }
  );
