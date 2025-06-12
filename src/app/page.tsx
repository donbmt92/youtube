"use client";

import { useState, useRef } from "react";

// Import components
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TranscriptForm } from "@/components/TranscriptForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { BatchProcessing } from "@/components/BatchProcessing";
import { PreviewModal } from "@/components/PreviewModal";

// Import services
import { 
  processTranscript, 
  processBatch, 
  parseExcelFile, 
  exportToExcel,
  BatchResultItem,
  processVietnameseActorScript
} from "@/services";

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
  const [actorType, setActorType] = useState("foreign");
  const fileInputRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState<BatchResultItem | null>(null);


  // Function to show preview of a processed item
  const handleShowPreview = (item: BatchResultItem) => {
    setPreviewItem(item);
    setShowPreview(true);
  };

  // Process transcript (UI function)
  const handleProcess = async () => {
    if (!transcript) {
      alert("Vui lòng nhập transcript");
      return;
    }

    setLoading(true);
    setStep(1);

    try {
      const result = actorType === "vietnamese" 
        ? await processVietnameseActorScript(transcript)
        : await processTranscript(transcript, useScriptTemplate);

      if (result.success) {
        setOutline(result.outline || "");
        setFirstSections(result.firstSections || "");
        setLastSections(result.lastSections || "");
        setStep(2);
      } else {
        throw new Error(result.error);
      }
    } catch (error: unknown) {
      console.error("Error processing transcript:", error);
      alert("Có lỗi xảy ra khi xử lý transcript: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Process batch of transcripts
  const handleProcessBatch = async () => {
    if (batchResults.length === 0) {
      alert("Vui lòng tải lên file Excel.");
      return;
    }

    setBatchProgress(0);
    setBatchProcessing(true);
    
    try {
      // Use the batch processing service
      const updatedResults = await processBatch(
        batchResults,
        useScriptTemplate,
        (progress: number) => setBatchProgress(progress),
        (results: BatchResultItem[]) => setBatchResults([...results])
      );
      
      setBatchResults(updatedResults);
    } catch (error) {
      console.error("Error processing batch:", error);
      alert("Error processing batch: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setBatchProcessing(false);
    }
  };

  // Handle Excel file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      // Use the file service to parse the Excel file
      const results = await parseExcelFile(file);
      setBatchResults(results);
      alert(`Found ${results.length} transcripts in the Excel file. Ready for batch processing.`);
    } catch (error) {
      console.error("Error processing Excel file:", error);
      alert("Error processing Excel file: " + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  // Export batch results to Excel
  const handleExportToExcel = () => {
    if (batchResults.length === 0) {
      alert("No results to export");
      return;
    }
    
    try {
      // Use the file service to export to Excel
      exportToExcel(batchResults);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting to Excel: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-4xl mx-auto">
        <Header />

        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
          <h1 className="text-4xl font-bold mb-8 text-center">YouTube Script Generator</h1>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại diễn viên
            </label>
            <select
              value={actorType}
              onChange={(e) => setActorType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="foreign">Diễn viên nước ngoài</option>
              <option value="vietnamese">Diễn viên Việt Nam</option>
            </select>
          </div>
        </div>

        <TranscriptForm 
          transcript={transcript}
          setTranscript={setTranscript}
          loading={loading}
          useScriptTemplate={useScriptTemplate}
          setUseScriptTemplate={setUseScriptTemplate}
          handleProcessTranscript={handleProcess}
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
          processBatch={handleProcessBatch}
          exportResults={handleExportToExcel}
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