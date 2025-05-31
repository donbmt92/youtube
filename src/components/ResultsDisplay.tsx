"use client";

import ReactMarkdown from "react-markdown";
import { exportToDocx, formatMarkdownForCopy } from "@/services";

interface ResultsDisplayProps {
  step: number;
  loading: boolean;
  outline: string;
  firstSections: string;
  lastSections: string;
}

export const ResultsDisplay = ({
  step,
  loading,
  outline,
  firstSections,
  lastSections
}: ResultsDisplayProps) => {
  if (step === 0) return null;
  
  // Function to download the complete script as a text file
  const downloadScript = () => {
    const completeScript = `ĐỀ CƯƠNG KỊCH BẢN:

${outline}


KỊCH BẢN ĐẦY ĐỦ:

${firstSections}

${lastSections}`;
    
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

  // Function to export to DOCX
  const exportToDocxFormat = () => {
    const completeScript = `ĐỀ CƯƠNG KỊCH BẢN:

${outline}


KỊCH BẢN ĐẦY ĐỦ:

${firstSections}

${lastSections}`;
    
    exportToDocx(completeScript, 'kich_ban_' + new Date().toISOString().split('T')[0] + '.docx');
  };

  // Function to copy content to clipboard
  const copyToClipboard = () => {
    const formattedContent = formatMarkdownForCopy(outline, firstSections, lastSections);
    
    navigator.clipboard.writeText(formattedContent).then(() => {
      alert('Đã sao chép vào clipboard!');
    }).catch(err => {
      console.error('Lỗi khi sao chép:', err);
      alert('Không thể sao chép vào clipboard');
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3">Bước 1: Đề Cương Kịch Bản</h2>
        <div className="prose dark:prose-invert max-w-none">
          {step === 1 && loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
              Đang tạo đề cương kịch bản...
            </div>
          ) : (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">
              <ReactMarkdown>{outline}</ReactMarkdown>
            </pre>
          )}
        </div>
      </div>

      {step > 1 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">Bước 2: Phần Đầu Kịch Bản</h2>
          <div className="prose dark:prose-invert max-w-none">
            {step === 2 && loading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
                Đang tạo nội dung phần đầu kịch bản...
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                <ReactMarkdown>{firstSections}</ReactMarkdown>
              </pre>
            )}
          </div>
        </div>
      )}

      {step > 2 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">Bước 3: Phần Cuối Kịch Bản</h2>
          <div className="prose dark:prose-invert max-w-none">
            {step === 3 && loading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
                Đang tạo nội dung phần cuối kịch bản...
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                <ReactMarkdown>{lastSections}</ReactMarkdown>
              </pre>
            )}
          </div>
        </div>
      )}
      
      {step === 4 && !loading && (
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={copyToClipboard}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Sao Chép
          </button>
          <button
            onClick={downloadScript}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Tải Kịch Bản Xuống (.txt)
          </button>
          <button
            onClick={exportToDocxFormat}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Tải Kịch Bản Xuống (.docx)
          </button>
        </div>
      )}
    </div>
  );
};
