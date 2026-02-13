"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, ArrowLeft } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [scriptText, setScriptText] = useState("");
  const [lookWordInput, setLookWordInput] = useState("");
  const [lookWords, setLookWords] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>("low");
  const [crewSize, setCrewSize] = useState<string>("small");
  const [coverageMode, setCoverageMode] = useState<string>("minimal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addLookWord() {
    const word = lookWordInput.trim().toLowerCase();
    if (word && !lookWords.includes(word) && lookWords.length < 10) {
      setLookWords([...lookWords, word]);
      setLookWordInput("");
    }
  }

  function removeLookWord(word: string) {
    setLookWords(lookWords.filter((w) => w !== word));
  }

  function handleLookWordKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addLookWord();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (lookWords.length < 3) {
      setError("Add at least 3 look & feel words");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        script_text: scriptText,
        look_words: lookWords,
        constraints: {
          budget,
          crew_size: crewSize,
          coverage_mode: coverageMode,
        },
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create project");
      setLoading(false);
      return;
    }

    const project = await res.json();
    router.push(`/projects/${project.id}/workspace`);
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-4 px-8 py-6 max-w-4xl mx-auto">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="text-lg tracking-tight font-medium">Pre-Pro</span>
      </header>

      <main className="max-w-2xl mx-auto px-8 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-light tracking-tight">New Project</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up your screenplay and visual direction
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g. "The Last Light — Short Film"'
              required
            />
          </div>

          {/* Script */}
          <div className="space-y-2">
            <Label htmlFor="script">Screenplay</Label>
            <p className="text-xs text-muted-foreground">
              Paste your screenplay text below. Standard screenplay format works
              best.
            </p>
            <Textarea
              id="script"
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="INT. APARTMENT — NIGHT&#10;&#10;SARAH sits alone at a kitchen table..."
              className="min-h-[300px] font-mono text-sm"
              required
            />
          </div>

          {/* Look Words */}
          <div className="space-y-3">
            <Label>Look &amp; Feel Words</Label>
            <p className="text-xs text-muted-foreground">
              3–10 words that describe the visual tone (e.g. intimate, raw,
              melancholy, naturalistic)
            </p>
            <div className="flex gap-2">
              <Input
                value={lookWordInput}
                onChange={(e) => setLookWordInput(e.target.value)}
                onKeyDown={handleLookWordKeyDown}
                placeholder="Type a word and press Enter"
                disabled={lookWords.length >= 10}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addLookWord}
                disabled={lookWords.length >= 10}
              >
                Add
              </Button>
            </div>
            {lookWords.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {lookWords.map((word) => (
                  <Badge
                    key={word}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {word}
                    <button
                      type="button"
                      onClick={() => removeLookWord(word)}
                      className="ml-1 hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {lookWords.length}/10 words
            </p>
          </div>

          {/* Constraints */}
          <div className="space-y-6">
            <Label className="text-base">Production Constraints</Label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm">
                  Budget Level
                </Label>
                <Select value={budget} onValueChange={setBudget}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="micro">Micro</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="crew" className="text-sm">
                  Crew Size
                </Label>
                <Select value={crewSize} onValueChange={setCrewSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skeleton">Skeleton</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverage" className="text-sm">
                  Coverage Mode
                </Label>
                <Select value={coverageMode} onValueChange={setCoverageMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Link href="/dashboard">
              <Button variant="ghost">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
