export type AISentenceSignal = {
  sentence: string;
  start: number;
  end: number;
  score: number; // 0..1
  reasons: string[];
};

export type AIFeatureVector = {
  avgRepetition: number;       // 0..1
  avgVocabDiversity: number;   // 0..1 (higher = more diverse)
  genericRate: number;         // 0..1 (fraction sentences with generic phrases)
  transitionRate: number;      // 0..1
  uniformity: number;          // 0..1 (how similar lengths are)
};

export type AIModelOutput = {
  overallAiScore: number; // 0..1
  threshold: number;
  avgSentenceLength: number;
  sentenceCount: number;
  features: AIFeatureVector;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function splitSentencesWithOffsets(text: string) {
  const regex = /[^.!?]+[.!?]+|\s*[^.!?]+$/g;
  const out: { sentence: string; start: number; end: number }[] = [];
  const matches = text.matchAll(regex);

  for (const m of matches) {
    const raw = m[0];
    const start = m.index ?? 0;
    const end = start + raw.length;
    const sentence = raw.trim();
    if (sentence.length) out.push({ sentence, start, end });
  }
  return out;
}

function words(s: string) {
  return s.toLowerCase().split(/[^a-z0-9']+/i).filter(Boolean);
}

function repetition(sentence: string) {
  const w = words(sentence);
  const uniq = new Set(w);
  return 1 - uniq.size / Math.max(w.length, 1);
}

function vocabDiversity(sentence: string) {
  const w = words(sentence);
  const uniq = new Set(w);
  return uniq.size / Math.max(w.length, 1);
}

function hasGenericPhrases(sentence: string) {
  const s = sentence.toLowerCase();
  const phrases = [
    "in today's world",
    "it is important to note",
    "this shows that",
    "overall",
    "in conclusion",
    "a wide range of",
    "plays a crucial role",
    "significantly",
    "various",
    "moreover",
    "furthermore",
  ];
  return phrases.some((p) => s.includes(p));
}

function transitionDensity(sentence: string) {
  const s = sentence.toLowerCase();
  const transitions = ["moreover","furthermore","additionally","therefore","however","overall"];
  let count = 0;
  for (const t of transitions) if (s.includes(t)) count++;
  return Math.min(count / 2, 1);
}

function aiSentenceScore(sentence: string, avgLen: number) {
  const len = sentence.length;
  const rep = repetition(sentence);
  const vdiv = vocabDiversity(sentence);
  const generic = hasGenericPhrases(sentence) ? 1 : 0;
  const trans = transitionDensity(sentence);

  const lenNorm = clamp01(Math.abs(len - avgLen) / Math.max(avgLen, 1));
  const uniformLenSignal = 1 - lenNorm;

  const raw =
    1.25 * rep +
    1.10 * (1 - vdiv) +
    0.80 * uniformLenSignal +
    0.90 * generic +
    0.70 * trans;

  const score = clamp01(raw / 4.5);

  const reasons: string[] = [];
  if (rep > 0.35) reasons.push("Repetitive word patterns");
  if (vdiv < 0.55) reasons.push("Low vocabulary diversity");
  if (uniformLenSignal > 0.8) reasons.push("Sentence length looks very uniform");
  if (generic > 0) reasons.push("Generic filler phrasing");
  if (trans > 0.5) reasons.push("Heavy transition-word use");

  return { score, reasons, rep, vdiv, generic, trans, uniformLenSignal };
}

export function analyzeTextForAI(text: string, threshold = 0.35) {
  const sents = splitSentencesWithOffsets(text);
  const avgLen =
    sents.reduce((a, s) => a + s.sentence.length, 0) / Math.max(sents.length, 1);

  const scored = sents.map((s) => {
    const r = aiSentenceScore(s.sentence, avgLen);
    return { ...s, ...r };
  });

  const aiSentenceSignals: AISentenceSignal[] = scored
    .filter((x) => x.score >= threshold)
    .map((x) => ({
      sentence: x.sentence,
      start: x.start,
      end: x.end,
      score: x.score,
      reasons: x.reasons.length ? x.reasons : ["Pattern-based AI signal"],
    }));

  const avgScore =
    scored.reduce((a, s) => a + s.score, 0) / Math.max(scored.length, 1);
  const flaggedRatio =
    aiSentenceSignals.length / Math.max(scored.length, 1);
  const overallAiScore = clamp01(0.65 * avgScore + 0.35 * flaggedRatio);

  // Feature vector for calibration/classification
  const avgRepetition =
    scored.reduce((a, s) => a + s.rep, 0) / Math.max(scored.length, 1);
  const avgVocabDiversity =
    scored.reduce((a, s) => a + s.vdiv, 0) / Math.max(scored.length, 1);
  const genericRate =
    scored.reduce((a, s) => a + (s.generic ? 1 : 0), 0) / Math.max(scored.length, 1);
  const transitionRate =
    scored.reduce((a, s) => a + s.trans, 0) / Math.max(scored.length, 1);
  const uniformity =
    scored.reduce((a, s) => a + s.uniformLenSignal, 0) / Math.max(scored.length, 1);

  const aiModel: AIModelOutput = {
    overallAiScore,
    threshold,
    avgSentenceLength: avgLen,
    sentenceCount: scored.length,
    features: {
      avgRepetition: clamp01(avgRepetition),
      avgVocabDiversity: clamp01(avgVocabDiversity),
      genericRate: clamp01(genericRate),
      transitionRate: clamp01(transitionRate),
      uniformity: clamp01(uniformity),
    },
  };

  return { aiSentenceSignals, aiModel };
}

export function distance(a: AIFeatureVector, b: AIFeatureVector) {
  // Euclidean distance in 5D
  const d =
    (a.avgRepetition - b.avgRepetition) ** 2 +
    (a.avgVocabDiversity - b.avgVocabDiversity) ** 2 +
    (a.genericRate - b.genericRate) ** 2 +
    (a.transitionRate - b.transitionRate) ** 2 +
    (a.uniformity - b.uniformity) ** 2;
  return Math.sqrt(d);
}

export function classifyWithCalibration(
  features: AIFeatureVector,
  human: AIFeatureVector | null,
  ai: AIFeatureVector | null
) {
  if (!human || !ai) {
    return {
      label: "uncertain" as const,
      confidence: 0,
      dHuman: null as number | null,
      dAI: null as number | null,
      note: "Missing calibration profiles. Visit /calibrate.",
    };
  }

  const dHuman = distance(features, human);
  const dAI = distance(features, ai);

  // margin > 0 means closer to human, < 0 means closer to AI
  const margin = dAI - dHuman;

  // Confidence from margin magnitude (scaled)
  const conf = clamp01(Math.abs(margin) / 0.25); // tune scale

  // Uncertainty band
  if (Math.abs(margin) < 0.06) {
    return {
      label: "uncertain" as const,
      confidence: conf,
      dHuman,
      dAI,
      note: "Close to both profiles (uncertain).",
    };
  }

  return {
    label: margin > 0 ? ("human" as const) : ("ai" as const),
    confidence: conf,
    dHuman,
    dAI,
    note: "Closer to one reference profile (not proof).",
  };
}
