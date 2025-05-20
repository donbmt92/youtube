"use client";

import { useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface PreviewItem {
  transcript?: string;
  outline?: string;
  firstSections?: string;
  lastSections?: string;
}

interface PreviewModalProps {
  showPreview: boolean;
  previewItem: PreviewItem | null;
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
              <h4 className="font-medium mb-2">Đề Cương</h4>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 prose dark:prose-invert max-w-none">
                <ReactMarkdown>{previewItem.outline || ''}</ReactMarkdown>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Các Phần Đầu</h4>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 prose dark:prose-invert max-w-none">
                <ReactMarkdown>{previewItem.firstSections || ''}</ReactMarkdown>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Các Phần Cuối</h4>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 prose dark:prose-invert max-w-none">
                <ReactMarkdown>{previewItem.lastSections || ''}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
