#!/usr/bin/env python3
"""Dump a real ATLAS graph-tracking event for the GnnSolution scene.

Input:  event NPZ with hit_x, hit_y, hit_z, edge_index, edge_y AND truth-track
        fields: track_edges, track_particle_id, track_particle_pt,
        track_particle_primary
Output: stage/public/data/tracking_event.bin — compact binary that the scene
        loads as a single ArrayBuffer and slices into typed arrays.

Filtering:
  * Hits: barrel only (|z| < 1000 mm). Everything in the barrel ships.
  * Candidate edges: both endpoints in barrel.
  * Focus tracks: derived from `track_edges` (truth-level connectivity, NOT
    connected components on `edge_y`). A particle is a "focus track" iff
        track_particle_pt > 1 GeV  AND  track_particle_primary == 1
        AND both endpoints of every kept edge survive the barrel cut.
    Focus particles are compact-remapped to dense ids 0..nFocus-1, ordered
    by descending pT so the colour palette gets the highest-pT tracks first.

File layout (little-endian, tightly packed, aligned so typed-array views work):

    struct header {
        uint32 magic;          // 0x54524147 ('GART')
        uint32 nHits;
        uint32 nEdges;         // candidate edges
        uint32 nFocusTracks;   // # particles passing pT + primary cut
        uint32 nFocusEdges;    // # truth edges connecting focus particles
        float32 scaleMm;       // multiply normalised coords by this to recover mm
    } ;                         // 24 bytes

    Float32  hits[nHits * 2];               // interleaved x,y in [-1, 1]
    Uint32   edges[nEdges * 2];             // interleaved src,dst hit indices
    Uint8    edgeY[nEdges];                 // 0/1 truth label, padded to 4-byte
    Int32    trackIds[nHits];               // dense focus-track id per hit, -1 = none
    Uint32   focusEdges[nFocusEdges * 2];   // src,dst hit indices, truth edges
    Int32    focusEdgePid[nFocusEdges];     // dense focus-track id per edge

Usage: python3 scripts/prep_tracking_event.py [/path/to/event.npz]
"""

import struct
import sys
from pathlib import Path

import numpy as np

NPZ = sys.argv[1] if len(sys.argv) > 1 else "/mnt/c/Users/rwh339/Downloads/event_000008843_slim.npz"
OUT = Path(__file__).resolve().parent.parent / "public" / "data" / "tracking_event.bin"

Z_MAX     = 1000.0   # mm — barrel half-length
PT_MIN_MEV = 1000.0  # 1 GeV
PRIMARY_VAL = 1.0    # primary == 1 (secondaries are 0 in this file)


def main():
    z = np.load(NPZ)
    hx, hy, hz = z["hit_x"], z["hit_y"], z["hit_z"]
    ei = z["edge_index"].astype(np.int64)   # (2, E) candidate
    ey = z["edge_y"].astype(bool)           # (E,)
    te = z["track_edges"].astype(np.int64)  # (2, T) truth track edges
    tpid = z["track_particle_id"].astype(np.int64)   # (T,)
    tpt  = z["track_particle_pt"].astype(np.float64) # (T,) MeV
    tprim = z["track_particle_primary"].astype(np.float64) # (T,)
    n_hits_raw = hx.size

    # Barrel cut on hits
    in_fid = np.abs(hz) < Z_MAX
    kept = np.where(in_fid)[0]
    old_to_new = -np.ones(n_hits_raw, dtype=np.int64)
    old_to_new[kept] = np.arange(len(kept))
    n_hits = len(kept)

    # ── Candidate edges (barrel) ────────────────────────────────────────────
    emask = (old_to_new[ei[0]] >= 0) & (old_to_new[ei[1]] >= 0)
    edges_new = np.stack(
        [old_to_new[ei[0, emask]], old_to_new[ei[1, emask]]],
        axis=0,
    ).T  # (nEdges, 2)
    edge_y = ey[emask]
    n_edges = edges_new.shape[0]

    # ── Focus tracks: pT > 1 GeV AND primary, edges in barrel ───────────────
    te_in = (old_to_new[te[0]] >= 0) & (old_to_new[te[1]] >= 0)
    pt_ok = (tpt > PT_MIN_MEV) & (tprim == PRIMARY_VAL)
    focus_edge_mask = te_in & pt_ok

    focus_te_old = te[:, focus_edge_mask]                     # (2, F) old hit ids
    focus_pid_raw = tpid[focus_edge_mask]                     # (F,) sparse pid
    focus_pt_raw  = tpt[focus_edge_mask]                      # (F,) MeV

    # Per-particle pT (one value per unique particle), to order the dense id
    # by descending pT so high-pT tracks get the brightest palette slots.
    upid_raw, first_idx = np.unique(focus_pid_raw, return_index=True)
    upid_pt = focus_pt_raw[first_idx]
    order = np.argsort(-upid_pt)            # descending pT
    upid_sorted = upid_raw[order]
    n_focus = len(upid_sorted)

    # Sparse → dense map
    pid_to_dense = {int(p): i for i, p in enumerate(upid_sorted)}
    focus_dense = np.array([pid_to_dense[int(p)] for p in focus_pid_raw], dtype=np.int32)

    # Remap focus edges to new (barrel-cut) hit space
    focus_te_new = np.stack(
        [old_to_new[focus_te_old[0]], old_to_new[focus_te_old[1]]],
        axis=0,
    ).T.astype(np.uint32)  # (F, 2)

    # ── Per-hit trackIds: dense focus-particle id, -1 if hit not on a focus track
    track_ids = -np.ones(n_hits, dtype=np.int32)
    # Walk focus edges and stamp particle id on both endpoints. If a hit
    # belongs to multiple focus particles (rare — vertex hits, shared modules),
    # last write wins. Order doesn't matter much because we just want a colour.
    track_ids[focus_te_new[:, 0]] = focus_dense
    track_ids[focus_te_new[:, 1]] = focus_dense

    # ── Normalise coords ────────────────────────────────────────────────────
    px = hx[kept].astype(np.float32)
    py = hy[kept].astype(np.float32)
    scale = float(max(np.abs(px).max(), np.abs(py).max()))
    px /= scale
    py /= scale

    hits_xy   = np.stack([px, py], axis=1).astype(np.float32)
    edges_u32 = edges_new.astype(np.uint32)
    edge_y_u8 = edge_y.astype(np.uint8)
    n_focus_edges = focus_te_new.shape[0]

    # ── Write binary ────────────────────────────────────────────────────────
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "wb") as f:
        # Header (24 bytes, 4-byte aligned)
        f.write(struct.pack("<IIIIIf", 0x54524147, n_hits, n_edges,
                            n_focus, n_focus_edges, scale))
        f.write(hits_xy.tobytes())                   # 8 * nHits
        f.write(edges_u32.tobytes())                 # 8 * nEdges
        f.write(edge_y_u8.tobytes())                 # nEdges
        pad = (-n_edges) & 3
        if pad:
            f.write(b"\x00" * pad)
        f.write(track_ids.tobytes())                 # 4 * nHits
        f.write(focus_te_new.tobytes())              # 8 * nFocusEdges
        f.write(focus_dense.tobytes())               # 4 * nFocusEdges

    size_mb = OUT.stat().st_size / 1024 / 1024
    print(f"wrote {OUT}  ({size_mb:.2f} MB)")
    print(f"  hits:          {n_hits}")
    print(f"  cand edges:    {n_edges}  (true: {int(edge_y_u8.sum())} · false: {int((~edge_y).sum())})")
    print(f"  focus tracks:  {n_focus}  (pT > {PT_MIN_MEV/1000:.1f} GeV AND primary)")
    print(f"  focus edges:   {n_focus_edges}")
    print(f"  scale:         {scale:.1f} mm")


if __name__ == "__main__":
    main()
