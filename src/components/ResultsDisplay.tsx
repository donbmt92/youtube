"use client";

import ReactMarkdown from "react-markdown";

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
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3">Bước 1: Đề Cương</h2>
        <div className="prose dark:prose-invert max-w-none">
          {step === 1 && loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
              Đang tạo đề cương...
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
          <h2 className="text-lg font-semibold mb-3">Bước 2: 4 Phần Đầu Tiên</h2>
          <div className="prose dark:prose-invert max-w-none">
            {step === 2 && loading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
                Đang tạo nội dung 4 phần đầu...
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
          <h2 className="text-lg font-semibold mb-3">Bước 3: 4 Phần Cuối Cùng</h2>
          <div className="prose dark:prose-invert max-w-none">
            {step === 3 && loading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
                Đang tạo nội dung 4 phần cuối...
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                <ReactMarkdown>{lastSections}</ReactMarkdown>
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
