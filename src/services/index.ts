export * from './transcriptService';
export * from './batchService';
export * from './fileService';

export const formatMarkdownForCopy = (outline: string, firstSections: string, lastSections: string) => {
  return `ĐỀ CƯƠNG KỊCH BẢN:

${outline}


KỊCH BẢN ĐẦY ĐỦ:

${firstSections}

${lastSections}`;
};

export const exportToDocx = async (content: string, filename: string) => {
  try {
    const response = await fetch('/api/create-docx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: content }),
    });

    if (!response.ok) {
      throw new Error('Failed to create DOCX file');
    }

    // Get the blob from the response
    const blob = await response.blob();
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to DOCX:', error);
    alert('Không thể tạo file DOCX. Vui lòng thử lại sau.');
  }
};
