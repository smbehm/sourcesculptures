#!/usr/bin/env python3
"""
Prompts for a folder, then for every .dxf file in it: doubles the size
of the part-number labels in place (keeping the same center point),
gives them a bold stroke, adds a white box 1mm larger than each
label's bounding box on every side (so linework behind a label doesn't
clutter it), and saves a same-named, 11x8.5in landscape, print-ready
PDF into that same folder. Part outlines are left untouched.

Run:
    pip3 install ezdxf matplotlib
    python3 process_dxf_folder.py
(then type/paste the folder path when asked)
"""
import glob
import os

import ezdxf
from ezdxf.math import BoundingBox
from ezdxf.addons.drawing import RenderContext, Frontend
from ezdxf.addons.drawing.matplotlib import MatplotlibBackend
from ezdxf.addons.drawing.config import Configuration, ColorPolicy, BackgroundPolicy
from matplotlib.patches import Rectangle
import matplotlib.pyplot as plt

# --- label detection / scaling ------------------------------------------
SIZE_THRESHOLD = 20.0   # max bbox dimension below which an LWPOLYLINE is a label, not a part
CLUSTER_GAP = 12.0      # max gap between label entities to merge into one label
SCALE = 2.0
STROKE_FRACTION = 0.14  # stroke width as a fraction of the scaled label height
STROKE_MIN = 0.7
STROKE_MAX = 2.2

# --- print PDF layout -----------------------------------------------------
PAGE_W_IN = 11.0
PAGE_H_IN = 8.5
MARGIN_IN = 0.25
LABEL_BOX_MARGIN = 1.0  # mm, on each side of a (post-scale) label's bounding box
PRINT_LABEL_SIZE_THRESHOLD = 40.0  # labels are ~2x bigger after scaling, so raise the cutoff


def classify_and_cluster(msp, size_threshold, cluster_gap):
    labels = []
    parts = []
    for e in msp:
        if e.dxftype() != "LWPOLYLINE":
            continue
        pts = list(e.get_points())
        if not pts:
            continue
        bbox = BoundingBox()
        for p in pts:
            bbox.extend([(p[0], p[1], 0)])
        w, h = bbox.size.x, bbox.size.y
        (labels if max(w, h) < size_threshold else parts).append((e, bbox))

    n = len(labels)
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    def bbox_gap(b1, b2):
        dx = max(0.0, max(b1.extmin.x, b2.extmin.x) - min(b1.extmax.x, b2.extmax.x))
        dy = max(0.0, max(b1.extmin.y, b2.extmin.y) - min(b1.extmax.y, b2.extmax.y))
        return (dx ** 2 + dy ** 2) ** 0.5

    for i in range(n):
        for j in range(i + 1, n):
            if bbox_gap(labels[i][1], labels[j][1]) < cluster_gap:
                union(i, j)

    clusters = {}
    for i in range(n):
        clusters.setdefault(find(i), []).append(i)

    label_clusters = []
    for idxs in clusters.values():
        bb = BoundingBox()
        for i in idxs:
            bb.extend([labels[i][1].extmin, labels[i][1].extmax])
        label_clusters.append(([labels[i][0] for i in idxs], bb))

    return label_clusters, parts


def scale_and_bolden_labels(msp):
    label_clusters, _ = classify_and_cluster(msp, SIZE_THRESHOLD, CLUSTER_GAP)
    for entities, bbox in label_clusters:
        cx, cy = bbox.center.x, bbox.center.y
        stroke_width = max(STROKE_MIN, min(STROKE_MAX, STROKE_FRACTION * bbox.size.y * SCALE))
        for e in entities:
            new_points = [
                (cx + (x - cx) * SCALE, cy + (y - cy) * SCALE, 0.0, 0.0, bulge)
                for x, y, start_w, end_w, bulge in e.get_points()
            ]
            e.set_points(new_points)
            e.dxf.const_width = stroke_width


def render_print_pdf(doc, out_path):
    msp = doc.modelspace()
    label_clusters, parts = classify_and_cluster(msp, PRINT_LABEL_SIZE_THRESHOLD, CLUSTER_GAP)
    label_entities = [e for entities, _ in label_clusters for e in entities]
    part_entities = [e for e, _ in parts]

    fig = plt.figure(figsize=(PAGE_W_IN, PAGE_H_IN))
    margin_x = MARGIN_IN / PAGE_W_IN
    margin_y = MARGIN_IN / PAGE_H_IN
    ax = fig.add_axes([margin_x, margin_y, 1 - 2 * margin_x, 1 - 2 * margin_y])
    ax.set_aspect("equal")
    ax.axis("off")

    ctx = RenderContext(doc)
    ctx.set_current_layout(msp)
    config = Configuration(background_policy=BackgroundPolicy.WHITE, color_policy=ColorPolicy.BLACK)
    backend = MatplotlibBackend(ax, adjust_figure=False)
    frontend = Frontend(ctx, backend, config=config)
    frontend.set_background(ctx.current_layout_properties.background_color)

    frontend.draw_entities(part_entities)
    box_zorder = backend._current_z - 0.5
    for _, cbbox in label_clusters:
        ax.add_patch(Rectangle(
            (cbbox.extmin.x - LABEL_BOX_MARGIN, cbbox.extmin.y - LABEL_BOX_MARGIN),
            cbbox.size.x + 2 * LABEL_BOX_MARGIN,
            cbbox.size.y + 2 * LABEL_BOX_MARGIN,
            facecolor="white", edgecolor="none", zorder=box_zorder,
        ))
    frontend.draw_entities(label_entities)
    frontend.pipeline.finalize()

    fig.savefig(out_path, format="pdf")
    plt.close(fig)


def main():
    folder = input("Folder containing your .dxf files: ").strip().strip('"')
    dxf_paths = sorted(glob.glob(os.path.join(folder, "*.dxf")))
    if not dxf_paths:
        print(f"No .dxf files found in {folder}")
        return

    for path in dxf_paths:
        doc = ezdxf.readfile(path)
        scale_and_bolden_labels(doc.modelspace())
        out_path = os.path.splitext(path)[0] + ".pdf"
        render_print_pdf(doc, out_path)
        print(f"{os.path.basename(path)} -> {os.path.basename(out_path)}")

    print(f"Done: {len(dxf_paths)} PDF(s) written to {folder}")


if __name__ == "__main__":
    main()
