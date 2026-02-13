"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ShotWithReferences } from "@/types/database";
import { ShotRow } from "./ShotRow";
import { ReferenceDrawer } from "@/components/references/ReferenceDrawer";

interface ShotTableProps {
  shots: ShotWithReferences[];
  onUpdate: () => void;
}

export function ShotTable({ shots: initialShots, onUpdate }: ShotTableProps) {
  const [shots, setShots] = useState(initialShots);
  const [selectedShot, setSelectedShot] = useState<ShotWithReferences | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sync local state when parent data changes (e.g. after reference generation)
  useEffect(() => {
    setShots(initialShots);
    setSelectedShot((prev) =>
      prev ? initialShots.find((s) => s.id === prev.id) ?? null : null
    );
  }, [initialShots]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = shots.findIndex((s) => s.id === active.id);
    const newIndex = shots.findIndex((s) => s.id === over.id);

    const newShots = arrayMove(shots, oldIndex, newIndex);
    setShots(newShots);

    // Update position indexes in background
    newShots.forEach((shot, index) => {
      if (shot.position_index !== index) {
        fetch(`/api/shots/${shot.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position_index: index }),
        });
      }
    });
  }

  function openReferences(shot: ShotWithReferences) {
    setSelectedShot(shot);
    setDrawerOpen(true);
  }

  return (
    <>
      <div className="border border-border/60 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[60px_80px_80px_90px_80px_1fr_100px_60px] gap-2 px-4 py-2.5 bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground font-medium">
          <span>Code</span>
          <span>Size</span>
          <span>Angle</span>
          <span>Movement</span>
          <span>Lens</span>
          <span>Intent</span>
          <span>Time</span>
          <span>Refs</span>
        </div>

        {/* Rows */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={shots.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {shots.map((shot) => (
              <ShotRow
                key={shot.id}
                shot={shot}
                onOpenReferences={() => openReferences(shot)}
                onUpdate={onUpdate}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Reference Drawer */}
      <ReferenceDrawer
        shot={selectedShot}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdate={onUpdate}
      />
    </>
  );
}
