/**
 * Transcript Processing Service
 * Handles the core logic for processing transcripts and generating scripts
 */

import { sendPromptWithHistory } from './geminiService';

interface ProcessingResult {
  success: boolean;
  outline?: string;
  firstSections?: string;
  lastSections?: string;
  error?: string;
}

/**
 * Process a transcript to generate a script
 * @param transcriptText The transcript text to process
 * @param useScriptTemplate Whether to use the script template
 * @param logger Optional logger function for detailed logging
 * @returns Processing result with outline and sections
 */
export const processTranscript = async (
  transcriptText: string,
  useScriptTemplate: boolean = true,
  logger?: (step: number, message: string, data?: any) => void
): Promise<ProcessingResult> => {
  try {
    // Helper function for logging
    const log = (step: number, message: string, data?: any) => {
      console.log(`[Step ${step}] ${message}`);
      if (data) console.log(`[Step ${step}] Data:`, data);
      if (logger) logger(step, message, data);
    };

    // Create a unique conversation ID for this transcript processing session
    const conversationId = `transcript_${Date.now()}`;
    
    // Step 1: Process outline - read carefully and create outline
    log(1, "Processing: Creating outline...");
    const outlinePrompt = `${transcriptText}\n\nRead carefully and give me the outline of the script.`;
    
    const outlineData = await sendPromptWithHistory(outlinePrompt, conversationId);
    log(1, "Completed: Outline created.", outlineData);
    
    // Step 2: Use the YouTube Video Script Brief prompt
    log(2, "Processing: Applying YouTube Script Brief template...");
    const scriptBriefPrompt = `This is the prompt I need you to learn to write, learn the prompt and confirm to me what you have learned.\n\n\n\n🎬 YouTube Video Script Brief: Exploring the Lives of Deceased Actors\n\n\n\nChannel Theme:\n\nDelve into the captivating stories of deceased actors, highlighting their cinematic achievements, personal lives, controversies, and enduring legacies.\n\n\n\n🖋️ Writing Style:\n\nTone: Blend nostalgia with depth and a touch of sensationalism to captivate the audience.\n\n\n\nNarrative Approach: Craft emotionally resonant stories that offer in-depth analyses and explore the personal facets of the actors' lives.\n\n\n\nContent Balance: Present a balanced view by discussing both their accomplishments and controversies, providing a comprehensive perspective.\n\n\n\nLanguage: Use expressive and engaging language suitable for voice narration, ensuring smooth and emotive delivery.​\n\n\n\n📚 Content Structure:\n\nIntroduction (500–700 words):\n\n\n\nIntroduce the film and its significance in cinematic history.\n\n\n\nTease intriguing and possibly controversial stories related to the film and its main cast.\n\n\n\nPose a compelling question to pique interest, such as, "Where are these actors now?"\n\n\n\nEncourage viewers to subscribe for more in-depth stories.​\n\n\n\nActor Profiles (300–400 words each):\n\n\n\nBiography: Detail the actor's birthdate, family background, and early life circumstances.\n\n\n\nCareer Beginnings: Discuss how they entered the film industry and their journey to the featured film.\n\n\n\nRole in the Film: Analyze their performance, critical reception, and impact on their career.\n\n\n\nPost-Film Trajectory: Explore subsequent career developments, including successes, shifts, or declines.\n\n\n\nPersonal Life: Delve into their private life, including relationships, conflicts, and lesser-known facts.\n\n\n\nLegacy and Death: Provide details on their passing, age at death, cause, and how they are remembered today.​\n\n\n\nConclusion (300–500 words):\n\n\n\nSummarize the film's impact and the enduring legacy of its cast.\n\n\n\nReflect on who achieved lasting fame, who faded into obscurity, and who left the industry.\n\n\n\nInvite viewers to subscribe for more captivating stories.​\n\n\n\n🎤 Presentation Guidelines:\n\nNarration: Ensure the script is written for fluent and emotional delivery by the narrator.\n\n\n\nVisuals: No need to suggest visuals; focus solely on crafting a compelling narrative.​\n\n\n\n🔄 Workflow:\n\nAfter completing each section, pause to confirm if you should proceed to the next.\n\n\n\nMaintain an engaging storytelling style, avoiding dry summaries.\n\n\n\nAvoid repetitive information across sections to keep the content fresh and engaging.\n\n\n\nRefrain from using symbols or formatting that may disrupt the flow of narration.​\n\n\n\n⚠️ Important Notes:\n\nAim to uncover and include lesser-known facts, rumors, or intriguing anecdotes to enhance the story's appeal.\n\n\n\nEnsure all information is presented in a seamless narrative without bullet points or abrupt transitions.\n\n\n\nAvoid bolding titles within the script, except for main section headings.`;
    
    const scriptBriefData = await sendPromptWithHistory(scriptBriefPrompt, conversationId);
    log(2, "Completed: YouTube Script Brief template applied.", scriptBriefData);
    if (scriptBriefData.response) {
      log(2, `Preview: ${scriptBriefData.response.substring(0, 100)}...`);
    }
    
    // Step 3: Request a new outline focused on characters
    log(3, "Processing: Creating character-focused outline...");
    const characterOutlinePrompt = `Based on the previous outline and this script brief:\n\n${scriptBriefData.response} and this outline:\n\n${outlineData.response}\n\n Please recommend me a new outline in which each section focuses on one character (actor) from the original list. I want the final article to be around 6000 words in total, with word count suggestions for each character's section. Also, please include an introduction and conclusion, and tell me how many total sections there are (including intro and conclusion). After finishing all the sections, please notify me and do not continue writing beyond the outline.`;
    
    const characterOutlineData = await sendPromptWithHistory(characterOutlinePrompt, conversationId);
    log(3, "Completed: Character-focused outline created.", characterOutlineData);
    
    // Step 4: Get the number of parts
    log(4, "Processing: Counting number of parts...");
    const countPartsPrompt = `Based on this outline:\n\n${characterOutlineData.response}\n\nHow many parts do we have? Just give me the number, no note, no special characters. Example - correct: 7, incorrect: **7**`;
    
    const countPartsData = await sendPromptWithHistory(countPartsPrompt, conversationId);
    const totalParts = parseInt(countPartsData.response.trim()) || 0;
    log(4, `Completed: Found ${totalParts} parts to generate.`, countPartsData);
    
    // Step 5: Get the first part
    log(5, `Processing: Generating first part of ${totalParts}...`);
    const firstPartPrompt = `Based on this character-focused outline:\n\n${characterOutlineData.response}\n\nThere are ${totalParts} parts to write. Please write the first part now (which should be the Introduction section from the outline). Start by clearly identifying which section of the outline you are writing, then write that section fully. Strictly follow the structure and content of the character outline. Make it detailed and engaging, following the script brief guidelines and word count suggestions from the outline.\n\nIMPORTANT: Write ONLY the narrator's dialogue. DO NOT include any scene descriptions, camera directions, transitions (like 'Open on...' or 'Transition to...'), or technical notes. Do not include any text in parentheses describing visuals or actions. Write the script as pure narration that can be read directly by a voice actor without any production notes.`;
    
    const firstPartData = await sendPromptWithHistory(firstPartPrompt, conversationId);
    log(5, "Completed: First part generated.", firstPartData);
    let allParts = firstPartData.response;
    let currentPart = 1;
    
    // Step 6: Get remaining parts
    while (currentPart < totalParts) {
      log(6, `Processing: Generating part ${currentPart + 1} of ${totalParts}...`);
      const nextPartPrompt = `Based on this character-focused outline:\n\n${characterOutlineData.response}\n\nAnd the previous content I've written so far:\n\n${allParts}\n\nPlease continue and write part ${currentPart + 1} of ${totalParts}. You must identify which specific section from the character outline you are writing now (it should be the next section in sequence after what has already been written). Start by clearly stating which section you're writing, then write that complete section. Strictly follow the structure and content from the character outline. Make sure it follows the word count suggestions from the outline and maintains the same style and quality as the previous parts.\n\nIMPORTANT: Write ONLY the narrator's dialogue. DO NOT include any scene descriptions, camera directions, transitions (like 'Open on...' or 'Transition to...'), or technical notes. Do not include any text in parentheses describing visuals or actions. Write the script as pure narration that can be read directly by a voice actor without any production notes. Remove any 'Narrator:' labels at the beginning of paragraphs.`;
      
      const nextPartData = await sendPromptWithHistory(nextPartPrompt, conversationId);
      log(6, `Completed part ${currentPart + 1} of ${totalParts}.`, nextPartData);
      
      // Append to all parts content
      allParts += "\n\n" + nextPartData.response;
      currentPart++;
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
    
    // Step 7: Split content into sections
    log(7, "Processing: Splitting content into sections...");
    const allPartsArray = allParts.split("\n\n");
    const midPoint = Math.floor(allPartsArray.length / 2);
    
    const firstSectionsContent = allPartsArray.slice(0, midPoint).join("\n\n");
    const lastSectionsContent = allPartsArray.slice(midPoint).join("\n\n");
    
    log(7, `First sections length: ${firstSectionsContent.length} characters`);
    log(7, `Last sections length: ${lastSectionsContent.length} characters`);
    log(7, `Total content length: ${firstSectionsContent.length + lastSectionsContent.length} characters`);
    log(7, "Completed: Content split into first and last sections.");
    
    return {
      success: true,
      outline: characterOutlineData.response,
      firstSections: firstSectionsContent,
      lastSections: lastSectionsContent
    };
  } catch (error) {
    console.error("Error processing transcript:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
