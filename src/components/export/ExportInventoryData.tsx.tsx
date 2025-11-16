"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { useInventoryStore } from "@/stores/features/inventoryStore";
import THSarabunNew from "@/lib/fonts/THSarabunNew-normal";

export default function ExportInventoryData() {
  const { inventories } = useInventoryStore();
  console.log("Inventories Data (Before PDF Mapping):", JSON.stringify(inventories, null, 2));

  // ✅ Export PDF - ปรับโครงสร้างให้เหมือน Invoice
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }); // เปลี่ยนเป็น A4 แนวตั้ง
    const pageMargin = 15; // ขอบกระดาษ

    // ✅ โหลดฟอนต์ไทย
    doc.addFileToVFS("THSarabunNew-normal.ttf", THSarabunNew);
    doc.addFont("THSarabunNew-normal.ttf", "THSarabunNew", "normal");
    doc.setFont("THSarabunNew");

    let currentY = 0;

    // --- ส่วนหัว (Header) - เหมือนในรูป ---
    const headerHeight = 35; // ความสูงของแถบสีน้ำเงินด้านบน
    doc.setFillColor(30, 41, 59); // สีน้ำเงินเข้ม
    doc.rect(0, 0, doc.internal.pageSize.width, headerHeight, "F"); // วาดแถบสีน้ำเงิน

    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255); // สีขาว
    doc.text("Invoice", doc.internal.pageSize.width - pageMargin, 15, { align: "right" });
    doc.setFontSize(14);
    doc.text("ใบแจ้งหนี้", doc.internal.pageSize.width - pageMargin, 22, { align: "right" });

    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255); // สีขาว
    // จำลองโลโก้
    doc.text("WARDIERE INC.", pageMargin, 15);
    doc.text("REAL ESTATE AGENT", pageMargin, 19);

    // รีเซ็ตสีและฟอนต์สำหรับส่วนถัดไป
    doc.setTextColor(0, 0, 0); // สีดำ
    currentY = headerHeight + 5; // เริ่มต้นใต้ Header

    // --- รายละเอียดลูกค้าและผู้ออก (Client & Issuer Details) ---
    doc.setFontSize(10);
    doc.setDrawColor(200, 200, 200); // สีเส้นอ่อนๆ

    // ข้อมูลลูกค้า (ซ้าย)
    let clientColX = pageMargin;
    doc.setFontSize(9);
    doc.text("ชื่อลูกค้า", clientColX, currentY + 5);
    doc.setFontSize(10);
    doc.text("Satford & Co.", clientColX, currentY + 10);
    doc.setFontSize(9);
    doc.text("ที่อยู่", clientColX, currentY + 15);
    doc.setFontSize(10);
    doc.text("123 Anywhere St., Any City, ST 12345", clientColX, currentY + 20);
    doc.setFontSize(9);
    doc.text("อีเมล", clientColX, currentY + 25);
    doc.setFontSize(10);
    doc.text("hello@reallygreatsite.com", clientColX, currentY + 30);
    doc.setFontSize(9);
    doc.text("เบอร์โทรศัพท์", clientColX, currentY + 35);
    doc.setFontSize(10);
    doc.text("123-456-7890", clientColX, currentY + 40);

    // ข้อมูล Invoice (ขวา)
    let invoiceColX = doc.internal.pageSize.width / 2 + 30; // เริ่มจากกลางค่อนไปทางขวา
    let invoiceLineHeight = 5;

    doc.setFontSize(9);
    doc.text("เลขที่", invoiceColX, currentY + 5);
    doc.setFontSize(10);
    doc.text("01234", invoiceColX, currentY + 10);

    doc.setFontSize(9);
    doc.text("วันที่", invoiceColX, currentY + 15);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString("th-TH", { year: 'numeric', month: 'long', day: 'numeric' }), invoiceColX, currentY + 20); // วันที่ปัจจุบัน

    doc.setFontSize(9);
    doc.text("กำหนดชำระ", invoiceColX, currentY + 25);
    doc.setFontSize(10);
    // เพิ่ม 7 วันจากวันที่ปัจจุบัน
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    doc.text(dueDate.toLocaleDateString("th-TH", { year: 'numeric', month: 'long', day: 'numeric' }), invoiceColX, currentY + 30);

    // ผู้ออก (ซ้ายล่างของส่วนนี้)
    currentY += 45; // ขยับลงมาจากส่วนข้อมูลลูกค้า
    doc.setFontSize(9);
    doc.text("ผู้ออก", clientColX, currentY + 5);
    doc.setFontSize(10);
    doc.text("Wardiere Inc.", clientColX, currentY + 10);
    doc.setFontSize(9);
    doc.text("ที่อยู่", clientColX, currentY + 15);
    doc.setFontSize(10);
    doc.text("123 Anywhere St., Any City, ST 12345", clientColX, currentY + 20);

    currentY += 25; // ตำแหน่งเริ่มตาราง
    // --- สิ้นสุดส่วน Header ---

    // --- ตารางรายการสินค้า ---
    const tableHead = [
      [
        "ลำดับ",
        "รายการสินค้า",
        "จำนวน",
        "ราคา/หน่วย (บาท)", // แก้เป็น ราคา/หน่วย
        "ราคารวม (บาท)",
      ],
    ];

    let itemCounter = 0; // ลำดับรายการ
    const bodyData = inventories.map((inv) => {
      itemCounter++;
      const total = inv.price ? inv.price * inv.quantity : 0;
      return [
        itemCounter.toString(),
        inv.name,
        inv.quantity.toLocaleString(),
        inv.price?.toLocaleString() || "0.00",
        total.toLocaleString(),
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: tableHead,
      body: bodyData,
      theme: "plain", // ใช้ theme plain เพื่อควบคุมเส้นเองได้ดีกว่า
      styles: {
        font: "THSarabunNew",
        fontStyle: "normal",
        fontSize: 10,
        cellPadding: 2,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [30, 41, 59], // สีน้ำเงินเข้ม
        textColor: [255, 255, 255],
        font: "THSarabunNew",
        fontStyle: "normal",
        valign: "middle",
        halign: "center",
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        valign: "middle",
        font: "THSarabunNew"
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center" }, // ลำดับ
        1: { cellWidth: 90 }, // รายการสินค้า
        2: { cellWidth: 20, halign: "center" }, // จำนวน
        3: { cellWidth: 30, halign: "right" }, // ราคา/หน่วย
        4: { cellWidth: 30, halign: "right" }, // ราคารวม
      },
      didDrawPage: function (data) {
        // วาดเส้นแนวนอนใต้ head manually
        doc.setDrawColor(30, 41, 59); // สีน้ำเงินเข้ม
        doc.setLineWidth(0.5);
        doc.line(data.settings.margin.left, data.cursor?.y ?? 0, doc.internal.pageSize.width - data.settings.margin.right, data.cursor?.y ?? 0);
      },
      willDrawCell: function (data) {
        if (data.section === 'body' && data.row.index % 2 === 0) {
          // สลับสีพื้นหลังแถว
          doc.setFillColor(245, 245, 245);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        }
      }
    });

    const finalYTable = (doc as any).lastAutoTable.finalY;
    currentY = finalYTable + 10;

    // --- ส่วนสรุปยอด (Summary) ---
    const totalSum = inventories.reduce(
      (sum, inv) => sum + (inv.price ? inv.price * inv.quantity : 0),
      0
    );
    const discount = 0; // ตัวอย่างส่วนลด
    const vatRate = 0.07;
    const vat = totalSum * vatRate;
    const grandTotal = totalSum + vat - discount;

    doc.setFontSize(10);
    // คอลัมน์ซ้าย (หมายเหตุ)
    doc.text("หมายเหตุ:", pageMargin, currentY);
    doc.setFontSize(9);
    doc.text(
      "โปรดตรวจสอบรายการสินค้าก่อนชำระเงิน\n" +
      "การชำระเงินล่าช้าอาจมีค่าปรับ\n" +
      "กรุณาติดต่อสอบถามเพิ่มเติมหากมีข้อสงสัย",
      pageMargin,
      currentY + 5
    );

    // คอลัมน์ขวา (สรุปยอด)
    let summaryColX = doc.internal.pageSize.width - pageMargin - 60; // เริ่มจากขวาเข้ามา 60mm
    let summaryValueColX = doc.internal.pageSize.width - pageMargin;

    doc.setFontSize(10);
    doc.text("ราคารวม", summaryColX, currentY);
    doc.text(`${totalSum.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`, summaryValueColX, currentY, { align: "right" });
    currentY += 5;

    doc.text("ภาษีมูลค่าเพิ่ม (7%)", summaryColX, currentY);
    doc.text(`${vat.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`, summaryValueColX, currentY, { align: "right" });
    currentY += 5;

    doc.text("ส่วนลด", summaryColX, currentY);
    doc.text(`${discount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`, summaryValueColX, currentY, { align: "right" });
    currentY += 5;

    // เส้นคั่นก่อนยอดสุทธิ
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(summaryColX, currentY + 2, summaryValueColX, currentY + 2);
    currentY += 5;

    doc.setFontSize(10);
    doc.setFont("THSarabunNew", "normal");
    doc.text("ยอดสุทธิ", summaryColX, currentY + 2);
    doc.setFontSize(10);
    doc.setFont("THSarabunNew", "normal");
    doc.text("ยอดสุทธิ", summaryColX, currentY + 2);

    doc.setFont("THSarabunNew", "normal");
    doc.text(
      `${grandTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท`,
      summaryValueColX,
      currentY + 2,
      { align: "right" }
    );
    currentY += 5;

    doc.setFont("THSarabunNew", "normal");
    currentY += 5;

    // --- ส่วน "จำนวนเงินรวมทั้งสิ้น" (Thai Text Total) ---
    doc.setFontSize(10);
    doc.text("จำนวนเงินรวมทั้งสิ้น", pageMargin, currentY);

    // ฟังก์ชันแปลงตัวเลขเป็นภาษาไทย (จากโค้ดตัวอย่างในอินเทอร์เน็ต)
    const convertNumberToThaiText = (num: number) => {
      const units = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
      const numbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];

      let result = "";
      let intPart = Math.floor(num);
      let decPart = Math.round((num - intPart) * 100);

      const numToThai = (n: number) => {
        let text = "";
        let i = 0;
        while (n > 0) {
          const digit = n % 10;
          if (digit > 0) {
            let unitText = units[i];
            let numText = numbers[digit];
            if (digit === 1 && i === 1) numText = ""; // สิบ
            if (digit === 2 && i === 1) numText = "ยี่"; // ยี่สิบ
            if (digit === 1 && i === 0 && text !== "") numText = "เอ็ด"; // หน่วยท้ายสุด (เอ็ด)

            text = numText + unitText + text;
          }
          n = Math.floor(n / 10);
          i++;
        }
        return text;
      };

      if (intPart === 0 && decPart === 0) return "ศูนย์บาทถ้วน";

      let intText = numToThai(intPart);
      if (intText) result += intText + "บาท";

      if (decPart > 0) {
        let decText = numToThai(decPart);
        result += decText + "สตางค์";
      } else {
        result += "ถ้วน";
      }
      return result;
    };

    let signatureY = currentY + 20; // เริ่มจากใต้เงื่อนไข
    if (signatureY < doc.internal.pageSize.height - 50) { // ตรวจสอบไม่ให้ทับกับเงื่อนไข
      signatureY = doc.internal.pageSize.height - 50;
    }


    const signCol1X = doc.internal.pageSize.width / 2 + 10; // ค่อนไปทางขวา
    const signCol2X = doc.internal.pageSize.width - pageMargin - 40; // คอลัมน์ขวาสุด

    doc.setFontSize(10);
    doc.text("_________________________", signCol1X, signatureY);
    doc.text("_________________________", signCol2X, signatureY);
    signatureY += 5;

    doc.setFontSize(9);
    doc.text("(.............................................)", signCol1X, signatureY);
    doc.text("(.............................................)", signCol2X, signatureY);
    signatureY += 5;

    doc.text("ผู้อนุมัติ", signCol1X + 15, signatureY);
    doc.text("ผู้รับใบแจ้งหนี้", signCol2X + 10, signatureY);
    signatureY += 5;

    doc.text("วันที่: ______/______/______", signCol1X, signatureY);
    doc.text("วันที่: ______/______/______", signCol2X, signatureY);

    doc.setFillColor(230, 230, 230); // สีเทาอ่อน
    doc.rect(pageMargin, currentY + 2, doc.internal.pageSize.width - (2 * pageMargin), 8, "F");
    doc.setFontSize(10);
    doc.text(convertNumberToThaiText(grandTotal), pageMargin + 2, currentY + 7); // พิมพ์ในกรอบ
    currentY += 15;

    // --- ช่องทางการชำระเงิน (Payment Method) ---
    doc.setFontSize(10);
    doc.setFont("THSarabunNew", "normal");
    doc.text("ช่องทางการชำระเงิน", pageMargin, currentY);
    currentY += 5;

    doc.setFont("THSarabunNew", "normal");
    doc.text("ชำระโดยการโอนผ่านบัญชีธนาคาร", pageMargin, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.text("ชื่อบัญชี:", pageMargin, currentY);
    doc.text("Ingoude Company", pageMargin + 20, currentY);
    currentY += 5;
    doc.text("เลขที่บัญชี:", pageMargin, currentY);
    doc.text("123-456-7890", pageMargin + 20, currentY);
    currentY += 5;


    // --- เงื่อนไข (Terms & Conditions) ---
    doc.setFontSize(10);
    doc.setFont("THSarabunNew", "normal");
    doc.text("เงื่อนไข", pageMargin, currentY);
    currentY += 5;

    doc.setFont("THSarabunNew", "normal");
    doc.text("กรุณาตรวจสอบความถูกต้องของรายการก่อนชำระเงิน", pageMargin, currentY);


    // const termsText =
    //   "• Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus at egestas odio. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae;\n" +
    //   "• Phasellus congue metus quis vehicula ultrices. Fusce at tristique lacus. Nullam sit amet lobortis sem, ut luctus odio. Duis semper odio id vitae bibendum aliquet.";
    // const splitTerms = doc.splitTextToSize(termsText, doc.internal.pageSize.width / 2 - pageMargin - 5); 
    // doc.setFontSize(8);
    // doc.text(splitTerms, pageMargin, currentY);

    // --- ส่วนลายเซ็น (Signatures) ---


    doc.save("invoice.pdf");
  };

  // ✅ ฟังก์ชันสำหรับ Escape ข้อมูลใน CSV (ไม่เปลี่ยนแปลงจากเดิม)
  const escapeCSV = (field: string | number | null | undefined): string => {
    if (field === null || field === undefined) {
      return '""';
    }
    const str = String(field);
    return `"${str.replace(/"/g, '""')}"`;
  };

  // ✅ Export CSV (ไม่เปลี่ยนแปลงจากเดิม)
  const exportCSV = () => {
    const headers = [
      "ID",
      "ชื่ออุปกรณ์",
      "จำนวน",
      "ราคา (บาท)",
      "รวม (บาท)",
      "สถานที่",
      "สถานะ",
      "ประเภท",
      "ผู้เบิก",
    ];

    const rows = inventories.map((inv) => {
      const total = inv.price ? inv.price * inv.quantity : 0;
      return [
        inv.id,
        inv.name,
        inv.quantity,
        inv.price || "",
        total,
        inv.location,
        inv.status,
        inv.type,
        inv.requireFrom,
      ];
    });

    const totalSum = inventories.reduce(
      (sum, inv) => sum + (inv.price ? inv.price * inv.quantity : 0),
      0
    );
    const footer = ["", "", "", "รวมทั้งหมด", totalSum, "", "", "", ""];

    const makeRow = (arr: any[]) => arr.map(escapeCSV).join(",");

    const allData = [headers, ...rows, footer];
    const csvContent = allData.map(makeRow).join("\n");

    const encodedUri = encodeURI(
      "data:text/csv;charset=utf-8,\uFEFF" + csvContent
    );
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      <Button onClick={exportPDF} className="text-white bg-blue-600 hover:bg-blue-700">
        Export PDF
      </Button>

      <Button onClick={exportCSV} className=" text-white bg-green-600 hover:bg-green-700">
        Export CSV
      </Button>
    </div>
  );
}