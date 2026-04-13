import jsPDF from "jspdf";
import { toPng } from "html-to-image";

export async function captureElementAsPngDataUrl(element: HTMLElement): Promise<string> {
  return toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });
}

export async function exportElementAsPng(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await captureElementAsPngDataUrl(element);
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function exportElementAsPdf(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await captureElementAsPngDataUrl(element);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const width = pdf.internal.pageSize.getWidth();
  const imageProperties = pdf.getImageProperties(dataUrl);
  const height = (imageProperties.height * width) / imageProperties.width;

  pdf.addImage(dataUrl, "PNG", 0, 0, width, height, undefined, "FAST");
  pdf.save(filename);
}
