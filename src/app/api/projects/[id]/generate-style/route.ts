import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI } from "@/lib/openai";
import { HOUSE_PERSONALITY_SYSTEM_PROMPT } from "@/lib/house-personality";

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

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${HOUSE_PERSONALITY_SYSTEM_PROMPT}

You are a cinematography consultant for indie narrative filmmakers. Based on the look/feel words and production constraints provided, generate a cohesive Style Profile.

The house personality above is the baseline. The user's look words refine it but do not override it. If look words conflict with the house personality, lean toward the house view.

The filmmaker is working with limited resources. Favor achievable, restrained choices. Prioritize emotional clarity over visual gimmicks.

Return a JSON object with this exact structure:
{
  "style_profile": {
    "camera_energy": "static" | "restrained" | "handheld" | "kinetic",
    "movement_frequency": "rare" | "occasional" | "frequent",
    "lens_bias": {
      "primary": "wide" | "normal" | "tele",
      "secondary": "wide" | "normal" | "tele"
    },
    "framing_bias": ["intimate", "observational", ...],
    "lighting_philosophy": {
      "key_style": "naturalistic" | "low-key" | "high-key",
      "source_bias": "motivated" | "practical-heavy" | "stylized",
      "contrast_level": "low" | "medium" | "high"
    },
    "color_bias": {
      "temperature": "warm" | "cool" | "neutral",
      "saturation": "muted" | "natural" | "heightened"
    },
    "texture": ["clean", "grainy", "raw", ...],
    "coverage_philosophy": "minimal" | "standard" | "safety",
    "directing_priorities": ["performance-first", "blocking-first", "camera-first"]
  }
}

Rules:
- framing_bias: 2-4 descriptors (intimate, observational, claustrophobic, detached, grounded, etc.)
- texture: 1-3 descriptors (clean, grainy, raw, polished, etc.)
- directing_priorities: ordered list of 1-3 priorities
- Choices should be internally consistent and reflect the look/feel words
- Consider the constraints: micro/low budgets favor naturalistic lighting, practical sources, and minimal coverage`,
        },
        {
          role: "user",
          content: `Look/feel words: ${project.look_words.join(", ")}
Constraints: Budget=${project.constraints.budget}, Crew=${project.constraints.crew_size}, Coverage=${project.constraints.coverage_mode}

${project.script_text ? `Script excerpt (first 2000 chars): ${project.script_text.substring(0, 2000)}` : "No script available yet."}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Failed to generate style profile" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);

    const { error: updateError } = await supabase
      .from("projects")
      .update({ style_profile: parsed.style_profile })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ style_profile: parsed.style_profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate style profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
