import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full">
        <span className="text-lg tracking-tight font-medium">Pre-Pro</span>
        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="max-w-2xl text-center space-y-8">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Pre-Production Assistant
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.1]">
            From script to
            <br />
            <span className="font-normal">shoot-ready shot list</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            Paste your screenplay, describe the look you want, and get a
            crew-usable shot list with visual references for every shot.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8">
                Start a Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 mb-20 max-w-4xl w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-3">
              <p className="text-sm font-medium tracking-wide uppercase text-muted-foreground">
                01
              </p>
              <h3 className="text-base font-medium">Scene Breakdown</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Paste your script and get an intelligent scene-by-scene
                breakdown with locations, characters, and story beats.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium tracking-wide uppercase text-muted-foreground">
                02
              </p>
              <h3 className="text-base font-medium">Visual Style Profile</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Describe your look in a few words. The system generates a
                consistent style profile covering camera, lighting, and
                coverage.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium tracking-wide uppercase text-muted-foreground">
                03
              </p>
              <h3 className="text-base font-medium">
                Shot List with References
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every shot comes with intent, reference targets, licensed
                images, and export-ready formatting for your crew.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Point of View */}
        <div className="mb-20 max-w-2xl w-full text-center">
          <Separator className="mb-12" />
          <p className="text-sm text-muted-foreground leading-relaxed italic">
            This tool reflects a specific visual point of view. It favors
            restraint, motivated light, and proximity to performance. It is
            designed for filmmakers who prefer observation over spectacle.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-8 text-center">
        <p className="text-xs text-muted-foreground">
          Built for indie narrative filmmakers
        </p>
      </footer>
    </div>
  );
}
