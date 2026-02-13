export interface Project {
  id: string;
  user_id: string;
  title: string;
  project_type: string;
  script_text: string | null;
  look_words: string[];
  constraints: ProjectConstraints;
  style_profile: StyleProfile | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectConstraints {
  budget: "micro" | "low" | "moderate";
  crew_size: "skeleton" | "small" | "standard";
  coverage_mode: "minimal" | "standard" | "safety";
}

export interface StyleProfile {
  camera_energy: "static" | "restrained" | "handheld" | "kinetic";
  movement_frequency: "rare" | "occasional" | "frequent";
  lens_bias: {
    primary: "wide" | "normal" | "tele";
    secondary: "wide" | "normal" | "tele";
  };
  framing_bias: string[];
  lighting_philosophy: {
    key_style: "naturalistic" | "low-key" | "high-key";
    source_bias: "motivated" | "practical-heavy" | "stylized";
    contrast_level: "low" | "medium" | "high";
  };
  color_bias: {
    temperature: "warm" | "cool" | "neutral";
    saturation: "muted" | "natural" | "heightened";
  };
  texture: string[];
  coverage_philosophy: "minimal" | "standard" | "safety";
  directing_priorities: string[];
}

export interface Scene {
  id: string;
  project_id: string;
  scene_number: number;
  int_ext: string;
  location: string;
  time_of_day: string;
  characters: string[];
  beat_summary: string;
  created_at: string;
}

export interface Shot {
  id: string;
  scene_id: string;
  shot_code: string;
  position_index: number;
  shot_size: string;
  angle: string;
  movement: string;
  lens_suggestion: string;
  blocking_notes: string;
  intent_text: string;
  audio_notes: string;
  time_cost_estimate: string;
  reference_targets: ReferenceTargets | null;
  search_prompts: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ReferenceTargets {
  lighting: string;
  framing: string;
  movement: string;
  depth: string;
  texture: string;
}

export interface ShotReference {
  id: string;
  shot_id: string;
  type: "recommended_image" | "external_link";
  provider: "pexels" | "unsplash" | "frameset";
  url: string;
  preview_url: string | null;
  attribution_text: string | null;
  attribution_url: string | null;
  license_info: string | null;
  why_this_works: string | null;
  created_at: string;
}

export interface SceneWithShots extends Scene {
  shots: ShotWithReferences[];
}

export interface ShotWithReferences extends Shot {
  references: ShotReference[];
}

export interface ProjectWithScenes extends Project {
  scenes: SceneWithShots[];
}
