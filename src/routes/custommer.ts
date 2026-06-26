import { Elysia, t } from "elysia";
import { sql } from "../db";

export const custommerRoutes = new Elysia({ prefix: "/custommer" })
  // 1. Get all customers
  .get(
    "/",
    async () => {
      try {
        const customers = await sql`
          SELECT * FROM "custommer" ORDER BY custommer_id DESC
        `;
        return { success: true, data: customers };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      detail: {
        tags: ["Customer"],
        summary: "ดึงข้อมูลลูกค้าทั้งหมด (Get all customers)",
      },
    }
  )

  // 2. Get customer by ID
  .get(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [customer] = await sql`
          SELECT * FROM "custommer" WHERE custommer_id = ${id}
        `;
        if (!customer) {
          return { success: false, error: "ไม่พบข้อมูลลูกค้านี้" };
        }
        return { success: true, data: customer };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Customer"],
        summary: "ดึงข้อมูลลูกค้าด้วย ID (Get customer by ID)",
      },
    }
  )

  // 3. Create a new customer
  .post(
    "/",
    async ({ body }) => {
      try {
        const insertData = { ...body };
        const allowedColumns = [
          "es_code",
          "document_type_code",
          "tax_id_type",
          "national_id",
          "business_id",
          "branch_id",
          "company_name",
          "first_name",
          "last_name",
          "email",
          "mobile",
          "village",
          "house_no",
          "moo",
          "soi",
          "road",
          "sub_district",
          "district",
          "province",
          "zip_code",
          "office_name"
        ];
        const insertKeys = Object.keys(insertData).filter(
          (key) => insertData[key] !== undefined && allowedColumns.includes(key)
        );

        const [newCustomer] = await sql`
          INSERT INTO "custommer" ${sql(insertData, ...insertKeys)}
          RETURNING *
        `;

        return { success: true, data: newCustomer };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        es_code: t.String({ minLength: 1 }),
        document_type_code: t.String({ minLength: 1 }),
        tax_id_type: t.String({ minLength: 1 }),
        national_id: t.Optional(t.String()),
        business_id: t.Optional(t.String()),
        branch_id: t.Optional(t.String()),
        company_name: t.Optional(t.String()),
        first_name: t.Optional(t.String()),
        last_name: t.Optional(t.String()),
        email: t.Optional(t.String()),
        mobile: t.String({ minLength: 1 }),
        village: t.Optional(t.String()),
        house_no: t.Optional(t.String()),
        moo: t.Optional(t.String()),
        soi: t.Optional(t.String()),
        road: t.Optional(t.String()),
        sub_district: t.Optional(t.String()),
        district: t.Optional(t.String()),
        province: t.Optional(t.String()),
        zip_code: t.Optional(t.String()),
        office_name: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Customer"],
        summary: "สร้างข้อมูลลูกค้าใหม่ (Create customer)",
      },
    }
  )

  // 4. Update customer by ID (PUT - Full Update)
  .put(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        const [existing] = await sql`SELECT custommer_id FROM "custommer" WHERE custommer_id = ${id}`;
        if (!existing) {
          return { success: false, error: "ไม่พบข้อมูลลูกค้าที่ต้องการอัปเดต" };
        }

        const updateData = {
          es_code: body.es_code,
          document_type_code: body.document_type_code,
          tax_id_type: body.tax_id_type,
          national_id: body.national_id ?? null,
          business_id: body.business_id ?? null,
          branch_id: body.branch_id ?? null,
          company_name: body.company_name ?? null,
          first_name: body.first_name ?? null,
          last_name: body.last_name ?? null,
          email: body.email ?? null,
          mobile: body.mobile,
          village: body.village ?? null,
          house_no: body.house_no ?? null,
          moo: body.moo ?? null,
          soi: body.soi ?? null,
          road: body.road ?? null,
          sub_district: body.sub_district ?? null,
          district: body.district ?? null,
          province: body.province ?? null,
          zip_code: body.zip_code ?? null,
          office_name: body.office_name ?? null,
          modify_time: new Date()
        };

        const [updated] = await sql`
          UPDATE "custommer"
          SET ${sql(updateData, ...Object.keys(updateData))}
          WHERE custommer_id = ${id}
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
        document_type_code: t.String({ minLength: 1 }),
        tax_id_type: t.String({ minLength: 1 }),
        national_id: t.Optional(t.Nullable(t.String())),
        business_id: t.Optional(t.Nullable(t.String())),
        branch_id: t.Optional(t.Nullable(t.String())),
        company_name: t.Optional(t.Nullable(t.String())),
        first_name: t.Optional(t.Nullable(t.String())),
        last_name: t.Optional(t.Nullable(t.String())),
        email: t.Optional(t.Nullable(t.String())),
        mobile: t.String({ minLength: 1 }),
        village: t.Optional(t.Nullable(t.String())),
        house_no: t.Optional(t.Nullable(t.String())),
        moo: t.Optional(t.Nullable(t.String())),
        soi: t.Optional(t.Nullable(t.String())),
        road: t.Optional(t.Nullable(t.String())),
        sub_district: t.Optional(t.Nullable(t.String())),
        district: t.Optional(t.Nullable(t.String())),
        province: t.Optional(t.Nullable(t.String())),
        zip_code: t.Optional(t.Nullable(t.String())),
        office_name: t.Optional(t.Nullable(t.String())),
      }),
      detail: {
        tags: ["Customer"],
        summary: "อัปเดตข้อมูลลูกค้าทั้งหมดด้วย ID (Put customer)",
      },
    }
  )

  // 5. Update customer by ID (PATCH - Partial Update)
  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        const [existing] = await sql`SELECT custommer_id FROM "custommer" WHERE custommer_id = ${id}`;
        if (!existing) {
          return { success: false, error: "ไม่พบข้อมูลลูกค้าที่ต้องการอัปเดต" };
        }

        const updateData = { ...body, modify_time: new Date() };
        const allowedColumns = [
          "es_code",
          "document_type_code",
          "tax_id_type",
          "national_id",
          "business_id",
          "branch_id",
          "company_name",
          "first_name",
          "last_name",
          "email",
          "mobile",
          "village",
          "house_no",
          "moo",
          "soi",
          "road",
          "sub_district",
          "district",
          "province",
          "zip_code",
          "office_name",
          "modify_time"
        ];
        const updateKeys = Object.keys(updateData).filter(
          (key) => updateData[key] !== undefined && allowedColumns.includes(key)
        );

        if (updateKeys.length === 0) {
          return { success: false, error: "ไม่มีข้อมูลสำหรับการแก้ไข" };
        }

        const [updated] = await sql`
          UPDATE "custommer"
          SET ${sql(updateData, ...updateKeys)}
          WHERE custommer_id = ${id}
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
        document_type_code: t.Optional(t.String({ minLength: 1 })),
        tax_id_type: t.Optional(t.String({ minLength: 1 })),
        national_id: t.Optional(t.Nullable(t.String())),
        business_id: t.Optional(t.Nullable(t.String())),
        branch_id: t.Optional(t.Nullable(t.String())),
        company_name: t.Optional(t.Nullable(t.String())),
        first_name: t.Optional(t.Nullable(t.String())),
        last_name: t.Optional(t.Nullable(t.String())),
        email: t.Optional(t.Nullable(t.String())),
        mobile: t.Optional(t.String({ minLength: 1 })),
        village: t.Optional(t.Nullable(t.String())),
        house_no: t.Optional(t.Nullable(t.String())),
        moo: t.Optional(t.Nullable(t.String())),
        soi: t.Optional(t.Nullable(t.String())),
        road: t.Optional(t.Nullable(t.String())),
        sub_district: t.Optional(t.Nullable(t.String())),
        district: t.Optional(t.Nullable(t.String())),
        province: t.Optional(t.Nullable(t.String())),
        zip_code: t.Optional(t.Nullable(t.String())),
        office_name: t.Optional(t.Nullable(t.String())),
      }),
      detail: {
        tags: ["Customer"],
        summary: "แก้ไขข้อมูลลูกค้าบางส่วนด้วย ID (Patch customer)",
      },
    }
  )

  // 6. Delete customer by ID
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [deleted] = await sql`
          DELETE FROM "custommer" WHERE custommer_id = ${id} RETURNING custommer_id
        `;
        if (!deleted) {
          return { success: false, error: "ไม่พบข้อมูลลูกค้าที่ต้องการลบ" };
        }
        return { success: true, message: `ลบข้อมูลลูกค้า ID ${id} เรียบร้อยแล้ว` };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Customer"],
        summary: "ลบข้อมูลลูกค้าด้วย ID (Delete customer)",
      },
    }
  );
