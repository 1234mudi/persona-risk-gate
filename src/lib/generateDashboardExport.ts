import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import pptxgen from 'pptxgenjs';

export interface ChartNarrative {
  chartTitle: string;
  narrative: string;
  keyInsight: string;
}

export interface ExportData {
  narratives: ChartNarrative[];
  executiveSummary: string;
  metrics: Array<{
    title: string;
    value: string | number;
    trend?: string;
    segments?: Array<{ label: string; value: number }>;
  }>;
  exportDate: string;
  filters: { businessUnit: string; timePeriod: string };
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

  // Add each chart narrative
  for (const n of data.narratives) {
    children.push(
      new Paragraph({
        text: n.chartTitle,
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({ text: n.narrative }),
      new Paragraph({
        children: [
          new TextRun({ text: "Key Insight: ", bold: true }),
          new TextRun({ text: n.keyInsight }),
        ],
      }),
      new Paragraph({ text: "" })
    );
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

  // Individual chart slides
  for (const narrative of data.narratives) {
    const slide = pptx.addSlide();
    slide.addText(narrative.chartTitle, {
      x: 0.5, y: 0.3, w: 9, h: 0.6,
      fontSize: 24, bold: true, color: "10052F",
      fontFace: "Arial",
    });
    slide.addText(narrative.narrative, {
      x: 0.5, y: 1.2, w: 9, h: 2.5,
      fontSize: 16, color: "333333", valign: "top",
      fontFace: "Arial",
    });
    slide.addShape("rect", {
      x: 0.5, y: 4, w: 9, h: 1,
      fill: { color: "F0F0F0" },
      line: { color: "CCCCCC", width: 1 },
    });
    slide.addText(`Key Insight: ${narrative.keyInsight}`, {
      x: 0.7, y: 4.2, w: 8.6, h: 0.6,
      fontSize: 14, italic: true, color: "555555", valign: "middle",
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
