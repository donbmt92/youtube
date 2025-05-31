import { Document, Packer, Paragraph, TextRun } from 'docx';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();

    if (!data) {
      return NextResponse.json(
        { error: "Data is required" },
        { status: 400 }
      );
    }

    // Create a new document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Generated Data Report",
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: new Date().toLocaleString(),
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: JSON.stringify(data, null, 2),
                size: 24,
              }),
            ],
          }),
        ],
      }],
    });

    // Generate the document as a buffer
    const buffer = await Packer.toBuffer(doc);

    // Return the document as a downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="generated-report.docx"',
      },
    });
  } catch (error) {
    console.error("Error creating DOCX:", error);
    return NextResponse.json(
      { error: "Failed to create DOCX file" },
      { status: 500 }
    );
  }
} 