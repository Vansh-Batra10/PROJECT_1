import Anthropic from "@anthropic-ai/sdk";
import { EXTRACTION_SYSTEM_PROMPT } from "./extraction-prompt";
import { extractionSchema, type Extraction } from "./extraction-schema";

// Single place to swap the model (or swap the whole provider, e.g. for AWS Bedrock).
export const EXTRACTION_MODEL = "claude-sonnet-4-5";

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
 * to Anthropic directly. Swap this implementation for Bedrock/another provider later
 * without touching callers.
 */
export class ExtractionService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const documentBlock = this.buildDocumentBlock(input);

    const message = await this.client.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: 8192,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            documentBlock,
            { type: "text", text: "Extract this document into the required JSON schema. Output only JSON." },
          ],
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const rawText = textBlock && textBlock.type === "text" ? textBlock.text : "";

    let parsed = this.tryParse(rawText);

    if (!parsed) {
      // One retry: tell the model its previous output was invalid JSON.
      const retry = await this.client.messages.create({
        model: EXTRACTION_MODEL,
        max_tokens: 8192,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [documentBlock, { type: "text", text: "Extract this document into the required JSON schema. Output only JSON." }],
          },
          { role: "assistant", content: rawText },
          {
            role: "user",
            content:
              "Your previous output was not valid JSON matching the schema. Return ONLY valid JSON, no prose, no markdown fences.",
          },
        ],
      });
      const retryText = retry.content.find((b) => b.type === "text");
      const retryRaw = retryText && retryText.type === "text" ? retryText.text : "";
      parsed = this.tryParse(retryRaw);
      if (!parsed) {
        throw new Error("Model did not return valid JSON after retry.");
      }
      return { parsed, raw: this.safeJson(retryRaw), modelName: EXTRACTION_MODEL };
    }

    return { parsed, raw: this.safeJson(rawText), modelName: EXTRACTION_MODEL };
  }

  private buildDocumentBlock(input: ExtractionInput): Anthropic.Messages.ContentBlockParam {
    const base64 = input.fileBuffer.toString("base64");
    if (input.mimeType === "application/pdf") {
      return {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      };
    }
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: input.mimeType as "image/png" | "image/jpeg" | "image/webp",
        data: base64,
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
