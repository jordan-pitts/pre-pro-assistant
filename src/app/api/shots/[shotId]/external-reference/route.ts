import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
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

  const body = await request.json();

  if (!body.url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("shot_references")
    .insert({
      shot_id: shotId,
      type: "external_link",
      provider: "frameset",
      url: body.url,
      why_this_works: body.description || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
