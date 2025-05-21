"use client";

import { RefObject } from "react";

import { BatchResultItem } from "@/services";


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
          
          <button
            onClick={exportResults}
            disabled={batchProcessing || batchResults.length === 0 || !batchResults.some(r => r.processed)}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            Xuất Kết Quả
          </button>
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
                          <button
                            onClick={() => handleShowPreview(item)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Xem kết quả
                          </button>
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
