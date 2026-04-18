# Factual references for the talk

Numbers cited in the scenes, with sources. If anyone in the audience pushes back, cite these.

## HL-LHC detector facts

- ⟨μ⟩ ≈ 200 inelastic pp collisions per bunch crossing at peak lumi 7.5×10³⁴ cm⁻² s⁻¹ — *CERN-2020-010; ATLAS-TDR-029*
- 25 ns bunch spacing → 40 MHz nominal crossing rate
- ATLAS L0 trigger → 1 MHz; Event Filter full-event tracking at 150 kHz; regional at up to 1 MHz
- Per event at ⟨μ⟩=200: ~311k ± 35k hits in ITk, ~16k ± 1.7k particles, ~1600–2000 reconstructed tracks — *IDTR-2023-01; Poreba & Fröning 2025; Murnane ACAT 2024 slide 4*
- Graph has ~1.95M edges average, ~3.7M peak

## Reconstruction-speed journey

- **CPU Fast Tracking baseline:** ~23 s/event — *Murnane ACAT 2024 slide 14*
- **Current GPU pipeline (full):** a few hundred ms/event on a modern GPU — *Poreba & Fröning, CHEP 2024, EPJ Web Conf. 337, 01043 (2025)*
- **ATLAS TDAQ target:** 10–100 ms/event (trigger latency requirement, aspirational) — *Murnane ACAT 2024 slide 15*

## Exa.TrkX

- Origin: DOE-funded CompHEP project, kicked off at LBNL June 2019, following HEP.TrkX pilot (2016–2019)
- PI: Paolo Calafiura (LBNL); Steve Farrell founding technical lead; cross-experiment (ATLAS, CMS, DUNE)
- Pipeline: (1) graph construction via metric learning or module map; (2) edge classification with Interaction GNN; (3) graph segmentation → track candidates
- Benchmark paper (TrackML): Ju, Murnane, Calafiura et al., *EPJC* 2021 — *arXiv:2103.06995*
  - Reported ~202 s/event single-core CPU, ~3.3 s/event on V100
- Acceleration paper: Lazar et al. — *arXiv:2202.06929*
  - Reduced V100 inference from ~15 s/event to ~0.7 s/event (FRNN graph-building + ONNX/TorchScript)

## GNN4ITk

- ATLAS-specific port of Exa.TrkX to the HL-LHC Inner Tracker
- Core leadership: L2IT Toulouse (Caillou, Rougier, Stark, Vallier) + LBNL (Calafiura, Ju, Farrell, Murnane) + UW-Madison (Pham)
- ~12 active developers across 7 institutes (Murnane ACAT 2024)
- ACORN framework (PyTorch / PyTorch Geometric / Lightning); ONNX/TorchScript export into Athena
- Physics performance (ttbar, √s=14 TeV, ⟨μ⟩=200): per-edge efficiency >98%, per-edge purity >92%
- HeteroGNN improves strip-barrel purity from ~70% to >90%
- Track-finding efficiency approaches CKF across η and pT; fake rate and duplication rate O(10⁻³)

## Key references

- Ju et al. 2021 — https://arxiv.org/abs/2103.06995
- Lazar et al. 2022 — https://arxiv.org/abs/2202.06929
- Caillou et al., CHEP 2023 — https://www.epj-conferences.org/articles/epjconf/pdf/2024/05/epjconf_chep2024_03030.pdf (CDS: https://cds.cern.ch/record/2871986)
- Poreba & Fröning, CHEP 2024 — https://www.epj-conferences.org/articles/epjconf/pdf/2025/22/epjconf_chep2025_01043.pdf (CDS: https://cds.cern.ch/record/2924720)
- Exa.TrkX project page — https://exatrkx.github.io/
- ATLAS EF Tracking public — https://twiki.cern.ch/twiki/bin/view/AtlasPublic/EFTrackingPublicResults
- IDTR-2022-01 plots — https://atlas.web.cern.ch/Atlas/GROUPS/PHYSICS/PLOTS/IDTR-2022-01/
- Murnane ACAT 2024 talk — https://indico.cern.ch/event/1330797/contributions/5796654/

## Known flags for Q&A

- "We're at 100 ms" is one step ahead of public numbers. Safer in hostile Q&A: "a few hundred milliseconds, approaching 100 ms."
- "10 ms target" is a trigger latency requirement, not a measurement. Present as the goal.
- "Hundreds of thousands of particles" was overstated in an early draft — per-event particle count is ~16k; the 300k number matches HITS, not particles.
