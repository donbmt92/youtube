"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [outline, setOutline] = useState("");
  const [firstSections, setFirstSections] = useState("");
  const [lastSections, setLastSections] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [noSpecialChars, setNoSpecialChars] = useState(false);
  const [useScriptTemplate, setUseScriptTemplate] = useState(false);
  const [batchResults, setBatchResults] = useState([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const fileInputRef = useRef(null);
  // Add these two state variables
  const [showPreview, setShowPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  // Script template for artist content
  const scriptTemplate = `Bạn là một biên kịch chuyên viết kịch bản về nghệ sĩ. Hãy viết một kịch bản chi tiết, hấp dẫn và có tính giáo dục về nghệ sĩ dựa trên transcript được cung cấp. Kịch bản nên có cấu trúc rõ ràng, thông tin chính xác, và giọng điệu chuyên nghiệp.`;

  // Function to show preview of a processed item - move inside component
  const handleShowPreview = (item) => {
    setPreviewItem(item);
    setShowPreview(true);
  };

  // Close preview modal when clicking outside - move inside component
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPreview && event.target.classList.contains('modal-backdrop')) {
        setShowPreview(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPreview]);

  // Process a single transcript
  const processTranscript = async () => {
    if (!transcript.trim()) {
      alert("Vui lòng nhập transcript");
      return;
    }

    setLoading(true);
    setStep(1);
    
    try {
      // Step 1: Get outline
      const outlinePrompt = useScriptTemplate 
        ? `${scriptTemplate}\n\n${transcript}\n\nDựa vào transcript này, hãy tạo một đề cương chi tiết với 8 phần cho một bài viết kịch bản dài khoảng 6000 từ. Cho biết mỗi phần nên dài bao nhiêu từ.`
        : `${transcript}\n\nDựa vào transcript này, hãy tạo một đề cương chi tiết với 8 phần.`;
      
      const outlineResponse = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: outlinePrompt
        }),
      });
      
      const outlineData = await outlineResponse.json();
      setOutline(outlineData.response);
      setStep(2);
      
      // Step 2: Get first 4 sections
      const firstSectionsPrompt = useScriptTemplate
        ? `${scriptTemplate}\n\n${transcript}\n\nDựa vào transcript này và đề cương sau:\n${outlineData.response}\n\nViết nội dung chi tiết cho 4 phần đầu tiên của đề cương. Đảm bảo không có ký tự đặc biệt như *, #, -, /n, ... trong nội dung. Viết liền mạch, không đánh số, không đánh dấu đầu dòng.`
        : `${transcript}\n\nDựa vào transcript này và đề cương sau:\n${outlineData.response}\n\nViết nội dung chi tiết cho 4 phần đầu tiên của đề cương.`;
      
      const firstSectionsResponse = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: firstSectionsPrompt
        }),
      });
      
      const firstSectionsData = await firstSectionsResponse.json();
      setFirstSections(firstSectionsData.response);
      setStep(3);
      
      // Step 3: Get last 4 sections
      const lastSectionsPrompt = useScriptTemplate
        ? `${scriptTemplate}\n\n${transcript}\n\nDựa vào transcript này và đề cương sau:\n${outlineData.response}\n\nViết nội dung chi tiết cho 4 phần cuối cùng của đề cương. Đảm bảo không có ký tự đặc biệt như *, #, -, /n, ... trong nội dung. Viết liền mạch, không đánh số, không đánh dấu đầu dòng.`
        : `${transcript}\n\nDựa vào transcript này và đề cương sau:\n${outlineData.response}\n\nViết nội dung chi tiết cho 4 phần cuối cùng của đề cương.`;
      
      const lastSectionsResponse = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: lastSectionsPrompt
        }),
      });
      
      const lastSectionsData = await lastSectionsResponse.json();
      setLastSections(lastSectionsData.response);
      setStep(4);
    } catch (error) {
      console.error("Lỗi xử lý transcript:", error);
      alert("Lỗi xử lý transcript. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Excel file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
          // Check if the file has a transcript column
          if (jsonData[0].transcript) {
            console.log("Found transcript column in the Excel file.", jsonData[0].transcript);
            
            alert(`Found ${jsonData.length} transcripts in the Excel file. Ready for batch processing.`);
            setBatchResults(jsonData.map(row => ({
              ...row,
              outline: '',
              firstSections: '',
              lastSections: '',
              processed: false
            })));
          } else {
            alert("The Excel file must have a 'transcript' column.");
          }
        } else {
          alert("No data found in the Excel file.");
        }
      } catch (error) {
        console.error("Error reading Excel file:", error);
        alert("Error reading Excel file. Please make sure it's a valid Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Process all transcripts in batch
  const processBatch = async () => {
    if (batchResults.length === 0) {
      alert("Vui lòng tải lên file Excel trước.");
      return;
    }

    setBatchProcessing(true);
    setBatchProgress(0);
    
    const updatedResults = [...batchResults];
    
    for (let i = 0; i < updatedResults.length; i++) {
      console.log(`Processing transcript ${i + 1}...`);
      
      if (updatedResults[i].processed) continue;
      
      try {
        // Process outline
        const outlinePrompt = useScriptTemplate 
          ? `${scriptTemplate}\n\n${updatedResults[i].transcript}\n\nDựa vào transcript này, hãy tạo một đề cương chi tiết với 8 phần cho một bài viết kịch bản dài khoảng 6000 từ. Cho biết mỗi phần nên dài bao nhiêu từ.`
          : `${updatedResults[i].transcript}\n\n${noSpecialChars ? 
              "Dựa vào transcript này, hãy tạo một đề cương chi tiết với 8 phần. Viết dưới dạng văn bản thuần túy không có ký tự định dạng đặc biệt." : 
              "Dựa vào transcript này, hãy tạo một đề cương chi tiết với 8 phần."}`;
        
        const outlineResponse = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: outlinePrompt
          }),
        });
        
        const outlineData = await outlineResponse.json();
        updatedResults[i].outline = outlineData.response;
        
        // Process first sections
        const firstSectionsPrompt = useScriptTemplate
          ? `${scriptTemplate}\n\n${updatedResults[i].transcript}\n\nDựa vào transcript này và đề cương sau:\n${outlineData.response}\n\nViết nội dung chi tiết cho 4 phần đầu tiên của đề cương. Đảm bảo không có ký tự đặc biệt như *, #, -, /n, ... trong nội dung. Viết liền mạch, không đánh số, không đánh dấu đầu dòng.`
          : `${updatedResults[i].transcript}\n\nDựa vào transcript này và đề cương sau:\n${outlineData.response}\n\n${noSpecialChars ? 
              "Viết nội dung chi tiết cho 4 phần đầu tiên của đề cương. Viết dưới dạng văn bản thuần túy không có ký tự định dạng đặc biệt." : 
              "Viết nội dung chi tiết cho 4 phần đầu tiên của đề cương."}`;
        
        const firstSectionsResponse = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: firstSectionsPrompt
          }),
        });
        
        const firstSectionsData = await firstSectionsResponse.json();
        updatedResults[i].firstSections = firstSectionsData.response;
        
        // Process last sections
        const lastSectionsPrompt = useScriptTemplate
          ? `${scriptTemplate}\n\n${updatedResults[i].transcript}\n\nDựa vào transcript này và đề cương sau:\n${outlineData.response}\n\nViết nội dung chi tiết cho 4 phần cuối cùng của đề cương. Đảm bảo không có ký tự đặc biệt như *, #, -, /n, ... trong nội dung. Viết liền mạch, không đánh số, không đánh dấu đầu dòng.`
          : `${updatedResults[i].transcript}\n\nDựa vào transcript này và đề cương sau:\n${outlineData.response}\n\n${noSpecialChars ? 
              "Viết nội dung chi tiết cho 4 phần cuối cùng của đề cương. Viết dưới dạng văn bản thuần túy không có ký tự định dạng đặc biệt." : 
              "Viết nội dung chi tiết cho 4 phần cuối cùng của đề cương."}`;
        
        const lastSectionsResponse = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: lastSectionsPrompt
          }),
        });
        
        const lastSectionsData = await lastSectionsResponse.json();
        updatedResults[i].lastSections = lastSectionsData.response;
        
        // Mark as processed
        updatedResults[i].processed = true;
        
        // Update progress
        setBatchProgress(Math.round(((i + 1) / updatedResults.length) * 100));
        setBatchResults([...updatedResults]);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Lỗi xử lý transcript ${i + 1}:`, error);
        updatedResults[i].error = error.message || "Xử lý thất bại";
      }
    }
    
    setBatchProcessing(false);
  };

  // Export results to Excel
  const exportResults = () => {
    if (batchResults.length === 0) {
      alert("No results to export.");
      return;
    }
    
    // Helper function to convert markdown to plain text
    const markdownToPlainText = (markdown) => {
      if (!markdown) return '';
      // Remove headers (#)
      let text = markdown.replace(/#{1,6}\s?/g, '');
      // Remove bold/italic markers
      text = text.replace(/[*_]{1,3}(.*?)[*_]{1,3}/g, '$1');
      // Remove links but keep text [text](url) -> text
      text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
      // Remove bullet points
      text = text.replace(/[-*+]\s/g, '');
      // Remove code blocks
      text = text.replace(/```[\s\S]*?```/g, '');
      // Remove inline code
      text = text.replace(/`(.*?)`/g, '$1');
      // Remove blockquotes
      text = text.replace(/>\s/g, '');
      // Remove horizontal rules
      text = text.replace(/---/g, '');
      // Replace multiple newlines with single newline
      text = text.replace(/\n\s*\n/g, '\n');
      return text.trim();
    };
    
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

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Image
            className="dark:invert mx-auto mb-4"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <h1 className="text-3xl font-bold mb-2">Xử Lý Transcript YouTube</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Được hỗ trợ bởi Google Gemini API và Next.js
          </p>
        </div>

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
              onClick={processTranscript}
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

        {/* Batch processing section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Xử Lý Hàng Loạt</h2>
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

        {step > 0 && (
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
        )}
      </main>

      <footer className="mt-16 border-t pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        <div className="flex gap-6 justify-center flex-wrap">
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/file.svg"
              alt="File icon"
              width={16}
              height={16}
            />
            Tài liệu Next.js
          </a>
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://ai.google.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/globe.svg"
              alt="Globe icon"
              width={16}
              height={16}
            />
            Gemini API
          </a>
        </div>
      </footer>
    </div>
  );
}