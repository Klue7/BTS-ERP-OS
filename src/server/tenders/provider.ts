import { GoogleGenAI } from '@google/genai';

export interface TenderDocumentAnalysisResult {
  provider: string;
  summary: string;
  status: 'Parsed' | 'Review Needed';
}

export interface TenderIntelligenceProvider {
  analyzeDocument(input: {
    fileName: string;
    mimeType: string;
    extractedText?: string;
    aiDirection?: string;
  }): Promise<TenderDocumentAnalysisResult>;
}

function normalize(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/\s+/g, ' ').slice(0, 4000);
}

function buildFallbackSummary(fileName: string, mimeType: string, extractedText: string, aiDirection?: string) {
  const direction = normalize(aiDirection);
  const excerpt = normalize(extractedText).slice(0, 180);
  if (excerpt) {
    return direction
      ? `Document scanned with deterministic extraction. Direction: ${direction}. Review the mapped lines and unresolved quantities before quoting.`
      : `Document scanned with deterministic extraction. ${excerpt.slice(0, 120)}${excerpt.length > 120 ? '…' : ''}`;
  }

  if (mimeType.startsWith('image/') || fileName.toLowerCase().includes('drawing')) {
    return direction
      ? `Architectural drawing uploaded. AI review direction captured: ${direction}. Visual quantity extraction still needs operator review.`
      : 'Architectural drawing uploaded. Visual review is required before quantities can be converted into a BOQ.';
  }

  return direction
    ? `Tender document stored. AI review direction captured: ${direction}. Manual BOQ extraction may still be required.`
    : 'Tender document stored. Automatic line extraction was limited, so manual review is required.';
}

class GoogleGenAiTenderProvider implements TenderIntelligenceProvider {
  private readonly apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  private readonly ai = this.apiKey ? new GoogleGenAI({ apiKey: this.apiKey }) : null;

  async analyzeDocument(input: {
    fileName: string;
    mimeType: string;
    extractedText?: string;
    aiDirection?: string;
  }): Promise<TenderDocumentAnalysisResult> {
    const extractedText = normalize(input.extractedText);
    const aiDirection = normalize(input.aiDirection);

    if (!this.ai || !extractedText) {
      return {
        provider: this.ai ? 'Google GenAI fallback to deterministic extraction' : 'Deterministic tender analysis fallback',
        summary: buildFallbackSummary(input.fileName, input.mimeType, extractedText, aiDirection),
        status: extractedText ? 'Parsed' : 'Review Needed',
      };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          'You are a tender intake assistant for a South African brick and cladding business.',
          `File: ${input.fileName}`,
          `Mime type: ${input.mimeType}`,
          aiDirection ? `Operator direction: ${aiDirection}` : '',
          `Extracted content:\n${extractedText.slice(0, 5000)}`,
          'Summarize what this document appears to be, whether it looks like a BOQ/RFQ/drawing/spec, and whether operator review is still required. Keep it under 80 words.',
        ].filter(Boolean).join('\n\n'),
      });

      const summary = normalize(response.text) || buildFallbackSummary(input.fileName, input.mimeType, extractedText, aiDirection);
      return {
        provider: 'Google GenAI',
        summary,
        status: summary.toLowerCase().includes('review') ? 'Review Needed' : 'Parsed',
      };
    } catch {
      return {
        provider: 'Deterministic tender analysis fallback',
        summary: buildFallbackSummary(input.fileName, input.mimeType, extractedText, aiDirection),
        status: extractedText ? 'Parsed' : 'Review Needed',
      };
    }
  }
}

export function getTenderIntelligenceProvider(): TenderIntelligenceProvider {
  return new GoogleGenAiTenderProvider();
}
