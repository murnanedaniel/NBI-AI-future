export const WINNING_PAIR = {
  a: {
    id: "135905",
    name: "Per Hedegård",
    section: "Condensed Matter Physics",
    group: "CMT · molecular spin · magnetic MOFs",
    bullets: [
      "DFT + Hubbard / Anderson minimal models for MOF magnets",
      "Sub-meV exchange couplings via Slater-Koster + RKKY",
      "STM-calibrated molecular spin coupling (Fe, H-bond biradicals)",
    ],
  },
  b: {
    id: "505651",
    name: "Eliza Cook",
    section: "Climate and Geophysics",
    group: "Tephrochronology · paleoclimate forcing",
    bullets: [
      "Cryptotephra + S-isotopes · Icelandic Active Period 751–940",
      "East Antarctic Holocene tephra framework (15+1 horizons)",
      "Deep-NN classifier for ice-core particles · 96.8% accuracy",
    ],
  },
  title:
    "Non-Destructive Magnetic Redox Proxy for Volcanic Tephra in Polar Ice, with First-Principles Calibration",
  abstract:
    "We propose a three-year NBI cross-section collaboration to establish a non-destructive magnetic readout of volcanic-tephra Fe-redox state in polar ice cores, as a quantitative tracer of magmatic fO₂ at eruption — and therefore of stratospheric sulphate yield and radiative forcing. The scientific payoff is established: Fiege, Scaillet et al. (Nat. Commun. 2025, Samalas 1257 CE) showed that magma redox governs excess pre-eruptive sulphur accumulation and hence forcing magnitude. The missing piece is a scalable ice-core method — μ-XANES and Mössbauer on individual shards are destructive and slow. Cook's cryptotephra framework, anchored to the Icelandic Active Period 751–940 CE with the visible Eldgjá 939 horizon as pilot target, supplies geochemically calibrated, eruption-tagged ice sections. Hedegård's DFT + Hubbard/Anderson spin-Hamiltonian toolkit — extended to titanomagnetite, hematite, and pyrrhotite end-members — supplies the first-principles inversion from bulk magnetic susceptibility and low-T SIRM signatures to Fe³⁺/Fe²⁺ ratios and end-member mineralogy. Deliverables: pilot magnetic measurements on Eldgjá-tagged ice sections, a spin-Hamiltonian reference database for common tephra end-members, and a calibrated bulk-magnetics → Fe-redox inversion cross-validated against μ-XANES on polished shards.",
  methods: [
    "Pilot: Eldgjá 939 CE (visible horizon, Cook's Icelandic Active Period)",
    "Spin-Hamiltonian database · titanomagnetite · hematite · pyrrhotite",
    "Bulk-magnetics → Fe³⁺/Fe²⁺ inversion · μ-XANES cross-validation",
  ],
  budget: {
    dkk: "~1.6M DKK",
    years: 3,
    people: "1 PhD (co-supervised CMT / Climate)",
  },
} as const;

export type WinningPerson = typeof WINNING_PAIR.a;
