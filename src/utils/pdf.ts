// src/utils/pdf.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Worker } from '@/types';

export function exportWorkersPdf(
  workers: Worker[],
  options: { sedeNombre?: string; filtros?: string } = {}
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // ==================== HEADER ====================
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Sistema de Transferencia - Reporte de Trabajadores', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);

  const fecha = new Date().toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  doc.text(`Generado: ${fecha}`, 14, 22);

  let yPos = 22;
  if (options.sedeNombre) {
    yPos += 5;
    doc.text(`Sede: ${options.sedeNombre}`, 14, yPos);
  }
  if (options.filtros) {
    yPos += 5;
    doc.text(`Filtros: ${options.filtros}`, 14, yPos);
  }

  const startY = yPos + 6;

  // ==================== TABLA ====================
  autoTable(doc, {
    startY,
    head: [[
      'DNI', 'Nombre completo', 'Área',
      'Régimen', 'Ingreso', 'Salida', 'Estado'
    ]],
    body: workers.map(w => [
      w.dni,
      w.nombre_completo,
      w.area_nombre || '-',
      w.regimen_nombre || w.regimen_codigo,
      w.fecha_ingreso ? new Date(w.fecha_ingreso).toLocaleDateString('es-PE') : '-',
      w.tiene_fecha_salida
        ? (w.fecha_salida ? new Date(w.fecha_salida).toLocaleDateString('es-PE') : 'Sin fecha')
        : 'Indeterminado',
      w.estado.toUpperCase()
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 65 },
      2: { cellWidth: 40 },
      3: { cellWidth: 45 },
      4: { cellWidth: 25 },
      5: { cellWidth: 30 },
      6: { cellWidth: 20 }
    },
    didDrawPage: () => {
      const pageCount = doc.getNumberOfPages();
      const currentPage = doc.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${currentPage} de ${pageCount}`,
        doc.internal.pageSize.getWidth() - 25,
        doc.internal.pageSize.getHeight() - 8
      );
    }
  });

  const nombre = `trabajadores_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nombre);
}