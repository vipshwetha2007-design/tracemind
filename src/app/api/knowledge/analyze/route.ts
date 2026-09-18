/**
 * POST /api/knowledge/analyze
 *
 * Step 1 of the knowledge-ingestion flow: takes raw meeting notes text OR
 * an uploaded PDF/TXT file, extracts plain text, sends it to Gemini (via
 * src/lib/gemini.ts) for structured extraction, and returns that extraction
 * for a human to review. Nothing is written to the database here — see
 * POST /api/knowledge/save for that, once the user approves the review.
 *
 * Frontend caller: src/app/knowledge/add/page.tsx
 */

import { NextResponse } from "next/server";
import { AiServiceError, extractKnowledge } from "@/lib/gemini";

// Needs Node's Buffer/fs-adjacent APIs (for PDF parsing) and cannot run on
// the Edge runtime.
export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = [".pdf", ".txt"];
const MIN_CONTENT_LENGTH = 20;

function errorResponse(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return result.text.trim();
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Could not read the submitted form data.", 400);
  }

  const sourceType = formData.get("type");
  if (sourceType !== "Meeting" && sourceType !== "Document") {
    return errorResponse('"type" must be "Meeting" or "Document".', 400);
  }

  const titleField = formData.get("title");
  const title = typeof titleField === "string" ? titleField.trim() : "";
  if (!title) {
    return errorResponse("Please provide a title.", 400);
  }

  const dateField = formData.get("date");
  const date = typeof dateField === "string" && dateField ? dateField : new Date().toISOString();

  let content = "";
  let fileName: string | null = null;

  if (sourceType === "Meeting") {
    const contentField = formData.get("content");
    content = typeof contentField === "string" ? contentField.trim() : "";
  } else {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return errorResponse("Please attach a PDF or TXT file.", 400);
    }
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return errorResponse("Only PDF and TXT files are supported in this MVP.", 400);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return errorResponse("File is too large. The limit is 5MB.", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (extension === ".txt") {
      content = buffer.toString("utf-8").trim();
    } else {
      try {
        content = await extractPdfText(buffer);
      } catch {
        return errorResponse(
          "Could not extract text from this PDF. Text-based PDFs are supported; scanned documents require OCR and are outside the current MVP.",
          400
        );
      }
      if (!content) {
        return errorResponse(
          "No extractable text was found in this PDF. Text-based PDFs are supported; scanned documents require OCR and are outside the current MVP.",
          400
        );
      }
    }
    fileName = file.name;
  }

  if (content.length < MIN_CONTENT_LENGTH) {
    return errorResponse(
      "Please provide more content to analyze (at least a couple of sentences).",
      400
    );
  }

  try {
    const extraction = await extractKnowledge(content);
    return NextResponse.json({ title, type: sourceType, date, fileName, content, extraction });
  } catch (error) {
    if (error instanceof AiServiceError) {
      if (error.code === "missing_api_key") {
        return errorResponse(error.message, 503, error.code);
      }
      if (error.code === "request_failed") {
        return errorResponse(error.message, 502, error.code);
      }
      // invalid_output: Gemini responded but not with usable structured data.
      // Degrade gracefully — the user can still save the raw text as a
      // knowledge source without AI-detected decisions.
      return NextResponse.json({
        title,
        type: sourceType,
        date,
        fileName,
        content,
        extraction: null,
        warning:
          "The AI could not extract structured information from this content. You can still save it as a knowledge source.",
      });
    }
    return errorResponse("Something went wrong while analyzing this content.", 500);
  }
}
