"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

// Import components
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TranscriptForm } from "@/components/TranscriptForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { BatchProcessing } from "@/components/BatchProcessing";
import { PreviewModal } from "@/components/PreviewModal";

// Define interfaces
interface BatchResultItem {
  transcript: string;
  outline: string;
  firstSections: string;
  lastSections: string;
  processed: boolean;
  error?: string;
}

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [outline, setOutline] = useState("");
  const [firstSections, setFirstSections] = useState("");
  const [lastSections, setLastSections] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [noSpecialChars, setNoSpecialChars] = useState(false);
  const [useScriptTemplate, setUseScriptTemplate] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResultItem[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState<BatchResultItem | null>(null);

  // Script template for artist content
  const scriptTemplate = `Bạn là một biên kịch chuyên viết kịch bản về nghệ sĩ. Hãy viết một kịch bản chi tiết, hấp dẫn và có tính giáo dục về nghệ sĩ dựa trên transcript được cung cấp. Kịch bản nên có cấu trúc rõ ràng, thông tin chính xác, và giọng điệu chuyên nghiệp.`;

  // Function to show preview of a processed item
  const handleShowPreview = (item: BatchResultItem) => {
    setPreviewItem(item);
    setShowPreview(true);
  };

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
          ? `${scriptTemplate}\n\n${updatedResults[i].transcript}\n\nDựa vào transcript này và đề cương sau:\n${outlineData.response}\n\nViết nội dung chi tiết cho 4 phần đầu tiên của đề cương. Hãy viết khoảng 3000 từ cho 4 phần này. Đảm bảo không có ký tự đặc biệt như *, #, -, /n, ... trong nội dung. Viết liền mạch, không đánh số, không đánh dấu đầu dòng.`
          : `${updatedResults[i].transcript}\n\nDựa vào transcript này và đề cương sau:\n${outlineData.response}\n\n${noSpecialChars ? 
              "Viết nội dung chi tiết cho 4 phần đầu tiên của đề cương. Hãy viết khoảng 3000 từ cho 4 phần này. Viết dưới dạng văn bản thuần túy không có ký tự định dạng đặc biệt." : 
              "Viết nội dung chi tiết cho 4 phần đầu tiên của đề cương. Hãy viết khoảng 3000 từ cho 4 phần này."}`;
        
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
          ? `${scriptTemplate}\n\n${updatedResults[i].transcript}\n\nDựa vào transcript này và đề cương sau:\n${outlineData.response}\n\nViết nội dung chi tiết cho 4 phần cuối cùng của đề cương. Hãy viết khoảng 3000 từ cho 4 phần này. Đảm bảo không có ký tự đặc biệt như *, #, -, /n, ... trong nội dung. Viết liền mạch, không đánh số, không đánh dấu đầu dòng.`
          : `${updatedResults[i].transcript}\n\nDựa vào transcript này và đề cương sau:\n${outlineData.response}\n\n${noSpecialChars ? 
              "Viết nội dung chi tiết cho 4 phần cuối cùng của đề cương. Hãy viết khoảng 3000 từ cho 4 phần này. Viết dưới dạng văn bản thuần túy không có ký tự định dạng đặc biệt." : 
              "Viết nội dung chi tiết cho 4 phần cuối cùng của đề cương. Hãy viết khoảng 3000 từ cho 4 phần này."}`;
        
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
        <Header />

        <TranscriptForm 
          transcript={transcript}
          setTranscript={setTranscript}
          loading={loading}
          useScriptTemplate={useScriptTemplate}
          setUseScriptTemplate={setUseScriptTemplate}
          handleProcessTranscript={processTranscript}
        />

        <ResultsDisplay 
          step={step}
          loading={loading}
          outline={outline}
          firstSections={firstSections}
          lastSections={lastSections}
        />

        <BatchProcessing 
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          processBatch={processBatch}
          exportResults={exportResults}
          batchProcessing={batchProcessing}
          batchProgress={batchProgress}
          batchResults={batchResults}
          handleShowPreview={handleShowPreview}
        />
      </main>

      <Footer />

      <PreviewModal 
        showPreview={showPreview}
        previewItem={previewItem}
        setShowPreview={setShowPreview}
      />
    </div>
  );
}