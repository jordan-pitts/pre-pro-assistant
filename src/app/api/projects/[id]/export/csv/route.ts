import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Papa from "papaparse";

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

  // Fetch project with scenes and shots
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: scenes } = await supabase
    .from("scenes")
    .select("*")
    .eq("project_id", id)
    .order("scene_number");

  const rows: Record<string, string>[] = [];

  for (const scene of scenes || []) {
    const { data: shots } = await supabase
      .from("shots")
      .select("*")
      .eq("scene_id", scene.id)
      .order("position_index");

    for (const shot of shots || []) {
      const { data: refs } = await supabase
        .from("shot_references")
        .select("*")
        .eq("shot_id", shot.id);

      const refUrls = (refs || []).map((r) => r.url).join(" | ");
      const prompts = (shot.search_prompts as string[] | null) || [];

      rows.push({
        scene_number: String(scene.scene_number),
        shot_code: shot.shot_code,
        shot_size: shot.shot_size || "",
        angle: shot.angle || "",
        movement: shot.movement || "",
        lens_suggestion: shot.lens_suggestion || "",
        intent_text: shot.intent_text || "",
        time_cost_estimate: shot.time_cost_estimate || "",
        reference_urls: refUrls,
        search_prompts: prompts.join(" | "),
      });
    }
  }

  const csv = Papa.unparse(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${project.title}.csv"`,
    },
  });
}
