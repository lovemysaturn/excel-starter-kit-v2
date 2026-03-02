import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface ExportColumn {
    key: string;
    label: string;
}

// ═══════════════════════════════════════════════════════════════
// Excel Export — one-click .xlsx download
// ═══════════════════════════════════════════════════════════════
export function exportToExcel(data: any[], columns: ExportColumn[], filename: string = 'export') {
    try {
        const mapped = data.map(row => {
            const obj: Record<string, any> = {};
            columns.forEach(col => { obj[col.label] = row[col.key] ?? ''; });
            return obj;
        });
        const ws = XLSX.utils.json_to_sheet(mapped);

        // Auto column widths
        const colWidths = columns.map(col => {
            const maxLen = Math.max(
                col.label.length,
                ...data.map(r => String(r[col.key] ?? '').length)
            );
            return { wch: Math.min(maxLen + 2, 40) };
        });
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        XLSX.writeFile(wb, `${filename}.xlsx`);
        toast.success(`Exported ${data.length} rows to ${filename}.xlsx`);
    } catch (err) {
        toast.error('Excel export failed');
        console.error(err);
    }
}

// ═══════════════════════════════════════════════════════════════
// PDF Export — table-formatted PDF download
// ═══════════════════════════════════════════════════════════════
export function exportToPdf(data: any[], columns: ExportColumn[], filename: string = 'export', title?: string) {
    try {
        const doc = new jsPDF({ orientation: data.length > 20 ? 'landscape' : 'portrait' });

        if (title) {
            doc.setFontSize(16);
            doc.text(title, 14, 20);
        }

        const head = [columns.map(c => c.label)];
        const body = data.map(row => columns.map(col => String(row[col.key] ?? '')));

        autoTable(doc, {
            head,
            body,
            startY: title ? 30 : 15,
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            margin: { left: 14, right: 14 },
        });

        doc.save(`${filename}.pdf`);
        toast.success(`Exported ${data.length} rows to ${filename}.pdf`);
    } catch (err) {
        toast.error('PDF export failed');
        console.error(err);
    }
}
