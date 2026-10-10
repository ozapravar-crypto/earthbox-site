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
| `leaf-heart.glb` | Broad-leaf plants (default) | Big Leaf Plant | reyshapes | CC0 1.0 | https://poly.pizza/m/aKIm5k6l5F | 732 → 732 |
| `leaf-monstera.glb` | Monstera, Rhaphidophora, Umbrella Plant, Fatsia | Large Monstera Plant | Isa Lousberg (Tiny Treats, "House Plants") | CC0 1.0 | https://poly.pizza/m/kZQ2WmnJFI · pack: https://tinytreats.itch.io/house-plants | 5,612 → 4,000 |
| `trail-pothos.glb` | Trailing plants | Pothos Plant Large | Isa Lousberg (Tiny Treats) | CC0 1.0 | https://poly.pizza/m/i7CfuCzaoo | 6,576 → 4,000 |
| `rosette-echeveria.glb` | Rosettes (default) | Succulent | Isa Lousberg (Tiny Treats) | CC0 1.0 | https://poly.pizza/m/CBczazDjjU | 1,148 → 1,148 |
| `rosette-upright.glb` | Haworthia | Succulent | Isa Lousberg (Tiny Treats) | CC0 1.0 | https://poly.pizza/m/3Wh5uc4bdL | 1,092 → 1,092 |
| `rosette-flat.glb` | Strawberry Begonia, Butterwort | Green Succulent | Isa Lousberg (Tiny Treats) | CC0 1.0 | https://poly.pizza/m/MMZ35YRwa9 | 924 → 924 |
| `moss-cushion.glb` | Mosses | Bush (×5) | Isa Lousberg (Tiny Treats) | CC0 1.0 | https://poly.pizza/m/I5KhMKZKju | 180 → 900 |
| `air-bromeliad.glb` | Air plants (Tillandsia) | Bromeliad | Poly by Google | **CC BY 3.0** | https://poly.pizza/m/5FZIGjZBWTB | 1,380 → 1,376 |
| `fern-clump.glb` | Ferns (not Java / Bird's Nest) | Fern (×8) | Danni Bittman | **CC BY 3.0** | https://poly.pizza/m/6ttropQuVzQ | 984 → 520 per frond, 4,160 total |
| `trap-flytrap.glb` | Venus Flytrap | Venus flytrap | Poly by Google | **CC BY 3.0** | https://poly.pizza/m/0y4ZpRcGhoD | 2,672 → 2,610 |

Licences: CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ ·
CC BY 3.0 https://creativecommons.org/licenses/by/3.0/

CC BY needs visible credit: it is on `maker.html`, under the Maker ("3D plant models: …").
Keep that line while any CC BY file above is in use.

Not used, no licensed model found: sundew and pitcher plants (Bite) stay procedural.
Java Fern and Bird's Nest Fern stay procedural on purpose (strap leaves).
