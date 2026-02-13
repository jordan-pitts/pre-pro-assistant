import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  // Fetch scenes with shots and references
  const { data: scenes } = await supabase
    .from("scenes")
    .select("*")
    .eq("project_id", id)
    .order("scene_number");

  const scenesWithShots = await Promise.all(
    (scenes || []).map(async (scene) => {
      const { data: shots } = await supabase
        .from("shots")
        .select("*")
        .eq("scene_id", scene.id)
        .order("position_index");

      const shotsWithRefs = await Promise.all(
        (shots || []).map(async (shot) => {
          const { data: references } = await supabase
            .from("shot_references")
            .select("*")
            .eq("shot_id", shot.id);

          return { ...shot, references: references || [] };
        })
      );

      return { ...scene, shots: shotsWithRefs };
    })
  );

  return NextResponse.json({ ...project, scenes: scenesWithShots });
}
