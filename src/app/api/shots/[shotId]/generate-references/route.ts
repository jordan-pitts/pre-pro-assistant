import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchPexels, formatPexelsAttribution } from "@/lib/pexels";
import { getOpenAI } from "@/lib/openai";
import { HOUSE_PERSONALITY_SYSTEM_PROMPT } from "@/lib/house-personality";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ shotId: string }> }
) {
  const { shotId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: shot, error: shotError } = await supabase
    .from("shots")
    .select("*")
    .eq("id", shotId)
    .single();

  if (shotError || !shot) {
    return NextResponse.json({ error: "Shot not found" }, { status: 404 });
  }

  // Delete existing recommended images for this shot
  await supabase
    .from("shot_references")
    .delete()
    .eq("shot_id", shotId)
    .eq("type", "recommended_image");

  const searchPrompts = shot.search_prompts as string[] | null;
  if (!searchPrompts || searchPrompts.length === 0) {
    return NextResponse.json(
      { error: "No search prompts available for this shot" },
      { status: 400 }
    );
  }

  try {
  // Fetch candidates across all search prompts (up to 9 total)
  const perPrompt = Math.ceil(9 / searchPrompts.length);
  const allPhotos = await Promise.all(
    searchPrompts.map((prompt) => searchPexels(prompt, perPrompt))
  );
  const candidates = allPhotos.flat().slice(0, 9);

  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "No images found from Pexels" },
      { status: 404 }
    );
  }

  // Build candidate descriptions for AI ranking
  const candidateDescriptions = candidates.map((photo, i) => ({
    index: i,
    alt: photo.alt || "No description available",
  }));

  const referenceTargets = shot.reference_targets as Record<string, string> | null;

  // Use OpenAI to rank and select top 3 based on house personality alignment
  const rankingCompletion = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `${HOUSE_PERSONALITY_SYSTEM_PROMPT}

You are a reference image selector. Given a list of candidate images (by their alt descriptions) and a shot's reference targets, select the 3 images that best align with the House Visual Personality.

Ranking priorities:
1. Alignment with the House Visual Personality (restraint, motivated light, close proximity, observational stance)
2. Match to the shot's reference targets
3. Up-rank images showing: single-source lighting, preserved shadows, close framing, low saturation, observational feel
4. Down-rank images that are: evenly lit, commercial/glossy, wide spectacle, expressively colored

Return a JSON object:
{
  "selections": [
    {
      "index": <number>,
      "why_this_works": "<1-2 sentences explaining alignment with the house personality>"
    }
  ]
}

Language rules for why_this_works:
- Use words like: restrained, motivated, observational, patient, withholding
- Never use: epic, cinematic, dramatic, stylish, energetic
- State WHY the reference aligns with the house view, not just what it shows`,
      },
      {
        role: "user",
        content: `Shot: ${shot.shot_size} ${shot.angle} — ${shot.intent_text}
Reference targets: ${referenceTargets ? JSON.stringify(referenceTargets) : "None specified"}

Candidate images:
${candidateDescriptions.map((c) => `[${c.index}] ${c.alt}`).join("\n")}`,
      },
    ],
  });

  const rankingContent = rankingCompletion.choices[0]?.message?.content;

  let selectedIndices: { index: number; why_this_works: string }[];

  if (rankingContent) {
    try {
      const parsed = JSON.parse(rankingContent);
      selectedIndices = parsed.selections.slice(0, 3);
    } catch {
      // Fallback: take first 3 candidates with generic explanation
      selectedIndices = candidates.slice(0, 3).map((_, i) => ({
        index: i,
        why_this_works: "Selected as a reference for framing and lighting intent.",
      }));
    }
  } else {
    selectedIndices = candidates.slice(0, 3).map((_, i) => ({
      index: i,
      why_this_works: "Selected as a reference for framing and lighting intent.",
    }));
  }

  const referencesToInsert = selectedIndices
    .filter((sel) => sel.index >= 0 && sel.index < candidates.length)
    .map((sel) => {
      const photo = candidates[sel.index];
      const attribution = formatPexelsAttribution(photo);
      return {
        shot_id: shotId,
        type: "recommended_image" as const,
        provider: attribution.provider,
        url: attribution.url,
        preview_url: attribution.preview_url,
        attribution_text: attribution.attribution_text,
        attribution_url: attribution.attribution_url,
        license_info: attribution.license_info,
        why_this_works: sel.why_this_works,
      };
    });

  if (referencesToInsert.length === 0) {
    return NextResponse.json(
      { error: "No suitable images could be selected" },
      { status: 404 }
    );
  }

  const { data: insertedRefs, error: insertError } = await supabase
    .from("shot_references")
    .insert(referencesToInsert)
    .select();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ references: insertedRefs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate references";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
