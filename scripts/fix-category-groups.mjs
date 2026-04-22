/**
 * Sync the new 10-group, 70-trade taxonomy into the database.
 * Equivalent to running migration 015 manually.
 * Run once: node scripts/fix-category-groups.mjs
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://fbnkapwljlepqiapbtqh.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Step 1: Clear existing group assignments
console.log("Clearing group assignments...");
const { error: clearErr } = await supabase
  .from("categories")
  .update({ group_id: null })
  .neq("id", "00000000-0000-0000-0000-000000000000"); // matches all rows
if (clearErr) throw clearErr;

// Step 2: Remove old groups
console.log("Removing old groups...");
const { error: delErr } = await supabase
  .from("category_groups")
  .delete()
  .neq("id", "00000000-0000-0000-0000-000000000000");
if (delErr) throw delErr;

// Step 3: Insert new groups
console.log("Inserting new groups...");
const { error: groupErr } = await supabase.from("category_groups").upsert([
  { name: "Exterior & Structure",  slug: "exterior-structure",   icon: "Building2",  description: "Roofing, siding, windows, gutters, and structural work",                 sort_order: 1  },
  { name: "Mechanical Systems",    slug: "mechanical-systems",   icon: "Zap",        description: "Plumbing, HVAC, electrical, solar, and generators",                      sort_order: 2  },
  { name: "Interior & Remodel",    slug: "interior-remodel",     icon: "Home",       description: "Painting, flooring, cabinetry, tile, and full remodels",                 sort_order: 3  },
  { name: "Outdoor & Landscape",   slug: "outdoor-landscape",    icon: "Leaf",       description: "Landscaping, lawn care, pool, irrigation, and outdoor living",           sort_order: 4  },
  { name: "Coastal & Marine",      slug: "coastal-marine",       icon: "Waves",      description: "Docks, seawalls, hurricane shutters, and flood mitigation",              sort_order: 5  },
  { name: "Property Services",     slug: "property-services",    icon: "Sparkles",   description: "Cleaning, pest control, handyman, and home management",                  sort_order: 6  },
  { name: "Vacation Rentals",      slug: "vacation-rentals",     icon: "Key",        description: "Rental management, turnover cleaning, and short-term rental services",   sort_order: 7  },
  { name: "Automotive",            slug: "automotive",           icon: "Car",        description: "Auto repair, detailing, towing, and golf cart service",                  sort_order: 8  },
  { name: "Health & Wellness",     slug: "health-wellness",      icon: "Heart",      description: "Chiropractic, massage, physical therapy, dental, and med spa",           sort_order: 9  },
  { name: "Professional Services", slug: "professional-services",icon: "Briefcase",  description: "Real estate, insurance, financial, legal, and tax services",            sort_order: 10 },
], { onConflict: "slug" });
if (groupErr) throw groupErr;

// Fetch new group IDs
const { data: groups, error: fetchErr } = await supabase
  .from("category_groups")
  .select("id, slug");
if (fetchErr) throw fetchErr;
const gid = Object.fromEntries(groups.map((g) => [g.slug, g.id]));

// Step 4: Upsert all 70 categories
const categories = [
  // Exterior & Structure
  { name: "Roofing",                           slug: "roofing",               icon: "Home",           description: "Roof installation, repair, and replacement",                        sort_order: 10,  group_id: gid["exterior-structure"] },
  { name: "Siding",                            slug: "siding",                icon: "LayoutGrid",     description: "Siding installation and repair",                                    sort_order: 11,  group_id: gid["exterior-structure"] },
  { name: "Windows & Doors",                   slug: "windows-doors",         icon: "DoorOpen",       description: "Window and door installation, replacement, and repair",             sort_order: 12,  group_id: gid["exterior-structure"] },
  { name: "Gutters",                           slug: "gutters",               icon: "ArrowDown",      description: "Gutter installation, cleaning, and repair",                         sort_order: 13,  group_id: gid["exterior-structure"] },
  { name: "Painting (Exterior)",               slug: "painting-exterior",     icon: "Paintbrush",     description: "Exterior painting, staining, and coating",                          sort_order: 14,  group_id: gid["exterior-structure"] },
  { name: "Pressure Washing",                  slug: "pressure-washing",      icon: "Wind",           description: "Residential and commercial pressure washing",                       sort_order: 15,  group_id: gid["exterior-structure"] },
  { name: "Driveway & Paving",                 slug: "driveway-paving",       icon: "Car",            description: "Driveway installation, repair, and paving",                         sort_order: 16,  group_id: gid["exterior-structure"] },
  { name: "Foundation & Structural",           slug: "foundation-structural", icon: "Building2",      description: "Foundation repair, structural work, and waterproofing",             sort_order: 17,  group_id: gid["exterior-structure"] },
  { name: "Stucco",                            slug: "stucco",                icon: "Layers",         description: "Stucco application, repair, and finishing",                         sort_order: 18,  group_id: gid["exterior-structure"] },
  // Mechanical Systems
  { name: "Plumbing",                          slug: "plumbing",              icon: "Droplets",       description: "Plumbers for repairs, installs, and remodels",                      sort_order: 20,  group_id: gid["mechanical-systems"] },
  { name: "HVAC",                              slug: "hvac",                  icon: "Thermometer",    description: "Heating, ventilation, and air conditioning specialists",            sort_order: 21,  group_id: gid["mechanical-systems"] },
  { name: "Electrical",                        slug: "electrical",            icon: "Zap",            description: "Licensed electricians for all residential and commercial work",     sort_order: 22,  group_id: gid["mechanical-systems"] },
  { name: "Solar",                             slug: "solar",                 icon: "Sun",            description: "Solar panel installation and battery storage",                      sort_order: 23,  group_id: gid["mechanical-systems"] },
  { name: "Generator Installation",            slug: "generator",             icon: "Cpu",            description: "Whole-home generator installation and service",                     sort_order: 24,  group_id: gid["mechanical-systems"] },
  { name: "Water Treatment & Softeners",       slug: "water-treatment",       icon: "Droplets",       description: "Water softener and treatment system installation and service",      sort_order: 25,  group_id: gid["mechanical-systems"] },
  { name: "Gas Lines",                         slug: "gas-lines",             icon: "Flame",          description: "Natural gas and propane line installation and repair",              sort_order: 26,  group_id: gid["mechanical-systems"] },
  // Interior & Remodel
  { name: "Painting (Interior)",               slug: "painting-interior",     icon: "Paintbrush",     description: "Interior painting, wallpaper, and finishing",                       sort_order: 30,  group_id: gid["interior-remodel"] },
  { name: "Flooring",                          slug: "flooring",              icon: "Grid",           description: "Hardwood, tile, LVP, and carpet installation",                      sort_order: 31,  group_id: gid["interior-remodel"] },
  { name: "Drywall",                           slug: "drywall",               icon: "Square",         description: "Drywall installation, repair, and finishing",                       sort_order: 32,  group_id: gid["interior-remodel"] },
  { name: "Insulation",                        slug: "insulation",            icon: "Layers",         description: "Attic, wall, and spray foam insulation",                            sort_order: 33,  group_id: gid["interior-remodel"] },
  { name: "Carpentry & Trim",                  slug: "carpentry-trim",        icon: "Ruler",          description: "Crown molding, baseboards, trim, and custom carpentry",             sort_order: 34,  group_id: gid["interior-remodel"] },
  { name: "Cabinetry & Countertops",           slug: "cabinetry-countertops", icon: "Box",            description: "Custom cabinetry, built-ins, and countertop installation",          sort_order: 35,  group_id: gid["interior-remodel"] },
  { name: "Tile & Stone",                      slug: "tile-stone",            icon: "Layers",         description: "Tile, stone, and countertop installation",                          sort_order: 36,  group_id: gid["interior-remodel"] },
  { name: "Kitchen Remodel",                   slug: "kitchen-remodel",       icon: "Utensils",       description: "Full kitchen renovation and remodeling",                            sort_order: 37,  group_id: gid["interior-remodel"] },
  { name: "Bathroom Remodel",                  slug: "bathroom-remodel",      icon: "Droplets",       description: "Full bathroom renovation and remodeling",                           sort_order: 38,  group_id: gid["interior-remodel"] },
  // Outdoor & Landscape
  { name: "Landscaping",                       slug: "landscaping",           icon: "Trees",          description: "Full landscaping design, hardscape, and new installs",              sort_order: 40,  group_id: gid["outdoor-landscape"] },
  { name: "Lawn Care",                         slug: "lawn-care",             icon: "Leaf",           description: "Mowing, edging, and routine lawn maintenance",                      sort_order: 41,  group_id: gid["outdoor-landscape"] },
  { name: "Irrigation",                        slug: "irrigation",            icon: "Droplets",       description: "Sprinkler system installation and repair",                          sort_order: 42,  group_id: gid["outdoor-landscape"] },
  { name: "Tree Service",                      slug: "tree-service",          icon: "TreePine",       description: "Tree trimming, removal, and stump grinding",                        sort_order: 43,  group_id: gid["outdoor-landscape"] },
  { name: "Pool & Spa",                        slug: "pool-spa",              icon: "Waves",          description: "Pool construction, maintenance, and repair",                        sort_order: 44,  group_id: gid["outdoor-landscape"] },
  { name: "Outdoor Lighting",                  slug: "outdoor-lighting",      icon: "Lightbulb",      description: "Landscape and outdoor lighting installation",                       sort_order: 45,  group_id: gid["outdoor-landscape"] },
  { name: "Fencing",                           slug: "fencing",               icon: "Shield",         description: "Wood, vinyl, aluminum, and chain-link fencing",                     sort_order: 46,  group_id: gid["outdoor-landscape"] },
  { name: "Decks & Patios",                    slug: "decks-patios",          icon: "Sun",            description: "Deck building, patio construction, and repair",                     sort_order: 47,  group_id: gid["outdoor-landscape"] },
  { name: "Outdoor Kitchen",                   slug: "outdoor-kitchen",       icon: "Flame",          description: "Outdoor kitchen and BBQ installations",                             sort_order: 48,  group_id: gid["outdoor-landscape"] },
  // Coastal & Marine
  { name: "Dock & Boathouse",                  slug: "dock-boathouse",        icon: "Anchor",         description: "Dock building, repair, and marine construction",                    sort_order: 50,  group_id: gid["coastal-marine"] },
  { name: "Seawall & Bulkhead",                slug: "seawall-bulkhead",      icon: "Waves",          description: "Seawall and bulkhead installation, repair, and inspection",         sort_order: 51,  group_id: gid["coastal-marine"] },
  { name: "Hurricane Shutters & Impact Windows",slug: "hurricane-shutters",   icon: "ShieldAlert",    description: "Hurricane shutter and impact window installation",                  sort_order: 52,  group_id: gid["coastal-marine"] },
  { name: "Flood Mitigation",                  slug: "flood-mitigation",      icon: "ArrowDownToLine",description: "Flood barrier, sump pump, and mitigation systems",                  sort_order: 53,  group_id: gid["coastal-marine"] },
  // Property Services
  { name: "Property Management",               slug: "property-management",   icon: "Building2",      description: "Full-service residential property management",                      sort_order: 60,  group_id: gid["property-services"] },
  { name: "Home Watch",                        slug: "home-watch",            icon: "Eye",            description: "Vacancy property checks and home watch services",                   sort_order: 61,  group_id: gid["property-services"] },
  { name: "Pest Control",                      slug: "pest-control",          icon: "Bug",            description: "Termite, pest, and wildlife control",                               sort_order: 62,  group_id: gid["property-services"] },
  { name: "Security Systems",                  slug: "security-systems",      icon: "Lock",           description: "Alarm systems, cameras, and smart home security",                   sort_order: 63,  group_id: gid["property-services"] },
  { name: "Locksmith",                         slug: "locksmith",             icon: "Key",            description: "Lock installation, rekeying, and emergency lockout service",        sort_order: 64,  group_id: gid["property-services"] },
  { name: "Handyman",                          slug: "handyman",              icon: "Wrench",         description: "General repairs, installs, and honey-do lists",                     sort_order: 65,  group_id: gid["property-services"] },
  { name: "Junk Removal",                      slug: "junk-removal",          icon: "Trash2",         description: "Residential and commercial junk and debris removal",                sort_order: 66,  group_id: gid["property-services"] },
  { name: "House Cleaning",                    slug: "house-cleaning",        icon: "Sparkles",       description: "Residential and vacation rental cleaning services",                 sort_order: 67,  group_id: gid["property-services"] },
  // Vacation Rentals
  { name: "Rental Management",                 slug: "rental-management",     icon: "ClipboardCheck", description: "Short-term rental property management services",                    sort_order: 70,  group_id: gid["vacation-rentals"] },
  { name: "Turnover Cleaning",                 slug: "turnover-cleaning",     icon: "Sparkles",       description: "Guest turnover and vacation rental cleaning",                       sort_order: 71,  group_id: gid["vacation-rentals"] },
  { name: "Linen Service",                     slug: "linen-service",         icon: "Package",        description: "Vacation rental linen supply and laundry service",                  sort_order: 72,  group_id: gid["vacation-rentals"] },
  { name: "Rental Photography & Virtual Tours",slug: "rental-photography",    icon: "Camera",         description: "Professional photography and virtual tours for rentals",            sort_order: 73,  group_id: gid["vacation-rentals"] },
  { name: "Staging for Rentals",               slug: "staging-rentals",       icon: "Home",           description: "Furniture and décor staging for rental properties",                 sort_order: 74,  group_id: gid["vacation-rentals"] },
  // Automotive
  { name: "Auto Repair",                       slug: "auto-repair",           icon: "Wrench",         description: "General auto repair and maintenance",                               sort_order: 80,  group_id: gid["automotive"] },
  { name: "Auto Body & Paint",                 slug: "auto-body-paint",       icon: "Paintbrush",     description: "Collision repair, dent removal, and auto painting",                 sort_order: 81,  group_id: gid["automotive"] },
  { name: "Oil Change",                        slug: "oil-change",            icon: "Droplets",       description: "Oil change and basic vehicle maintenance",                          sort_order: 82,  group_id: gid["automotive"] },
  { name: "Tire Shop",                         slug: "tire-shop",             icon: "Circle",         description: "Tire sales, installation, and rotation",                            sort_order: 83,  group_id: gid["automotive"] },
  { name: "Car Detailing",                     slug: "car-detailing",         icon: "Car",            description: "Interior and exterior car detailing",                               sort_order: 84,  group_id: gid["automotive"] },
  { name: "Towing",                            slug: "towing",                icon: "Truck",          description: "Vehicle towing and roadside assistance",                            sort_order: 85,  group_id: gid["automotive"] },
  { name: "Golf Cart Repair",                  slug: "golf-cart-repair",      icon: "Cpu",            description: "Golf cart repair, maintenance, and upgrades",                       sort_order: 86,  group_id: gid["automotive"] },
  // Health & Wellness
  { name: "Chiropractor",                      slug: "chiropractor",          icon: "Activity",       description: "Chiropractic care and spinal adjustment",                           sort_order: 90,  group_id: gid["health-wellness"] },
  { name: "Massage Therapy",                   slug: "massage-therapy",       icon: "Heart",          description: "Therapeutic and relaxation massage services",                       sort_order: 91,  group_id: gid["health-wellness"] },
  { name: "Physical Therapy",                  slug: "physical-therapy",      icon: "Activity",       description: "Physical rehabilitation and therapy",                               sort_order: 92,  group_id: gid["health-wellness"] },
  { name: "Dentist",                           slug: "dentist",               icon: "Heart",          description: "General and cosmetic dental services",                              sort_order: 93,  group_id: gid["health-wellness"] },
  { name: "Med Spa",                           slug: "med-spa",               icon: "Sparkles",       description: "Medical spa, aesthetics, and wellness treatments",                  sort_order: 94,  group_id: gid["health-wellness"] },
  { name: "Personal Training",                 slug: "personal-training",     icon: "Activity",       description: "One-on-one fitness coaching and personal training",                 sort_order: 95,  group_id: gid["health-wellness"] },
  // Professional Services
  { name: "Real Estate Agent",                 slug: "real-estate-agent",     icon: "Home",           description: "Residential and commercial real estate agents",                    sort_order: 100, group_id: gid["professional-services"] },
  { name: "Insurance Agent",                   slug: "insurance-agent",       icon: "Shield",         description: "Home, auto, and business insurance",                               sort_order: 101, group_id: gid["professional-services"] },
  { name: "Financial Advisor",                 slug: "financial-advisor",     icon: "TrendingUp",     description: "Wealth management and financial planning",                         sort_order: 102, group_id: gid["professional-services"] },
  { name: "Attorney",                          slug: "attorney",              icon: "Briefcase",      description: "Real estate, estate planning, and general legal services",         sort_order: 103, group_id: gid["professional-services"] },
  { name: "CPA & Tax",                         slug: "cpa-tax",               icon: "Briefcase",      description: "Tax preparation, accounting, and CPA services",                   sort_order: 104, group_id: gid["professional-services"] },
];

console.log(`Upserting ${categories.length} categories...`);
for (const cat of categories) {
  const { error } = await supabase
    .from("categories")
    .upsert(cat, { onConflict: "slug", ignoreDuplicates: false });
  if (error) console.error(`✗ ${cat.slug}:`, error.message);
  else console.log(`✓ ${cat.slug}`);
}

// Step 5: Remove old slugs no longer in the taxonomy (only if not referenced by contractors)
const obsoleteSlugs = [
  "general-contractor", "concrete-masonry", "moving", "other",
  "painting", "cabinetry-millwork", "cleaning",
  "landscaping-design", "deck-porch", "dock-marine", "seawall",
  "blinds-window-treatments", "screen-enclosures", "garage-doors",
  "septic", "home-inspection",
];

console.log("\nRemoving obsolete slugs (if unreferenced)...");
const { data: obsolete } = await supabase
  .from("categories")
  .select("id, slug")
  .in("slug", obsoleteSlugs);

if (obsolete?.length) {
  const { data: usedCats } = await supabase
    .from("contractors")
    .select("category_id, additional_categories")
    .eq("status", "active");

  const usedIds = new Set();
  for (const c of usedCats ?? []) {
    if (c.category_id) usedIds.add(c.category_id);
    for (const id of c.additional_categories ?? []) usedIds.add(id);
  }

  for (const cat of obsolete) {
    if (usedIds.has(cat.id)) {
      console.log(`  skipped ${cat.slug} (still referenced by a contractor)`);
      continue;
    }
    const { error } = await supabase.from("categories").delete().eq("id", cat.id);
    if (error) console.error(`  ✗ delete ${cat.slug}:`, error.message);
    else console.log(`  ✓ deleted ${cat.slug}`);
  }
}

console.log("\nDone.");
