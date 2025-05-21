"use client";

import { useEffect } from "react";
import ReactMarkdown from "react-markdown";

import { BatchResultItem } from "@/services";

interface PreviewModalProps {
  showPreview: boolean;
  previewItem: BatchResultItem | null;
  setShowPreview: (show: boolean) => void;
}

export const PreviewModal = ({ showPreview, previewItem, setShowPreview }: PreviewModalProps) => {
  // Close preview modal when ESC key is pressed
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowPreview(false);
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setShowPreview]);

  // Function to download the complete script as a text file
  const downloadScript = () => {
    if (!previewItem) return;
    
    const completeScript = `ĐỀ CƯƠNG KỊCH BẢN:

${previewItem.outline || ''}


KỊCH BẢN ĐẦY ĐỦ:

${previewItem.firstSections || ''}

${previewItem.lastSections || ''}`;
    
    // Create a blob with the text content
    const blob = new Blob([completeScript], { type: 'text/plain;charset=utf-8' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kich_ban_' + new Date().toISOString().split('T')[0] + '.txt';
    
    // Append to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  };

  if (!showPreview || !previewItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-xl font-semibold">Xem Kết Quả</h3>
          <button 
            onClick={() => setShowPreview(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-64px)]">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Transcript</h4>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 text-sm">
                {previewItem.transcript}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Đề Cương Kịch Bản</h4>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 prose dark:prose-invert max-w-none">
                <ReactMarkdown>{previewItem.outline || ''}</ReactMarkdown>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Phần Đầu Kịch Bản</h4>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 prose dark:prose-invert max-w-none">
                <ReactMarkdown>{previewItem.firstSections || ''}</ReactMarkdown>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Phần Cuối Kịch Bản</h4>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 prose dark:prose-invert max-w-none">
                <ReactMarkdown>{previewItem.lastSections || ''}</ReactMarkdown>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Kịch Bản Đầy Đủ</h4>
                <button
                  onClick={downloadScript}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded-md flex items-center gap-1 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải về (.txt)
                </button>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 prose dark:prose-invert max-w-none">
                <ReactMarkdown>{`${previewItem.outline || ''}\n\n${previewItem.firstSections || ''}\n\n${previewItem.lastSections || ''}`}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
