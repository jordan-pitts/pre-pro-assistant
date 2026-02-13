import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI } from "@/lib/openai";
import { HOUSE_PERSONALITY_SYSTEM_PROMPT } from "@/lib/house-personality";
import type { StyleProfile } from "@/types/database";

export async function POST(
  request: NextRequest,
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

  const body = await request.json();
  const sceneId = body.scene_id;

  if (!sceneId) {
    return NextResponse.json(
      { error: "scene_id is required" },
      { status: 400 }
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: scene } = await supabase
    .from("scenes")
    .select("*")
    .eq("id", sceneId)
    .single();

  if (!scene) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }

  // Delete existing shots for this scene
  await supabase.from("shots").delete().eq("scene_id", sceneId);

  const styleProfile = project.style_profile as StyleProfile | null;

  try {
  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `${HOUSE_PERSONALITY_SYSTEM_PROMPT}

You are a shot list generator for indie narrative filmmakers. Generate a practical, crew-usable shot list for the given scene.

Style Profile: ${styleProfile ? JSON.stringify(styleProfile) : "Not yet defined — use sensible indie defaults."}
Constraints: Budget=${project.constraints.budget}, Crew=${project.constraints.crew_size}, Coverage=${project.constraints.coverage_mode}

Return a JSON object with this exact structure:
{
  "shots": [
    {
      "shot_code": "1A",
      "shot_size": "WS" | "MS" | "MCU" | "CU" | "ECU",
      "angle": "eye-level" | "low" | "high" | "OTS" | "POV" | "two-shot",
      "movement": "static" | "handheld" | "pan" | "tilt" | "push-in" | "pull-out",
      "lens_suggestion": "24mm" | "35mm" | "50mm" | "85mm",
      "blocking_notes": "Brief description of actor/camera blocking",
      "intent_text": "WHY this shot exists — the emotional/dramatic purpose",
      "audio_notes": "Any audio considerations",
      "time_cost_estimate": "quick" | "moderate" | "slow",
      "reference_targets": {
        "lighting": "description of target lighting look",
        "framing": "description of target framing",
        "movement": "description of target movement feel",
        "depth": "description of depth of field target",
        "texture": "description of texture/grain target"
      },
      "search_prompts": [
        "2-3 search prompts for finding reference images on stock photo sites"
      ]
    }
  ]
}

Rules:
- Every shot MUST have a clear intent_text explaining WHY it exists
- Favor achievable shots for indie crews (avoid crane, steadicam, complex rigs unless budget allows)
- Shot codes: scene number + letter (1A, 1B, 1C...)
- For minimal coverage: fewer shots, rely on masters and select coverage
- For standard coverage: balanced approach with key moments covered
- For safety coverage: more angles and safety takes
- Keep the shot list practical and crew-ready

Shot Generation Bias (from House Personality):
- Prefer static shots. Default to "static" movement unless emotional escalation demands otherwise.
- Prefer close proximity. Default to MCU or CU framing.
- Introduce movement only when emotional escalation is detected in the beat.
- Minimize redundant coverage. Each shot must justify its existence.
- If emotional intensity does not increase, do not add camera movement.

Search Prompt Rules (from House Personality):
- search_prompts MUST always include concepts aligned with: motivated/practical lighting, low-key/shadow-forward, close framing/tight proximity, static/still camera, muted/neutral color.
- search_prompts MUST NEVER include: "cinematic", "epic", "dynamic", "stylized", "high-energy".`,
      },
      {
        role: "user",
        content: `Scene ${scene.scene_number}: ${scene.int_ext}. ${scene.location} — ${scene.time_of_day}
Characters: ${scene.characters?.join(", ") || "None specified"}
Beat: ${scene.beat_summary || "No beat summary"}

Full script for context:
${project.script_text?.substring(0, 4000) || "No script available"}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: "Failed to generate shots" },
      { status: 500 }
    );
  }

  const parsed = JSON.parse(content);

  const shotsToInsert = parsed.shots.map(
    (
      shot: {
        shot_code: string;
        shot_size: string;
        angle: string;
        movement: string;
        lens_suggestion: string;
        blocking_notes: string;
        intent_text: string;
        audio_notes: string;
        time_cost_estimate: string;
        reference_targets: object;
        search_prompts: string[];
      },
      index: number
    ) => ({
      scene_id: sceneId,
      shot_code: shot.shot_code,
      position_index: index,
      shot_size: shot.shot_size,
      angle: shot.angle,
      movement: shot.movement,
      lens_suggestion: shot.lens_suggestion,
      blocking_notes: shot.blocking_notes,
      intent_text: shot.intent_text,
      audio_notes: shot.audio_notes,
      time_cost_estimate: shot.time_cost_estimate,
      reference_targets: shot.reference_targets,
      search_prompts: shot.search_prompts,
    })
  );

  const { data: insertedShots, error: insertError } = await supabase
    .from("shots")
    .insert(shotsToInsert)
    .select();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ shots: insertedShots });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate shots";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
