/**
 * Batch Processing Service
 * Handles the batch processing of multiple transcripts
 */

import { processTranscript, processVietnameseActorScript } from './transcriptService';

export interface BatchResultItem {
  transcript?: string;
  outline?: string;
  firstSections?: string;
  lastSections?: string;
  processed: boolean;
  error?: string;
}

/**
 * Process a batch of transcripts
 * @param transcripts Array of transcript items to process
 * @param useScriptTemplate Whether to use the script template
 * @param actorType Type of actor script to generate ('foreign' or 'vietnamese')
 * @param onProgress Callback for progress updates
 * @param onItemComplete Callback when an item is completed
 */
export const processBatch = async (
  transcripts: BatchResultItem[],
  useScriptTemplate: boolean = true,
  actorType: 'foreign' | 'vietnamese' = 'foreign',
  onProgress?: (progress: number) => void,
  onItemComplete?: (results: BatchResultItem[]) => void
): Promise<BatchResultItem[]> => {
  // Validate input
  if (!transcripts || !Array.isArray(transcripts) || transcripts.length === 0) {
    throw new Error('No transcripts provided for batch processing');
  }

  const updatedResults = [...transcripts];
  
  for (let i = 0; i < updatedResults.length; i++) {
    const currentItem = updatedResults[i];
    if (!currentItem) continue;

    console.log(`Processing transcript ${i + 1}...`);
    
    if (currentItem.processed) continue;
    
    try {
      // Validate transcript
      if (!currentItem.transcript || currentItem.transcript.trim().length === 0) {
        throw new Error('Empty transcript');
      }

      const transcript = currentItem.transcript as string; // Type assertion since we validated it's not empty

      // Use the appropriate processing function based on actor type
      const result = actorType === 'vietnamese'
        ? await processVietnameseActorScript(
            transcript,
            (step: number, message: string, data?: any) => {
              console.log(`[Step ${step}] Transcript ${i + 1}: ${message}`);
              if (data && step !== 2) { // Skip logging the large script brief template
                if (typeof data.response === 'string') {
                  console.log(`[Step ${step}] Preview:`, data.response.substring(0, 100) + '...');
                }
              }
            }
          )
        : await processTranscript(
            transcript,
            useScriptTemplate,
            (step: number, message: string, data?: any) => {
              console.log(`[Step ${step}] Transcript ${i + 1}: ${message}`);
              if (data && step !== 2) { // Skip logging the large script brief template
                if (typeof data.response === 'string') {
                  console.log(`[Step ${step}] Preview:`, data.response.substring(0, 100) + '...');
                }
              }
            }
          );
      
      if (result.success) {
        currentItem.outline = result.outline;
        currentItem.firstSections = result.firstSections;
        currentItem.lastSections = result.lastSections;
        currentItem.processed = true;
      } else {
        throw new Error(result.error || 'Processing failed');
      }
      
      // Update progress
      const progress = Math.round(((i + 1) / updatedResults.length) * 100);
      if (onProgress) onProgress(progress);
      if (onItemComplete) onItemComplete([...updatedResults]);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Lỗi xử lý transcript ${i + 1}:`, error);
      currentItem.error = error instanceof Error ? error.message : String(error);
      currentItem.processed = false;
    }
  }
  
  return updatedResults;
};

/**
 * Convert markdown to plain text
 * @param markdown Markdown text to convert
 * @returns Plain text
 */
export const markdownToPlainText = (markdown: any): string => {
  if (!markdown) return '';
  
  // Remove headers (#)
  let text = String(markdown).replace(/#{1,6}\s?/g, '');
  
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
