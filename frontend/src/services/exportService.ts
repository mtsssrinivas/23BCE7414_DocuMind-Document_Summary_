import { DocumentMetadata, SummaryResponse } from '../types';

export const exportService = {
  downloadMarkdown(filename: string, summary: SummaryResponse, metadata?: DocumentMetadata): void {
    const docName = metadata?.filename || filename || 'Document';
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const keyPointsMd = summary.key_points.map(pt => `- ${pt}`).join('\n');
    const mainIdeasMd = summary.main_ideas.map(idea => `- **${idea}**`).join('\n');
    const suggestionsMd = summary.improvement_suggestions
      .map(s => `### ${s.title} (${s.category})\n${s.description}`)
      .join('\n\n');

    const content = `# Summary Report: ${docName}
*Generated: ${dateStr}*

---

## Overview
- **File Name:** ${metadata?.filename || 'N/A'}
- **Type:** ${metadata?.file_type || 'N/A'}
- **Size:** ${metadata?.file_size_formatted || 'N/A'}
- **Pages:** ${metadata?.page_count || 1}
- **Word Count:** ${metadata?.word_count || 0} words

---

## Executive Summary (${summary.summary_length.toUpperCase()})
${summary.summary}

---

## Key Points
${keyPointsMd || 'None extracted.'}

---

## Main Topics
${mainIdeasMd || 'None extracted.'}

---

## Suggestions & Notes
${suggestionsMd || 'None.'}
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docName.replace(/\.[^/.]+$/, '')}_Summary.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  downloadPlainText(filename: string, summary: SummaryResponse, metadata?: DocumentMetadata): void {
    const docName = metadata?.filename || filename || 'Document';
    const content = `SUMMARY REPORT
==================================================
Document: ${docName}
Generated: ${new Date().toLocaleString()}

EXECUTIVE SUMMARY (${summary.summary_length.toUpperCase()}):
--------------------------------------------------
${summary.summary}

KEY POINTS:
--------------------------------------------------
${summary.key_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}

MAIN IDEAS:
--------------------------------------------------
${summary.main_ideas.map(m => `• ${m}`).join('\n')}

SUGGESTIONS:
--------------------------------------------------
${summary.improvement_suggestions.map(s => `[${s.category.toUpperCase()}] ${s.title}: ${s.description}`).join('\n\n')}
==================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docName.replace(/\.[^/.]+$/, '')}_Summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  printDocumentReport(filename: string, summary: SummaryResponse, metadata?: DocumentMetadata): void {
    const docName = metadata?.filename || filename || 'Document';
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the report.');
      return;
    }

    const keyPointsHtml = summary.key_points.map(pt => `<li>${pt}</li>`).join('');
    const mainIdeasHtml = summary.main_ideas.map(idea => `<span style="display:inline-block;background:#e4e4e7;color:#18181b;padding:3px 8px;border-radius:6px;margin:3px;font-size:12px;">${idea}</span>`).join('');
    const suggestionsHtml = summary.improvement_suggestions.map(s => `
      <div style="margin-bottom:10px;padding:8px;border-left:3px solid #10b981;background:#f4f4f5;">
        <strong>${s.title}</strong> <span style="font-size:11px;color:#71717a;">(${s.category})</span>
        <p style="margin:4px 0 0 0;color:#27272a;">${s.description}</p>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Summary - ${docName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #18181b; padding: 30px; max-width: 750px; margin: 0 auto; }
          h1 { font-size: 20px; border-bottom: 1px solid #e4e4e7; padding-bottom: 8px; margin-bottom: 12px; }
          h2 { font-size: 15px; margin-top: 20px; border-bottom: 1px solid #f4f4f5; padding-bottom: 4px; }
          .meta-box { background: #f4f4f5; padding: 10px; border-radius: 6px; font-size: 12px; margin-bottom: 16px; }
          ul { padding-left: 20px; }
          li { margin-bottom: 4px; font-size: 13px; }
        </style>
      </head>
      <body>
        <h1>Executive Summary</h1>
        <div class="meta-box">
          <strong>Document:</strong> ${docName} | 
          <strong>Pages:</strong> ${metadata?.page_count || 1} | 
          <strong>Words:</strong> ${metadata?.word_count || 'N/A'}
        </div>
        
        <h2>Summary</h2>
        <p style="font-size: 13px;">${summary.summary.replace(/\n/g, '<br><br>')}</p>
        
        <h2>Key Points</h2>
        <ul>${keyPointsHtml}</ul>
        
        <h2>Main Ideas</h2>
        <div>${mainIdeasHtml}</div>
        
        <h2>Suggestions</h2>
        <div>${suggestionsHtml}</div>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
};
