export const SECTION_COLORS_DARK: Record<string, string> = {
  "Climate and Geophysics": "#60a5fa",
  "Theoretical Particle Physics and Cosmology": "#c084fc",
  "Quantum Optics": "#2dd4bf",
  "Condensed Matter Physics": "#86efac",
  "Cosmic Dawn Center (DAWN)": "#f472b6",
  "Experimental Subatomic Physics": "#fb923c",
  Biophysics: "#4ade80",
  "Astrophysics and Planetary Science": "#facc15",
  "Dark Cosmology Centre (DARK)": "#a78bfa",
  "Niels Bohr International Academy": "#818cf8",
  Support: "#71717a",
};

export const SECTION_COLORS_LIGHT: Record<string, string> = {
  "Climate and Geophysics": "#1d4ed8",
  "Theoretical Particle Physics and Cosmology": "#7c3aed",
  "Quantum Optics": "#0d9488",
  "Condensed Matter Physics": "#16a34a",
  "Cosmic Dawn Center (DAWN)": "#db2777",
  "Experimental Subatomic Physics": "#ea580c",
  Biophysics: "#15803d",
  "Astrophysics and Planetary Science": "#ca8a04",
  "Dark Cosmology Centre (DARK)": "#6d28d9",
  "Niels Bohr International Academy": "#4338ca",
  Support: "#52525b",
};

export function sectionColor(
  section: string,
  mode: "dark" | "light" = "dark",
): string {
  const table = mode === "light" ? SECTION_COLORS_LIGHT : SECTION_COLORS_DARK;
  return table[section] ?? (mode === "light" ? "#52525b" : "#a1a1aa");
}
