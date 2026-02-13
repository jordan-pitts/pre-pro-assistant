"use client";

import { Badge } from "@/components/ui/badge";
import type { StyleProfile } from "@/types/database";

interface StyleProfileCardProps {
  profile: StyleProfile;
}

export function StyleProfileCard({ profile }: StyleProfileCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Camera */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Camera
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Energy</span>
            <span className="font-medium">{profile.camera_energy}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Movement</span>
            <span className="font-medium">{profile.movement_frequency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Primary Lens</span>
            <span className="font-medium">{profile.lens_bias?.primary}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Secondary Lens</span>
            <span className="font-medium">{profile.lens_bias?.secondary}</span>
          </div>
        </div>
      </div>

      {/* Lighting */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Lighting
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Key Style</span>
            <span className="font-medium">
              {profile.lighting_philosophy?.key_style}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Source Bias</span>
            <span className="font-medium">
              {profile.lighting_philosophy?.source_bias}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Contrast</span>
            <span className="font-medium">
              {profile.lighting_philosophy?.contrast_level}
            </span>
          </div>
        </div>
      </div>

      {/* Color & Texture */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Color &amp; Texture
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Temperature</span>
            <span className="font-medium">
              {profile.color_bias?.temperature}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Saturation</span>
            <span className="font-medium">
              {profile.color_bias?.saturation}
            </span>
          </div>
          {profile.texture && (
            <div className="flex gap-1.5 pt-1">
              {profile.texture.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Framing */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Framing
        </h4>
        {profile.framing_bias && (
          <div className="flex gap-1.5 flex-wrap">
            {profile.framing_bias.map((f) => (
              <Badge key={f} variant="secondary" className="text-xs">
                {f}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Coverage */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Coverage
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Philosophy</span>
            <span className="font-medium">
              {profile.coverage_philosophy}
            </span>
          </div>
        </div>
      </div>

      {/* Priorities */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Directing Priorities
        </h4>
        {profile.directing_priorities && (
          <ol className="space-y-1">
            {profile.directing_priorities.map((p, i) => (
              <li key={p} className="text-sm flex gap-2">
                <span className="text-muted-foreground">{i + 1}.</span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
