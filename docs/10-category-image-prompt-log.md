# JIESTAR Category Image Prompt Log

This file records the generation direction for the first Shopify collection category image set.

## 2026-05-13 Category Image Set

Scope:

- Included: `Pirates`, `Fairground`, `Technic`, `Movie & Game`, `Modular Buildings`, `Gun`, `Trains`, `Military`, `Space`
- Added later: `Other`
- Excluded: `Home page`, `New Arrivals`
- Delivery mode: generated image assets only; no code or Shopify integration changes in this step.

Master style:

```text
High-end 3D building block model render, clean warm-white/light-gray studio tabletop scene, modern international brand website asset, consistent softbox lighting from upper left, subtle contact shadow, camera at a slightly elevated front three-quarter angle, subject centered slightly forward with generous safe margins for card and hero cropping. Use small restrained red accent bricks only as a tasteful JIESTAR brand cue. The image must clearly look like interlocking plastic building bricks and assembled brick-built models.

4:3 landscape composition. Avoid real brand logos, LEGO branding, packaging boxes, readable text, watermarks, people, childish cartoon styling, random gradients, excessive saturated colors, and third-party IP.
```

Generated files:

| Collection | Handle | Asset |
| --- | --- | --- |
| Pirates | `pirates` | `/images/categories/category-pirates.png` |
| Fairground | `fairground` | `/images/categories/category-fairground.png` |
| Technic | `technic` | `/images/categories/category-technic.png` |
| Movie & Game | `movie-game` | `/images/categories/category-movie-game.png` |
| Modular Buildings | `modular-buildings` | `/images/categories/category-modular-buildings.png` |
| Gun | `gun` | `/images/categories/category-gun.png` |
| Trains | `trains` | `/images/categories/category-trains.png` |
| Military | `military` | `/images/categories/category-military.png` |
| Space | `space` | `/images/categories/category-space.png` |
| Other | `other` | `/images/categories/category-other.png` |

Category subject prompts:

- `pirates`: brick-built pirate ship display model with sails, deck details, small island base, treasure elements, and compact ocean/wave brick details.
- `fairground`: brick-built amusement park scene with ferris wheel, compact carousel or ticket booth element, warm light details, and refined fairground base plates.
- `technic`: brick-built mechanical engineering vehicle with visible gears, suspension arms, pistons, axles, tread/tyre detail, and exposed mechanical structure.
- `movie-game`: original cinematic fantasy and game-inspired brick diorama with abstract controller/screen cues, no recognizable characters, franchises, logos, or IP.
- `modular-buildings`: brick-built modular city street model with detailed facades, windows, balconies, architectural details, sidewalk tiles, and street lamps.
- `gun`: brick-built sci-fi blaster prop displayed as a toy construction set object, clearly non-realistic and toy-like, with a safety-like orange/red accent tip and display stand.
- `trains`: brick-built train model on a short track base with locomotive detail, carriages, rail sleepers, and station platform hints.
- `military`: brick-built tactical armored vehicle display model, clearly toy-like and non-realistic, with no people, no combat scene, no national insignia, and no gore.
- `space`: brick-built spacecraft and moon-base display scene with spaceship, small rover, landing pad, crater base plates, antenna details, and subtle space cues.
- `other`: curated display arrangement of several small miscellaneous brick-built models on one refined base, including flower/book-shelf display, underwater exploration scene, mini creature or decorative object, and neutral parts/display stand element.

When adding a new category image later, reuse the master style exactly and only swap the category subject prompt.

## 2026-05-14 Factory Series Image Set

Scope:

- Generated additional category images for factory-side fine-grained series.
- Kept the factory category logic mostly intact.
- Only obvious duplicate or near-duplicate categories should be merged in Shopify later, such as `Gun` + `Gun Model`, `Ocean` + `Underwater` + `Diving`, `Ship` + `Ship Model`, `Space` + `Aerospace`, and `Car Model` + `Motorcycle`.

Master style:

Use the same master style as the first category image set: premium 3D brick-built model render, warm-white/light-gray tabletop studio, soft upper-left lighting, subtle contact shadow, crop-safe 4:3 landscape composition, no text, no packaging, no third-party IP, and no visible brand marks.

Generated additional files:

| Collection | Handle | Asset |
| --- | --- | --- |
| Character Figure | `character-figure` | `/images/categories/category-character-figure.png` |
| Warship | `warship` | `/images/categories/category-warship.png` |
| Frozen | `frozen` | `/images/categories/category-frozen.png` |
| Animal | `animal` | `/images/categories/category-animal.png` |
| Chemical | `chemical` | `/images/categories/category-chemical.png` |
| Christmas | `christmas` | `/images/categories/category-christmas.png` |
| Scene | `scene` | `/images/categories/category-scene.png` |
| Tank | `tank` | `/images/categories/category-tank.png` |
| Castle | `castle` | `/images/categories/category-castle.png` |
| City | `city` | `/images/categories/category-city.png` |
| Girl | `girl` | `/images/categories/category-girl.png` |
| Furniture | `furniture` | `/images/categories/category-furniture.png` |
| Home Appliance | `home-appliance` | `/images/categories/category-home-appliance.png` |
| Engineering | `engineering` | `/images/categories/category-engineering.png` |
| Dinosaur | `dinosaur` | `/images/categories/category-dinosaur.png` |
| Ornament | `ornament` | `/images/categories/category-ornament.png` |
| Storage Box | `storage-box` | `/images/categories/category-storage-box.png` |
| Constellation | `constellation` | `/images/categories/category-constellation.png` |
| Mecha | `mecha` | `/images/categories/category-mecha.png` |
| Weapon | `weapon` | `/images/categories/category-weapon.png` |
| Ocean & Underwater | `ocean-underwater` | `/images/categories/category-ocean-underwater.png` |
| Fire Rescue | `fire-rescue` | `/images/categories/category-fire-rescue.png` |
| Hot Air Balloon | `hot-air-balloon` | `/images/categories/category-hot-air-balloon.png` |
| Ranch | `ranch` | `/images/categories/category-ranch.png` |
| SWAT | `swat` | `/images/categories/category-swat.png` |
| Arcade Game | `arcade-game` | `/images/categories/category-arcade-game.png` |
| Boy | `boy` | `/images/categories/category-boy.png` |
| Legendary Dragon | `legendary-dragon` | `/images/categories/category-legendary-dragon.png` |
| Ship Model | `ship-model` | `/images/categories/category-ship-model.png` |
| Flower | `flower` | `/images/categories/category-flower.png` |
| Street View | `street-view` | `/images/categories/category-street-view.png` |
| Police | `police` | `/images/categories/category-police.png` |
| Car Model | `car-model` | `/images/categories/category-car-model.png` |
| Aircraft | `aircraft` | `/images/categories/category-aircraft.png` |
| Brick Alliance | `brick-alliance` | `/images/categories/category-brick-alliance.png` |
| Fairy Tale | `fairy-tale` | `/images/categories/category-fairy-tale.png` |

All images in `public/images/categories` were normalized to `1448 x 1086`.
