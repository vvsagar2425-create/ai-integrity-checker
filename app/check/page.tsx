"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";

type AnalyzeResult = {
  overall: {
    originalityRisk: "low" | "medium" | "high";
    citationQuality: "low" | "medium" | "high";
    aiLikelihood: "low" | "medium" | "high";
    aiModelScore?: number; // 0..1
    aiThreshold?: number; // 0..1
  };
  plagiarism: { score: number; sourceTitle: string; sourceUrl: string }[];
  citations: { type: string; message: string; suggestion?: string }[];
  aiSignals: { name: string; value: number; explanation: string }[];
  flaggedSentences?: { score: number; text: string; reasons: string[] }[];
  highlightedHtml?: string; // optional if your API returns it
  calibration?: {
    verdict: "Closer to Human" | "Closer to AI" | "Uncertain";
    confidence: number; // 0..1
    note?: string;
  };
};

function toneFromLevel(x: "low" | "medium" | "high") {
  if (x === "low") return "good";
  if (x === "medium") return "warn";
  return "bad";
}

export default function CheckPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = useMemo(() => {
    const t = text.trim();
    return t ? t.split(/\s+/).length : 0;
  }, [text]);

  async function analyze() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Analyze failed");
      }

      const data = (await res.json()) as AnalyzeResult;
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="font-semibold tracking-tight">AI Integrity Checker</div>
          <nav className="flex items-center gap-3 text-sm">
            <Link className="text-white/70 hover:text-white" href="/">
              Home
            </Link>
            <Link className="text-white/70 hover:text-white" href="/calibrate">
              Calibrate
            </Link>
          </nav>
        </header>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Left: input */}
          <Card
            title="Check My Work"
            subtitle="Paste writing to check citations + AI-like signals. Outputs are signals, not proof."
            right={<Badge tone={wordCount >= 250 ? "good" : "neutral"}>{wordCount} words</Badge>}
          >
            <textarea
              className="w-full h-[360px] rounded-2xl border border-white/15 bg-black/40 p-4 text-white outline-none focus:border-white/30"
              placeholder="Paste your essay here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={analyze}
                disabled={loading || text.trim().length === 0}
                className="rounded-xl bg-white text-black px-4 py-2 font-medium hover:bg-white/90 disabled:opacity-50"
              >
                {loading ? "Analyzing…" : "Analyze"}
              </button>

              <Link
                href="/calibrate"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
              >
                Improve Human vs AI
              </Link>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-200">
                {error}
              </div>
            )}

            {/* Highlighted preview */}
            {result?.highlightedHtml && (
              <div className="mt-6">
                <div className="text-sm font-semibold mb-2">
                  Highlighted Preview <span className="text-white/50">(signals)</span>
                </div>
                <div
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: result.highlightedHtml }}
                />
                <div className="mt-2 text-xs text-white/50">
                  Hover highlighted parts to see why. Not proof—just signals.
                </div>
              </div>
            )}
          </Card>

          {/* Right: results */}
          <Card title="Results" subtitle="What we found + why it was flagged.">
            {!result ? (
              <div className="text-white/60">Run analysis to see results.</div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="font-semibold">Summary</div>
                    <Badge tone={toneFromLevel(result.overall.originalityRisk)}>
                      Originality: {result.overall.originalityRisk}
                    </Badge>
                    <Badge tone={toneFromLevel(result.overall.citationQuality)}>
                      Citations: {result.overall.citationQuality}
                    </Badge>
                    <Badge tone={toneFromLevel(result.overall.aiLikelihood)}>
                      AI likelihood: {result.overall.aiLikelihood}
                    </Badge>
                  </div>

                  {typeof result.overall.aiModelScore === "number" && (
                    <div className="mt-3 text-sm text-white/70">
                      AI model score:{" "}
                      <span className="font-semibold">
                        {Math.round(result.overall.aiModelScore * 100)}%
                      </span>{" "}
                      <span className="text-white/40">
                        (threshold {Math.round((result.overall.aiThreshold ?? 0.35) * 100)}%)
                      </span>
                    </div>
                  )}

                  {result.calibration && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="font-semibold">
                        Calibration Verdict:{" "}
                        <span className="text-white">{result.calibration.verdict}</span>
                      </div>
                      <div className="text-sm text-white/70 mt-1">
                        Confidence: {Math.round(result.calibration.confidence * 100)}%
                      </div>
                      {result.calibration.note && (
                        <div className="text-xs text-white/50 mt-2">
                          {result.calibration.note}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Plagiarism */}
                <div>
                  <div className="font-semibold">Plagiarism Matches</div>
                  {result.plagiarism.length === 0 ? (
                    <div className="text-sm text-white/60 mt-1">No matches (demo).</div>
                  ) : (
                    <ul className="text-sm list-disc pl-5 mt-2 space-y-1">
                      {result.plagiarism.map((m, i) => (
                        <li key={i}>
                          Similarity {(m.score * 100).toFixed(0)}% —{" "}
                          <a className="underline" href={m.sourceUrl} target="_blank" rel="noreferrer">
                            {m.sourceTitle}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Citations */}
                <div>
                  <div className="font-semibold">Citation Issues</div>
                  {result.citations.length === 0 ? (
                    <div className="text-sm text-white/60 mt-1">No citation issues (demo).</div>
                  ) : (
                    <ul className="text-sm list-disc pl-5 mt-2 space-y-2">
                      {result.citations.map((c, i) => (
                        <li key={i}>
                          <b>{c.type}</b>: {c.message}
                          {c.suggestion ? (
                            <div className="text-white/60 mt-1">Suggestion: {c.suggestion}</div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* AI signals */}
                <div>
                  <div className="font-semibold">AI Writing Signals</div>
                  <ul className="text-sm list-disc pl-5 mt-2 space-y-2">
                    {result.aiSignals.map((s, i) => (
                      <li key={i}>
                        <b>{s.name}</b> ({Math.round(s.value * 100)}%): {s.explanation}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Flagged sentences */}
                {result.flaggedSentences && result.flaggedSentences.length > 0 && (
                  <div>
                    <div className="font-semibold">Flagged Sentences (not proof)</div>
                    <ul className="text-sm mt-2 space-y-3">
                      {result.flaggedSentences.map((f, i) => (
                        <li key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="font-medium">
                            Score {Math.round(f.score * 100)}% —{" "}
                            <span className="text-white/85">{f.text}</span>
                          </div>
                          <div className="text-xs text-white/55 mt-1">
                            Reasons: {f.reasons.join(", ")}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        </section>
      </div>
    </main>
  );
}
