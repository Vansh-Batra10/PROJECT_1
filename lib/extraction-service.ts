import { GoogleGenAI } from "@google/genai";
import { EXTRACTION_SYSTEM_PROMPT } from "./extraction-prompt";
import { extractionSchema, type Extraction } from "./extraction-schema";

// Single place to swap the model.
export const EXTRACTION_MODEL = "gemini-2.5-flash";

export interface ExtractionResult {
  parsed: Extraction;
  raw: unknown;
  modelName: string;
}

export interface ExtractionInput {
  fileBuffer: Buffer;
  mimeType: string; // application/pdf | image/png | image/jpeg | image/webp
}

function stripCodeFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

/**
 * ExtractionService abstracts the LLM provider so the rest of the app never talks
 * to Gemini directly. Swap this implementation for another provider later without
 * touching callers.
 */
export class ExtractionService {
  private client: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set.");
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const documentPart = this.buildDocumentPart(input);
    const instructionPart = { text: "Extract this document into the required JSON schema. Output only JSON." };

    const rawText = await this.generate([{ role: "user", parts: [documentPart, instructionPart] }]);
    let parsed = this.tryParse(rawText);

    if (!parsed) {
      // One retry: tell the model its previous output was invalid JSON.
      const retryText = await this.generate([
        { role: "user", parts: [documentPart, instructionPart] },
        { role: "model", parts: [{ text: rawText }] },
        {
          role: "user",
          parts: [
            {
              text: "Your previous output was not valid JSON matching the schema. Return ONLY valid JSON, no prose, no markdown fences.",
            },
          ],
        },
      ]);
      parsed = this.tryParse(retryText);
      if (!parsed) {
        throw new Error("Model did not return valid JSON after retry.");
      }
      return { parsed, raw: this.safeJson(retryText), modelName: EXTRACTION_MODEL };
    }

    return { parsed, raw: this.safeJson(rawText), modelName: EXTRACTION_MODEL };
  }

  private async generate(contents: Array<{ role: string; parts: Array<Record<string, unknown>> }>): Promise<string> {
    const response = await this.client.models.generateContent({
      model: EXTRACTION_MODEL,
      contents,
      config: {
        systemInstruction: EXTRACTION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });
    return response.text ?? "";
  }

  private buildDocumentPart(input: ExtractionInput): Record<string, unknown> {
    return {
      inlineData: {
        mimeType: input.mimeType,
        data: input.fileBuffer.toString("base64"),
      },
    };
  }

  private tryParse(text: string) {
    const json = this.safeJson(text);
    if (json === undefined) return null;
    const result = extractionSchema.safeParse(json);
    return result.success ? result.data : null;
  }

  private safeJson(text: string): unknown {
    try {
      return JSON.parse(stripCodeFence(text));
    } catch {
      return undefined;
    }
  }
}
