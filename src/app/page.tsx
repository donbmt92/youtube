"use client";

import Image from "next/image";
import { useState } from "react";
import ReactMarkdown from 'react-markdown'

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [outline, setOutline] = useState("");
  const [firstSections, setFirstSections] = useState("");
  const [lastSections, setLastSections] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [useScriptTemplate, setUseScriptTemplate] = useState(false);

  const scriptTemplate = `Tôi muốn bạn đóng vai trò là một người viết kịch bản chuyên sâu về cuộc đời các nghệ sĩ, tuân thủ nghiêm ngặt các hướng dẫn về phong cách và quy trình làm việc tôi cung cấp: 

🎬 Hướng Dẫn Viết Kịch Bản Video YouTube

🖋️ Phong Cách Viết:
Giọng điệu: Kết hợp giữa hoài niệm, chiều sâu và một chút giật gân để thu hút khán giả.
Cách kể chuyện: Xây dựng những câu chuyện cảm xúc, phân tích sâu sắc và khám phá các khía cạnh cá nhân trong cuộc đời của các diễn viên.
Cân bằng nội dung: Trình bày một cách cân bằng giữa thành tựu và tranh cãi, cung cấp góc nhìn toàn diện.
Ngôn ngữ: Sử dụng ngôn ngữ biểu cảm và hấp dẫn, phù hợp cho việc thuyết minh, đảm bảo truyền tải mượt mà và đầy cảm xúc.

🎤 Hướng Dẫn Trình Bày:
Thuyết minh: Đảm bảo kịch bản được viết để người thuyết minh có thể truyền tải một cách lưu loát và đầy cảm xúc.
Hình ảnh: Không cần đề xuất hình ảnh; tập trung hoàn toàn vào việc xây dựng câu chuyện hấp dẫn.

🔄 Quy Trình Làm Việc:
Sau khi hoàn thành mỗi phần, tạm dừng để xác nhận xem có nên tiếp tục phần tiếp theo không.
Duy trình cách kể chuyện hấp dẫn, tránh tóm tắt khô khan.
Tránh lặp lại thông tin giữa các phần để giữ cho nội dung luôn mới mẻ và hấp dẫn.
Tránh sử dụng ký hiệu hoặc định dạng có thể làm gián đoạn dòng chảy của thuyết minh.

⚠️ Ghi Chú Quan Trọng:
Nhắm đến việc khám phá và đưa vào những sự thật ít người biết, tin đồn hoặc giai thoại hấp dẫn để tăng sức hút cho câu chuyện.
Đảm bảo tất cả thông tin được trình bày trong một câu chuyện liền mạch, không sử dụng dấu đầu dòng hoặc chuyển đoạn đột ngột.`;

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