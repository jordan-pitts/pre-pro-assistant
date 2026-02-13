"use client";

import { Badge } from "@/components/ui/badge";
import type { SceneWithShots } from "@/types/database";

interface SceneCardProps {
  scene: SceneWithShots;
}

export function SceneCard({ scene }: SceneCardProps) {
  return (
    <div className="border border-border/60 rounded-lg p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium tracking-tight">
            Scene {scene.scene_number} — {scene.int_ext}. {scene.location}
          </h3>
          <p className="text-sm text-muted-foreground">{scene.time_of_day}</p>
        </div>
        {scene.shots && (
          <Badge variant="secondary" className="text-xs">
            {scene.shots.length} shot{scene.shots.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>
      {scene.beat_summary && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {scene.beat_summary}
        </p>
      )}
      {scene.characters && scene.characters.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {scene.characters.map((char: string) => (
            <Badge key={char} variant="outline" className="text-xs font-normal">
              {char}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
