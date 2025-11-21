"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { useJobStore } from "@/stores/features/jobStore";
import THSarabunNew from "@/lib/fonts/THSarabunNew-normal";
import dayjs from "dayjs";
import 'dayjs/locale/th';

export default function ExportInventoryData() {
  const { inventoryRequests, inventories } = useInventoryStore();
  const { getJobById } = useJobStore();

  // Prepare data: Filter approved requests and flatten items
  const getExportData = () => {
    const approvedRequests = inventoryRequests.filter(req => req.status === 'approved');
    
    return approvedRequests.flatMap(req => {
      const job = getJobById(req.jobId);
      return req.requestedItems.map(item => {
        const inventoryInfo = inventories.find(inv => inv.id === item.id);
        return {
          id: req.id,
          date: req.approvedAt || req.requestedAt,
          jobTitle: job?.title || 'Unknown Job',
          requester: req.requestedBy.name,
          itemName: inventoryInfo?.name || 'Unknown Item',
          quantity: item.qty,
          price: inventoryInfo?.price || 0,
          total: (inventoryInfo?.price || 0) * item.qty,
          approver: req.approvedBy?.name || '-'
        };
      });
    });
  };

  const exportPDF = () => {
    const data = getExportData();
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageMargin = 15;

    // Load Thai Font
    doc.addFileToVFS("THSarabunNew-normal.ttf", THSarabunNew);
    doc.addFont("THSarabunNew-normal.ttf", "THSarabunNew", "normal");
    doc.setFont("THSarabunNew");

    let currentY = 0;

    // --- Header ---
    const headerHeight = 35;
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, doc.internal.pageSize.width, headerHeight, "F");

    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text("Inventory Withdrawal Report", doc.internal.pageSize.width - pageMargin, 15, { align: "right" });
    doc.setFontSize(14);
    doc.text("รายงานการเบิกจ่ายวัสดุอุปกรณ์ (อนุมัติแล้ว)", doc.internal.pageSize.width - pageMargin, 22, { align: "right" });

    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("WARDIERE INC.", pageMargin, 15);
    doc.text("System Generated Report", pageMargin, 19);

    doc.setTextColor(0, 0, 0);
    currentY = headerHeight + 10;

    // --- Report Info ---
    doc.setFontSize(10);
    doc.text(`วันที่พิมพ์รายงาน: ${dayjs().locale('th').format('DD MMMM YYYY HH:mm')}`, pageMargin, currentY);
    currentY += 10;

    // --- Table ---
    const tableHead = [
      [
        "วันที่อนุมัติ",
        "ชื่องาน",
        "ผู้เบิก",
        "รายการสินค้า",
        "จำนวน",
        "ราคา/หน่วย",
        "รวม (บาท)",
      ],
    ];

    const bodyData = data.map((item) => [
      dayjs(item.date).locale('th').format('DD/MM/YY'),
      item.jobTitle,
      item.requester,
      item.itemName,
      item.quantity.toLocaleString(),
      item.price.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      item.total.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: tableHead,
      body: bodyData,
      theme: "grid",
      styles: {
        font: "THSarabunNew",
        fontStyle: "normal",
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 40 },
        4: { cellWidth: 15, halign: "center" },
        5: { cellWidth: 20, halign: "right" },
        6: { cellWidth: 20, halign: "right" },
      },
    });

    const finalYTable = (doc as any).lastAutoTable.finalY;
    currentY = finalYTable + 10;

    // --- Summary ---
    const totalSum = data.reduce((sum, item) => sum + item.total, 0);
    
    doc.setFontSize(12);
    doc.text(`รวมมูลค่าการเบิกจ่ายทั้งหมด: ${totalSum.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท`, doc.internal.pageSize.width - pageMargin, currentY, { align: "right" });

    doc.save("approved-withdrawals.pdf");
  };

  const escapeCSV = (field: string | number | null | undefined): string => {
    if (field === null || field === undefined) {
      return '""';
    }
    const str = String(field);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const exportCSV = () => {
    const data = getExportData();
    const headers = [
      "Request ID",
      "Date Approved",
      "Job Title",
      "Requester",
      "Approver",
      "Item Name",
      "Quantity",
      "Unit Price",
      "Total Price",
    ];

    const rows = data.map((item) => [
      item.id,
      dayjs(item.date).format('YYYY-MM-DD HH:mm:ss'),
      item.jobTitle,
      item.requester,
      item.approver,
      item.itemName,
      item.quantity,
      item.price,
      item.total,
    ]);

    const totalSum = data.reduce((sum, item) => sum + item.total, 0);
    const footer = ["", "", "", "", "", "", "", "Grand Total", totalSum];

    const makeRow = (arr: any[]) => arr.map(escapeCSV).join(",");

    const allData = [headers, ...rows, footer];
    const csvContent = allData.map(makeRow).join("\n");

    const encodedUri = encodeURI(
      "data:text/csv;charset=utf-8,\uFEFF" + csvContent
    );
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "approved_withdrawals.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      <Button onClick={exportPDF} className="text-white bg-blue-600 hover:bg-blue-700">
        Export PDF (Approved)
      </Button>

      <Button onClick={exportCSV} className=" text-white bg-green-600 hover:bg-green-700">
        Export CSV (Approved)
      </Button>
    </div>
  );
}