export interface AppearanceSettings {
  appearance_theme?: string
  appearance_accent_color?: string
  appearance_collapsed?: string
  appearance_density?: string
  appearance_font_family?: string
  appearance_font_size?: string
  appearance_language?: string
  appearance_time_format?: string
  appearance_date_format?: string
}

export const AppearanceDefaults: AppearanceSettings = {
  appearance_theme: "dark",
  appearance_accent_color: "default",
  appearance_collapsed: "true",
  appearance_density: "default",
  appearance_font_family: "system",
  appearance_font_size: "md",
  appearance_language: "en",
  appearance_time_format: "HH:mm",
  appearance_date_format: "DD/MM/YYYY",
} as const
