import { Elysia, t } from "elysia";
import { sql } from "../db";

export const orderItemsRoutes = new Elysia({ prefix: "/order-items" })
  // 1. Get all order items
  .get(
    "/",
    async () => {
      try {
        const items = await sql`
          SELECT * FROM "order_items" ORDER BY item_id DESC
        `;
        return { success: true, data: items };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      detail: {
        tags: ["Order Items"],
        summary: "ดึงข้อมูลรายการคำสั่งซื้อทั้งหมด (Get all order items)",
      },
    }
  )

  // 2. Get order item by ID
  .get(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [item] = await sql`
          SELECT * FROM "order_items" WHERE item_id = ${id}
        `;
        if (!item) {
          return { success: false, error: "ไม่พบข้อมูลรายการนี้" };
        }
        return { success: true, data: item };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Order Items"],
        summary: "ดึงข้อมูลรายการคำสั่งซื้อด้วย ID (Get order item by ID)",
      },
    }
  )

  // 3. Create a new order item
  .post(
    "/",
    async ({ body }) => {
      try {
        const insertData = { ...body };
        const allowedColumns = [
          "order_ref",
          "es_code",
          "account_code",
          "hana_product_code",
          "hana_product_name",
          "model",
          "company_code",
          "home_code",
          "production_option1",
          "production_option2",
          "production_option3",
          "unit",
          "price",
          "vat",
          "net_price",
          "net_vat",
          "status"
        ];
        const insertKeys = Object.keys(insertData).filter(
          (key) => insertData[key] !== undefined && allowedColumns.includes(key)
        );

        const [newItem] = await sql`
          INSERT INTO "order_items" ${sql(insertData, ...insertKeys)}
          RETURNING *
        `;

        return { success: true, data: newItem };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        order_ref: t.String({ minLength: 1 }),
        es_code: t.String({ minLength: 1 }),
        account_code: t.String({ minLength: 1 }),
        hana_product_code: t.String({ minLength: 1 }),
        hana_product_name: t.String({ minLength: 1 }),
        model: t.Optional(t.String()),
        company_code: t.String({ minLength: 1 }),
        home_code: t.Optional(t.String()),
        production_option1: t.Optional(t.String()),
        production_option2: t.Optional(t.String()),
        production_option3: t.Optional(t.String()),
        unit: t.Optional(t.Integer()),
        price: t.Optional(t.Numeric()),
        vat: t.Optional(t.Numeric()),
        net_price: t.Optional(t.Numeric()),
        net_vat: t.Optional(t.Numeric()),
        status: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Order Items"],
        summary: "สร้างข้อมูลรายการคำสั่งซื้อใหม่ (Create order item)",
      },
    }
  )

  // 4. Update order item by ID (PUT - Full Update)
  .put(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        const [existing] = await sql`SELECT item_id FROM "order_items" WHERE item_id = ${id}`;
        if (!existing) {
          return { success: false, error: "ไม่พบข้อมูลที่ต้องการอัปเดต" };
        }

        const updateData = {
          order_ref: body.order_ref,
          es_code: body.es_code,
          account_code: body.account_code,
          hana_product_code: body.hana_product_code,
          hana_product_name: body.hana_product_name,
          model: body.model ?? null,
          company_code: body.company_code,
          home_code: body.home_code ?? null,
          production_option1: body.production_option1 ?? null,
          production_option2: body.production_option2 ?? null,
          production_option3: body.production_option3 ?? null,
          unit: body.unit ?? 1,
          price: body.price ?? 0.00,
          vat: body.vat ?? 0.00,
          net_price: body.net_price ?? 0.00,
          net_vat: body.net_vat ?? 0.00,
          status: body.status ?? 'success',
          modify_time: new Date()
        };

        const [updated] = await sql`
          UPDATE "order_items"
          SET ${sql(updateData, ...Object.keys(updateData))}
          WHERE item_id = ${id}
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
        order_ref: t.String({ minLength: 1 }),
        es_code: t.String({ minLength: 1 }),
        account_code: t.String({ minLength: 1 }),
        hana_product_code: t.String({ minLength: 1 }),
        hana_product_name: t.String({ minLength: 1 }),
        model: t.Optional(t.Nullable(t.String())),
        company_code: t.String({ minLength: 1 }),
        home_code: t.Optional(t.Nullable(t.String())),
        production_option1: t.Optional(t.Nullable(t.String())),
        production_option2: t.Optional(t.Nullable(t.String())),
        production_option3: t.Optional(t.Nullable(t.String())),
        unit: t.Optional(t.Nullable(t.Integer())),
        price: t.Optional(t.Nullable(t.Numeric())),
        vat: t.Optional(t.Nullable(t.Numeric())),
        net_price: t.Optional(t.Nullable(t.Numeric())),
        net_vat: t.Optional(t.Nullable(t.Numeric())),
        status: t.Optional(t.Nullable(t.String())),
      }),
      detail: {
        tags: ["Order Items"],
        summary: "อัปเดตข้อมูลรายการคำสั่งซื้อทั้งหมดด้วย ID (Put order item)",
      },
    }
  )

  // 5. Update order item by ID (PATCH - Partial Update)
  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        const [existing] = await sql`SELECT item_id FROM "order_items" WHERE item_id = ${id}`;
        if (!existing) {
          return { success: false, error: "ไม่พบข้อมูลที่ต้องการอัปเดต" };
        }

        const updateData = { ...body, modify_time: new Date() };
        const allowedColumns = [
          "order_ref",
          "es_code",
          "account_code",
          "hana_product_code",
          "hana_product_name",
          "model",
          "company_code",
          "home_code",
          "production_option1",
          "production_option2",
          "production_option3",
          "unit",
          "price",
          "vat",
          "net_price",
          "net_vat",
          "status",
          "modify_time"
        ];
        const updateKeys = Object.keys(updateData).filter(
          (key) => updateData[key] !== undefined && allowedColumns.includes(key)
        );

        if (updateKeys.length === 0) {
          return { success: false, error: "ไม่มีข้อมูลสำหรับการแก้ไข" };
        }

        const [updated] = await sql`
          UPDATE "order_items"
          SET ${sql(updateData, ...updateKeys)}
          WHERE item_id = ${id}
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
        order_ref: t.Optional(t.String({ minLength: 1 })),
        es_code: t.Optional(t.String({ minLength: 1 })),
        account_code: t.Optional(t.String({ minLength: 1 })),
        hana_product_code: t.Optional(t.String({ minLength: 1 })),
        hana_product_name: t.Optional(t.String({ minLength: 1 })),
        model: t.Optional(t.Nullable(t.String())),
        company_code: t.Optional(t.String({ minLength: 1 })),
        home_code: t.Optional(t.Nullable(t.String())),
        production_option1: t.Optional(t.Nullable(t.String())),
        production_option2: t.Optional(t.Nullable(t.String())),
        production_option3: t.Optional(t.Nullable(t.String())),
        unit: t.Optional(t.Nullable(t.Integer())),
        price: t.Optional(t.Nullable(t.Numeric())),
        vat: t.Optional(t.Nullable(t.Numeric())),
        net_price: t.Optional(t.Nullable(t.Numeric())),
        net_vat: t.Optional(t.Nullable(t.Numeric())),
        status: t.Optional(t.Nullable(t.String())),
      }),
      detail: {
        tags: ["Order Items"],
        summary: "แก้ไขข้อมูลรายการคำสั่งซื้อบางส่วนด้วย ID (Patch order item)",
      },
    }
  )

  // 6. Delete order item by ID
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [deleted] = await sql`
          DELETE FROM "order_items" WHERE item_id = ${id} RETURNING item_id
        `;
        if (!deleted) {
          return { success: false, error: "ไม่พบข้อมูลรายการที่ต้องการลบ" };
        }
        return { success: true, message: `ลบข้อมูลรายการคำสั่งซื้อ ID ${id} เรียบร้อยแล้ว` };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Order Items"],
        summary: "ลบข้อมูลรายการคำสั่งซื้อด้วย ID (Delete order item)",
      },
    }
  );
