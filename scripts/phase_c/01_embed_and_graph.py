"""Phase C — embed + graph export.

Reads background_text.json + ongoing_text.json for all 124 faculty,
embeds via OpenAI text-embedding-3-large, computes pairwise P and W
cosine similarities, scores each pair as (W_sim - P_sim) = "shared
current work, different backgrounds", picks KNN=3 bridges per node,
runs 2D PCA on P for layout, and writes artifacts/nbi_research_graph.json.

Cost: ~$0.50 OpenAI. No Anthropic calls. Re-runs are cheap due to
per-faculty embeddings.json cache keyed on SHA-256 of text.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
import time
from pathlib import Path

import numpy as np
from openai import OpenAI
from sklearn.decomposition import PCA

REPO = Path(__file__).resolve().parents[2].parent
ARTIFACTS = REPO / "artifacts"
CORPUS = ARTIFACTS / "corpus"
PICKS = ARTIFACTS / "phase_a" / "picks.json"
OUT = ARTIFACTS / "nbi_research_graph.json"

MODEL = "text-embedding-3-large"
DIM = 3072
KNN = 3
PCA_N = 3


def sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_picks() -> list[dict]:
    with PICKS.open() as f:
        return json.load(f)["picks"]


def load_text(path: Path) -> str:
    if not path.exists():
        return ""
    data = json.loads(path.read_text())
    return (
        data.get("text")
        or data.get("background_text")
        or data.get("ongoing_text")
        or ""
    ).strip()


def load_cache(path: Path) -> dict | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text())
    except Exception:
        return None


def embed_batch(client: OpenAI, texts: list[str]) -> list[list[float]]:
    """Batch-embed with per-call cap of 16 to be nice on rate limits."""
    out: list[list[float]] = []
    B = 16
    for i in range(0, len(texts), B):
        chunk = texts[i : i + B]
        for attempt in range(3):
            try:
                resp = client.embeddings.create(model=MODEL, input=chunk)
                out.extend([d.embedding for d in resp.data])
                break
            except Exception as e:
                if attempt == 2:
                    raise
                wait = 2 ** attempt
                print(f"  embed retry {attempt + 1} in {wait}s: {e}", file=sys.stderr)
                time.sleep(wait)
    return out


def cosine_matrix(X: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    Xn = X / norms
    return Xn @ Xn.T


def main() -> int:
    client = OpenAI()
    picks = load_picks()
    print(f"[phase_c] {len(picks)} faculty loaded from picks.json")

    records: list[dict] = []
    p_texts_to_embed: list[tuple[int, str]] = []
    w_texts_to_embed: list[tuple[int, str]] = []
    p_vecs: list[list[float] | None] = [None] * len(picks)
    w_vecs: list[list[float] | None] = [None] * len(picks)

    for i, pick in enumerate(picks):
        pid = pick["id"]
        cdir = CORPUS / pid
        p_text = load_text(cdir / "background_text.json")
        w_text = load_text(cdir / "ongoing_text.json")
        p_hash = sha(p_text) if p_text else ""
        w_hash = sha(w_text) if w_text else ""

        cached = load_cache(cdir / "embeddings.json")
        p_hit = (
            cached
            and cached.get("model") == MODEL
            and cached.get("p_text_hash") == p_hash
            and cached.get("p_vec")
        )
        w_hit = (
            cached
            and cached.get("model") == MODEL
            and cached.get("w_text_hash") == w_hash
            and cached.get("w_vec")
        )
        if p_hit:
            p_vecs[i] = cached["p_vec"]
        elif p_text:
            p_texts_to_embed.append((i, p_text))
        if w_hit:
            w_vecs[i] = cached["w_vec"]
        elif w_text:
            w_texts_to_embed.append((i, w_text))

        records.append(
            {
                "idx": i,
                "id": pid,
                "name": pick["name"],
                "section": pick["section"],
                "rank": pick.get("rank", ""),
                "title": pick.get("title", ""),
                "p_text": p_text,
                "w_text": w_text,
                "p_hash": p_hash,
                "w_hash": w_hash,
                "has_p": bool(p_text),
                "has_w": bool(w_text),
            }
        )

    print(
        f"[phase_c] P: {sum(1 for v in p_vecs if v is not None)} cache-hit, "
        f"{len(p_texts_to_embed)} to embed"
    )
    print(
        f"[phase_c] W: {sum(1 for v in w_vecs if v is not None)} cache-hit, "
        f"{len(w_texts_to_embed)} to embed"
    )

    if p_texts_to_embed:
        vecs = embed_batch(client, [t for _, t in p_texts_to_embed])
        for (i, _), v in zip(p_texts_to_embed, vecs):
            p_vecs[i] = v
    if w_texts_to_embed:
        vecs = embed_batch(client, [t for _, t in w_texts_to_embed])
        for (i, _), v in zip(w_texts_to_embed, vecs):
            w_vecs[i] = v

    for i, pick in enumerate(picks):
        pid = pick["id"]
        (CORPUS / pid).mkdir(parents=True, exist_ok=True)
        payload = {
            "model": MODEL,
            "p_text_hash": records[i]["p_hash"],
            "w_text_hash": records[i]["w_hash"],
            "p_vec": p_vecs[i],
            "w_vec": w_vecs[i],
            "produced_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        }
        (CORPUS / pid / "embeddings.json").write_text(json.dumps(payload))

    zero = np.zeros(DIM, dtype=np.float32)
    P = np.stack(
        [np.asarray(v, dtype=np.float32) if v is not None else zero for v in p_vecs]
    )
    W = np.stack(
        [np.asarray(v, dtype=np.float32) if v is not None else zero for v in w_vecs]
    )

    P_sim = cosine_matrix(P)
    W_sim = cosine_matrix(W)
    np.fill_diagonal(P_sim, 0.0)
    np.fill_diagonal(W_sim, 0.0)
    score = W_sim - P_sim

    mask_p = np.array([r["has_p"] for r in records])
    mask_w = np.array([r["has_w"] for r in records])
    valid = mask_p & mask_w
    for i, ok in enumerate(valid):
        if not ok:
            score[i, :] = -np.inf
            score[:, i] = -np.inf

    topk: list[set[int]] = [set() for _ in records]
    for i in range(len(records)):
        if not valid[i]:
            continue
        order = np.argsort(-score[i])
        picked = 0
        for j in order:
            j = int(j)
            if j == i or not valid[j] or score[i, j] == -np.inf:
                continue
            topk[i].add(j)
            picked += 1
            if picked >= KNN:
                break

    edges: list[dict] = []
    seen: set[tuple[int, int]] = set()
    for i in range(len(records)):
        for j in topk[i]:
            a, b = (i, j) if i < j else (j, i)
            if (a, b) in seen:
                continue
            seen.add((a, b))
            mutual = (i in topk[j]) and (j in topk[i])
            edges.append(
                {
                    "source": records[a]["id"],
                    "target": records[b]["id"],
                    "w_sim": float(W_sim[a, b]),
                    "p_sim": float(P_sim[a, b]),
                    "score": float(score[a, b]),
                    "mutual": mutual,
                }
            )

    p_valid_idx = [i for i, ok in enumerate(valid) if ok]
    if len(p_valid_idx) >= 2:
        pca = PCA(n_components=PCA_N)
        coords_valid = pca.fit_transform(P[p_valid_idx])
        lo = coords_valid.min(axis=0)
        hi = coords_valid.max(axis=0)
        span = np.where(hi - lo > 0, hi - lo, 1.0)
        coords_norm = (coords_valid - lo) / span
        coords_by_idx = {idx: coords_norm[k].tolist() for k, idx in enumerate(p_valid_idx)}
        var = pca.explained_variance_ratio_.tolist()
    else:
        coords_by_idx = {}
        var = [0.0] * PCA_N

    nodes = []
    for i, r in enumerate(records):
        xyz = coords_by_idx.get(i, [0.5] * PCA_N)
        nodes.append(
            {
                "id": r["id"],
                "name": r["name"],
                "section": r["section"],
                "rank": r["rank"],
                "title": r["title"],
                "x": xyz[0],
                "y": xyz[1],
                "z": xyz[2] if len(xyz) > 2 else 0.5,
                "has_p": r["has_p"],
                "has_w": r["has_w"],
                "valid": bool(valid[i]),
                "p_text": r["p_text"],
                "w_text": r["w_text"],
            }
        )

    graph = {
        "meta": {
            "n_nodes": len(nodes),
            "n_edges": len(edges),
            "n_valid": int(valid.sum()),
            "embedding_model": MODEL,
            "embedding_dim": DIM,
            "knn": KNN,
            "score_formula": "w_sim - p_sim",
            "layout": f"PCA(P, n_components={PCA_N}) on valid nodes, normalized to [0,1]",
            "pca_explained_variance_ratio": var,
            "produced_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        },
        "nodes": nodes,
        "edges": edges,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(graph, ensure_ascii=False, indent=2))
    print(f"[phase_c] wrote {OUT} — {len(nodes)} nodes, {len(edges)} edges")
    print(
        f"[phase_c] PCA var: {' + '.join(f'{v:.3f}' for v in var)} = "
        f"{sum(var):.3f}"
    )

    for rel in ("stage/public/data", "stage/src/data"):
        (REPO / rel).mkdir(parents=True, exist_ok=True)
        (REPO / rel / "nbi_research_graph.json").write_text(
            json.dumps(graph, ensure_ascii=False)
        )
        print(f"[phase_c] mirrored to {REPO / rel}/nbi_research_graph.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
