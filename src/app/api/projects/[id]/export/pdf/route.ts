import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { StyleProfile } from "@/types/database";

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

  const doc = new jsPDF({ orientation: "landscape" });

  // Title page
  doc.setFontSize(28);
  doc.setTextColor(50, 50, 50);
  doc.text(project.title, 20, 40);

  doc.setFontSize(12);
  doc.setTextColor(120, 120, 120);
  doc.text("Shot List — Pre-Pro Assistant", 20, 52);

  // Look words
  if (project.look_words?.length > 0) {
    doc.setFontSize(10);
    doc.text(
      `Look & Feel: ${(project.look_words as string[]).join(", ")}`,
      20,
      65
    );
  }

  // Style Profile summary
  const style = project.style_profile as StyleProfile | null;
  if (style) {
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    let y = 80;

    doc.setFontSize(11);
    doc.text("Style Profile", 20, y);
    y += 8;

    doc.setFontSize(9);
    const lines = [
      `Camera: ${style.camera_energy}, movement ${style.movement_frequency}`,
      `Lens: ${style.lens_bias?.primary} (primary), ${style.lens_bias?.secondary} (secondary)`,
      `Lighting: ${style.lighting_philosophy?.key_style}, ${style.lighting_philosophy?.source_bias}, contrast ${style.lighting_philosophy?.contrast_level}`,
      `Color: ${style.color_bias?.temperature}, ${style.color_bias?.saturation}`,
      `Coverage: ${style.coverage_philosophy}`,
      `Framing: ${style.framing_bias?.join(", ")}`,
    ];

    for (const line of lines) {
      doc.text(line, 20, y);
      y += 5;
    }
  }

  // Scenes and shots
  for (const scene of scenes || []) {
    doc.addPage();

    // Scene header
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text(
      `Scene ${scene.scene_number} — ${scene.int_ext}. ${scene.location} — ${scene.time_of_day}`,
      20,
      20
    );

    if (scene.beat_summary) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(scene.beat_summary, 20, 28, { maxWidth: 250 });
    }

    // Fetch shots
    const { data: shots } = await supabase
      .from("shots")
      .select("*")
      .eq("scene_id", scene.id)
      .order("position_index");

    if (shots && shots.length > 0) {
      // Fetch references for each shot
      const shotsWithRefs = await Promise.all(
        shots.map(async (shot) => {
          const { data: refs } = await supabase
            .from("shot_references")
            .select("*")
            .eq("shot_id", shot.id);
          return { ...shot, references: refs || [] };
        })
      );

      const tableData = shotsWithRefs.map((shot) => {
        const refInfo = shot.references
          .map((r: { type: string; url: string; attribution_text: string | null }) => {
            if (r.type === "external_link") return `[Link] ${r.url}`;
            return r.attribution_text || r.url;
          })
          .join("\n");

        return [
          shot.shot_code,
          shot.shot_size || "",
          shot.angle || "",
          shot.movement || "",
          shot.lens_suggestion || "",
          shot.intent_text || "",
          shot.time_cost_estimate || "",
          refInfo || "—",
        ];
      });

      autoTable(doc, {
        startY: scene.beat_summary ? 36 : 30,
        head: [
          [
            "Code",
            "Size",
            "Angle",
            "Movement",
            "Lens",
            "Intent",
            "Time",
            "References",
          ],
        ],
        body: tableData,
        theme: "plain",
        styles: {
          fontSize: 8,
          cellPadding: 3,
          textColor: [60, 60, 60],
          lineColor: [220, 220, 220],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [245, 245, 240],
          textColor: [80, 80, 80],
          fontStyle: "bold",
          fontSize: 7,
        },
        columnStyles: {
          0: { cellWidth: 20 },
          5: { cellWidth: 60 },
          7: { cellWidth: 50 },
        },
      });
    }
  }

  const pdfOutput = doc.output("arraybuffer");

  return new NextResponse(pdfOutput, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${project.title}.pdf"`,
    },
  });
}
