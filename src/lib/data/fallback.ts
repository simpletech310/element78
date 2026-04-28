// Static fallback so the app renders before Supabase is wired up.
// Mirrors supabase/seed.sql.

import type { ClassRow, Location, Post, Product, Trainer } from "./types";

export const fallbackLocations: Location[] = [
  { id: "loc-cpt", slug: "compton-hq", name: "Compton HQ", city: "Compton", state: "CA", status: "active", hero_image: "/assets/blue-hair-gym.jpg", lat: 33.8958, lng: -118.2201, sort_order: 1 },
  { id: "loc-atl", slug: "atl-west-end", name: "ATL West End", city: "Atlanta", state: "GA", status: "active", hero_image: "/assets/dumbbell-street.jpg", lat: 33.749, lng: -84.388, sort_order: 2 },
  { id: "loc-hou", slug: "houston-third-ward", name: "Houston · Third Ward", city: "Houston", state: "TX", status: "waitlist", hero_image: null, lat: 29.7604, lng: -95.3698, sort_order: 3 },
  { id: "loc-nyc", slug: "nyc-bed-stuy", name: "NYC · Bed-Stuy", city: "Brooklyn", state: "NY", status: "waitlist", hero_image: null, lat: 40.6872, lng: -73.9418, sort_order: 4 },
  { id: "loc-oak", slug: "oakland-fruitvale", name: "Oakland · Fruitvale", city: "Oakland", state: "CA", status: "waitlist", hero_image: null, lat: 37.7749, lng: -122.2247, sort_order: 5 },
];

export const fallbackTrainers: Trainer[] = [
  { id: "tr-kai", slug: "kai-brooks", name: "Kai Brooks", headline: "Pilates + reformer. Certified BASI. 8 yrs.", bio: "Compton-raised, LA-trained. Builds slow strength and long lines. Music loud, cues precise.", specialties: ["Reformer","Mat Pilates","Mobility"], avatar_url: "/assets/blue-hair-gym.jpg", hero_image: "/assets/blue-hair-gym.jpg", home_location_id: "loc-cpt", rating: 4.95 },
  { id: "tr-amara", slug: "amara-jones", name: "Amara Jones", headline: "HIIT + functional strength. NSCA-CPT.", bio: "Heavy basics. Quick rounds. No filler.", specialties: ["HIIT","Strength","Conditioning"], avatar_url: "/assets/dumbbell-street.jpg", hero_image: "/assets/dumbbell-street.jpg", home_location_id: "loc-atl", rating: 4.91 },
  { id: "tr-simone", slug: "simone-okafor", name: "Simone Okafor", headline: "Mobility + recovery. Yoga + breathwork.", bio: "Restoration as resistance.", specialties: ["Yoga","Breathwork","Mobility"], avatar_url: "/assets/pilates-pink.jpg", hero_image: "/assets/pilates-pink.jpg", home_location_id: "loc-cpt", rating: 4.97 },
];

const today = new Date();
const at = (dayOffset: number, hour: number, min = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

export const fallbackClasses: ClassRow[] = [
  { id: "cls-1", slug: "west-coast-flow-1", location_id: "loc-cpt", trainer_id: "tr-kai", name: "WEST COAST FLOW", kind: "reformer", starts_at: at(2, 18, 30), duration_min: 50, capacity: 14, booked: 9, intensity: "MD", room: "STUDIO B", hero_image: "/assets/blue-set-rooftop.jpg" },
  { id: "cls-2", slug: "core-compton-1", location_id: "loc-cpt", trainer_id: "tr-simone", name: "CORE COMPTON", kind: "pilates", starts_at: at(0, 7, 0), duration_min: 45, capacity: 12, booked: 8, intensity: "HI", room: "STUDIO A", hero_image: "/assets/pilates-pink.jpg" },
  { id: "cls-3", slug: "morning-mobility", location_id: "loc-cpt", trainer_id: "tr-simone", name: "MORNING MOBILITY", kind: "yoga", starts_at: at(0, 6, 0), duration_min: 30, capacity: 16, booked: 4, intensity: "LO", room: "STUDIO C", hero_image: "/assets/bridge-pose.jpg" },
  { id: "cls-4", slug: "street-hiit", location_id: "loc-atl", trainer_id: "tr-amara", name: "STREET HIIT", kind: "hiit", starts_at: at(0, 12, 0), duration_min: 30, capacity: 20, booked: 20, intensity: "HI", room: "FLOOR", hero_image: "/assets/dumbbell-street.jpg" },
  { id: "cls-5", slug: "private-1on1", location_id: "loc-cpt", trainer_id: "tr-kai", name: "PRIVATE · 1:1", kind: "private", starts_at: at(0, 17, 0), duration_min: 60, capacity: 1, booked: 0, intensity: "MD", room: "STUDIO B", hero_image: "/assets/blue-hair-gym.jpg" },
  { id: "cls-6", slug: "rooftop-sunset", location_id: "loc-cpt", trainer_id: "tr-kai", name: "ROOFTOP SUNSET", kind: "reformer", starts_at: at(0, 19, 30), duration_min: 50, capacity: 12, booked: 12, intensity: "MD", room: "ROOF", hero_image: "/assets/blue-set-rooftop.jpg" },
];

export const fallbackProducts: Product[] = [
  { id: "p1", slug: "tripod-bottle", name: "TRIPOD BOTTLE", subtitle: "32 OZ · DUSK BLUE", category: "gear", price_cents: 5800, compare_at_cents: null, description: "Insulated 32oz with a built-in phone mount in the cap. Set it up on the mat. Get the angle right.", hero_image: "/assets/bottle-tripod.jpg", gallery: ["/assets/bottle-tripod.jpg","/assets/bottle-gym.jpg","/assets/bottle-gym-2.jpg"], tag: "SIGNATURE", in_stock: true, sort_order: 1 },
  { id: "p2", slug: "compton-hoodie", name: "COMPTON HOODIE", subtitle: "HEATHER · OS", category: "wear", price_cents: 9200, compare_at_cents: null, description: "Heavyweight French terry, double-stitched. Fits oversized.", hero_image: "/products/IMG_3456.jpg", gallery: ["/products/IMG_3456.jpg","/assets/hoodie-grey-blonde.jpg","/assets/hoodie-grey-blonde-2.jpg"], tag: null, in_stock: true, sort_order: 2 },
  { id: "p3", slug: "element-bra", name: "ELEMENT BRA", subtitle: "SKY · XS-XL", category: "wear", price_cents: 4800, compare_at_cents: null, description: "Medium-impact compression, sweat-wicking. Sky blue, our signature.", hero_image: "/products/IMG_3457.jpg", gallery: ["/products/IMG_3457.jpg","/assets/blue-hair-selfie.jpg"], tag: "BACK", in_stock: true, sort_order: 3 },
  { id: "p4", slug: "heavy-flask", name: "HEAVY FLASK", subtitle: "40 OZ · GYM", category: "gear", price_cents: 4800, compare_at_cents: null, description: "Vacuum-sealed steel. 40 oz keeps you on the floor longer.", hero_image: "/products/IMG_3460.jpg", gallery: ["/products/IMG_3460.jpg","/assets/bottle-gym-2.jpg"], tag: null, in_stock: true, sort_order: 4 },
  { id: "p5", slug: "element-set", name: "THE ELEMENT SET", subtitle: "HOODIE + SHORTS BUNDLE", category: "wear", price_cents: 14800, compare_at_cents: 18000, description: "Drop 04. The full kit.", hero_image: "/assets/hoodie-duo.jpg", gallery: ["/assets/hoodie-duo.jpg","/products/IMG_3464.jpg"], tag: "BUNDLE", in_stock: true, sort_order: 5 },
];

export const fallbackPosts: Post[] = [
  { id: "ps1", author_id: null, kind: "trainer_drop", body: "NEW · West Coast Flow Series 04 just dropped. Light reformer + breath. 7 sessions.", media_url: "/assets/blue-set-rooftop.jpg", meta: { author: "KAI · TRAINER", tag: "STAFF" }, created_at: new Date().toISOString() },
  { id: "ps2", author_id: null, kind: "progress", body: "Hit 14 days straight. The streak is real. Pulled up at 5:45a.", media_url: "/assets/dumbbell-street.jpg", meta: { author: "AALIYAH M.", streak: 14 }, created_at: new Date(Date.now() - 1000*60*60).toISOString() },
  { id: "ps3", author_id: null, kind: "milestone", body: "PR · Reformer footwork to plank. Held it.", media_url: "/assets/pilates-pink.jpg", meta: { author: "NOVA T.", pr: "Plank · 2:30" }, created_at: new Date(Date.now() - 1000*60*60*4).toISOString() },
  { id: "ps4", author_id: null, kind: "event", body: "Sunset rooftop class · Sat 7p · Compton HQ. 12 spots.", media_url: "/assets/blue-set-rooftop.jpg", meta: { date: "SAT 5/3 · 7:00P", spots: 12 }, created_at: new Date(Date.now() - 1000*60*60*24).toISOString() },
  { id: "ps5", author_id: null, kind: "announcement", body: "ATL West End is officially open. Come see us.", media_url: "/assets/element78-hero.jpg", meta: { location: "ATL · WEST END" }, created_at: new Date(Date.now() - 1000*60*60*48).toISOString() },
];
