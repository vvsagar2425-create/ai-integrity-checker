import { NextResponse } from "next/server";
import { findCitationIssues } from "@/lib/citations";
import { analyzeTextForAI } from "@/lib/aiFeatures";

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const wordCount = text.trim().split(/\s+/).length;

  const { aiSentenceSignals, aiModel } = analyzeTextForAI(text, 0.35);

  const result = {
    overall: {
      originalityRisk: wordCount > 150 ? "medium" : "low",
      citationQuality: wordCount > 150 ? "medium" : "high",
      aiLikelihood:
        aiModel.overallAiScore > 0.68
          ? "high"
          : aiModel.overallAiScore > 0.52
          ? "medium"
          : "low",
    },
    plagiarism: [],
    citations: findCitationIssues(text),
    aiSignals: [
      {
        name: "ai_model_score",
        value: aiModel.overallAiScore,
        explanation:
          "Pattern-based score using repetition, vocabulary diversity, sentence uniformity, and generic phrasing. Not proof.",
      },
    ],
    aiSentenceSignals,
    aiModel,
  };

  return NextResponse.json(result);
}
