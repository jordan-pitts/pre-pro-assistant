"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Table, Loader2 } from "lucide-react";
import type { ProjectWithScenes } from "@/types/database";
import { toast } from "sonner";

export default function ExportPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<ProjectWithScenes | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        setProject(await res.json());
      }
      setLoading(false);
    }
    fetchProject();
  }, [projectId]);

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/export/pdf`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.title || "shot-list"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to export PDF");
    }
    setExportingPdf(false);
  }

  async function handleExportCsv() {
    setExportingCsv(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/export/csv`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.title || "shot-list"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("Failed to export CSV");
    }
    setExportingCsv(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalShots =
    project?.scenes?.reduce((acc, s) => acc + (s.shots?.length || 0), 0) || 0;

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-4 px-8 py-6 max-w-4xl mx-auto">
        <Link href={`/projects/${projectId}/workspace`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="text-lg tracking-tight font-medium">Pre-Pro</span>
      </header>

      <main className="max-w-2xl mx-auto px-8 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-light tracking-tight">Export</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Download your shot list for {project?.title}
          </p>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Scenes</span>
            <span>{project?.scenes?.length || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total shots</span>
            <span>{totalShots}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Style profile</span>
            <span>{project?.style_profile ? "Generated" : "Not yet"}</span>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PDF Export */}
          <div className="border border-border/60 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div>
                <h3 className="font-medium">PDF Export</h3>
                <p className="text-xs text-muted-foreground">
                  Professional shot list with references
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Includes style profile, scene headers, all shots with intent,
              reference thumbnails, and attribution.
            </p>
            <Button
              onClick={handleExportPdf}
              disabled={exportingPdf || totalShots === 0}
              className="w-full"
            >
              {exportingPdf ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Download PDF
            </Button>
          </div>

          {/* CSV Export */}
          <div className="border border-border/60 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Table className="h-8 w-8 text-muted-foreground" />
              <div>
                <h3 className="font-medium">CSV Export</h3>
                <p className="text-xs text-muted-foreground">
                  Spreadsheet-ready shot data
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              All shot data in CSV format. Compatible with Google Sheets, Excel,
              and other spreadsheet tools.
            </p>
            <Button
              onClick={handleExportCsv}
              disabled={exportingCsv || totalShots === 0}
              variant="outline"
              className="w-full"
            >
              {exportingCsv ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Table className="h-4 w-4 mr-2" />
              )}
              Download CSV
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
