import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Initialize the Gemini API with the correct model name
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Get the generative model with the correct model name
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      }
    });

    // Generate content
    const result = await model.generateContent(prompt);
    
    if (!result.response) {
      throw new Error("No response received from Gemini API");
    }
    
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json(
      { error: "Failed to process with Gemini API" },
      { status: 500 }
    );
  }
}