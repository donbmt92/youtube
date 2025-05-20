import Image from "next/image";

export const Footer = () => {
  return (
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
  );
};
