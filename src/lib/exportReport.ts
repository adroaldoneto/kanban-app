import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function captureElementAsPng(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#0f1219",
  });
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function elementToPdf(
  element: HTMLElement,
  filename: string,
  title: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#0f1219",
  });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width, canvas.height + 80],
  });
  pdf.setFontSize(14);
  pdf.text(title, 24, 28);
  pdf.addImage(imgData, "PNG", 0, 48, canvas.width, canvas.height);
  pdf.save(`${filename}.pdf`);
}

export function buildMailtoReport(
  to: string,
  subject: string,
  bodyLines: string[]
): string {
  const q = new URLSearchParams();
  q.set("subject", subject);
  q.set("body", bodyLines.join("\n"));
  return `mailto:${to}?${q.toString()}`;
}
