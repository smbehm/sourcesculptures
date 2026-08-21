"""
dxf_pipe_and_export.py
-----------------------
Rhino 8 ScriptEditor (CPython 3)

Batch: for every .dxf in a chosen folder ->
  1. Import into a cleared document
  2. Force every object to #111111
  3. Find all curves with bounding-box diagonal < SMALL_THRESHOLD_MM
  4. Build pipe meshes around them (Radius/Segments/Faceted/CapType/
     Accuracy per the Properties panel screenshot)
  5. Top view, shaded display mode, zoom extents
  6. Write a high-res JPG (~10080 x 7024) with a pure white background,
     named after the source DXF, saved beside it

WHY NO ApplyCurvePiping COMMAND:
  The dash form still stops for an Enter on every file and there is no
  RhinoCommon API to set the piping *property* directly. Instead this
  bakes the same geometry with Rhino.Geometry.Mesh.CreateFromCurvePipe(),
  which is the exact mesh the piping display generates. Fully scripted,
  zero prompts, deterministic.

  Trade-off: the result is real mesh objects, not a display property on
  the curves. For raster export that is equivalent (and more
  predictable). If you ever need a .3dm that carries the live piping
  property, that has to stay a manual/command step.
"""
#! python 3
import rhinoscriptsyntax as rs
import scriptcontext as sc
import Rhino
import System
import os
import glob
import traceback

# ---------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------
TEST_FILE = None              # r"C:\...\29.dxf" to run a single file

SMALL_THRESHOLD_MM = 50.0

PIPE_RADIUS_MM = 1.0
PIPE_SEGMENTS = 16
PIPE_FACETED = False
PIPE_CAPTYPE = "Dome"         # None / Flat / Box / Dome
PIPE_ACCURACY = 50            # 0-100

OBJECT_COLOR = (17, 17, 17)   # #111111
DISPLAY_MODE = "Shaded"

# 10080 x 7024 is ~1.435:1, which is NOT 11x8.5 (1.294:1).
# For true sheet proportion at this width use 10080 x 7789.
IMG_WIDTH = 10080
IMG_HEIGHT = 7024
JPG_QUALITY = 95              # 0-100

MM = 2  # Rhino.UnitSystem.Millimeters

WHITE = System.Drawing.Color.White


def mm_to_doc_units(value_mm):
    """
    rs.UnitScale(to_system, from_system=None) returns the factor that
    converts a value FROM from_system TO to_system (from_system defaults
    to the current doc units). To turn a millimeter value into doc
    units, from_system must be MM and to_system must be the doc's own
    unit system - i.e. the arguments are the reverse of what you'd guess
    from the function's name.
    """
    return value_mm * rs.UnitScale(sc.doc.ModelUnitSystem, MM)


def get_dxf_list():
    if TEST_FILE:
        return [TEST_FILE]
    folder = rs.BrowseForFolder(message="Select folder containing DXF files")
    if not folder:
        return []
    files = glob.glob(os.path.join(folder, "*.dxf")) + \
            glob.glob(os.path.join(folder, "*.DXF"))
    return sorted(set(files))


def clear_document():
    ids = rs.AllObjects()
    if ids:
        rs.DeleteObjects(ids)
    sc.doc.Views.Redraw()


def import_dxf(path):
    ok = rs.Command('_-Import "{}" _Enter'.format(path), False)
    if not ok:
        print("  !! Import failed: {}".format(path))
    return ok


def make_attributes(color):
    """Attributes forcing an explicit object + plot color."""
    attr = Rhino.DocObjects.ObjectAttributes()
    attr.ColorSource = Rhino.DocObjects.ObjectColorSource.ColorFromObject
    attr.ObjectColor = color
    attr.PlotColorSource = \
        Rhino.DocObjects.ObjectPlotColorSource.PlotColorFromObject
    attr.PlotColor = color
    return attr


def color_all_objects():
    """
    ObjectColor alone does nothing unless ColorSource is switched to
    ColorFromObject - otherwise Rhino keeps inheriting the layer color.
    """
    ids = rs.AllObjects()
    if not ids:
        return 0

    color = System.Drawing.Color.FromArgb(*OBJECT_COLOR)
    count = 0
    for obj_id in ids:
        obj = sc.doc.Objects.FindId(obj_id)
        if not obj:
            continue
        attr = obj.Attributes
        attr.ColorSource = Rhino.DocObjects.ObjectColorSource.ColorFromObject
        attr.ObjectColor = color
        attr.PlotColorSource = \
            Rhino.DocObjects.ObjectPlotColorSource.PlotColorFromObject
        attr.PlotColor = color
        sc.doc.Objects.ModifyAttributes(obj, attr, True)
        count += 1

    sc.doc.Views.Redraw()
    return count


def find_small_curves(threshold_mm):
    """Return (guid, Curve) for every curve under the diagonal threshold."""
    threshold = mm_to_doc_units(threshold_mm)
    found = []
    for obj_id in rs.AllObjects():
        bbox = rs.BoundingBox(obj_id)
        if not bbox:
            continue
        if rs.Distance(bbox[0], bbox[6]) >= threshold:
            continue
        obj = sc.doc.Objects.FindId(obj_id)
        if not obj:
            continue
        geo = obj.Geometry
        if isinstance(geo, Rhino.Geometry.Curve):
            found.append((obj_id, geo))
    return found


def cap_style(name):
    """
    Resolve by reflecting over the enum's real member names. Avoids
    getattr-by-name entirely, since "None" is a Python keyword and the
    .NET member surfaces under an unpredictable identifier depending on
    the Python.NET binding.
    """
    enum_type = Rhino.Geometry.MeshPipeCapStyle
    names = list(System.Enum.GetNames(enum_type))

    key = (name or "dome").strip().lower().rstrip("_")
    aliases = {
        "none": ("none", "nocap", "open"),
        "open": ("none", "nocap", "open"),
        "flat": ("flat",),
        "box": ("box", "flatextended"),
        "dome": ("dome", "round", "roundcap"),
    }.get(key, (key,))

    for member in names:
        if member.strip().lower().rstrip("_") in aliases:
            return System.Enum.Parse(enum_type, member)

    print("  !! Cap style '{}' not found. Available: {}".format(name, names))
    return System.Enum.Parse(enum_type, names[0])


def build_pipe_meshes(curve_pairs):
    """
    Mesh.CreateFromCurvePipe() generates the same mesh the Curve Piping
    display would - but in code, with no command prompt.
    """
    radius = mm_to_doc_units(PIPE_RADIUS_MM)
    caps = cap_style(PIPE_CAPTYPE)
    color = System.Drawing.Color.FromArgb(*OBJECT_COLOR)
    attr = make_attributes(color)

    added = 0
    failed = 0
    first_error = None
    for _, curve in curve_pairs:
        try:
            mesh = Rhino.Geometry.Mesh.CreateFromCurvePipe(
                curve, radius, PIPE_SEGMENTS, PIPE_ACCURACY,
                caps, PIPE_FACETED)
        except Exception as ex:
            if first_error is None:
                first_error = "{}: {}".format(type(ex).__name__, ex)
            mesh = None

        if mesh is None:
            failed += 1
            continue

        if sc.doc.Objects.AddMesh(mesh, attr) != System.Guid.Empty:
            added += 1
        else:
            failed += 1

    sc.doc.Views.Redraw()
    if first_error:
        print("  !! first pipe error: {}".format(first_error))
    return added, failed


def setup_view():
    view = sc.doc.Views.ActiveView
    if view is None:
        print("  !! No active view.")
        return None

    vp = view.ActiveViewport
    vp.SetProjection(Rhino.Display.DefinedViewportProjection.Top, None, False)

    dmd = Rhino.Display.DisplayModeDescription.FindByName(DISPLAY_MODE)
    if dmd:
        vp.DisplayMode = dmd
    else:
        print("  !! Display mode '{}' not found.".format(DISPLAY_MODE))

    rs.ZoomExtents()
    sc.doc.Views.Redraw()
    return view


def flatten_onto_white(bitmap):
    """
    Composite the capture onto an opaque white sheet. Handles the
    transparent-background case and guarantees pure white regardless of
    the viewport's gradient background - PROVIDED the capture actually
    came back with real alpha. If ViewCaptureSettings ignored the
    transparent-background request (see write_jpg), the source bitmap is
    already fully opaque with whatever the display mode's background
    color is, and this composite will just preserve that color instead
    of forcing white. Verify the first output file per session.
    """
    flat = System.Drawing.Bitmap(bitmap.Width, bitmap.Height,
                                 System.Drawing.Imaging.PixelFormat.Format24bppRgb)
    g = System.Drawing.Graphics.FromImage(flat)
    try:
        g.Clear(WHITE)
        g.DrawImage(bitmap, 0, 0, bitmap.Width, bitmap.Height)
    finally:
        g.Dispose()
    return flat


def jpeg_encoder_params():
    codec = None
    for enc in System.Drawing.Imaging.ImageCodecInfo.GetImageEncoders():
        if enc.MimeType == "image/jpeg":
            codec = enc
            break
    params = System.Drawing.Imaging.EncoderParameters(1)
    # Must be Int64. A plain Python int binds to the wrong overload and
    # GDI+ rejects the whole parameter block with "Parameter is not valid".
    params.Param[0] = System.Drawing.Imaging.EncoderParameter(
        System.Drawing.Imaging.Encoder.Quality,
        System.Int64(JPG_QUALITY))
    return codec, params


def save_jpeg(bitmap, path):
    """Try the quality-controlled encoder, fall back to a plain save."""
    try:
        codec, params = jpeg_encoder_params()
        if codec:
            bitmap.Save(path, codec, params)
            return True
    except Exception as ex:
        print("  .. encoder save failed ({}: {}), falling back"
              .format(type(ex).__name__, ex))

    try:
        bitmap.Save(path, System.Drawing.Imaging.ImageFormat.Jpeg)
        return True
    except Exception as ex:
        print("  !! plain JPEG save failed: {}: {}"
              .format(type(ex).__name__, ex))
        return False


def write_jpg(view, jpg_path):
    bitmap = None
    flat = None
    try:
        size = System.Drawing.Size(IMG_WIDTH, IMG_HEIGHT)
        settings = Rhino.Display.ViewCaptureSettings(view, size, 300)

        # Ask for a transparent background so the composite below decides
        # the final color. If unsupported, the flatten still runs.
        for prop in ("TransparentBackground", "DrawBackground",
                     "DrawGroundPlane", "DrawGrid", "DrawAxes"):
            try:
                setattr(settings, prop,
                        True if prop == "TransparentBackground" else False)
            except Exception:
                pass

        try:
            bitmap = Rhino.Display.ViewCapture.CaptureToBitmap(settings)
        except Exception:
            bitmap = view.CaptureToBitmap(size)

        if bitmap is None:
            print("  !! Capture returned no bitmap.")
            return False

        print("  captured {}x{}".format(bitmap.Width, bitmap.Height))

        flat = flatten_onto_white(bitmap)

        if not save_jpeg(flat, jpg_path):
            return False

        return os.path.exists(jpg_path)

    except Exception as ex:
        print("  !! JPG WRITE FAILED: {}: {}".format(type(ex).__name__, ex))
        traceback.print_exc()
        return False
    finally:
        if flat:
            flat.Dispose()
        if bitmap:
            bitmap.Dispose()


def process_one(path):
    print("Processing: {}".format(path))
    clear_document()

    if not import_dxf(path):
        return False
    sc.doc.Views.Redraw()

    recolored = color_all_objects()
    total = len(rs.AllObjects())

    small = find_small_curves(SMALL_THRESHOLD_MM)
    print("  {} of {} objects small (<{}mm); recolored {}".format(
        len(small), total, SMALL_THRESHOLD_MM, recolored))

    if small:
        added, failed = build_pipe_meshes(small)
        print("  piped {} curves ({} failed)".format(added, failed))
    else:
        print("  nothing to pipe")

    rs.UnselectAllObjects()

    view = setup_view()
    if view is None:
        return False

    base = os.path.splitext(os.path.basename(path))[0]
    jpg_path = os.path.join(os.path.dirname(path), base + ".jpg")

    if write_jpg(view, jpg_path):
        print("  -> {} ({}x{})".format(jpg_path, IMG_WIDTH, IMG_HEIGHT))
        return True

    print("  !! JPG NOT CONFIRMED for {}".format(jpg_path))
    return False


def main():
    print("=== dxf_pipe_and_export.py  rev6 (mesh-baked piping, JPG out) ===")
    files = get_dxf_list()
    if not files:
        print("No DXF files found / cancelled.")
        return
    print("Found {} DXF file(s).".format(len(files)))

    succeeded, failed = [], []
    for f in files:
        try:
            (succeeded if process_one(f) else failed).append(f)
        except Exception as ex:
            print("  !! UNHANDLED: {}: {}".format(type(ex).__name__, ex))
            traceback.print_exc()
            failed.append(f)

    print("Done. {} succeeded, {} failed.".format(len(succeeded), len(failed)))
    for f in failed:
        print("  FAILED: {}".format(f))


if __name__ == "__main__":
    main()
