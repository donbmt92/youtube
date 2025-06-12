/**
 * Transcript Processing Service
 * Handles the core logic for processing transcripts and generating scripts
 */

import { sendPromptWithHistory } from "./geminiService";

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

    const outlineData = await sendPromptWithHistory(
      outlinePrompt,
      conversationId
    );
    log(1, "Completed: Outline created.", outlineData);

    // Step 2: Use the YouTube Video Script Brief prompt
    log(2, "Processing: Applying YouTube Script Brief template...");
    const scriptBriefPrompt = `This is the prompt I need you to learn to write, learn the prompt and confirm to me what you have learned.\n\n\n\n🎬 YouTube Video Script Brief: Exploring the Lives of Deceased Actors\n\n\n\nChannel Theme:\n\nDelve into the captivating stories of deceased actors, highlighting their cinematic achievements, personal lives, controversies, and enduring legacies.\n\n\n\n🖋️ Writing Style:\n\nTone: Blend nostalgia with depth and a touch of sensationalism to captivate the audience.\n\n\n\nNarrative Approach: Craft emotionally resonant stories that offer in-depth analyses and explore the personal facets of the actors' lives.\n\n\n\nContent Balance: Present a balanced view by discussing both their accomplishments and controversies, providing a comprehensive perspective.\n\n\n\nLanguage: Use expressive and engaging language suitable for voice narration, ensuring smooth and emotive delivery.​\n\n\n\n📚 Content Structure:\n\nIntroduction (500–700 words):\n\n\n\nIntroduce the film and its significance in cinematic history.\n\n\n\nTease intriguing and possibly controversial stories related to the film and its main cast.\n\n\n\nPose a compelling question to pique interest, such as, "Where are these actors now?"\n\n\n\nEncourage viewers to subscribe for more in-depth stories.​\n\n\n\nActor Profiles (300–400 words each):\n\n\n\nBiography: Detail the actor's birthdate, family background, and early life circumstances.\n\n\n\nCareer Beginnings: Discuss how they entered the film industry and their journey to the featured film.\n\n\n\nRole in the Film: Analyze their performance, critical reception, and impact on their career.\n\n\n\nPost-Film Trajectory: Explore subsequent career developments, including successes, shifts, or declines.\n\n\n\nPersonal Life: Delve into their private life, including relationships, conflicts, and lesser-known facts.\n\n\n\nLegacy and Death: Provide details on their passing, age at death, cause, and how they are remembered today.​\n\n\n\nConclusion (300–500 words):\n\n\n\nSummarize the film's impact and the enduring legacy of its cast.\n\n\n\nReflect on who achieved lasting fame, who faded into obscurity, and who left the industry.\n\n\n\nInvite viewers to subscribe for more captivating stories.​\n\n\n\n🎤 Presentation Guidelines:\n\nNarration: Ensure the script is written for fluent and emotional delivery by the narrator.\n\n\n\nVisuals: No need to suggest visuals; focus solely on crafting a compelling narrative.​\n\n\n\n🔄 Workflow:\n\nAfter completing each section, pause to confirm if you should proceed to the next.\n\n\n\nMaintain an engaging storytelling style, avoiding dry summaries.\n\n\n\nAvoid repetitive information across sections to keep the content fresh and engaging.\n\n\n\nRefrain from using symbols or formatting that may disrupt the flow of narration.​\n\n\n\n⚠️ Important Notes:\n\nAim to uncover and include lesser-known facts, rumors, or intriguing anecdotes to enhance the story's appeal.\n\n\n\nEnsure all information is presented in a seamless narrative without bullet points or abrupt transitions.\n\n\n\nAvoid bolding titles within the script, except for main section headings.`;

    const scriptBriefData = await sendPromptWithHistory(
      scriptBriefPrompt,
      conversationId
    );
    log(
      2,
      "Completed: YouTube Script Brief template applied.",
      scriptBriefData
    );
    if (scriptBriefData.response) {
      log(2, `Preview: ${scriptBriefData.response.substring(0, 100)}...`);
    }

    // Step 3: Request a new outline focused on characters
    log(3, "Processing: Creating character-focused outline...");
    const characterOutlinePrompt = `Based on the previous outline and this script brief:

${scriptBriefData.response}

And this outline:

${outlineData.response}

Please generate a **new outline** that focuses on **15 to 18 main characters (actors)** from the original list.

For each character, I want a **dedicated section of approximately 350 words** — **please keep this length consistent for every individual character**.

The total article should be around **6000-7000 words** (350 words for each character).

Please format the outline with clear numbering like this:
1. Introduction (500 words)
2. [Actor Name 1] (350 words)
3. [Actor Name 2] (350 words)
...and so on for all characters
[N]. Conclusion (500 words)

IMPORTANT REQUIREMENTS:
- Only include actual actors from the original list - NO placeholder sections
- Each numbered section must be a real actor with their actual name
- Do not include any sections marked as "Add another actor" or similar placeholders
- The total number of sections should be exactly: 1 (Introduction) + number of actual actors + 1 (Conclusion)

Also, include:
- An introduction of around **500 words**
- A conclusion of around **500 words**

Once the entire outline (introduction + 10–12 actual actors + conclusion) is complete, please **stop** and **notify me** — **do not proceed to write the full content yet**.
`;

    const characterOutlineData = await sendPromptWithHistory(
      characterOutlinePrompt,
      conversationId
    );
    log(
      3,
      "Completed: Character-focused outline created.",
      characterOutlineData
    );

    // Step 4: Get the number of parts
    log(4, "Processing: Counting number of parts...");
    const countPartsPrompt = `Given this character outline:\n\n${characterOutlineData.response}\n\nCount how many main parts it contains. A valid part is either:\n- Introduction\n- Conclusion\n- One section per actor (if present)\n\nReturn ONLY the total number of parts as a number. Do not include any notes, formatting, or extra characters. Example of correct output: 5`;

    console.log("countPartsPrompt", countPartsPrompt);

    const countPartsData = await sendPromptWithHistory(
      countPartsPrompt,
      conversationId
    );
    const totalParts = parseInt(countPartsData.response.trim()) || 0;
    log(4, `Completed: Found ${totalParts} parts to generate.`, countPartsData);

    // Step 5: Get the first part
    log(5, `Processing: Generating first part of ${totalParts}...`);
    const firstPartPrompt = `Based on this character-focused outline:\n\n${characterOutlineData.response}\n\nThere are ${totalParts} parts to write. Please write the first part now (which should be the Introduction section from the outline). Start by clearly identifying which section of the outline you are writing, then write that section fully. Strictly follow the structure and content of the character outline. Make it detailed and engaging, following the script brief guidelines and word count suggestions from the outline.\n\nIMPORTANT: Write ONLY the narrator's dialogue. DO NOT include any scene descriptions, camera directions, transitions (like 'Open on...' or 'Transition to...'), or technical notes. Do not include any text in parentheses describing visuals or actions. Write the script as pure narration that can be read directly by a voice actor without any production notes.`;

    const firstPartData = await sendPromptWithHistory(
      firstPartPrompt,
      conversationId
    );
    log(5, "Completed: First part generated.", firstPartData);
    let allParts = firstPartData.response;
    let currentPart = 1;

    // Store the character outline for reference in each part generation
    // to avoid sending it repeatedly
    const outlineReference = characterOutlineData.response;

    // Step 6: Get remaining parts - OPTIMIZED to reduce memory usage
    while (currentPart < totalParts) {
      log(
        6,
        `Processing: Generating part ${currentPart + 1} of ${totalParts}...`
      );

      // Create a more targeted prompt that references the outline but doesn't include all previous content
      const nextPartPrompt = `I need you to write part ${
        currentPart + 1
      } of ${totalParts} based on this character-focused outline:

${outlineReference}

You are writing part ${
        currentPart + 1
      }, which should be the next section in the outline after the previous parts.

Start by clearly identifying which **specific section or character** from the outline you are writing now, then write that section **fully and completely**.

⚠️ IMPORTANT INSTRUCTIONS:
- Follow the **word count guidance** from the outline. For example, if a section is suggested to be ~350 words, then your writing must be **within ±10%** of that (315–385 words). 
- **Maintain the narrative voice and tone** established in the script brief.
- Write **ONLY** the narrator's dialogue. 
  - ❌ DO NOT include scene descriptions, camera directions, transitions, or any technical script formatting.
  - ✅ Write as **pure narration**, suitable to be read out loud directly by a voice actor.
`;

      // Skip saving this exchange to history to conserve memory
      const nextPartData = await sendPromptWithHistory(
        nextPartPrompt,
        conversationId,
        false
      );
      log(
        6,
        `Completed part ${currentPart + 1} of ${totalParts}.`,
        nextPartData
      );

      // Append to all parts content
      allParts += "\n\n" + nextPartData.response;
      currentPart++;

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    // Step 7: Split content into sections
    log(7, "Processing: Splitting content into sections...");
    const allPartsArray = allParts.split("\n\n");
    const midPoint = Math.floor(allPartsArray.length / 2);

    const firstSectionsContent = allPartsArray.slice(0, midPoint).join("\n\n");
    const lastSectionsContent = allPartsArray.slice(midPoint).join("\n\n");

    log(7, `First sections length: ${firstSectionsContent.length} characters`);
    log(7, `Last sections length: ${lastSectionsContent.length} characters`);
    log(
      7,
      `Total content length: ${
        firstSectionsContent.length + lastSectionsContent.length
      } characters`
    );
    log(7, "Completed: Content split into first and last sections.");

    return {
      success: true,
      outline: characterOutlineData.response,
      firstSections: firstSectionsContent,
      lastSections: lastSectionsContent,
    };
  } catch (error) {
    console.error("Error processing transcript:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Process a transcript to generate a Vietnamese actor script
 * @param transcriptText The transcript text to process
 * @param logger Optional logger function for detailed logging
 * @returns Processing result with outline and sections
 */
export const processVietnameseActorScript = async (
  transcriptText: string,
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
    const conversationId = `vietnamese_actor_${Date.now()}`;

    // Step 1: Process outline - read carefully and create outline
    log(1, "Processing: Creating outline...");
    const outlinePrompt = `${transcriptText}

Tôi muốn bạn đóng vai trò là một người viết kịch bản chuyên sâu về cuộc đời các nghệ sĩ, tuân thủ nghiêm ngặt các hướng dẫn về phong cách và quy trình làm việc tôi cung cấp:

🎬 Hướng Dẫn Viết Kịch Bản Video YouTube

🖋️ Phong Cách Viết:
- Giọng điệu: Kết hợp giữa hoài niệm, chiều sâu và một chút giật gân để thu hút khán giả
- Cách kể chuyện: Xây dựng những câu chuyện cảm xúc, phân tích sâu sắc và khám phá các khía cạnh cá nhân
- Cân bằng nội dung: Trình bày một cách cân bằng giữa thành tựu và tranh cãi
- Ngôn ngữ: Sử dụng ngôn ngữ biểu cảm và hấp dẫn, phù hợp cho việc thuyết minh

🎤 Hướng Dẫn Trình Bày:
- Thuyết minh: Đảm bảo kịch bản được viết để người thuyết minh có thể truyền tải một cách lưu loát và đầy cảm xúc
- Hình ảnh: Không cần đề xuất hình ảnh; tập trung hoàn toàn vào việc xây dựng câu chuyện hấp dẫn

🔄 Quy Trình Làm Việc:
- Sau khi hoàn thành mỗi phần, tạm dừng để xác nhận xem có nên tiếp tục phần tiếp theo không
- Duy trì phong cách kể chuyện hấp dẫn, tránh tóm tắt khô khan
- Tránh lặp lại thông tin giữa các phần để giữ cho nội dung luôn mới mẻ và hấp dẫn
- Tránh sử dụng ký hiệu hoặc định dạng có thể làm gián đoạn dòng chảy của thuyết minh

⚠️ Ghi Chú Quan Trọng:
- Nhắm đến việc khám phá và đưa vào những sự thật ít người biết, tin đồn hoặc giai thoại hấp dẫn
- Đảm bảo tất cả thông tin được trình bày trong một câu chuyện liền mạch, không sử dụng dấu đầu dòng hoặc chuyển đoạn đột ngột

Hãy tạo một đề cương chi tiết với 8 phần cho kịch bản này, mỗi phần PHẢI đạt chính xác 750 từ (tổng cộng 6000 từ). Các phần phải được đánh số rõ ràng từ 1 đến 8 và mỗi phần phải có tiêu đề cụ thể.`;

    const outlineData = await sendPromptWithHistory(
      outlinePrompt,
      conversationId
    );
    log(1, "Completed: Outline created.", outlineData);

    // Step 2: Generate each part one by one
    let allParts = "";
    let previousParts = "";

    for (let partNumber = 1; partNumber <= 8; partNumber++) {
      log(2, `Processing: Generating part ${partNumber} of 8...`);

      const partPrompt = `Dựa vào transcript, đề cương và các phần trước đó sau:

${outlineData.response}

${previousParts}

Hãy viết chi tiết phần ${partNumber} của kịch bản. 

⚠️ YÊU CẦU BẮT BUỘC VỀ SỐ TỪ:
- Phần này PHẢI đạt chính xác 750 từ
- Không được ít hơn hoặc nhiều hơn 750 từ

Viết bằng tiếng Việt, không sử dụng ký tự đặc biệt, không đánh số, không đánh dấu đầu dòng. Viết liền mạch như một câu chuyện. Đảm bảo phần này có tiêu đề rõ ràng và nội dung phù hợp với đề cương.

Sau khi viết xong, hãy đếm và xác nhận số từ của phần này.`;

      const partData = await sendPromptWithHistory(partPrompt, conversationId);
      log(2, `Completed: Part ${partNumber} generated.`, partData);

      // Add the new part to our collection
      allParts += (allParts ? "\n\n" : "") + partData.response;
      previousParts = allParts;

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    // Split the content into two sections for the return value
    const allPartsArray = allParts.split("\n\n");
    const midPoint = Math.floor(allPartsArray.length / 2);

    const firstSectionsContent = allPartsArray.slice(0, midPoint).join("\n\n");
    const lastSectionsContent = allPartsArray.slice(midPoint).join("\n\n");

    return {
      success: true,
      outline: outlineData.response,
      firstSections: firstSectionsContent,
      lastSections: lastSectionsContent,
    };
  } catch (error) {
    console.error("Error processing Vietnamese actor script:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
