/**
 * File Service
 * Handles file operations like Excel import/export
 */

import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';
import { BatchResultItem, markdownToPlainText } from './batchService';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { marked } from 'marked';

// Configure marked to use synchronous parsing
marked.setOptions({
  async: false
});

/**
 * Parse Excel file and extract transcripts
 * @param file Excel file to parse
 * @returns Array of batch result items
 */
export const parseExcelFile = async (file: File): Promise<BatchResultItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        if (!e.target?.result) {
          reject(new Error("Failed to read file"));
          return;
        }
        
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          reject(new Error("No data found in the Excel file"));
          return;
        }
        
        // Check if the file has a transcript column
        if (!Object.prototype.hasOwnProperty.call(jsonData[0], 'transcript')) {
          reject(new Error("The Excel file must have a 'transcript' column"));
          return;
        }
        
        // Convert to BatchResultItem format
        const results = jsonData.map((row: any) => ({
          ...row,
          transcript: row.transcript || '',
          outline: '',
          firstSections: '',
          lastSections: '',
          processed: false
        }));
        
        resolve(results);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Export batch results to Excel
 * @param batchResults Batch results to export
 */
export const exportToExcel = (batchResults: BatchResultItem[]): void => {
  if (batchResults.length === 0) {
    throw new Error("No results to export");
  }
  
  const worksheet = XLSX.utils.json_to_sheet(batchResults.map(item => ({
    transcript: item.transcript,
    outline: markdownToPlainText(item.outline),
    firstSections: markdownToPlainText(item.firstSections),
    lastSections: markdownToPlainText(item.lastSections),
    fullContent: markdownToPlainText(`${item.outline}\n\n${item.firstSections}\n\n${item.lastSections}`),
    processed: item.processed ? "Yes" : "No",
    error: item.error || ""
  })));
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Processed Transcripts");
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
  FileSaver.saveAs(data, "processed_transcripts.xlsx");
};

/**
 * Convert markdown text to DOCX paragraphs
 * @param text Markdown text to convert
 * @returns Array of DOCX paragraphs
 */
const markdownToDocx = (text: string) => {
  if (!text) return [new Paragraph({ text: '' })];
  
  const lines = text.split('\n');
  const paragraphs: Paragraph[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle headers
    if (line.startsWith('# ')) {
      paragraphs.push(new Paragraph({
        text: line.substring(2),
        heading: HeadingLevel.HEADING_1
      }));
    } else if (line.startsWith('## ')) {
      paragraphs.push(new Paragraph({
        text: line.substring(3),
        heading: HeadingLevel.HEADING_2
      }));
    } else if (line.startsWith('### ')) {
      paragraphs.push(new Paragraph({
        text: line.substring(4),
        heading: HeadingLevel.HEADING_3
      }));
    } else if (line.startsWith('#### ')) {
      paragraphs.push(new Paragraph({
        text: line.substring(5),
        heading: HeadingLevel.HEADING_4
      }));
    } else if (line.startsWith('##### ')) {
      paragraphs.push(new Paragraph({
        text: line.substring(6),
        heading: HeadingLevel.HEADING_5
      }));
    } else if (line.startsWith('###### ')) {
      paragraphs.push(new Paragraph({
        text: line.substring(7),
        heading: HeadingLevel.HEADING_6
      }));
    }
    // Handle bullet points
    else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ')) {
      paragraphs.push(new Paragraph({
        text: line.substring(2),
        bullet: {
          level: 0
        }
      }));
    }
    // Handle numbered lists
    else if (/^\d+\.\s/.test(line)) {
      paragraphs.push(new Paragraph({
        text: line.replace(/^\d+\.\s/, ''),
        numbering: {
          reference: 'numbered-list',
          level: 0
        }
      }));
    }
    // Handle blockquotes
    else if (line.startsWith('> ')) {
      paragraphs.push(new Paragraph({
        text: line.substring(2),
        indent: {
          left: 720 // 0.5 inch in twips
        }
      }));
    }
    // Handle code blocks
    else if (line.startsWith('```')) {
      const codeBlock: string[] = [];
      while (i + 1 < lines.length && !lines[i + 1].startsWith('```')) {
        i++;
        codeBlock.push(lines[i]);
      }
      paragraphs.push(new Paragraph({
        text: codeBlock.join('\n'),
        spacing: {
          before: 200,
          after: 200
        }
      }));
    }
    // Handle regular text
    else if (line.trim()) {
      // Handle bold and italic
      let text = line;
      const runs: TextRun[] = [];
      
      // Handle bold
      text = text.replace(/\*\*(.*?)\*\*/g, (_, content) => {
        runs.push(new TextRun({ text: content, bold: true }));
        return '';
      });
      
      // Handle italic
      text = text.replace(/\*(.*?)\*/g, (_, content) => {
        runs.push(new TextRun({ text: content, italics: true }));
        return '';
      });
      
      // Add remaining text
      if (text) {
        runs.push(new TextRun({ text }));
      }
      
      paragraphs.push(new Paragraph({
        children: runs,
        spacing: {
          after: 200
        }
      }));
    }
    // Handle empty lines
    else {
      paragraphs.push(new Paragraph({ text: '' }));
    }
  }
  
  return paragraphs;
};

/**
 * Export content to DOCX format
 * @param content Content to export
 * @param filename Name of the output file
 */
export const exportToDocx = (content: string, filename: string = 'document.docx'): void => {
  // Create a new document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "KỊCH BẢN",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),
        ...markdownToDocx(content)
      ]
    }]
  });

  // Generate and save the document
  Packer.toBlob(doc).then(blob => {
    FileSaver.saveAs(blob, filename);
  });
};

/**
 * Export batch results to DOCX
 * @param batchResults Batch results to export
 */
export const exportBatchToDocx = (batchResults: BatchResultItem[]): void => {
  if (batchResults.length === 0) {
    throw new Error("No results to export");
  }

  // Create a new document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "KẾT QUẢ XỬ LÝ KỊCH BẢN",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),
        ...batchResults.map((item, index) => [
          new Paragraph({
            text: `Kịch Bản ${index + 1}`,
            heading: HeadingLevel.HEADING_2
          }),
          new Paragraph({
            text: "Transcript:",
            heading: HeadingLevel.HEADING_3
          }),
          new Paragraph({
            children: [new TextRun(item.transcript || '')]
          }),
          new Paragraph({
            text: "Đề Cương:",
            heading: HeadingLevel.HEADING_3
          }),
          ...markdownToDocx(item.outline || ''),
          new Paragraph({
            text: "Phần Đầu:",
            heading: HeadingLevel.HEADING_3
          }),
          ...markdownToDocx(item.firstSections || ''),
          new Paragraph({
            text: "Phần Cuối:",
            heading: HeadingLevel.HEADING_3
          }),
          ...markdownToDocx(item.lastSections || ''),
          new Paragraph({ text: "" }) // Add spacing between items
        ]).flat()
      ]
    }]
  });

  // Generate and save the document
  Packer.toBlob(doc).then(blob => {
    FileSaver.saveAs(blob, "processed_transcripts.docx");
  });
};

/**
 * Convert markdown to HTML using marked
 * @param content Markdown content
 * @returns HTML string
 */
const markdownToHtml = (content: string): string => {
  return marked.parse(content) as string;
};

/**
 * Format markdown content for copying
 * @param outline Outline content
 * @param firstSections First sections content
 * @param lastSections Last sections content
 * @returns Formatted plain text content
 */
export const formatMarkdownForCopy = (
  outline: string = '',
  firstSections: string = '',
  lastSections: string = ''
): string => {
  const formattedOutline = markdownToPlainText(outline);
  const formattedFirstSections = markdownToPlainText(firstSections);
  const formattedLastSections = markdownToPlainText(lastSections);

  return `ĐỀ CƯƠNG KỊCH BẢN:

${formattedOutline}

KỊCH BẢN ĐẦY ĐỦ:

${formattedFirstSections}

${formattedLastSections}`;
};
