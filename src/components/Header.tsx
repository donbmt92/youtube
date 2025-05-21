import Image from "next/image";

export const Header = () => {
  return (
    <div className="text-center mb-8">
      <Image
        className="dark:invert mx-auto mb-4"
        src="/next.svg"
        alt="Next.js logo"
        width={180}
        height={38}
        priority
      />
      <h1 className="text-3xl font-bold mb-2">Tạo Kịch Bản Từ Transcript YouTube</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Chuyên tạo kịch bản về diễn viên đã mất | Được hỗ trợ bời Google Gemini API
      </p>
    </div>
  );
};
