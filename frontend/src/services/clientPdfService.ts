import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function extractTextFromPdfClient(file: File): Promise<{ text: string; pageCount: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    const pageTexts: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageStrings = textContent.items
        .map((item: any) => (item.str ? item.str.trim() : ''))
        .filter(Boolean)
        .join(' ');
        
      if (pageStrings.trim()) {
        pageTexts.push(pageStrings.trim());
      }
    }

    const fullText = pageTexts.join('\n\n').trim();
    if (!fullText) {
      throw new Error('No readable text found in PDF.');
    }

    return { text: fullText, pageCount };
  } catch (error) {
    throw error;
  }
}
