import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI } from "@/lib/openai";
import { HOUSE_PERSONALITY_SUMMARY } from "@/lib/house-personality";

export async function POST(
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

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.script_text) {
    return NextResponse.json({ error: "No script text found" }, { status: 400 });
  }

  // Delete existing scenes for this project
  await supabase.from("scenes").delete().eq("project_id", id);

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a script breakdown assistant for indie narrative filmmakers. Parse the given screenplay into scenes.

Visual point of view: ${HOUSE_PERSONALITY_SUMMARY}
When writing beat summaries, favor observational and restrained emotional language. Describe what characters do and what tension exists, rather than using dramatic or cinematic framing language.

Return a JSON object with this exact structure:
{
  "scenes": [
    {
      "scene_number": 1,
      "int_ext": "INT" or "EXT" or "INT/EXT",
      "location": "APARTMENT - KITCHEN",
      "time_of_day": "NIGHT",
      "characters": ["CHARACTER_NAME_1", "CHARACTER_NAME_2"],
      "beat_summary": "A 1-2 sentence summary of the emotional/dramatic beat of this scene"
    }
  ]
}

Rules:
- Extract scene headings (slug lines) to determine INT/EXT, location, and time of day
- List all speaking or described characters in each scene
- Write beat summaries that focus on emotional/dramatic content, not just plot
- If the script doesn't use standard format, do your best to interpret it
- Number scenes sequentially starting from 1`,
        },
        {
          role: "user",
          content: project.script_text,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Failed to parse script" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);

    // Insert scenes into database
    const scenesToInsert = parsed.scenes.map(
      (scene: {
        scene_number: number;
        int_ext: string;
        location: string;
        time_of_day: string;
        characters: string[];
        beat_summary: string;
      }) => ({
        project_id: id,
        scene_number: scene.scene_number,
        int_ext: scene.int_ext,
        location: scene.location,
        time_of_day: scene.time_of_day,
        characters: scene.characters,
        beat_summary: scene.beat_summary,
      })
    );

    const { data: insertedScenes, error: insertError } = await supabase
      .from("scenes")
      .insert(scenesToInsert)
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ scenes: insertedScenes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse script";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
