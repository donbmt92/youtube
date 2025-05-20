"use client";

import { useState } from "react";

interface TranscriptFormProps {
  transcript: string;
  setTranscript: (transcript: string) => void;
  loading: boolean;
  useScriptTemplate: boolean;
  setUseScriptTemplate: (value: boolean) => void;
  handleProcessTranscript: () => void;
}

export const TranscriptForm = ({
  transcript,
  setTranscript,
  loading,
  useScriptTemplate,
  setUseScriptTemplate,
  handleProcessTranscript
}: TranscriptFormProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <div className="space-y-4">
        <div>
          <label htmlFor="transcript" className="block text-sm font-medium mb-2">
            Nhập Transcript YouTube:
          </label>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Dán transcript YouTube của bạn vào đây..."
            rows={6}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            disabled={loading}
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="useTemplate"
            checked={useScriptTemplate}
            onChange={(e) => setUseScriptTemplate(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            disabled={loading}
          />
          <label htmlFor="useTemplate" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Sử dụng mẫu kịch bản nghệ sĩ
          </label>
        </div>
        
        <button
          onClick={handleProcessTranscript}
          disabled={loading || !transcript.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Đang xử lý transcript...
            </>
          ) : (
            "Xử Lý Transcript"
          )}
        </button>
      </div>
    </div>
  );
};
