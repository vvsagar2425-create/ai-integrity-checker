type CitationIssue = {
  type: "missing_citation" | "needs_quote";
  message: string;
  suggestion?: string;
};

function hasWorksCitedSection(text: string) {
  return /\b(works cited|references|bibliography)\b/i.test(text);
}

function hasInlineCitation(line: string) {
  return /\([^)]+\d{2,4}[^)]*\)|\([A-Z][a-zA-Z-]+[^)]*\)|\[\d+\]/.test(line);
}

function splitLines(text: string) {
  return text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
}

export function findCitationIssues(text: string): CitationIssue[] {
  const issues: CitationIssue[] = [];
  const lines = splitLines(text);
  const hasWC = hasWorksCitedSection(text);

  // Missing Works Cited
  if (!hasWC) {
    issues.push({
      type: "missing_citation",
      message: "No Works Cited / References section detected.",
      suggestion: "Add a Works Cited (MLA) or References (APA) section."
    });
  }

  for (const line of lines) {
    const hasYear = /\b(19|20)\d{2}\b/.test(line);
    const hasNumber =
      /\b\d+(\.\d+)?%?\b/.test(line) ||
      /\b(million|billion|percent|%)\b/i.test(line);

    // Stats / years without citation
    if ((hasYear || hasNumber) && !hasInlineCitation(line) && line.length >= 10) {
      issues.push({
        type: "missing_citation",
        message: "A statistic or year appears without a citation.",
        suggestion: "Add an in-text citation after this sentence."
      });
    }

    // Quotes without citation
    if (/"[^"]{10,}"/.test(line) && !hasInlineCitation(line)) {
      issues.push({
        type: "needs_quote",
        message: "A direct quote appears without a citation.",
        suggestion: "Add an in-text citation immediately after the quote."
      });
    }
  }

  // Deduplicate
  return issues.filter(
    (v, i, a) => a.findIndex(t => t.message === v.message) === i
  );
}
