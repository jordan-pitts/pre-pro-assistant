"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Sparkles,
  ExternalLink,
  Plus,
  Search,
} from "lucide-react";
import type { ShotWithReferences, ReferenceTargets } from "@/types/database";
import { toast } from "sonner";

interface ReferenceDrawerProps {
  shot: ShotWithReferences | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function ReferenceDrawer({
  shot,
  open,
  onOpenChange,
  onUpdate,
}: ReferenceDrawerProps) {
  const [generatingRefs, setGeneratingRefs] = useState(false);
  const [addingLink, setAddingLink] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [externalDescription, setExternalDescription] = useState("");

  if (!shot) return null;

  const targets = shot.reference_targets as ReferenceTargets | null;
  const searchPrompts = shot.search_prompts as string[] | null;
  const recommendedImages =
    shot.references?.filter((r) => r.type === "recommended_image") || [];
  const externalLinks =
    shot.references?.filter((r) => r.type === "external_link") || [];

  async function handleGenerateReferences() {
    setGeneratingRefs(true);
    const res = await fetch(`/api/shots/${shot!.id}/generate-references`, {
      method: "POST",
    });
    if (res.ok) {
      toast.success("References generated");
      onUpdate();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to generate references");
    }
    setGeneratingRefs(false);
  }

  async function handleAddExternalLink() {
    if (!externalUrl) return;

    const res = await fetch(`/api/shots/${shot!.id}/external-reference`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: externalUrl,
        description: externalDescription,
      }),
    });

    if (res.ok) {
      toast.success("External link added");
      setExternalUrl("");
      setExternalDescription("");
      setAddingLink(false);
      onUpdate();
    } else {
      toast.error("Failed to add link");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <SheetTitle className="font-light tracking-tight text-lg">
            Shot {shot.shot_code}
          </SheetTitle>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="secondary" className="text-[11px] font-normal">
              {shot.shot_size}
            </Badge>
            <Badge variant="secondary" className="text-[11px] font-normal">
              {shot.angle}
            </Badge>
            <Badge variant="secondary" className="text-[11px] font-normal">
              {shot.movement}
            </Badge>
          </div>
          <p className="text-sm italic text-muted-foreground pt-1 leading-relaxed">
            {shot.intent_text}
          </p>
        </SheetHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Reference Targets */}
          {targets && (
            <div className="space-y-3">
              <h4 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                Reference Targets
              </h4>
              <div className="bg-secondary/30 rounded-lg p-4 space-y-2.5">
                {Object.entries(targets).map(([key, value]) => (
                  <div key={key} className="flex gap-3 text-sm leading-snug">
                    <span className="text-muted-foreground capitalize min-w-[72px] shrink-0 text-xs pt-0.5">
                      {key}
                    </span>
                    <span className="text-[13px]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Prompts */}
          {searchPrompts && searchPrompts.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-1.5">
                <Search className="h-3 w-3" />
                Search Prompts
              </h4>
              <div className="space-y-1.5">
                {searchPrompts.map((prompt, i) => (
                  <p
                    key={i}
                    className="text-xs text-muted-foreground bg-secondary/40 rounded-md px-3 py-2 leading-relaxed"
                  >
                    {prompt}
                  </p>
                ))}
              </div>
            </div>
          )}

          <Separator className="!my-5" />

          {/* Recommended Images */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                Recommended Images
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateReferences}
                disabled={generatingRefs}
                className="h-8 text-xs"
              >
                {generatingRefs ? (
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1.5" />
                )}
                {recommendedImages.length > 0 ? "Refresh" : "Find Images"}
              </Button>
            </div>

            {recommendedImages.length > 0 ? (
              <div className="space-y-5">
                {recommendedImages.map((ref) => (
                  <div
                    key={ref.id}
                    className="rounded-lg border border-border/50 overflow-hidden"
                  >
                    {ref.preview_url && (
                      <img
                        src={ref.preview_url}
                        alt={ref.attribution_text || "Reference image"}
                        className="w-full object-cover aspect-video"
                      />
                    )}
                    <div className="p-3 space-y-2">
                      {ref.why_this_works && (
                        <p className="text-[13px] text-muted-foreground leading-relaxed">
                          {ref.why_this_works}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                        <span>{ref.attribution_text}</span>
                        {ref.attribution_url && (
                          <a
                            href={ref.attribution_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No images yet
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Click &ldquo;Find Images&rdquo; to get recommendations from
                  Pexels
                </p>
              </div>
            )}
          </div>

          <Separator className="!my-5" />

          {/* External Links (Frame Set) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                External References
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddingLink(!addingLink)}
                className="h-8 text-xs"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Add Link
              </Button>
            </div>

            {addingLink && (
              <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border/40">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">URL</Label>
                  <Input
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://frameset.app/..."
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Description (optional)
                  </Label>
                  <Input
                    value={externalDescription}
                    onChange={(e) => setExternalDescription(e.target.value)}
                    placeholder="Lighting, framing, or proximity intent"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddingLink(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddExternalLink}>
                    Save
                  </Button>
                </div>
              </div>
            )}

            {externalLinks.length > 0 ? (
              <div className="space-y-2.5">
                {externalLinks.map((ref) => (
                  <div key={ref.id} className="space-y-1.5">
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 bg-secondary/30 rounded-lg text-sm hover:bg-secondary/50 transition-colors border border-border/30"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">
                        {ref.why_this_works || ref.url}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] shrink-0"
                      >
                        {ref.provider}
                      </Badge>
                    </a>
                    <p className="text-[10px] text-muted-foreground/60 px-4">
                      Use this reference for framing and lighting intent, not
                      exact composition.
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              !addingLink && (
                <p className="text-xs text-muted-foreground/60 py-4 text-center">
                  No external links. Add a Frame Set or other reference URL.
                </p>
              )
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
