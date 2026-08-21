#!/usr/bin/env python3
"""
Double the size of part-number labels in a nested CNC-cut DXF, in place,
and give each label a bold stroke so it engraves/reads more clearly.

How labels are told apart from parts:
  - The CNC part outlines are large (hundreds to thousands of drawing
    units) closed LWPOLYLINEs.
  - The number labels are small (a few units) LWPOLYLINEs -- some open
    (e.g. the strokes of a "1" or "7"), some closed (e.g. the loop of a
    "0", "6", "8", "9"). Size, not open/closed-ness, is what reliably
    separates labels from parts (a handful of digit glyphs are themselves
    closed curves).
  - A multi-digit label is several small LWPOLYLINEs sitting right next
    to each other, so after picking out the small entities we cluster
    them by proximity into per-label groups.

For each label cluster we scale every point 2x about the cluster's own
bounding-box center (so the label stays centered on the same spot, just
bigger) and set a constant width (DXF group code 43 / LWPOLYLINE
const_width) on each entity, proportional to the label's new height, so
the label renders/engraves as a bold stroke instead of a hairline.

Usage:
    python3 scale_labels.py input.dxf output.dxf
    python3 scale_labels.py input.dxf output.dxf --size-threshold 20 \
        --cluster-gap 12 --scale 2.0 --stroke-fraction 0.07
"""
import argparse
import sys

import ezdxf
from ezdxf.math import BoundingBox


def classify_and_cluster(msp, size_threshold, cluster_gap):
    """Split modelspace LWPOLYLINEs into (label, part) groups, and further
    group the label entities into per-label clusters by bbox proximity."""
    labels = []  # list of (entity, bbox)
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
        if max(w, h) < size_threshold:
            labels.append((e, bbox))
        else:
            parts.append((e, bbox))

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
        entities = [labels[i][0] for i in idxs]
        label_clusters.append((entities, bb))

    return label_clusters, parts


def scale_cluster(entities, bbox, scale, stroke_fraction, stroke_min, stroke_max):
    cx, cy = bbox.center.x, bbox.center.y
    scaled_h = bbox.size.y * scale
    stroke_width = stroke_fraction * scaled_h
    stroke_width = max(stroke_min, min(stroke_max, stroke_width))

    for e in entities:
        new_points = []
        for x, y, start_w, end_w, bulge in e.get_points():
            nx = cx + (x - cx) * scale
            ny = cy + (y - cy) * scale
            new_points.append((nx, ny, 0.0, 0.0, bulge))
        e.set_points(new_points)
        e.dxf.const_width = stroke_width


def process(in_path, out_path, size_threshold, cluster_gap, scale,
            stroke_fraction, stroke_min, stroke_max):
    doc = ezdxf.readfile(in_path)
    msp = doc.modelspace()

    label_clusters, parts = classify_and_cluster(msp, size_threshold, cluster_gap)

    print(f"Found {len(label_clusters)} label cluster(s) and {len(parts)} part outline(s).")
    for entities, bbox in label_clusters:
        scale_cluster(entities, bbox, scale, stroke_fraction, stroke_min, stroke_max)

    doc.saveas(out_path)
    print(f"Saved: {out_path}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input", help="input DXF path")
    ap.add_argument("output", help="output DXF path")
    ap.add_argument("--size-threshold", type=float, default=20.0,
                     help="max bbox dimension (drawing units) below which an LWPOLYLINE is treated as label geometry, not a part (default: 20)")
    ap.add_argument("--cluster-gap", type=float, default=12.0,
                     help="max gap (drawing units) between label entity bboxes to merge them into one label (default: 12)")
    ap.add_argument("--scale", type=float, default=2.0, help="label scale factor (default: 2.0)")
    ap.add_argument("--stroke-fraction", type=float, default=0.07,
                     help="stroke width as a fraction of the scaled label height (default: 0.07)")
    ap.add_argument("--stroke-min", type=float, default=0.35, help="minimum stroke width, drawing units (default: 0.35)")
    ap.add_argument("--stroke-max", type=float, default=1.2, help="maximum stroke width, drawing units (default: 1.2)")
    args = ap.parse_args()

    process(args.input, args.output, args.size_threshold, args.cluster_gap,
             args.scale, args.stroke_fraction, args.stroke_min, args.stroke_max)


if __name__ == "__main__":
    sys.exit(main())
