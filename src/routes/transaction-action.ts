import { Elysia, t } from "elysia";
import { sql } from "../db";
import { signature } from "../utils/crypto";

export const transactionActionRoutes = new Elysia({
  prefix: "/transaction",
}).post(
  "/action",
  async ({ headers, body, request, set }) => {
    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const requestId = request.headers.get("x-request-id") || "";
    const orderRef =
      (body as any)?.orderRef || (body as any)?.order_ref || null;
    const paymentType =
      (body as any)?.payment_type !== undefined
        ? (body as any).payment_type
        : 0;

    console.log(
      `[transaction-action] Starting processing for orderRef: ${orderRef}, payment_type: ${paymentType}`,
    );

    // Extract authorization header
    const authHeader = headers["authorization"];
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

    if (!token) {
      set.status = 401;
      const responseBody = {
        success: false,
        error: "Unauthorized: Missing Bearer Token",
      };

      try {
        await sql`
            INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, error_message, status_code)
            VALUES ('transaction-action-unauthorized', ${JSON.stringify(body || {})}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'Unauthorized: Missing Bearer Token', '401')
          `;
      } catch (err) {
        console.error("Failed to log transaction-action auth failure:", err);
      }
      return responseBody;
    }

    try {
      if (!orderRef) {
        throw new Error("Missing orderRef in request body");
      }

      // 1. นำ orderRef มาแยกโดยใช้เครื่องหมาย - แล้วใส่ array value
      console.log(
        `[transaction-action] Step 1: Splitting orderRef: ${orderRef}`,
      );
      const parts = orderRef.split("-");
      const esCode = parts[0];
      console.log(
        `[transaction-action] Step 1 complete. Extracted esCode: ${esCode}`,
      );

      // 2. ค้นหาใน table product_mapping where es_code = value(0)
      console.log(
        `[transaction-action] Step 2: Querying product_mapping for es_code: ${esCode}`,
      );
      const [mapping] = await sql`
          SELECT product_token, product_name, channel_product_code, channel_service_code, 
                 hana_account_code, hana_product_code, 
                 ecc_account_code, ecc_product_code, ecc_product_name, bank_url 
          FROM "product_mapping" 
          WHERE es_code = ${esCode}
        `;

      if (!mapping) {
        set.status = 404;
        const responseBody = {
          success: false,
          error: `Product mapping not found for esCode: ${esCode}`,
        };
        await sql`
            INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, error_message, status_code)
            VALUES ('transaction-action-error', ${JSON.stringify(body || {})}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, ${responseBody.error}, '404')
          `;
        return responseBody;
      }
      console.log(
        `[transaction-action] Step 2 complete. Found mapping for esCode: ${esCode}`,
        JSON.stringify(mapping),
      );

      // 3. ตรวจสอบ Authorization: Bearer token ที่ได้รับมา ถ้า token == product_token จึงจะทำงานต่อ
      console.log(`[transaction-action] Step 3: Verifying Bearer token...`);
      if (token !== mapping.product_token) {
        set.status = 401;
        const responseBody = {
          success: false,
          error:
            "Unauthorized: Token mismatch or not found for the decoded esCode",
        };

        await sql`
            INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, error_message, status_code)
            VALUES ('transaction-action-unauthorized', ${JSON.stringify(body || {})}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, 'Unauthorized: Token mismatch', '401')
          `;
        return responseBody;
      }
      console.log(
        `[transaction-action] Step 3 complete. Token successfully verified.`,
      );

      // 4. หาค่า "signature" จาก function @utils/crypto.ts
      console.log(`[transaction-action] Step 4: Generating signature...`);
      const txKey =
        paymentType === 1 || paymentType === "1"
          ? process.env.prod_txkey || process.env.PROD_TXKEY || ""
          : process.env.dev_txkey || process.env.DEV_TXKEY || "";
      const calculatedSignature = signature(
        txKey,
        orderRef,
        (body as any).totalUnit || 0,
        (body as any).totalPrice || 0,
        (body as any).totalVat || 0,
        (body as any).totalPayment || 0,
      );
      console.log(
        `[transaction-action] Step 4 complete. Generated signature: ${calculatedSignature}`,
      );

      // 5. ตรวจสอบและบันทึกข้อมูลลูกค้า (Check/Insert Customer)
      console.log(
        `[transaction-action] Step 5: Checking customer in custommer table...`,
      );
      const customerId = (body as any).customer_id || "";
      const [existingCustomer] = await sql`
          SELECT id FROM "custommer" WHERE es_code = ${esCode} AND customer_id = ${customerId}
        `;

      let customerDbId: number;
      const etax = (body as any).etaxInvoice || {};
      if (!existingCustomer) {
        console.log(
          `[transaction-action] Step 5: Customer not found. Inserting new customer...`,
        );
        const [inserted] = await sql`
            INSERT INTO "custommer" (
              es_code, customer_id, document_type_code, tax_id_type, national_id, business_id, branch_id,
              company_name, first_name, last_name, email, mobile, village, house_no, moo, soi, road,
              sub_district, district, province, zip_code, office_name
            ) VALUES (
              ${esCode}, ${customerId}, ${etax.documentTypeCode || ""}, ${etax.taxIdType || ""},
              ${etax.nationalId || ""}, ${etax.businessId || ""}, ${etax.branchId || ""},
              ${etax.companyName || ""}, ${etax.firstName || ""}, ${etax.lastName || ""},
              ${etax.email || ""}, ${etax.mobile || ""}, ${etax.village || ""},
              ${etax.houseNo || ""}, ${etax.moo || ""}, ${etax.soi || ""},
              ${etax.road || ""}, ${etax.subDistrict || ""}, ${etax.district || ""},
              ${etax.province || ""}, ${etax.zipCode || ""}, ${etax.officeName || ""}
            ) RETURNING id
          `;
        customerDbId = inserted.id;
        console.log(
          `[transaction-action] Step 5 complete. Inserted new customer with ID: ${customerDbId}`,
        );
      } else {
        console.log(
          `[transaction-action] Step 5: Customer found. Updating customer details with ID: ${existingCustomer.id}...`,
        );
        await sql`
            UPDATE "custommer" SET
              document_type_code = ${etax.documentTypeCode || ""},
              tax_id_type = ${etax.taxIdType || ""},
              national_id = ${etax.nationalId || ""},
              business_id = ${etax.businessId || ""},
              branch_id = ${etax.branchId || ""},
              company_name = ${etax.companyName || ""},
              first_name = ${etax.firstName || ""},
              last_name = ${etax.lastName || ""},
              email = ${etax.email || ""},
              mobile = ${etax.mobile || ""},
              village = ${etax.village || ""},
              house_no = ${etax.houseNo || ""},
              moo = ${etax.moo || ""},
              soi = ${etax.soi || ""},
              road = ${etax.road || ""},
              sub_district = ${etax.subDistrict || ""},
              district = ${etax.district || ""},
              province = ${etax.province || ""},
              zip_code = ${etax.zipCode || ""},
              office_name = ${etax.officeName || ""},
              modify_time = CURRENT_TIMESTAMP
            WHERE id = ${existingCustomer.id}
          `;
        customerDbId = existingCustomer.id;
        console.log(
          `[transaction-action] Step 5 complete. Updated customer details.`,
        );
      }

      // 6. Update ลง table orders where order_ref
      console.log(
        `[transaction-action] Step 6: Updating orders table for order_ref: ${orderRef}...`,
      );
      await sql`
          UPDATE "orders" SET
            custommer_id = ${customerDbId},
            total_unit = ${(body as any).totalUnit || 0},
            total_price = ${(body as any).totalPrice || 0},
            total_vat = ${(body as any).totalVat || 0},
            total_payment = ${(body as any).totalPayment || 0},
            document_type_code = ${etax.documentTypeCode || "0"},
            tax_id_type = ${etax.taxIdType || "0"},
            mobile = ${etax.mobile || "0"},
            modify_time = CURRENT_TIMESTAMP
          WHERE order_ref = ${orderRef}
        `;
      console.log(
        `[transaction-action] Step 6 complete. Updated orders table.`,
      );

      // 7. Insert ลง table order_items
      console.log(
        `[transaction-action] Step 7: Inserting items into order_items...`,
      );
      const orderItems = (body as any).orderItems;
      if (orderItems && Array.isArray(orderItems)) {
        for (const item of orderItems) {
          await sql`
              INSERT INTO "order_items" (
                order_ref, es_code, account_code, hana_product_code, hana_product_name, model,
                company_code, home_code, production_option1, production_option2, production_option3,
                unit, price, vat, net_price, net_vat, status, add_time, modify_time
              ) VALUES (
                ${orderRef},
                ${item.esCode || esCode},
                ${mapping.ecc_account_code || item.accountCode},
                ${mapping.ecc_product_code || item.productCode},
                ${mapping.product_name || item.productName || ""},
                ${item.model || ""},
                ${item.companyCode || "NT"},
                ${item.homeCode || ""},
                ${item.productionOption1 || ""},
                ${item.productionOption2 || ""},
                ${item.productionOption3 || ""},
                ${item.unit || 1},
                ${item.price || 0.0},
                ${item.vat || 0.0},
                ${item.netPrice || 0.0},
                ${item.netVat || 0.0},
                'success',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
              )
            `;
        }
      }
      console.log(
        `[transaction-action] Step 7 complete. Inserted all order items.`,
      );

      // 8. สร้าง curl เพื่อส่งข้อมูล โดยนำค่าที่ได้ มาเติมใน ข้อมูลที่ส่ง NT-Eservie
      console.log(
        `[transaction-action] Step 8: Preparing fetch payload for NT-Eservice...`,
      );
      const eserviceUrl =
        paymentType === 1 || paymentType === "1"
          ? process.env.prod_url || process.env.PROD_URL || ""
          : process.env.dev_url || process.env.DEV_URL || "";
      const eserviceKey =
        paymentType === 1 || paymentType === "1"
          ? process.env.prod_key || process.env.PROD_KEY || ""
          : process.env.dev_key || process.env.DEV_KEY || "";
      const fetchUrl = `${eserviceUrl}/payments/otcpay/innovation`;

      const eservicePayload = {
        version: "2.4.2",
        channelProductCode: mapping.channel_product_code,
        channelServiceCode: mapping.channel_service_code,
        orderRef: orderRef,
        orderRef2: "",
        orderItems: (orderItems || []).map((item: any) => ({
          esCode: esCode,
          accountCode: mapping.ecc_account_code || "50412000",
          productCode: mapping.ecc_product_code || "G0309",
          productName: mapping.ecc_product_name || "",
          model: item.model || "",
          companyCode: item.companyCode || "NT",
          homeCode: item.homeCode || "",
          productionOption1: item.productionOption1 || "",
          productionOption2: item.productionOption2 || "",
          productionOption3: item.productionOption3 || "",
          unit: item.unit || 1,
          price: item.price || 0,
          vat: item.vat || 0,
          netPrice: item.netPrice || 0,
          netVat: item.netVat || 0,
        })),
        totalUnit: (body as any).totalUnit,
        totalPrice: (body as any).totalPrice,
        totalVat: (body as any).totalVat,
        totalPayment: (body as any).totalPayment,
        signature: calculatedSignature,
        language: (body as any).language || "th",
        homeLocation: (body as any).homeLocation || "",
        offerId: (body as any).offerId || "",
        etaxInvoice: {
          documentTypeCode: etax.documentTypeCode || "",
          taxIdType: etax.taxIdType || "NIDN",
          nationalId: etax.nationalId || "",
          businessId: etax.businessId || "",
          branchId: etax.branchId || "",
          companyName: etax.companyName || "",
          firstName: etax.firstName || "",
          lastName: etax.lastName || "",
          email: etax.email || "",
          mobile: etax.mobile || "",
          village: etax.village || "",
          houseNo: etax.houseNo || "",
          moo: etax.moo || "",
          soi: etax.soi || "",
          road: etax.road || "",
          subDistrict: etax.subDistrict || "",
          district: etax.district || "",
          province: etax.province || "",
          zipCode: etax.zipCode || "",
          officeName: etax.officeName || "",
        },
      };

      console.log(
        `[transaction-action] Step 8: Sending POST request to ${fetchUrl}...`,
      );
      const fetchResponse = await fetch(fetchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${eserviceKey}`,
          "X-ClientIp": clientIp,
          "X-RequestId": requestId,
        },
        body: JSON.stringify(eservicePayload),
      });

      const fetchResult = await fetchResponse.json().catch(() => ({}));
      console.log(
        `[transaction-action] Step 8 complete. NT-Eservice response:`,
        fetchResult,
      );

      // 9. บันทึกข้อมูลการยิงข้อมูลชำระเงิน (Log to payment_logs)
      console.log(`[transaction-action] Step 9: Logging to payment_logs...`);
      const requestHeadersObj = {
        "Content-Type": "application/json",
        "X-ClientIp": clientIp,
        "X-RequestId": requestId,
      };
      const responseBody = {
        success: true,
        status: "success",
        message: "Transaction processed successfully",
        eservice_response: fetchResult,
      };

      // 9. ส่งต่อข้อมูลไปยังธนาคารปลายทาง (Forward to bank_url)
      if (mapping.bank_url) {
        console.log(
          `[transaction-action] Step 9: Forwarding results to bank_url: ${mapping.bank_url}...`,
        );
        try {
          const forwardResponse = await fetch(mapping.bank_url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-ClientIp": clientIp,
              "X-RequestId": requestId,
            },
            body: JSON.stringify(responseBody),
          });
          const forwardResult = await forwardResponse.text();
          console.log(
            `[transaction-action] Step 9 complete. Forward response status: ${forwardResponse.status}, response body: ${forwardResult}`,
          );
        } catch (forwardErr: any) {
          console.error(
            `[transaction-action] Step 9 failed. Failed to forward to bank_url:`,
            forwardErr.message,
          );
        }
      } else {
        console.log(
          `[transaction-action] Step 9 skipped: bank_url is not configured.`,
        );
      }

      // 10. บันทึกข้อมูลการยิงข้อมูลชำระเงิน (Log to payment_logs)
      console.log(`[transaction-action] Step 10: Logging to payment_logs...`);
      const requestHeadersObj = {
        "Content-Type": "application/json",
        "X-ClientIp": clientIp,
        "X-RequestId": requestId,
      };
      await sql`
          INSERT INTO "payment_logs" (
            request_method,
            request_url,
            auth_token,
            request_headers,
            request_payload,
            order_ref,
            total_payment
          ) VALUES (
            'POST',
            ${fetchUrl},
            ${eserviceKey},
            ${JSON.stringify(requestHeadersObj)},
            ${JSON.stringify(eservicePayload)},
            ${orderRef},
            ${(body as any).totalPayment !== undefined ? Number((body as any).totalPayment) : 0.0}
          )
        `;
      console.log(
        `[transaction-action] Step 10 complete. Logged to payment_logs.`,
      );

      // 11. ทุกขั้นตอน console.log & บันทึกประวัติธุรกรรม (Log to api_logs)
      console.log(
        `[transaction-action] Step 11: Writing success log to api_logs...`,
      );
      await sql`
          INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, status_code)
          VALUES ('transaction-action-success', ${JSON.stringify(body || {})}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, true, '200')
        `;
      console.log(
        `[transaction-action] Step 11 complete. Processing successful.`,
      );

      return responseBody;
    } catch (error: any) {
      console.error(`[transaction-action] Error encountered:`, error.message);
      set.status = 500;
      const responseBody = { success: false, error: error.message };

      try {
        await sql`
            INSERT INTO "api_logs" (api_name, request_body, response_body, order_ref, x_client_ip, x_request_id, is_success, error_message, status_code)
            VALUES ('transaction-action-error', ${JSON.stringify(body || {})}, ${JSON.stringify(responseBody)}, ${orderRef}, ${clientIp}, ${requestId}, false, ${error.message}, '500')
          `;
      } catch (dbErr) {
        console.error(
          "Failed to log transaction-action internal error:",
          dbErr,
        );
      }
      return responseBody;
    }
  },
  {
    body: t.Any(),
    detail: {
      tags: ["Transaction"],
      summary: "Transaction action handler",
    },
  },
);
