import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import pptxgen from 'pptxgenjs';

export interface ChartNarrative {
  chartTitle: string;
  narrative: string;
  keyInsight: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface HeatmapData {
  businessUnits: Array<{
    name: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
    trends?: { critical: number; high: number; medium: number; low: number };
  }>;
  totals: { critical: number; high: number; medium: number; low: number; total: number };
}

export interface ExportData {
  narratives: ChartNarrative[];
  executiveSummary: string;
  metrics: Array<{
    title: string;
    value: string | number;
    trend?: string;
    segments?: Array<{ label: string; value: number; color?: string }>;
    chartType?: 'bar' | 'pie' | 'stacked' | 'heatmap';
  }>;
  organizationHeatmap?: HeatmapData;
  exportDate: string;
  filters: { businessUnit: string; timePeriod: string };
}

// Helper to map segment colors to hex
function getColorHex(color?: string): string {
  if (!color) return '94A3B8';
  // If it's already a hex color (with or without #), return it without the #
  if (color.startsWith('#')) {
    return color.slice(1);
  }
  const colorMap: Record<string, string> = {
    'bg-error': 'EF4444',
    'bg-warning': 'F59E0B',
    'bg-success': '22C55E',
    'bg-primary': '6366F1',
    'bg-accent': '8B5CF6',
    'bg-blue-500': '3B82F6',
    'bg-amber-500': 'F59E0B',
    'bg-purple-500': 'A855F7',
    'bg-emerald-500': '10B981',
    'bg-slate-500': '64748B',
    'bg-red-500': 'EF4444',
    'bg-orange-500': 'F97316',
    'bg-yellow-500': 'EAB308',
    'bg-green-500': '22C55E',
  };
  return colorMap[color] || '94A3B8';
}

// Helper function to create metric table for Word
function createMetricTable(metric: ExportData['metrics'][0]): Table {
  if (!metric.segments || metric.segments.length === 0) {
    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: 'No data available' })],
            }),
          ],
        }),
      ],
    });
  }

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ text: 'Category', bold: true })],
          alignment: AlignmentType.LEFT,
        })],
        width: { size: 60, type: WidthType.PERCENTAGE },
        shading: { fill: 'F3F4F6' },
      }),
      new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ text: 'Value', bold: true })],
          alignment: AlignmentType.RIGHT,
        })],
        width: { size: 40, type: WidthType.PERCENTAGE },
        shading: { fill: 'F3F4F6' },
      }),
    ],
  });

  const dataRows = metric.segments.map(segment =>
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: segment.label })],
        }),
        new TableCell({
          children: [new Paragraph({ 
            text: segment.value.toString(),
            alignment: AlignmentType.RIGHT,
          })],
        }),
      ],
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

// Helper function to create heatmap table for Word
function createHeatmapTable(heatmap: HeatmapData): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Business Unit', bold: true })] })],
        shading: { fill: 'F3F4F6' },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Critical', bold: true, color: 'DC2626' })] })],
        shading: { fill: 'FEE2E2' },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'High', bold: true, color: 'EA580C' })] })],
        shading: { fill: 'FFEDD5' },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Medium', bold: true, color: 'CA8A04' })] })],
        shading: { fill: 'FEF9C3' },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Low', bold: true, color: '16A34A' })] })],
        shading: { fill: 'DCFCE7' },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true })] })],
        shading: { fill: 'E5E7EB' },
      }),
    ],
  });

  const dataRows = heatmap.businessUnits.map(bu => {
    const getTrendText = (trend?: number) => {
      if (!trend || trend === 0) return '';
      return trend > 0 ? ` ↑${trend}` : ` ↓${Math.abs(trend)}`;
    };

    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: bu.name })],
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [
              new TextRun({ text: bu.critical.toString() }),
              new TextRun({ text: getTrendText(bu.trends?.critical), color: bu.trends?.critical && bu.trends.critical > 0 ? 'DC2626' : '16A34A' }),
            ]
          })],
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [
              new TextRun({ text: bu.high.toString() }),
              new TextRun({ text: getTrendText(bu.trends?.high), color: bu.trends?.high && bu.trends.high > 0 ? 'DC2626' : '16A34A' }),
            ]
          })],
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [
              new TextRun({ text: bu.medium.toString() }),
              new TextRun({ text: getTrendText(bu.trends?.medium), color: bu.trends?.medium && bu.trends.medium > 0 ? 'DC2626' : '16A34A' }),
            ]
          })],
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [
              new TextRun({ text: bu.low.toString() }),
              new TextRun({ text: getTrendText(bu.trends?.low), color: bu.trends?.low && bu.trends.low > 0 ? 'DC2626' : '16A34A' }),
            ]
          })],
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: bu.total.toString(), bold: true })],
          })],
        }),
      ],
    });
  });

  // Total row
  const totalRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL', bold: true })] })],
        shading: { fill: 'E5E7EB' },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: heatmap.totals.critical.toString(), bold: true })] })],
        shading: { fill: 'FECACA' },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: heatmap.totals.high.toString(), bold: true })] })],
        shading: { fill: 'FED7AA' },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: heatmap.totals.medium.toString(), bold: true })] })],
        shading: { fill: 'FEF08A' },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: heatmap.totals.low.toString(), bold: true })] })],
        shading: { fill: 'BBF7D0' },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: heatmap.totals.total.toString(), bold: true })] })],
        shading: { fill: 'D1D5DB' },
      }),
    ],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows, totalRow],
  });
}

export async function generateDashboardDocx(data: ExportData): Promise<Blob> {
  const children: Paragraph[] = [
    // Title
    new Paragraph({
      text: "2nd Line Risk Analyst Dashboard Report",
      heading: HeadingLevel.TITLE,
    }),
    // Metadata
    new Paragraph({
      children: [
        new TextRun({ text: `Generated: ${data.exportDate}`, italics: true }),
        new TextRun({ text: ` | Business Unit: ${data.filters.businessUnit}`, italics: true }),
        new TextRun({ text: ` | Period: ${data.filters.timePeriod}`, italics: true }),
      ],
    }),
    new Paragraph({ text: "" }),
    // Executive Summary
    new Paragraph({
      text: "Executive Summary",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({ text: data.executiveSummary }),
    new Paragraph({ text: "" }),
  ];

  // Add each chart narrative with data table
  for (let i = 0; i < data.narratives.length; i++) {
    const n = data.narratives[i];
    const metric = data.metrics[i];

    children.push(
      new Paragraph({
        text: n.chartTitle,
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({ text: n.narrative }),
      new Paragraph({ text: "" }),
    );

    // Add data table if segments exist
    if (metric?.segments && metric.segments.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Data Breakdown:", bold: true, size: 22 })],
        }),
      );
      const table = createMetricTable(metric);
      // Add the table - docx lib handles it when we cast properly
      (children as any).push(table);
      children.push(new Paragraph({ text: "" }));
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Key Insight: ", bold: true }),
          new TextRun({ text: n.keyInsight }),
        ],
      }),
      new Paragraph({ text: "" })
    );
  }

  // Add Organization Heatmap if provided
  if (data.organizationHeatmap && data.organizationHeatmap.businessUnits.length > 0) {
    children.push(
      new Paragraph({
        text: "Organization Risk Heat Map",
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({ 
        text: "Distribution of residual risks by business unit and severity level. Trend arrows indicate changes compared to the previous period.",
      }),
      new Paragraph({ text: "" }),
    );
    
    const heatmapTable = createHeatmapTable(data.organizationHeatmap);
    (children as any).push(heatmapTable);
    children.push(new Paragraph({ text: "" }));
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  return await Packer.toBlob(doc);
}

export async function generateDashboardPptx(data: ExportData): Promise<Blob> {
  const pptx = new pptxgen();
  pptx.author = "Risk Dashboard";
  pptx.title = "2nd Line Risk Analyst Dashboard Report";
  pptx.subject = "Dashboard Export";

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText("2nd Line Risk Analyst\nDashboard Report", {
    x: 0.5, y: 1.5, w: 9, h: 2,
    fontSize: 36, bold: true, color: "10052F", align: "center",
    fontFace: "Arial",
  });
  titleSlide.addText(`Generated: ${data.exportDate}\nBusiness Unit: ${data.filters.businessUnit} | Period: ${data.filters.timePeriod}`, {
    x: 0.5, y: 4, w: 9, h: 0.8,
    fontSize: 14, color: "666666", align: "center",
    fontFace: "Arial",
  });

  // Executive Summary slide
  const summarySlide = pptx.addSlide();
  summarySlide.addText("Executive Summary", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, bold: true, color: "10052F",
    fontFace: "Arial",
  });
  summarySlide.addText(data.executiveSummary, {
    x: 0.5, y: 1.2, w: 9, h: 4,
    fontSize: 16, color: "333333", valign: "top",
    fontFace: "Arial",
  });

  // Individual chart slides with native charts
  for (let i = 0; i < data.narratives.length; i++) {
    const narrative = data.narratives[i];
    const metric = data.metrics[i];
    const slide = pptx.addSlide();

    // Title
    slide.addText(narrative.chartTitle, {
      x: 0.3, y: 0.2, w: 9.4, h: 0.5,
      fontSize: 20, bold: true, color: "10052F",
      fontFace: "Arial",
    });

    // Add native bar chart if segments data is available
    if (metric?.segments && metric.segments.length > 0) {
      const chartData = [{
        name: metric.title,
        labels: metric.segments.map(s => s.label),
        values: metric.segments.map(s => s.value),
      }];

      const chartColors = metric.segments.map(s => getColorHex(s.color));

      slide.addChart(pptx.ChartType.bar, chartData, {
        x: 0.3, y: 0.8, w: 4.5, h: 2.5,
        showTitle: false,
        showLegend: false,
        barDir: 'bar',
        chartColors: chartColors,
        valAxisMaxVal: Math.max(...metric.segments.map(s => s.value)) * 1.2,
        catAxisLabelFontSize: 9,
        valAxisLabelFontSize: 9,
        dataLabelPosition: 'outEnd',
        showValue: true,
        dataLabelFontSize: 9,
        dataLabelColor: '333333',
      });

      // Narrative on right side
      slide.addText(narrative.narrative, {
        x: 5, y: 0.8, w: 4.7, h: 2.5,
        fontSize: 11, color: "333333", valign: "top",
        fontFace: "Arial",
      });
    } else {
      // No chart - full width narrative
      slide.addText(narrative.narrative, {
        x: 0.5, y: 0.8, w: 9, h: 2.5,
        fontSize: 12, color: "333333", valign: "top",
        fontFace: "Arial",
      });
    }

    // Key insight box at bottom
    slide.addShape("rect", {
      x: 0.3, y: 3.5, w: 9.4, h: 0.8,
      fill: { color: "F0F4F8" },
      line: { color: "CBD5E1", width: 1 },
    });
    slide.addText(`Key Insight: ${narrative.keyInsight}`, {
      x: 0.5, y: 3.6, w: 9, h: 0.6,
      fontSize: 11, italic: true, color: "475569", valign: "middle",
      fontFace: "Arial",
    });
  }

  // Organization Heatmap slide (if data provided)
  if (data.organizationHeatmap && data.organizationHeatmap.businessUnits.length > 0) {
    const heatmapSlide = pptx.addSlide();
    heatmapSlide.addText("Organization Risk Heat Map", {
      x: 0.3, y: 0.2, w: 9.4, h: 0.4,
      fontSize: 20, bold: true, color: "10052F",
      fontFace: "Arial",
    });

    heatmapSlide.addText("Residual Risk Distribution by Business Unit (with trend vs previous period)", {
      x: 0.3, y: 0.55, w: 9.4, h: 0.3,
      fontSize: 11, color: "666666",
      fontFace: "Arial",
    });

    // Create table data for heatmap
    const getTrendArrow = (trend?: number) => {
      if (!trend || trend === 0) return '';
      return trend > 0 ? ` ↑${trend}` : ` ↓${Math.abs(trend)}`;
    };

    const tableRows: pptxgen.TableRow[] = [
      // Header row
      [
        { text: 'Business Unit', options: { bold: true, fill: { color: 'E5E7EB' }, align: 'left' as const } },
        { text: 'Critical', options: { bold: true, fill: { color: 'FECACA' }, color: 'DC2626', align: 'center' as const } },
        { text: 'High', options: { bold: true, fill: { color: 'FED7AA' }, color: 'EA580C', align: 'center' as const } },
        { text: 'Medium', options: { bold: true, fill: { color: 'FEF08A' }, color: 'CA8A04', align: 'center' as const } },
        { text: 'Low', options: { bold: true, fill: { color: 'BBF7D0' }, color: '16A34A', align: 'center' as const } },
        { text: 'Total', options: { bold: true, fill: { color: 'D1D5DB' }, align: 'center' as const } },
      ],
      // Data rows
      ...data.organizationHeatmap.businessUnits.map(bu => [
        { text: bu.name, options: { fill: { color: 'F9FAFB' }, align: 'left' as const } },
        { text: `${bu.critical}${getTrendArrow(bu.trends?.critical)}`, options: { align: 'center' as const } },
        { text: `${bu.high}${getTrendArrow(bu.trends?.high)}`, options: { align: 'center' as const } },
        { text: `${bu.medium}${getTrendArrow(bu.trends?.medium)}`, options: { align: 'center' as const } },
        { text: `${bu.low}${getTrendArrow(bu.trends?.low)}`, options: { align: 'center' as const } },
        { text: bu.total.toString(), options: { bold: true, align: 'center' as const } },
      ]),
      // Total row
      [
        { text: 'TOTAL', options: { bold: true, fill: { color: 'E5E7EB' }, align: 'left' as const } },
        { text: data.organizationHeatmap.totals.critical.toString(), options: { bold: true, fill: { color: 'FECACA' }, align: 'center' as const } },
        { text: data.organizationHeatmap.totals.high.toString(), options: { bold: true, fill: { color: 'FED7AA' }, align: 'center' as const } },
        { text: data.organizationHeatmap.totals.medium.toString(), options: { bold: true, fill: { color: 'FEF08A' }, align: 'center' as const } },
        { text: data.organizationHeatmap.totals.low.toString(), options: { bold: true, fill: { color: 'BBF7D0' }, align: 'center' as const } },
        { text: data.organizationHeatmap.totals.total.toString(), options: { bold: true, fill: { color: 'D1D5DB' }, align: 'center' as const } },
      ],
    ];

    heatmapSlide.addTable(tableRows, {
      x: 0.3, y: 0.95, w: 9.4,
      fontFace: "Arial",
      fontSize: 10,
      border: { pt: 0.5, color: 'CBD5E1' },
      colW: [2.2, 1.4, 1.4, 1.4, 1.4, 1.4],
    });

    // Legend
    heatmapSlide.addText("↑ = Increased vs previous period  |  ↓ = Decreased vs previous period", {
      x: 0.3, y: 3.8, w: 9.4, h: 0.3,
      fontSize: 9, italic: true, color: "64748B",
      fontFace: "Arial",
    });
  }

  return await pptx.write({ outputType: "blob" }) as Blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
