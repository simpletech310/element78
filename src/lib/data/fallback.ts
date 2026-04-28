// Static fallback so the app renders before Supabase is wired up.
// Mirrors supabase/seed.sql + the imagery-refresh migration.

import type { ClassRow, Location, Post, Product, Trainer, Program, ProgramSession } from "./types";

export const fallbackLocations: Location[] = [
  { id: "loc-atl", slug: "atlanta-hq", name: "Atlanta HQ", city: "Atlanta", state: "GA", status: "active", hero_image: "/assets/atlgym.jpg", lat: 33.749, lng: -84.388, sort_order: 1 },
  { id: "loc-la", slug: "los-angeles", name: "Los Angeles", city: "Los Angeles", state: "CA", status: "waitlist", hero_image: "/assets/blue-hair-gym.jpg", lat: 34.0522, lng: -118.2437, sort_order: 2 },
  { id: "loc-hou", slug: "houston", name: "Houston", city: "Houston", state: "TX", status: "waitlist", hero_image: null, lat: 29.7604, lng: -95.3698, sort_order: 3 },
  { id: "loc-nyc", slug: "new-york", name: "New York", city: "Brooklyn", state: "NY", status: "waitlist", hero_image: null, lat: 40.6872, lng: -73.9418, sort_order: 4 },
  { id: "loc-dc", slug: "washington-dc", name: "Washington DC", city: "Washington", state: "DC", status: "waitlist", hero_image: null, lat: 38.9072, lng: -77.0369, sort_order: 5 },
];

export const fallbackTrainers: Trainer[] = [
  { id: "tr-kai", slug: "kai-brooks", name: "Kai Brooks", headline: "Pilates + reformer. Certified BASI. 8 yrs.", bio: "Builds slow strength and long lines. Music loud, cues precise. Lead reformer trainer.", specialties: ["Reformer","Mat Pilates","Mobility"], avatar_url: "/assets/blue-hair-gym.jpg", hero_image: "/assets/blue-hair-gym.jpg", home_location_id: "loc-atl", rating: 4.95 },
  { id: "tr-amara", slug: "amara-jones", name: "Amara Jones", headline: "HIIT + functional strength. NSCA-CPT.", bio: "Heavy basics. Quick rounds. No filler. Builds the engine.", specialties: ["HIIT","Strength","Conditioning"], avatar_url: "/assets/dumbbell-street.jpg", hero_image: "/assets/dumbbell-street.jpg", home_location_id: "loc-atl", rating: 4.91 },
  { id: "tr-jay", slug: "jay-elias", name: "Jay Elias", headline: "Strength + 1-on-1. 7 yrs.", bio: "Big numbers, sharp form. Builds the engine and the architecture.", specialties: ["Strength","1-on-1"], avatar_url: "/assets/IMG_3461.jpg", hero_image: "/assets/IMG_3461.jpg", home_location_id: "loc-atl", rating: 4.88 },
  { id: "tr-tasha", slug: "tasha-wright", name: "Tasha Wright", headline: "Pilates · mobility · pre/post natal. 6 yrs.", bio: "Patient hands, sharp eye.", specialties: ["Pilates","Mobility","Pre/Post Natal"], avatar_url: "/assets/editorial-1.jpg", hero_image: "/assets/editorial-1.jpg", home_location_id: "loc-atl", rating: 4.96 },
];

const today = new Date();
const at = (dayOffset: number, hour: number, min = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

export const fallbackClasses: ClassRow[] = [
  { id: "cls-1", slug: "west-coast-flow-1", location_id: "loc-atl", trainer_id: "tr-kai", name: "WEST COAST FLOW", kind: "reformer", starts_at: at(2, 18, 30), duration_min: 50, capacity: 14, booked: 9, intensity: "MD", room: "STUDIO B", hero_image: "/assets/blue-set-rooftop.jpg" },
  { id: "cls-2", slug: "core-78-1", location_id: "loc-atl", trainer_id: "tr-tasha", name: "CORE 78", kind: "pilates", starts_at: at(0, 7, 0), duration_min: 45, capacity: 12, booked: 8, intensity: "HI", room: "STUDIO A", hero_image: "/assets/floor-mockup.png" },
  { id: "cls-3", slug: "morning-mobility", location_id: "loc-atl", trainer_id: "tr-tasha", name: "MORNING MOBILITY", kind: "yoga", starts_at: at(0, 6, 0), duration_min: 30, capacity: 16, booked: 4, intensity: "LO", room: "STUDIO C", hero_image: "/assets/IMG_3467.jpg" },
  { id: "cls-4", slug: "street-hiit", location_id: "loc-atl", trainer_id: "tr-amara", name: "STREET HIIT", kind: "hiit", starts_at: at(0, 12, 0), duration_min: 30, capacity: 20, booked: 20, intensity: "HI", room: "FLOOR", hero_image: "/assets/dumbbell-street.jpg" },
  { id: "cls-5", slug: "private-1on1", location_id: "loc-atl", trainer_id: "tr-kai", name: "PRIVATE · 1:1", kind: "private", starts_at: at(0, 17, 0), duration_min: 60, capacity: 1, booked: 0, intensity: "MD", room: "STUDIO B", hero_image: "/assets/IMG_3465.jpg" },
  { id: "cls-6", slug: "rooftop-sunset", location_id: "loc-atl", trainer_id: "tr-kai", name: "ROOFTOP SUNSET", kind: "reformer", starts_at: at(0, 19, 30), duration_min: 50, capacity: 12, booked: 12, intensity: "MD", room: "ROOF", hero_image: "/assets/editorial-2.png" },
];

export const fallbackProducts: Product[] = [
  { id: "p1", slug: "tripod-bottle", name: "TRIPOD BOTTLE", subtitle: "32 OZ · DUSK BLUE", category: "gear", price_cents: 5800, compare_at_cents: null, description: "Insulated 32oz with a built-in phone mount in the cap. Set it up on the mat. Get the angle right.", hero_image: "/products/water-tripod-1.png", gallery: ["/products/water-tripod-1.png","/products/water-tripod-2.jpg","/assets/IMG_3470.jpg","/assets/IMG_3462.jpg"], tag: "SIGNATURE", in_stock: true, sort_order: 1 },
  { id: "p2", slug: "compton-hoodie", name: "ELEMENT HOODIE", subtitle: "HEATHER · OS", category: "wear", price_cents: 9200, compare_at_cents: null, description: "Heavyweight French terry, double-stitched. Fits oversized.", hero_image: "/assets/IMG_3458.jpg", gallery: ["/assets/IMG_3458.jpg","/assets/IMG_3459.jpg","/products/IMG_3456.jpg"], tag: null, in_stock: true, sort_order: 2 },
  { id: "p3", slug: "element-bra", name: "ELEMENT BRA", subtitle: "SKY · XS-XL", category: "wear", price_cents: 4800, compare_at_cents: null, description: "Medium-impact compression, sweat-wicking. Sky blue, our signature.", hero_image: "/products/blueset-1.jpg", gallery: ["/products/blueset-1.jpg","/products/blueset-2.png","/assets/IMG_3469.jpg"], tag: "BACK", in_stock: true, sort_order: 3 },
  { id: "p4", slug: "heavy-flask", name: "HEAVY FLASK", subtitle: "40 OZ · GYM", category: "gear", price_cents: 4800, compare_at_cents: null, description: "Vacuum-sealed steel. 40 oz keeps you on the floor longer.", hero_image: "/products/IMG_3460.jpg", gallery: ["/products/IMG_3460.jpg","/assets/bottle-gym-2.jpg","/assets/IMG_3470.jpg"], tag: null, in_stock: true, sort_order: 4 },
  { id: "p5", slug: "element-set", name: "THE ELEMENT SET", subtitle: "HOODIE + SHORTS BUNDLE", category: "wear", price_cents: 14800, compare_at_cents: 18000, description: "Drop 04. The full kit.", hero_image: "/products/long-short-sleeve-set.jpg", gallery: ["/products/long-short-sleeve-set.jpg","/assets/IMG_3458.jpg","/products/long-sleeve-set-1.jpg"], tag: "BUNDLE", in_stock: true, sort_order: 5 },
  { id: "p6", slug: "element-tracksuit", name: "ELEMENT TRACKSUIT", subtitle: "HEATHER · OS · OS", category: "wear", price_cents: 12800, compare_at_cents: null, description: "Mid-weight terry tracksuit, oversized cut.", hero_image: "/products/tracksuit.jpg", gallery: ["/products/tracksuit.jpg","/assets/IMG_3459.jpg"], tag: "NEW", in_stock: true, sort_order: 6 },
  { id: "p7", slug: "long-sleeve-set", name: "LONG SLEEVE SET", subtitle: "SKY · XS-XL", category: "wear", price_cents: 11800, compare_at_cents: null, description: "Compression long sleeve crop with the Element 78 wordmark.", hero_image: "/products/long-sleeve-set-1.jpg", gallery: ["/products/long-sleeve-set-1.jpg","/products/long-sleeve-set-2.jpg","/products/pick-set.jpg"], tag: "BACK", in_stock: true, sort_order: 7 },
  { id: "p8", slug: "short-sleeve-set", name: "SHORT SLEEVE SET", subtitle: "SKY · XS-XL", category: "wear", price_cents: 9800, compare_at_cents: null, description: "Quarter-zip mock crop + bike shorts. Sweat-wicking, four-way stretch.", hero_image: "/products/short-sleeve-1.jpg", gallery: ["/products/short-sleeve-1.jpg","/products/short-sleeve-2.jpg","/products/blueset-2.png"], tag: null, in_stock: true, sort_order: 8 },
];

export const fallbackPrograms: Program[] = [
  { id: "prog-1", slug: "in-my-element", name: "IN MY ELEMENT", subtitle: "Series 03 · the signature reset", description: "Daily Pilates flow + breath work. Slow tempo, hard work. Builds the body — and the streak — back from neutral.", hero_image: "/assets/floor-mockup.png", duration_label: "21 DAYS · DAILY", total_sessions: 21, intensity: "Beginner → Intermediate", kind: "both", surfaces: ["app","gym","class"], sort_order: 1 },
  { id: "prog-2", slug: "city-of-angels", name: "CITY OF ANGELS", subtitle: "Outdoor + weight floor", description: "Heavy basics, quick rounds, no filler. Mixes street strength with reformer accessory work.", hero_image: "/assets/IMG_3461.jpg", duration_label: "14 DAYS · STRENGTH", total_sessions: 14, intensity: "Intermediate", kind: "both", surfaces: ["app","gym"], sort_order: 2 },
  { id: "prog-3", slug: "living-room-luxury", name: "LIVING ROOM LUXURY", subtitle: "No equipment, low impact", description: "For travel, recovery weeks, and the days you don't want to drive. Mat-only Pilates and mobility you can do in 6×6 feet.", hero_image: "/assets/IMG_3467.jpg", duration_label: "8 SESSIONS · LIVING ROOM", total_sessions: 8, intensity: "All levels", kind: "in_app", surfaces: ["app"], sort_order: 3 },
];

export const fallbackProgramSessions: ProgramSession[] = (() => {
  const out: ProgramSession[] = [];
  for (let d = 1; d <= 21; d++) out.push({ id: `s-ime-${d}`, program_id: "prog-1", day_index: d, name: `IN MY ELEMENT · Day ${d}`, duration_min: 35, description: "Daily Pilates flow + breath work.", kind: "flow", video_url: d === 1 ? "https://xiimrgdfbucpwugxmkrm.supabase.co/storage/v1/object/public/media/flow.mp4" : null, hero_image: "/assets/floor-mockup.png" });
  for (let d = 1; d <= 14; d++) out.push({ id: `s-coa-${d}`, program_id: "prog-2", day_index: d, name: `CITY OF ANGELS · Day ${d}`, duration_min: 45, description: "Heavy basics, quick rounds.", kind: "strength", video_url: null, hero_image: "/assets/IMG_3461.jpg" });
  for (let d = 1; d <= 8; d++) out.push({ id: `s-lrl-${d}`, program_id: "prog-3", day_index: d, name: `LIVING ROOM LUXURY · Day ${d}`, duration_min: 25, description: "Mat-only Pilates and mobility.", kind: "flow", video_url: null, hero_image: "/assets/IMG_3467.jpg" });
  return out;
})();

export const fallbackPosts: Post[] = [
  { id: "ps1", author_id: null, kind: "trainer_drop", body: "NEW · West Coast Flow Series 04 just dropped. Light reformer + breath. 7 sessions.", media_url: "/assets/blue-set-rooftop.jpg", meta: { author: "KAI · TRAINER", tag: "STAFF" }, created_at: new Date().toISOString() },
  { id: "ps2", author_id: null, kind: "progress", body: "Hit 14 days straight. The streak is real. Pulled up at 5:45a.", media_url: "/assets/IMG_3461.jpg", meta: { author: "AALIYAH M.", streak: 14 }, created_at: new Date(Date.now() - 1000*60*60).toISOString() },
  { id: "ps3", author_id: null, kind: "milestone", body: "PR · Reformer footwork to plank. Held it.", media_url: "/assets/IMG_3467.jpg", meta: { author: "AALIYAH M.", pr: "Plank · 2:30" }, created_at: new Date(Date.now() - 1000*60*60*4).toISOString() },
  { id: "ps4", author_id: null, kind: "event", body: "Sunset rooftop class · Sat 7p · Atlanta HQ. 12 spots.", media_url: "/assets/IMG_3465.jpg", meta: { date: "SAT 5/3 · 7:00P", spots: 12 }, created_at: new Date(Date.now() - 1000*60*60*24).toISOString() },
  { id: "ps5", author_id: null, kind: "announcement", body: "ATL West End is officially open. Come see us.", media_url: "/assets/IMG_3471.jpg", meta: { location: "ATL · WEST END" }, created_at: new Date(Date.now() - 1000*60*60*48).toISOString() },
];
