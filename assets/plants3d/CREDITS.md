# 3D plant models · credits

Used by the Maker's 3D preview (`scripts/maker-3d.js`, mapped in `data/maker.js` → `models`).
All were downloaded on 10 Oct 2026 from Poly Pizza's static file host (`static.poly.pizza/<id>.glb`),
which is where each model page below serves its file. Licences were read on each model page.

**Changes made to every file (applies to the CC BY ones too):** textures baked into flat vertex
colours, textures/UVs/normals removed, meshes joined, simplified where noted, re-centred, quantized
(`KHR_mesh_quantization`), names stripped. In the browser the foliage is recoloured per plant.
`fern-clump.glb` is 8 copies of one frond arranged in a ring; `moss-cushion.glb` is 5 scaled copies
of one bush; `air-bromeliad.glb` and `trap-flytrap.glb` had their soil base removed.

| File | Used for | Original | Author | Licence | Source | Triangles (original → here) |
|---|---|---|---|---|---|---|
| `leaf-heart.glb` | Colour cultivars: Neon Pink, Pink Princess, Dark Maria, Black Velvet, Jewel Orchid (a scan's green texture can't be tinted) | Big Leaf Plant | reyshapes | CC0 1.0 | https://poly.pizza/m/aKIm5k6l5F | 732 → 732 |
| `leaf-monstera.glb` | Monstera, Rhaphidophora, Umbrella Plant, Fatsia | Large Monstera Plant | Isa Lousberg (Tiny Treats, "House Plants") | CC0 1.0 | https://poly.pizza/m/kZQ2WmnJFI · pack: https://tinytreats.itch.io/house-plants | 5,612 → 4,000 |
| `trail-pothos.glb` | Trailing plants | Pothos Plant Large | Isa Lousberg (Tiny Treats) | CC0 1.0 | https://poly.pizza/m/i7CfuCzaoo | 6,576 → 4,000 |
| `rosette-echeveria.glb` | Rosettes (default) | Succulent | Isa Lousberg (Tiny Treats) | CC0 1.0 | https://poly.pizza/m/CBczazDjjU | 1,148 → 1,148 |
| `rosette-flat.glb` | Strawberry Begonia, Butterwort | Green Succulent | Isa Lousberg (Tiny Treats) | CC0 1.0 | https://poly.pizza/m/MMZ35YRwa9 | 924 → 924 |
| `moss-cushion.glb` | Mosses | Bush (×5) | Isa Lousberg (Tiny Treats) | CC0 1.0 | https://poly.pizza/m/I5KhMKZKju | 180 → 900 |
| `air-bromeliad.glb` | Air plants (Tillandsia) | Bromeliad | Poly by Google | **CC BY 3.0** | https://poly.pizza/m/5FZIGjZBWTB | 1,380 → 1,376 |
| `fern-clump.glb` | Ferns (not Java / Bird's Nest) | Fern (×8) | Danni Bittman | **CC BY 3.0** | https://poly.pizza/m/6ttropQuVzQ | 984 → 520 per frond, 4,160 total |

Licences: CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ ·
CC BY 3.0 https://creativecommons.org/licenses/by/3.0/

CC BY needs visible credit: it is on `maker.html`, under the Maker ("3D plant models: …").
Keep that line while any CC BY file above is in use.

Not used, no licensed model found: sundew and pitcher plants (Bite) stay procedural.
Java Fern and Bird's Nest Fern stay procedural on purpose (strap leaves).

## Realistic scans (added 12 Oct 2026)

Downloaded from Poly Haven (CC0, no attribution required; credited here anyway) and Poly Pizza.
Changes: leaves-only meshes kept, simplified, textures resized to 512 px WebP, quantized
(`KHR_mesh_quantization`); meshopt compression removed so no WebAssembly decoder is needed
(the site's CSP allows no `wasm-unsafe-eval`). They keep their own textures; the Maker shades
them gently toward each plant's colour.

| File | Used for | Original | Author | Licence | Source |
|---|---|---|---|---|---|
| `leaf-syngonium.glb` | Broad/heart leaves (default): Syngonium, Philodendron, Alocasia… | Potted Plant 02 (leaves) | Rico Cilliers | CC0 1.0 | https://polyhaven.com/a/potted_plant_02 |
| `leaf-anthurium.glb` | Anthuriums, Peace Lily | Anthurium Botany 01 | Rob Tuytel, Rico Cilliers | CC0 1.0 | https://polyhaven.com/a/anthurium_botany_01 |
| `rosette-haworthia.glb` | Haworthia | Potted Plant 04 (plant) | James Ray Cock | CC0 1.0 | https://polyhaven.com/a/potted_plant_04 |
| `fern-strap.glb` | Java Fern, Bird's Nest Fern | Fern 02 | Rob Tuytel, Rico Cilliers | CC0 1.0 | https://polyhaven.com/a/fern_02 |
| `trap-flytrap-real.glb` | Venus Flytrap (original textures) | Venus flytrap | Poly by Google | **CC BY 3.0** | https://poly.pizza/m/0y4ZpRcGhoD |

The CC BY flytrap is the same model as before, so the Maker's existing credit line still covers it.

