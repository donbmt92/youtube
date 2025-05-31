"use client";

import { RefObject } from "react";

import { BatchResultItem } from "@/services";
import { exportBatchToDocx, formatMarkdownForCopy } from "@/services";


interface BatchProcessingProps {
  fileInputRef: RefObject<HTMLInputElement>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  processBatch: () => void;
  exportResults: () => void;
  batchProcessing: boolean;
  batchProgress: number;
  batchResults: BatchResultItem[];
  handleShowPreview: (item: BatchResultItem) => void;
}

export const BatchProcessing = ({
  fileInputRef,
  handleFileUpload,
  processBatch,
  exportResults,
  batchProcessing,
  batchProgress,
  batchResults,
  handleShowPreview
}: BatchProcessingProps) => {
  // Function to copy a single result to clipboard
  const copyResultToClipboard = (item: BatchResultItem) => {
    const formattedContent = formatMarkdownForCopy(
      item.outline,
      item.firstSections,
      item.lastSections
    );
    
    navigator.clipboard.writeText(formattedContent).then(() => {
      alert('Đã sao chép vào clipboard!');
    }).catch(err => {
      console.error('Lỗi khi sao chép:', err);
      alert('Không thể sao chép vào clipboard');
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Xử Lý Kịch Bản Hàng Loạt</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="excelFile" className="block text-sm font-medium mb-2">
            Tải lên File Excel (có cột 'transcript'):
          </label>
          <input
            type="file"
            id="excelFile"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={batchProcessing}
          />
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={processBatch}
            disabled={batchProcessing || batchResults.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {batchProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Đang xử lý... {batchProgress}%
              </>
            ) : (
              "Xử Lý Hàng Loạt"
            )}
          </button>
          
          <div className="flex-1 flex space-x-2">
            <button
              onClick={exportResults}
              disabled={batchProcessing || batchResults.length === 0 || !batchResults.some(r => r.processed)}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              Xuất Excel
            </button>
            <button
              onClick={() => exportBatchToDocx(batchResults)}
              disabled={batchProcessing || batchResults.length === 0 || !batchResults.some(r => r.processed)}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              Xuất DOCX
            </button>
          </div>
        </div>
        
        {batchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-md font-medium mb-2">Trạng thái xử lý:</h3>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md max-h-40 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-600">
                    <th className="text-left py-2 px-3">#</th>
                    <th className="text-left py-2 px-3">Xem trước transcript</th>
                    <th className="text-left py-2 px-3">Trạng thái</th>
                    <th className="text-left py-2 px-3">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {batchResults.map((item, index) => (
                    <tr key={index} className="border-b dark:border-gray-700">
                      <td className="py-2 px-3">{index + 1}</td>
                      <td className="py-2 px-3">{item.transcript?.substring(0, 50)}...</td>
                      <td className="py-2 px-3">
                        {item.processed ? (
                          <span className="text-green-600 dark:text-green-400">Hoàn thành</span>
                        ) : item.error ? (
                          <span className="text-red-600 dark:text-red-400">Lỗi: {item.error}</span>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400">Đang chờ</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {item.processed && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleShowPreview(item)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Xem kết quả
                            </button>
                            <button
                              onClick={() => copyResultToClipboard(item)}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                              title="Sao chép kết quả"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
