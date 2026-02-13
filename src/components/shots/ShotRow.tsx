"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Image, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ShotWithReferences } from "@/types/database";
import { toast } from "sonner";

interface ShotRowProps {
  shot: ShotWithReferences;
  onOpenReferences: () => void;
  onUpdate: () => void;
}

export function ShotRow({ shot, onOpenReferences, onUpdate }: ShotRowProps) {
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    shot_size: shot.shot_size,
    angle: shot.angle,
    movement: shot.movement,
    lens_suggestion: shot.lens_suggestion,
    intent_text: shot.intent_text,
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  async function handleSave() {
    const res = await fetch(`/api/shots/${shot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editValues),
    });

    if (res.ok) {
      toast.success("Shot updated");
      setEditing(false);
      onUpdate();
    } else {
      toast.error("Failed to update shot");
    }
  }

  const refCount = shot.references?.length || 0;

  if (editing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="grid grid-cols-[60px_80px_80px_90px_80px_1fr_100px_60px] gap-2 px-4 py-2 border-t border-border/30 bg-accent/20 items-center"
      >
        <span className="text-sm font-mono">{shot.shot_code}</span>
        <Input
          value={editValues.shot_size}
          onChange={(e) =>
            setEditValues({ ...editValues, shot_size: e.target.value })
          }
          className="h-7 text-xs"
        />
        <Input
          value={editValues.angle}
          onChange={(e) =>
            setEditValues({ ...editValues, angle: e.target.value })
          }
          className="h-7 text-xs"
        />
        <Input
          value={editValues.movement}
          onChange={(e) =>
            setEditValues({ ...editValues, movement: e.target.value })
          }
          className="h-7 text-xs"
        />
        <Input
          value={editValues.lens_suggestion}
          onChange={(e) =>
            setEditValues({ ...editValues, lens_suggestion: e.target.value })
          }
          className="h-7 text-xs"
        />
        <Input
          value={editValues.intent_text}
          onChange={(e) =>
            setEditValues({ ...editValues, intent_text: e.target.value })
          }
          className="h-7 text-xs"
        />
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleSave} className="h-7 w-7 p-0">
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(false)}
            className="h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <span />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[60px_80px_80px_90px_80px_1fr_100px_60px] gap-2 px-4 py-2.5 border-t border-border/30 items-center group hover:bg-accent/20 transition-colors"
    >
      <div className="flex items-center gap-1">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="text-sm font-mono font-medium">{shot.shot_code}</span>
      </div>
      <span className="text-sm">{shot.shot_size}</span>
      <span className="text-sm">{shot.angle}</span>
      <span className="text-sm">{shot.movement}</span>
      <span className="text-sm text-muted-foreground">
        {shot.lens_suggestion}
      </span>
      <span className="text-sm text-muted-foreground truncate">
        {shot.intent_text}
      </span>
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className={`text-[10px] ${
            shot.time_cost_estimate === "quick"
              ? "bg-green-50 text-green-700"
              : shot.time_cost_estimate === "slow"
                ? "bg-amber-50 text-amber-700"
                : ""
          }`}
        >
          {shot.time_cost_estimate}
        </Badge>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenReferences}
          className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
        >
          <Image className="h-3.5 w-3.5" />
          {refCount > 0 && (
            <span className="absolute -top-1 -right-1 text-[9px] bg-primary text-primary-foreground rounded-full h-3.5 w-3.5 flex items-center justify-center">
              {refCount}
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-60 hover:!opacity-100"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
