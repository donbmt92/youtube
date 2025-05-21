/**
 * File Service
 * Handles file operations like Excel import/export
 */

import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';
import { BatchResultItem, markdownToPlainText } from './batchService';

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
