# Technical notes

Derivations behind the bench. All angles in radians unless marked.

`R` = shell radius (3000 mm) · `n̂` = outward unit surface direction ·
`ψ` = angle between a sightline and the local radius · `k = D/R` for an observer at
distance `D` from the sphere centre.

---

## 1. Why a single-layer surface pattern cannot produce an omnidirectional burst

**Hairy ball theorem.** There is no continuous non-vanishing tangent vector field on S².
Any continuous tangent *direction* field must carry total index +2.

For an **unoriented line field** — which is what a cut or engraved lattice is, since a
stripe has no arrowhead — half-integer defects are admissible, and the minimum-energy
configuration is four +½ disclinations on tetrahedral vertices. The covering radius of the
tetrahedral 4-point set is **70.53°**, so the nearest defect can sit near the limb.

For a **triangulated mesh**, a 5-fold vertex is a +1 disclination and Euler forces exactly
twelve of them. Icosahedral placement gives a covering radius of **37.38°**, so a defect is
always within 37.4° of any sightline — inside the visible disk, but still fixed to the
object rather than tracking the viewer.

Either way the burst points are welded to the sphere. Loxodromes, Vogel phyllotaxis and
Doyle spirals are all two-pole solutions. **A tangential pattern cannot do it.**

The way out is to stop treating it as a surface problem.

---

## 2. Radial members: exact, not perceptual

Any line segment whose extension passes through the sphere centre projects — under
orthographic *or* perspective projection, from any viewpoint — onto a ray through the image
of that centre.

Proof (orthographic, view direction **v**): a radial segment runs from `R₂û` to `R₁û`.
Projection removes the component along **v**, leaving `R₂û⊥` and `R₁û⊥` where
`û⊥ = û − (û·v)v`. Both are scalar multiples of the same in-plane vector, so the projected
segment lies on a ray from the origin of the image. Under perspective it is even more
direct: all radial lines pass through the centre, which projects to a single point, so all
their images pass through it — a true vanishing point.

Projected length scales as `sin θ`, so radial members vanish to points at the disk centre
and reach full length at the limb. This is a projective identity, not an illusion, and
there is no topological obstruction because a radial field is not tangent.

---

## 3. Louver gating

A through-cut of width `w` in a wall of thickness `t`, drilled along `n̂`, transmits only
within an acceptance cone:

    T(ψ) = max(0, 1 − (t/w)·tan ψ)          ψ_max = arctan(w/t)

For a **round** hole of diameter `d` the clear area is the overlap of two circles offset by
`t·tan ψ`:

    T(ψ) = (2/π)·[arccos x − x√(1−x²)]      x = min(1, t·tan ψ / d)

Half-transmission at `ψ = arctan(0.404·d/t)`. The `arccos` rolloff is markedly softer than
the linear slot function — the better gradient for a graded corona.

Cut the holes **radially** and `ψ` becomes the angular distance from the centre of the
visible disk: the shell is optically open at whatever point faces you and progressively
opaque toward the limb. The aperture follows the viewer because radiality is
view-independent.

### Thin walls cannot collimate

At `t = 3 mm`, a 15° cone needs `d = 0.80 mm`. Reaching 3 % open area over a 6 m sphere at
that hole size requires order 10⁶ holes — a non-starter. Widen to slots and the slug becomes
a needle that tips and tack-welds in the kerf.

### Shell separation is the collimator

For two concentric perforated skins at separation `g` with hole patterns matched by radial
projection, a ray entering an outer hole travels `L = g/cos ψ` before reaching the inner
shell, drifting laterally by

    Δ = g · tan ψ            ⟹      ψ_max = arctan(d/g)

Identical to the louver formula with `t → g`. **Plate thickness drops out entirely** — the
structural frame depth is the optical element. Registration tolerance is the risk: an error
`δ` shifts the cone by `arctan(δ/g)`.

---

## 4. The interior light volume (what the bench implements)

With an internal luminous body of radius `r`, everything above collapses. A sightline
through an aperture at angle `ψ` to the local radius has impact parameter `R·sin ψ` relative
to the centre, and strikes the core iff `R sin ψ ≤ r`:

    ψ_max = arcsin(r / R)

**Exact, and independent of hole diameter and wall thickness** — the hole only has to be big
enough to look through. At `d = 40 mm` in `t = 3 mm` the wall's own vignetting cutoff is
85.6°, nowhere near interfering.

Because `ψ_max` depends only on radius, a radially graded interior luminance maps directly
onto angular brightness:

    B(ψ) = L(R · sin ψ)

The radial light distribution inside **is** the corona profile outside. Nested lit scrims at
`r₁ < r₂ < r₃` give a stepped corona with edges at `arcsin(rᵢ/R)`.

### Finite observer distance

With the eye at `D` from the centre, `k = D/R`, `ρ = r/R`, a hole at surface angle `θ` from
the sightline axis shows the core iff

    k·sin θ ≤ ρ·√(1 + k² − 2k·cos θ)

Solving the boundary:

    cos θmax = [ρ² + √((1−ρ²)(k²−ρ²))] / k

Checks: `k → ∞` gives `θmax = arcsin ρ` (orthographic); `ρ = 1` gives
`θmax = arccos(1/k)`, the silhouette. Small-angle: `θmax ≈ ρ·(k−1)/k`.

The core therefore **contracts to a point as you approach and blooms as you retreat**. The
silhouette also pulls in: at `k = 3` the visible cap is only 70.5°, not 90°.

---

## 5. Front/back overlay

You always see the far wall through the near apertures. Orthographically, a near point at
polar angle `θ` from the sightline overlays a far point at `180° − θ` at the same azimuth —
that is, **the pattern superposed on its own mirror image, reflected through the plane
normal to your line of sight.**

The mirror plane is defined by the viewer, so the interference is centre-locked for free.
A chiral pattern therefore always superimposes on its opposite hand, and two identical
counter-handed log-spiral gratings superpose into a **radial ray star from the centre** —
standard rotational moiré.

This is directly visible in the bench on the parastichy family: the far-wall spirals run
counter to the near ones. Use the **far wall** slider to separate the depths.

Also automatic: both walls foreshorten by `cos θ` toward the limb, so projected density goes
as `1/cos θ` and the two walls converge at the silhouette — dense dark rim, open bright
centre.

---

## 6. Nested-shell moiré

Two concentric openwork shells at `R₁ < R₂` sharing the same angular lattice. A ray with
impact parameter `b` hits them at `arcsin(b/R₁)` and `arcsin(b/R₂)`, so the misregistration

    Δθ(b) = arcsin(b/R₁) − arcsin(b/R₂)

is zero at `b = 0` and grows monotonically toward the limb. The lattices register perfectly
at whatever point faces you and beat outward from there — the rosette centre tracks the
viewer. Ring count ≈ `Δθ(0.9R₁) / λ` where `λ ≈ √(4π/N)` is the lattice angular pitch for
`N` nodes.

Rotating the inner shell, or building both as Class III chiral geodesics, turns the
concentric rosette into a spiral.

---

## 7. Measurement method

See the README for the co-area derivation. Summary:

    open fraction = mean[ f < 0 ]                    over an equal-area map
    perimeter     = (4π / 3ε) × mean[ |f| < 1.5ε|∇f| ]

The surface gradient is taken by finite differences along two orthonormal tangents with
angular step `ε`. Setting the band half-width proportional to `|∇f|` makes the estimator
independent of field scaling, which is why one implementation serves every family.

`ε` must satisfy two competing constraints: the band must span several texels to be sampled
at all, and `1.5ε` must stay inside the thinner phase or the band clips against itself at a
feature centre and the perimeter over-reads. The solver iterates on the measured phase
widths `2·A/P`; when it cannot satisfy both, the cut-path figure is flagged.

Validated against `N` non-overlapping spherical caps (area `N(1−cos ρ)/2`, perimeter
`N·2π·sin ρ`): worst area error 0.15 %, worst perimeter error 0.27 %.

---

## References

- Keinert, Innmann, Sänger, Stamminger — *Spherical Fibonacci Mapping*, SIGGRAPH Asia 2015.
  The O(1) inverse lattice lookup used by every phyllotaxis-family pattern here.
- Vogel — *A better way to construct the sunflower head*, Math. Biosci. 44 (1979).
- Schoen — *Infinite periodic minimal surfaces without self-intersections*, NASA TN D-5541
  (1970). Origin of the gyroid.
