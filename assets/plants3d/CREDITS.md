# 3D plant models · credits

Used by the Maker's 3D preview (`scripts/maker-3d.js`, mapped in `data/maker.js` → `models`).
All were downloaded on 10 Oct 2026 from Poly Pizza's static file host (`static.poly.pizza/<id>.glb`),
which is where each model page below serves its file. Licences were read on each model page.

**Changes made to every file (applies to the CC BY ones too):** textures baked into flat vertex
colours, textures/UVs/normals removed, meshes joined, simplified where noted, re-centred, quantized
(`KHR_mesh_quantization`), names stripped. In the browser the foliage is recoloured per plant.
`moss-cushion.glb` is 5 scaled copies of one bush.

| File | Used for | Original | Author | Licence | Source | Triangles (original → here) |
|---|---|---|---|---|---|---|
| `leaf-heart.glb` | Colour cultivars: Neon Pink, Pink Princess, Dark Maria, Black Velvet, Jewel Orchid (a scan's green texture can't be tinted) | Big Leaf Plant | reyshapes | CC0 1.0 | https://poly.pizza/m/aKIm5k6l5F | 732 → 732 |
| `leaf-monstera.glb` | Umbrella Plant, Fatsia | Large Monstera Plant | Isa Lousberg (Tiny Treats, "House Plants") | CC0 1.0 | https://poly.pizza/m/kZQ2WmnJFI · pack: https://tinytreats.itch.io/house-plants | 5,612 → 4,000 |
| `trail-pothos.glb` | Tradescantia Nanouk, Pink Fury (colour matters) | Pothos Plant Large | Isa Lousberg (Tiny Treats) | CC0 1.0 | https://poly.pizza/m/i7CfuCzaoo | 6,576 → 4,000 |
| `rosette-flat.glb` | Strawberry Begonia, Butterwort | Green Succulent | Isa Lousberg (Tiny Treats) | CC0 1.0 | https://poly.pizza/m/MMZ35YRwa9 | 924 → 924 |
| `moss-cushion.glb` | Mosses | Bush (×5) | Isa Lousberg (Tiny Treats) | CC0 1.0 | https://poly.pizza/m/I5KhMKZKju | 180 → 900 |

Licences: CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ ·
CC BY 3.0 https://creativecommons.org/licenses/by/3.0/

CC BY needs visible credit: it is on `maker.html`, under the Maker ("3D plant models: …").
Keep that line while any CC BY file above is in use.


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


## Sketchfab models (added 12 Oct 2026)

Downloaded through the Sketchfab API; licence read from each model's API record (all "CC Attribution", i.e. CC BY 4.0,
https://creativecommons.org/licenses/by/4.0/). Changes: pots and soil removed, parts joined into one mesh with one
texture, simplified to about 4–5k triangles, textures resized to 512 px WebP, quantized (`KHR_mesh_quantization`),
no meshopt/draco. Credited by name on `maker.html` under the Maker.

| File | Used for | Original | Author | Licence | Source |
|---|---|---|---|---|---|
| `trap-sundew.glb` | Cape Sundew | Sun Dew - Drosera Capensis | stephenandrewmalcolm (sketchfab.com/stephenandrewmalcolm) | **CC BY 4.0** | https://sketchfab.com/3d-models/sun-dew-drosera-capensis-109042c8c45240fb95b33cf365d7d9bb |
| `trap-sarracenia.glb` | North American Pitcher Plant | White-topped Pitcher plant | Libraries of Life (sketchfab.com/ExplorMorLabs) | **CC BY 4.0** | https://sketchfab.com/3d-models/white-topped-pitcher-plant-639d6edef0ca4f8897fe6dd994ca5d73 |
| `trap-nepenthes.glb` | Pitcher Plant (Nepenthes) | Carnivorous plant | Vanum-Chan (sketchfab.com/Patricia.Schad) | **CC BY 4.0** | https://sketchfab.com/3d-models/carnivorous-plant-138e1842493e4452923cb3351cf33aa6 |
| `leaf-monstera-real.glb` | Monstera, Rhaphidophora | Monstera Deliciosa Potted Mid-Century plant | Giora (sketchfab.com/ChubbyPanda) | **CC BY 4.0** | https://sketchfab.com/3d-models/monstera-deliciosa-potted-mid-century-plant-1ab9bf841df04c07b1819be596327629 |
| `trail-pothos-real.glb` | Trailing plants (default) | [FREE] Pothos Potted Plant - Money Plant | AllQuad (sketchfab.com/AllQuad) | **CC BY 4.0** | https://sketchfab.com/3d-models/free-pothos-potted-plant-money-plant-e9832f38484f4f85b3f9081b51fa3799 |
| `trail-pothos-marble.glb` | Pothos Marble Queen | Pothos Plant | Blizzy (sketchfab.com/jeffbas) | **CC BY 4.0** | https://sketchfab.com/3d-models/pothos-plant-175142c4942b42169455eb20c4033c9d |
| `rosette-echeveria-purple.glb` | Rosettes (default): Echeveria | Low Poly Purple Echeveria | Mak_Sensei (sketchfab.com/Mak_Sensei) | **CC BY 4.0** | https://sketchfab.com/3d-models/low-poly-purple-echeveria-5171385ab70f446d8263855d5098b1d1 |
| `air-tillandsia.glb` | Air plants (Tillandsia) | Air Plant v1.0 | YouniqueĪdeaStudio (sketchfab.com/sinnervoncrawsz) | **CC BY 4.0** | https://sketchfab.com/3d-models/air-plant-v10-22ceb29f9bd947c19a9f964d5a9533a1 |
| `fern-male.glb` | Ferns (default) | Realistic HD Male fern (3/50) | PlantCatalog (sketchfab.com/PlantCatalog) | **CC BY 4.0** | https://sketchfab.com/3d-models/realistic-hd-male-fern-350-5186272e16e3414e9240e093f37c3bf3 |
