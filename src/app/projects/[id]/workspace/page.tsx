"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  FileDown,
  RefreshCw,
} from "lucide-react";
import type {
  ProjectWithScenes,
  SceneWithShots,
  StyleProfile,
} from "@/types/database";
import { StyleProfileCard } from "@/components/project/StyleProfileCard";
import { SceneCard } from "@/components/project/SceneCard";
import { ShotTable } from "@/components/shots/ShotTable";
import { toast } from "sonner";

export default function WorkspacePage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectWithScenes | null>(null);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [generatingStyle, setGeneratingStyle] = useState(false);
  const [generatingShots, setGeneratingShots] = useState<string | null>(null);
  const [activeScene, setActiveScene] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
      if (data.scenes?.length > 0 && !activeScene) {
        setActiveScene(data.scenes[0].id);
      }
    }
    setLoading(false);
  }, [projectId, activeScene]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  async function handleParseScript() {
    setParsing(true);
    const res = await fetch(`/api/projects/${projectId}/parse-script`, {
      method: "POST",
    });
    if (res.ok) {
      toast.success("Script parsed into scenes");
      await fetchProject();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to parse script");
    }
    setParsing(false);
  }

  async function handleGenerateStyle() {
    setGeneratingStyle(true);
    const res = await fetch(`/api/projects/${projectId}/generate-style`, {
      method: "POST",
    });
    if (res.ok) {
      toast.success("Style profile generated");
      await fetchProject();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to generate style");
    }
    setGeneratingStyle(false);
  }

  async function handleGenerateShots(sceneId: string) {
    setGeneratingShots(sceneId);
    const res = await fetch(`/api/projects/${projectId}/generate-shots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scene_id: sceneId }),
    });
    if (res.ok) {
      toast.success("Shot list generated");
      await fetchProject();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to generate shots");
    }
    setGeneratingShots(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const currentScene = project.scenes?.find((s) => s.id === activeScene);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="flex items-center justify-between px-6 py-4 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-medium tracking-tight">
                {project.title}
              </h1>
              {project.look_words?.length > 0 && (
                <div className="flex gap-1.5 mt-1">
                  {project.look_words.map((word: string) => (
                    <Badge
                      key={word}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {word}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/projects/${projectId}/export`}>
              <Button variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <Tabs defaultValue="workspace" className="space-y-8">
          <TabsList>
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
            <TabsTrigger value="style">Style Profile</TabsTrigger>
          </TabsList>

          {/* Style Profile Tab */}
          <TabsContent value="style" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-light tracking-tight">
                  Style Profile
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Visual direction derived from your look words
                </p>
              </div>
              <Button
                onClick={handleGenerateStyle}
                disabled={generatingStyle}
                variant={project.style_profile ? "outline" : "default"}
              >
                {generatingStyle ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : project.style_profile ? (
                  <RefreshCw className="h-4 w-4 mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {project.style_profile ? "Regenerate" : "Generate Style"}
              </Button>
            </div>
            {project.style_profile && (
              <StyleProfileCard
                profile={project.style_profile as StyleProfile}
              />
            )}
          </TabsContent>

          {/* Workspace Tab */}
          <TabsContent value="workspace" className="space-y-8">
            {/* Generation Controls */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleParseScript}
                disabled={parsing}
                variant={
                  project.scenes?.length > 0 ? "outline" : "default"
                }
                size="sm"
              >
                {parsing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {project.scenes?.length > 0
                  ? "Re-parse Script"
                  : "Parse Script"}
              </Button>
              {!project.style_profile && (
                <Button
                  onClick={handleGenerateStyle}
                  disabled={generatingStyle}
                  size="sm"
                >
                  {generatingStyle ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Style
                </Button>
              )}
            </div>

            {/* Scenes */}
            {project.scenes && project.scenes.length > 0 ? (
              <div className="space-y-6">
                {/* Scene selector */}
                <div className="flex gap-2 flex-wrap">
                  {project.scenes.map((scene: SceneWithShots) => (
                    <button
                      key={scene.id}
                      onClick={() => setActiveScene(scene.id)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        activeScene === scene.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }`}
                    >
                      Sc. {scene.scene_number}
                    </button>
                  ))}
                </div>

                <Separator />

                {/* Active scene details */}
                {currentScene && (
                  <div className="space-y-6">
                    <SceneCard scene={currentScene} />

                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-light tracking-tight">
                        Shot List
                      </h3>
                      <Button
                        onClick={() => handleGenerateShots(currentScene.id)}
                        disabled={generatingShots === currentScene.id}
                        variant={
                          currentScene.shots?.length > 0
                            ? "outline"
                            : "default"
                        }
                        size="sm"
                      >
                        {generatingShots === currentScene.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        {currentScene.shots?.length > 0
                          ? "Regenerate Shots"
                          : "Generate Shots"}
                      </Button>
                    </div>

                    {currentScene.shots && currentScene.shots.length > 0 ? (
                      <ShotTable
                        shots={currentScene.shots}
                        onUpdate={fetchProject}
                      />
                    ) : (
                      <div className="text-center py-16 border border-dashed border-border/60 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          No shots yet. Generate a shot list for this scene.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-border/60 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Parse your script to create scenes, then generate shot lists.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
