import { createWorker } from 'tesseract.js';

export async function performClientOcr(
  file: File, 
  onProgress?: (progress: number, statusText: string) => void
): Promise<string> {
  let worker = null;
  try {
    if (onProgress) onProgress(0.2, 'Initializing OCR engine...');
    worker = await createWorker('eng');
    
    if (onProgress) onProgress(0.5, 'Reading document text...');
    const result = await worker.recognize(file);
    
    if (onProgress) onProgress(0.9, 'Processing characters...');
    await worker.terminate();
    
    return result.data.text.trim();
  } catch (error) {
    if (worker) {
      try {
        await (worker as any).terminate();
      } catch {}
    }
    throw error;
  }
}
