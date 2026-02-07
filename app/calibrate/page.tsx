"use client";

import { useEffect, useMemo, useState } from "react";
import { analyzeTextForAI, type AIFeatureVector } from "@/lib/aiFeatures";

type SavedProfile = {
  label: "human" | "ai";
  features: AIFeatureVector;
  createdAt: number;
};

const KEY_HUMAN = "calibration_human_v1";
const KEY_AI = "calibration_ai_v1";

function saveProfile(key: string, profile: SavedProfile) {
  localStorage.setItem(key, JSON.stringify(profile));
}

function loadProfile(key: string): SavedProfile | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SavedProfile;
  } catch {
    return null;
  }
}

export default function CalibratePage() {
  const [humanText, setHumanText] = useState("");
  const [aiText, setAiText] = useState("");
  const [humanSaved, setHumanSaved] = useState<SavedProfile | null>(null);
  const [aiSaved, setAiSaved] = useState<SavedProfile | null>(null);

  useEffect(() => {
    setHumanSaved(loadProfile(KEY_HUMAN));
    setAiSaved(loadProfile(KEY_AI));
  }, []);

  const humanPreview = useMemo(() => {
    if (!humanText.trim()) return null;
    const { aiModel } = analyzeTextForAI(humanText, 0.35);
    return aiModel.features;
  }, [humanText]);

  const aiPreview = useMemo(() => {
    if (!aiText.trim()) return null;
    const { aiModel } = analyzeTextForAI(aiText, 0.35);
    return aiModel.features;
  }, [aiText]);

  function saveHuman() {
    if (!humanText.trim()) return;
    const { aiModel } = analyzeTextForAI(humanText, 0.35);
    const p: SavedProfile = { label: "human", features: aiModel.features, createdAt: Date.now() };
    saveProfile(KEY_HUMAN, p);
    setHumanSaved(p);
  }

  function saveAI() {
    if (!aiText.trim()) return;
    const { aiModel } = analyzeTextForAI(aiText, 0.35);
    const p: SavedProfile = { label: "ai", features: aiModel.features, createdAt: Date.now() };
    saveProfile(KEY_AI, p);
    setAiSaved(p);
  }

  function clearAll() {
    localStorage.removeItem(KEY_HUMAN);
    localStorage.removeItem(KEY_AI);
    setHumanSaved(null);
    setAiSaved(null);
  }

  function FeatureBox({ title, f }: { title: string; f: AIFeatureVector }) {
    return (
      <div className="border rounded-xl p-4 text-sm">
        <div className="font-semibold mb-2">{title}</div>
        <ul className="space-y-1 text-gray-700">
          <li>avgRepetition: <b>{Math.round(f.avgRepetition * 100)}%</b></li>
          <li>avgVocabDiversity: <b>{Math.round(f.avgVocabDiversity * 100)}%</b></li>
          <li>genericRate: <b>{Math.round(f.genericRate * 100)}%</b></li>
          <li>transitionRate: <b>{Math.round(f.transitionRate * 100)}%</b></li>
          <li>uniformity: <b>{Math.round(f.uniformity * 100)}%</b></li>
        </ul>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Calibration</h1>
      <p className="text-gray-600">
        Paste a known <b>human-written</b> sample and a known <b>AI-written</b> sample.
        We store their feature profiles locally in your browser. This enables “Closer to Human / Closer to AI / Uncertain”.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-3">
          <div className="font-semibold">Human Reference Sample</div>
          <textarea
            className="w-full h-56 p-4 border rounded-xl"
            placeholder="Paste a known human-written sample here..."
            value={humanText}
            onChange={(e) => setHumanText(e.target.value)}
          />
          <button
            onClick={saveHuman}
            disabled={!humanText.trim()}
            className="px-4 py-2 rounded-xl border hover:bg-gray-100 disabled:opacity-50"
          >
            Save Human Profile
          </button>

          {humanPreview && <FeatureBox title="Human Preview (this paste)" f={humanPreview} />}
          {humanSaved && <FeatureBox title="Saved Human Profile" f={humanSaved.features} />}
        </section>

        <section className="space-y-3">
          <div className="font-semibold">AI Reference Sample</div>
          <textarea
            className="w-full h-56 p-4 border rounded-xl"
            placeholder="Paste a known AI-written sample here..."
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
          />
          <button
            onClick={saveAI}
            disabled={!aiText.trim()}
            className="px-4 py-2 rounded-xl border hover:bg-gray-100 disabled:opacity-50"
          >
            Save AI Profile
          </button>

          {aiPreview && <FeatureBox title="AI Preview (this paste)" f={aiPreview} />}
          {aiSaved && <FeatureBox title="Saved AI Profile" f={aiSaved.features} />}
        </section>
      </div>

      <div className="flex gap-3">
        <button onClick={clearAll} className="px-4 py-2 rounded-xl border hover:bg-gray-100">
          Clear Calibration
        </button>
        <a className="px-4 py-2 rounded-xl border hover:bg-gray-100" href="/check">
          Go to /check
        </a>
      </div>

      <div className="text-xs text-gray-500">
        Calibration is stored in <b>localStorage</b> on your device only. Not proof—just similarity to reference profiles.
      </div>
    </main>
  );
}
