/**
 * Fix: assign group_id to all categories and insert missing ones.
 * Run once: node scripts/fix-category-groups.mjs
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://fbnkapwljlepqiapbtqh.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fetch group slugs → IDs
const { data: groups, error: gErr } = await supabase
  .from("category_groups")
  .select("id, slug");
if (gErr) throw gErr;

const gid = Object.fromEntries(groups.map((g) => [g.slug, g.id]));

// Update existing categories with their group_id
const updates = [
  // outdoors-yard
  { slug: "landscaping",       group_id: gid["outdoors-yard"] },
  { slug: "pool-spa",          group_id: gid["outdoors-yard"] },
  // interior
  { slug: "flooring",          group_id: gid["interior"] },
  { slug: "painting",          group_id: gid["interior"] },
  { slug: "cabinetry-millwork",group_id: gid["interior"] },
  // exterior
  { slug: "roofing",           group_id: gid["exterior"] },
  { slug: "windows-doors",     group_id: gid["exterior"] },
  // systems-mechanical
  { slug: "hvac",              group_id: gid["systems-mechanical"] },
  { slug: "electrical",        group_id: gid["systems-mechanical"] },
  { slug: "plumbing",          group_id: gid["systems-mechanical"] },
  // construction
  { slug: "general-contractor",group_id: gid["construction"] },
  { slug: "concrete-masonry",  group_id: gid["construction"] },
  // home-services
  { slug: "pest-control",      group_id: gid["home-services"] },
  { slug: "cleaning",          group_id: gid["home-services"] },
];

for (const u of updates) {
  const { error } = await supabase
    .from("categories")
    .update({ group_id: u.group_id })
    .eq("slug", u.slug);
  if (error) console.error(`Failed to update ${u.slug}:`, error.message);
  else console.log(`✓ Updated ${u.slug}`);
}

// Insert new categories that don't exist yet
const newCats = [
  // outdoors-yard
  { name: "Lawn Care",              slug: "lawn-care",              icon: "Leaf",            description: "Mowing, edging, and routine lawn maintenance",            sort_order: 10, group_id: gid["outdoors-yard"] },
  { name: "Landscaping & Design",   slug: "landscaping-design",     icon: "Trees",           description: "Full landscaping design, hardscape, and new installs",    sort_order: 11, group_id: gid["outdoors-yard"] },
  { name: "Tree Service",           slug: "tree-service",           icon: "TreePine",        description: "Tree trimming, removal, and stump grinding",              sort_order: 12, group_id: gid["outdoors-yard"] },
  { name: "Irrigation",             slug: "irrigation",             icon: "Droplets",        description: "Sprinkler system installation and repair",                sort_order: 13, group_id: gid["outdoors-yard"] },
  { name: "Fencing",                slug: "fencing",                icon: "Shield",          description: "Wood, vinyl, aluminum, and chain-link fencing",           sort_order: 14, group_id: gid["outdoors-yard"] },
  { name: "Deck & Porch",           slug: "deck-porch",             icon: "Sun",             description: "Deck building, porch construction, and repair",           sort_order: 16, group_id: gid["outdoors-yard"] },
  { name: "Outdoor Kitchen",        slug: "outdoor-kitchen",        icon: "Flame",           description: "Outdoor kitchen and BBQ installations",                   sort_order: 17, group_id: gid["outdoors-yard"] },
  // interior
  { name: "Drywall",                slug: "drywall",                icon: "Square",          description: "Drywall installation, repair, and finishing",             sort_order: 23, group_id: gid["interior"] },
  { name: "Tile & Stone",           slug: "tile-stone",             icon: "Layers",          description: "Tile, stone, and countertop installation",                sort_order: 24, group_id: gid["interior"] },
  { name: "Blinds & Window Treatments", slug: "blinds-window-treatments", icon: "PanelLeft", description: "Blinds, shades, shutters, and drapes",                    sort_order: 25, group_id: gid["interior"] },
  // exterior
  { name: "Gutters",                slug: "gutters",                icon: "ArrowDown",       description: "Gutter installation, cleaning, and repair",               sort_order: 32, group_id: gid["exterior"] },
  { name: "Siding",                 slug: "siding",                 icon: "LayoutGrid",      description: "Siding installation and repair",                          sort_order: 33, group_id: gid["exterior"] },
  { name: "Pressure Washing",       slug: "pressure-washing",       icon: "Wind",            description: "Residential and commercial pressure washing",             sort_order: 34, group_id: gid["exterior"] },
  { name: "Screen Enclosures",      slug: "screen-enclosures",      icon: "Grid2x2",         description: "Pool cages, porches, and screen enclosure installation",  sort_order: 35, group_id: gid["exterior"] },
  { name: "Hurricane Shutters",     slug: "hurricane-shutters",     icon: "ShieldAlert",     description: "Hurricane shutter and impact window installation",        sort_order: 36, group_id: gid["exterior"] },
  { name: "Garage Doors",           slug: "garage-doors",           icon: "SquareParking",   description: "Garage door installation, repair, and openers",           sort_order: 37, group_id: gid["exterior"] },
  // systems-mechanical
  { name: "Solar",                  slug: "solar",                  icon: "Sun",             description: "Solar panel installation and battery storage",            sort_order: 43, group_id: gid["systems-mechanical"] },
  { name: "Generator",              slug: "generator",              icon: "Cpu",             description: "Whole-home generator installation and service",           sort_order: 44, group_id: gid["systems-mechanical"] },
  { name: "Security Systems",       slug: "security-systems",       icon: "Lock",            description: "Alarm systems, cameras, and smart home security",        sort_order: 45, group_id: gid["systems-mechanical"] },
  { name: "Septic",                 slug: "septic",                 icon: "ArrowDownToLine", description: "Septic system installation, pumping, and repair",        sort_order: 46, group_id: gid["systems-mechanical"] },
  // construction
  { name: "Home Inspection",        slug: "home-inspection",        icon: "ClipboardCheck",  description: "Pre-purchase and insurance home inspections",             sort_order: 52, group_id: gid["construction"] },
  // waterfront
  { name: "Dock & Marine",          slug: "dock-marine",            icon: "Anchor",          description: "Dock building, repair, and marine construction",          sort_order: 60, group_id: gid["waterfront"] },
  { name: "Seawall",                slug: "seawall",                icon: "Waves",           description: "Seawall installation, repair, and inspection",            sort_order: 61, group_id: gid["waterfront"] },
  // home-services
  { name: "Handyman",               slug: "handyman",               icon: "Wrench",          description: "General repairs, installs, and honey-do lists",           sort_order: 72, group_id: gid["home-services"] },
];

for (const cat of newCats) {
  const { error } = await supabase
    .from("categories")
    .upsert(cat, { onConflict: "slug", ignoreDuplicates: false });
  if (error) console.error(`Failed to upsert ${cat.slug}:`, error.message);
  else console.log(`✓ Upserted ${cat.slug}`);
}

console.log("\nDone.");
