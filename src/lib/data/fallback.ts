// Static fallback so the app renders before Supabase is wired up.
// Mirrors supabase/seed.sql + the imagery-refresh migration.

import type { ClassRow, Flow, Location, Post, Product, Trainer, Program, ProgramSession } from "./types";

export const fallbackLocations: Location[] = [
  { id: "loc-atl", slug: "atlanta-hq", name: "Atlanta HQ", city: "Atlanta", state: "GA", status: "active", hero_image: "/assets/atlgym.jpg", lat: 33.749, lng: -84.388, sort_order: 1 },
  { id: "loc-la", slug: "los-angeles", name: "Los Angeles", city: "Los Angeles", state: "CA", status: "waitlist", hero_image: "/assets/blue-hair-gym.jpg", lat: 34.0522, lng: -118.2437, sort_order: 2 },
  { id: "loc-hou", slug: "houston", name: "Houston", city: "Houston", state: "TX", status: "waitlist", hero_image: null, lat: 29.7604, lng: -95.3698, sort_order: 3 },
  { id: "loc-nyc", slug: "new-york", name: "New York", city: "Brooklyn", state: "NY", status: "waitlist", hero_image: null, lat: 40.6872, lng: -73.9418, sort_order: 4 },
  { id: "loc-dc", slug: "washington-dc", name: "Washington DC", city: "Washington", state: "DC", status: "waitlist", hero_image: null, lat: 38.9072, lng: -77.0369, sort_order: 5 },
];

export const fallbackTrainers: Trainer[] = [
  { id: "tr-kai", slug: "kai-brooks", name: "Kai Brooks", headline: "Reformer + mat Pilates. BASI-certified. 8 yrs on the floor.", bio: "Kai trains the way she dances — slow tempo, long lines, no shortcuts. Lead reformer coach. Trains everyone from first-timers to dancers prepping for tour. Ask her about the Power Pilates ladder; she built it from a 12-week study with her clients.", specialties: ["Reformer","Mat Pilates","Mobility"], avatar_url: "/assets/blue-hair-gym.jpg", hero_image: "/assets/blue-hair-gym.jpg", home_location_id: "loc-atl", rating: 4.95, is_ai: false, years_experience: 8, cert: "BASI · Polestar L2" },
  { id: "tr-amara", slug: "amara-jones", name: "Amara Jones", headline: "HIIT, strength, conditioning. NSCA-CPT. 6 yrs.", bio: "Trained the Atlanta running club for three years before joining the floor. Builds engines. Believes most women lift too light and rest too short — and fixes both. Programs lean toward strength bias with metabolic finishers.", specialties: ["HIIT","Strength","Conditioning"], avatar_url: "/assets/dumbbell-street.jpg", hero_image: "/assets/dumbbell-street.jpg", home_location_id: "loc-atl", rating: 4.91, is_ai: false, years_experience: 6, cert: "NSCA-CPT · USAW-L1" },
  { id: "tr-jay", slug: "jay-elias", name: "Jay Elias", headline: "Strength + 1-on-1. NASM. 7 yrs.", bio: "Powerlifting background, then trained pre/post-natal for four years — that combo is rarer than it sounds. Big numbers, sharp form. Most popular for 1-on-1s where the goal is squat or deadlift PR.", specialties: ["Strength","1-on-1","Powerlifting"], avatar_url: "/assets/IMG_3461.jpg", hero_image: "/assets/IMG_3461.jpg", home_location_id: "loc-atl", rating: 4.88, is_ai: false, years_experience: 7, cert: "NASM-CPT · CSCS" },
  { id: "tr-tasha", slug: "tasha-wright", name: "Tasha Wright", headline: "Pilates, mobility, pre/post natal. 6 yrs.", bio: "Patient hands, sharp eye. Built her practice around women returning to fitness after pregnancy — knows how to scale every block to where you actually are today. Leads the Sunrise Pilates wave at 6:25A weekdays.", specialties: ["Pilates","Mobility","Pre/Post Natal"], avatar_url: "/assets/editorial-1.jpg", hero_image: "/assets/editorial-1.jpg", home_location_id: "loc-atl", rating: 4.96, is_ai: false, years_experience: 6, cert: "STOTT · Pre/Post Natal" },
  // AI avatars — same trainer table, marked is_ai. Lets us slot them into
  // /trainers, the schedule, and detail pages without a parallel system.
  { id: "tr-zuri", slug: "zuri", name: "Zuri", headline: "AI avatar · Pilates, reformer, mobility.", bio: "Modeled on Kai's signature flow. Slow tempo, hard work, breath-led cues. Available 24/7 in the app and at the AI booths in Studio B. Reads your form in real time, adjusts intensity to your day.", specialties: ["Pilates","Reformer","Mobility"], avatar_url: "/assets/blue-hair-gym.jpg", hero_image: "/assets/floor-mockup.png", home_location_id: "loc-atl", rating: 4.93, is_ai: true, years_experience: null, cert: "Element 78 AI · v3.2" },
  { id: "tr-mari", slug: "mari", name: "Mari", headline: "AI avatar · HIIT, functional, conditioning.", bio: "Modeled on Amara. Heavy basics, quick rounds. Real-time tempo cues and rep counts. Pair with a heart-rate monitor and she tunes the work-to-rest ratios live.", specialties: ["HIIT","Functional","Conditioning"], avatar_url: "/assets/dumbbell-street.jpg", hero_image: "/assets/IMG_3469.jpg", home_location_id: "loc-atl", rating: 4.89, is_ai: true, years_experience: null, cert: "Element 78 AI · v3.2" },
  { id: "tr-leila", slug: "leila", name: "Leila", headline: "AI avatar · Yoga, breathwork, recovery.", bio: "Breath-led restorative flows. Soft tempo, deeper holds. Built for the days your watch says you slept badly — Leila tunes the session to your sleep score and HRV.", specialties: ["Yoga","Breathwork","Recovery"], avatar_url: "/assets/pilates-pink.jpg", hero_image: "/assets/editorial-2.png", home_location_id: "loc-atl", rating: 4.94, is_ai: true, years_experience: null, cert: "Element 78 AI · v3.2" },
];

// Daily schedule template — every weekday gets these classes, weekends pull
// from a slimmer set. Lets us generate two weeks of variety from one definition.
type ScheduleSlot = {
  slug: string;
  name: string;
  kind: string;
  trainer_id: string;
  hour: number;
  minute: number;
  duration_min: number;
  capacity: number;
  booked: number;
  intensity: string;
  room: string;
  hero_image: string;
  price_cents: number;
  summary: string;
  what_to_bring: string;
  weekendOnly?: boolean;
  weekdaysOnly?: boolean;
};

const scheduleTemplate: ScheduleSlot[] = [
  // Morning
  { slug: "sunrise-pilates",  name: "SUNRISE PILATES",   kind: "pilates",    trainer_id: "tr-tasha", hour: 6,  minute: 25, duration_min: 35, capacity: 14, booked: 6,  intensity: "LO", room: "STUDIO A", hero_image: "/assets/IMG_3467.jpg",        price_cents: 0,    summary: "The 6:25A wave. Slow openings, breath cues, no equipment.",                     what_to_bring: "Mat provided · loose layers", weekdaysOnly: true },
  { slug: "morning-mobility", name: "MORNING MOBILITY",  kind: "mobility",   trainer_id: "tr-tasha", hour: 7,  minute: 0,  duration_min: 30, capacity: 16, booked: 4,  intensity: "LO", room: "STUDIO C", hero_image: "/assets/IMG_3467.jpg",        price_cents: 0,    summary: "Pre-coffee mobility flow. Soft openings, slow breath.",                          what_to_bring: "Mat provided · loose layers" },
  { slug: "core-78",          name: "CORE 78",           kind: "pilates",    trainer_id: "tr-tasha", hour: 8,  minute: 30, duration_min: 45, capacity: 12, booked: 8,  intensity: "HI", room: "STUDIO A", hero_image: "/assets/floor-mockup.png",    price_cents: 1500, summary: "High-intensity core block on the mat. Short bursts, longer holds.",              what_to_bring: "Mat provided · grip socks" },
  // Mid-morning / lunch
  { slug: "power-pilates",    name: "POWER PILATES",     kind: "reformer",   trainer_id: "tr-kai",   hour: 10, minute: 0,  duration_min: 50, capacity: 12, booked: 5,  intensity: "MD", room: "STUDIO B", hero_image: "/assets/blue-set-rooftop.jpg",price_cents: 2500, summary: "Reformer-based Pilates that builds long lines and core control.",               what_to_bring: "Grip socks · water" },
  { slug: "street-hiit",      name: "STREET HIIT",       kind: "hiit",       trainer_id: "tr-amara", hour: 12, minute: 0,  duration_min: 30, capacity: 20, booked: 11, intensity: "HI", room: "FLOOR",    hero_image: "/assets/dumbbell-street.jpg", price_cents: 0,    summary: "Outdoor-style HIIT on the floor. Bodyweight + dumbbells.",                       what_to_bring: "Athletic shoes · sweat towel" },
  { slug: "lunch-strength",   name: "LUNCH STRENGTH",    kind: "strength",   trainer_id: "tr-jay",   hour: 12, minute: 30, duration_min: 45, capacity: 10, booked: 4,  intensity: "MD", room: "WEIGHT FLOOR", hero_image: "/assets/IMG_3469.jpg",    price_cents: 1500, summary: "Heavy basics in 45. Squat, hinge, push, pull, carry — pick three.",              what_to_bring: "Lifters · chalk allowed" },
  // Afternoon
  { slug: "engine-builder",   name: "ENGINE BUILDER",    kind: "conditioning",trainer_id:"tr-amara", hour: 16, minute: 0,  duration_min: 28, capacity: 16, booked: 9,  intensity: "HI", room: "FLOOR",    hero_image: "/assets/IMG_3465.jpg",        price_cents: 1500, summary: "Threshold intervals scaled to your HRV. Eight rounds, three minutes each.",      what_to_bring: "Heart-rate monitor optional" },
  { slug: "deadlift-lab",     name: "DEADLIFT LAB",      kind: "strength",   trainer_id: "tr-jay",   hour: 17, minute: 0,  duration_min: 60, capacity: 8,  booked: 6,  intensity: "HI", room: "WEIGHT FLOOR", hero_image: "/assets/IMG_3461.jpg",   price_cents: 2500, summary: "Pull setup → top set → backoffs. Conventional or trap bar.",                     what_to_bring: "Lifters · belt if you want", weekdaysOnly: true },
  // Evening
  { slug: "west-coast-flow",  name: "WEST COAST FLOW",   kind: "reformer",   trainer_id: "tr-kai",   hour: 18, minute: 30, duration_min: 50, capacity: 14, booked: 9,  intensity: "MD", room: "STUDIO B", hero_image: "/assets/blue-set-rooftop.jpg",price_cents: 2500, summary: "Slow tempo, hard work. Reformer flow that builds long lines.",                   what_to_bring: "Grip socks · water" },
  { slug: "rooftop-sunset",   name: "ROOFTOP SUNSET",    kind: "reformer",   trainer_id: "tr-kai",   hour: 19, minute: 30, duration_min: 50, capacity: 12, booked: 7,  intensity: "MD", room: "ROOF",     hero_image: "/assets/editorial-2.png",     price_cents: 2500, summary: "Reformer flow on the open-air rooftop deck. Sunset cues, heavier music.",        what_to_bring: "Grip socks · water · open mind" },
  { slug: "evening-yoga",     name: "EVENING YOGA",      kind: "yoga",       trainer_id: "tr-tasha", hour: 20, minute: 0,  duration_min: 45, capacity: 16, booked: 5,  intensity: "LO", room: "STUDIO C", hero_image: "/assets/pilates-pink.jpg",    price_cents: 0,    summary: "Restorative wind-down. Long holds, soft music, breath-led.",                     what_to_bring: "Mat provided · blanket if you have one" },
  // Weekend specials
  { slug: "saturday-strong",  name: "SATURDAY STRONG",   kind: "strength",   trainer_id: "tr-jay",   hour: 9,  minute: 0,  duration_min: 60, capacity: 12, booked: 6,  intensity: "HI", room: "WEIGHT FLOOR", hero_image: "/assets/IMG_3469.jpg",    price_cents: 2500, summary: "Heavy basics, full hour. Squat or deadlift focus, alternating weeks.",           what_to_bring: "Lifters · chalk allowed", weekendOnly: true },
  { slug: "sunday-reset",     name: "SUNDAY RESET",      kind: "yoga",       trainer_id: "tr-tasha", hour: 10, minute: 0,  duration_min: 60, capacity: 18, booked: 8,  intensity: "LO", room: "STUDIO C", hero_image: "/assets/editorial-1.jpg",     price_cents: 0,    summary: "Restorative yoga + breathwork. The week's slowest hour.",                        what_to_bring: "Mat provided · blanket", weekendOnly: true },
];

export const fallbackClasses: ClassRow[] = (() => {
  const out: ClassRow[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dow = date.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dow === 0 || dow === 6;
    for (const slot of scheduleTemplate) {
      if (slot.weekdaysOnly && isWeekend) continue;
      if (slot.weekendOnly && !isWeekend) continue;
      const start = new Date(date);
      start.setHours(slot.hour, slot.minute, 0, 0);
      out.push({
        id: `cls-${slot.slug}-${dayOffset}`,
        slug: `${slot.slug}-${dayOffset}`,
        location_id: "loc-atl",
        trainer_id: slot.trainer_id,
        name: slot.name,
        kind: slot.kind,
        starts_at: start.toISOString(),
        duration_min: slot.duration_min,
        capacity: slot.capacity,
        // Lightly randomize occupancy by day so the schedule doesn't look static.
        booked: Math.min(slot.capacity, slot.booked + ((dayOffset * 3) % 5)),
        intensity: slot.intensity,
        room: slot.room,
        hero_image: slot.hero_image,
        price_cents: slot.price_cents,
        requires_payment: slot.price_cents > 0,
        summary: slot.summary,
        what_to_bring: slot.what_to_bring,
      });
    }
  }
  return out;
})();

export const fallbackProducts: Product[] = [
  { id: "p1", slug: "tripod-bottle", name: "TRIPOD BOTTLE", subtitle: "32 OZ · DUSK BLUE", category: "gear", price_cents: 5800, compare_at_cents: null, description: "Insulated 32oz with a built-in phone mount in the cap. Set it up on the mat. Get the angle right.", hero_image: "/products/water-tripod-1.png", gallery: ["/products/water-tripod-1.png","/products/water-tripod-2.jpg","/assets/IMG_3470.jpg","/assets/IMG_3462.jpg"], tag: "SIGNATURE", in_stock: true, sort_order: 1 },
  { id: "p2", slug: "compton-hoodie", name: "ELEMENT HOODIE", subtitle: "HEATHER · OS", category: "wear", price_cents: 9200, compare_at_cents: null, description: "Heavyweight French terry, double-stitched. Fits oversized.", hero_image: "/assets/IMG_3458.jpg", gallery: ["/assets/IMG_3458.jpg","/assets/IMG_3459.jpg","/products/IMG_3456.jpg"], tag: null, in_stock: true, sort_order: 2 },
  { id: "p5", slug: "element-set", name: "THE ELEMENT SET", subtitle: "HOODIE + SHORTS BUNDLE", category: "wear", price_cents: 14800, compare_at_cents: 18000, description: "Drop 04. The full kit.", hero_image: "/products/long-short-sleeve-set.jpg", gallery: ["/products/long-short-sleeve-set.jpg","/assets/IMG_3458.jpg","/products/long-sleeve-set-1.jpg"], tag: "BUNDLE", in_stock: true, sort_order: 5 },
  { id: "p6", slug: "element-tracksuit", name: "ELEMENT TRACKSUIT", subtitle: "HEATHER · OS · OS", category: "wear", price_cents: 12800, compare_at_cents: null, description: "Mid-weight terry tracksuit, oversized cut.", hero_image: "/products/tracksuit.jpg", gallery: ["/products/tracksuit.jpg","/assets/IMG_3459.jpg"], tag: "NEW", in_stock: true, sort_order: 6 },
  { id: "p7", slug: "long-sleeve-set", name: "LONG SLEEVE SET", subtitle: "SKY · XS-XL", category: "wear", price_cents: 11800, compare_at_cents: null, description: "Compression long sleeve crop with the Element 78 wordmark.", hero_image: "/products/long-sleeve-set-1.jpg", gallery: ["/products/long-sleeve-set-1.jpg","/products/long-sleeve-set-2.jpg","/products/pick-set.jpg"], tag: "BACK", in_stock: true, sort_order: 7 },
  { id: "p8", slug: "short-sleeve-set", name: "SHORT SLEEVE SET", subtitle: "SKY · XS-XL", category: "wear", price_cents: 9800, compare_at_cents: null, description: "Quarter-zip mock crop + bike shorts. Sweat-wicking, four-way stretch.", hero_image: "/products/short-sleeve-1.jpg", gallery: ["/products/short-sleeve-1.jpg","/products/short-sleeve-2.jpg","/products/blueset-2.png"], tag: null, in_stock: true, sort_order: 8 },
];

export const fallbackPrograms: Program[] = [
  { id: "prog-1", slug: "in-my-element", name: "IN MY ELEMENT", subtitle: "Series 03 · the signature reset", description: "Daily Pilates flow + breath work. Slow tempo, hard work. Builds the body — and the streak — back from neutral.", hero_image: "/assets/floor-mockup.png", duration_label: "21 DAYS · DAILY", total_sessions: 21, intensity: "Beginner → Intermediate", kind: "both", surfaces: ["app","gym","class"], sort_order: 1, price_cents: 0, requires_payment: false, trainer_id: "tr-kai" },
  { id: "prog-2", slug: "city-of-angels", name: "CITY OF ANGELS", subtitle: "Outdoor + weight floor", description: "Heavy basics, quick rounds, no filler. Mixes street strength with reformer accessory work.", hero_image: "/assets/IMG_3461.jpg", duration_label: "14 DAYS · STRENGTH", total_sessions: 14, intensity: "Intermediate", kind: "both", surfaces: ["app","gym"], sort_order: 2, price_cents: 8900, requires_payment: true, trainer_id: "tr-amara" },
  { id: "prog-3", slug: "living-room-luxury", name: "LIVING ROOM LUXURY", subtitle: "No equipment, low impact", description: "For travel, recovery weeks, and the days you don't want to drive. Mat-only Pilates and mobility you can do in 6×6 feet.", hero_image: "/assets/IMG_3467.jpg", duration_label: "8 SESSIONS · LIVING ROOM", total_sessions: 8, intensity: "All levels", kind: "in_app", surfaces: ["app"], sort_order: 3, price_cents: 3900, requires_payment: true, trainer_id: "tr-tasha" },
  { id: "prog-4", slug: "heavy-basics", name: "HEAVY BASICS", subtitle: "Squat · hinge · push · pull · carry", description: "Five movements, three sessions a week. Learn the lifts, build the engine, walk out stronger every Monday.", hero_image: "/assets/IMG_3469.jpg", duration_label: "4 WEEKS · 12 SESSIONS", total_sessions: 12, intensity: "Beginner → Intermediate", kind: "in_person", surfaces: ["gym","class"], sort_order: 4, price_cents: 7900, requires_payment: true, trainer_id: "tr-amara" },
  { id: "prog-5", slug: "sunrise-30", name: "SUNRISE 30", subtitle: "30 days of morning mobility", description: "12-minute pre-coffee mobility flow. Same time every day. Builds a sustainable practice you actually keep.", hero_image: "/assets/IMG_3467.jpg", duration_label: "30 DAYS · 12 MIN", total_sessions: 30, intensity: "All levels", kind: "in_app", surfaces: ["app"], sort_order: 5, price_cents: 0, requires_payment: false, trainer_id: "tr-tasha" },
  { id: "prog-6", slug: "engine-builder", name: "ENGINE BUILDER", subtitle: "Conditioning · 6 weeks", description: "Lactate-threshold work for runners and lifters. Three engine sessions a week — short, brutal, scaled by HRV.", hero_image: "/assets/IMG_3465.jpg", duration_label: "6 WEEKS · 18 SESSIONS", total_sessions: 18, intensity: "Intermediate → Advanced", kind: "both", surfaces: ["app","gym"], sort_order: 6, price_cents: 9900, requires_payment: true, trainer_id: "tr-amara" },
  { id: "prog-7", slug: "reformer-ladder", name: "REFORMER LADDER", subtitle: "Power Pilates · 6 weeks", description: "Kai's reformer protocol — three blocks, ascending intensity. Built from the 12-week study with her clients.", hero_image: "/assets/blue-set-rooftop.jpg", duration_label: "6 WEEKS · 24 SESSIONS", total_sessions: 24, intensity: "Intermediate", kind: "in_person", surfaces: ["gym","class"], sort_order: 7, price_cents: 14900, requires_payment: true, trainer_id: "tr-kai" },
  { id: "prog-8", slug: "return-to-run", name: "RETURN TO RUN", subtitle: "Rebuild your run · 8 weeks", description: "From comeback after a break (or a baby) to a confident 5K. Strength, mobility, and progressive run intervals.", hero_image: "/assets/dumbbell-street.jpg", duration_label: "8 WEEKS · 24 SESSIONS", total_sessions: 24, intensity: "All levels", kind: "both", surfaces: ["app","gym"], sort_order: 8, price_cents: 11900, requires_payment: true, trainer_id: "tr-jay" },
  { id: "prog-9", slug: "breath-reset", name: "BREATH RESET", subtitle: "AI-led · 14 days", description: "Box breathing, physiological sigh, 4-7-8. Ten-minute resets you can run before bed or between meetings.", hero_image: "/assets/pilates-pink.jpg", duration_label: "14 DAYS · 10 MIN", total_sessions: 14, intensity: "All levels", kind: "in_app", surfaces: ["app"], sort_order: 9, price_cents: 0, requires_payment: false, trainer_id: "tr-leila" },
  { id: "prog-10", slug: "post-natal-foundation", name: "POST-NATAL FOUNDATION", subtitle: "Reconnect · 8 weeks", description: "Patient core reconnection + pelvic floor work. Modular blocks with three regression options every day.", hero_image: "/assets/editorial-1.jpg", duration_label: "8 WEEKS · 24 SESSIONS", total_sessions: 24, intensity: "Beginner", kind: "both", surfaces: ["app","gym","class"], sort_order: 10, price_cents: 12900, requires_payment: true, trainer_id: "tr-tasha" },
];

/**
 * Flows curated per trainer. These are the "AI Studio" short solo videos
 * (the rail on /home), but tagged so each trainer's profile can show their
 * own. No DB table yet — this is the source of truth.
 */
export const fallbackFlows: Flow[] = [
  // Kai
  { id: "fl-kai-1", slug: "west-coast-flow", name: "WEST COAST FLOW", trainer_id: "tr-kai", duration_min: 28, intensity: "MD", kind: "Pilates", hero_image: "/assets/blue-set-rooftop.jpg", summary: "Slow tempo, long lines. Reformer-free, mat only. Built for living rooms in Atlanta." },
  { id: "fl-kai-2", slug: "long-line-low-impact", name: "LONG LINE · LOW IMPACT", trainer_id: "tr-kai", duration_min: 22, intensity: "LO", kind: "Pilates", hero_image: "/assets/IMG_3467.jpg", summary: "Pre-coffee mobility into a slow Pilates ladder. Soft on the body, sharp on the focus." },
  { id: "fl-kai-3", slug: "power-pilates-ladder", name: "POWER PILATES LADDER", trainer_id: "tr-kai", duration_min: 35, intensity: "HI", kind: "Pilates", hero_image: "/assets/floor-mockup.png", summary: "The 12-week study, condensed. Three blocks, ascending intensity. Only attempt if you've done it once with form cues on." },
  // Amara
  { id: "fl-amara-1", slug: "street-hiit-30", name: "STREET HIIT 30", trainer_id: "tr-amara", duration_min: 30, intensity: "HI", kind: "HIIT", hero_image: "/assets/dumbbell-street.jpg", summary: "Outdoor-style HIIT in your living room. Bodyweight + one dumbbell. Real rounds, real rest." },
  { id: "fl-amara-2", slug: "engine-builder", name: "ENGINE BUILDER", trainer_id: "tr-amara", duration_min: 24, intensity: "HI", kind: "Conditioning", hero_image: "/assets/IMG_3465.jpg", summary: "Lactate-threshold work for runners and lifters. Eight intervals, three minutes each, finish gassed." },
  { id: "fl-amara-3", slug: "heavy-basics", name: "HEAVY BASICS", trainer_id: "tr-amara", duration_min: 38, intensity: "HI", kind: "Strength", hero_image: "/assets/IMG_3469.jpg", summary: "Squat, hinge, push, pull, carry. Five movements, three sets. The whole engine in 38 minutes." },
  // Jay
  { id: "fl-jay-1", slug: "deadlift-architecture", name: "DEADLIFT ARCHITECTURE", trainer_id: "tr-jay", duration_min: 42, intensity: "HI", kind: "Strength", hero_image: "/assets/IMG_3461.jpg", summary: "Pull setup → top set → backoffs. Built around the conventional deadlift but scales to RDL or trap bar." },
  { id: "fl-jay-2", slug: "back-and-grip", name: "BACK + GRIP", trainer_id: "tr-jay", duration_min: 28, intensity: "MD", kind: "Strength", hero_image: "/assets/IMG_3458.jpg", summary: "Rows, pull-ups, farmer carries. The unsexy work that fixes everything." },
  // Tasha
  { id: "fl-tasha-1", slug: "sunrise-pilates", name: "SUNRISE PILATES", trainer_id: "tr-tasha", duration_min: 25, intensity: "LO", kind: "Pilates", hero_image: "/assets/IMG_3467.jpg", summary: "The 6:25A wave, condensed for solo practice. Slow openings, breath cues, no equipment." },
  { id: "fl-tasha-2", slug: "post-natal-foundation", name: "POST-NATAL FOUNDATION", trainer_id: "tr-tasha", duration_min: 30, intensity: "LO", kind: "Pilates", hero_image: "/assets/editorial-1.jpg", summary: "Core reconnection + pelvic floor work. Modular — every block has three regression options." },
  // Zuri (AI)
  { id: "fl-zuri-1", slug: "zuri-flow-01", name: "ZURI · FLOW 01", trainer_id: "tr-zuri", duration_min: 18, intensity: "LO", kind: "Pilates", hero_image: "/assets/IMG_3467.jpg", summary: "Live AI-coached Pilates flow. Form-corrected in real time. Phone propped, mat down, go." },
  { id: "fl-zuri-2", slug: "zuri-mobility-am", name: "ZURI · MOBILITY AM", trainer_id: "tr-zuri", duration_min: 12, intensity: "LO", kind: "Mobility", hero_image: "/assets/floor-mockup.png", summary: "Twelve-minute morning mobility. AI tunes to whichever joint your watch says is stiff today." },
  // Mari (AI)
  { id: "fl-mari-1", slug: "mari-rounds", name: "MARI · ROUNDS", trainer_id: "tr-mari", duration_min: 24, intensity: "HI", kind: "HIIT", hero_image: "/assets/dumbbell-street.jpg", summary: "AI-paced HIIT. Heart-rate driven; she'll extend rest if you spike, push tempo if you don't." },
  { id: "fl-mari-2", slug: "mari-finisher", name: "MARI · FINISHER", trainer_id: "tr-mari", duration_min: 8, intensity: "HI", kind: "Conditioning", hero_image: "/assets/IMG_3469.jpg", summary: "Eight-minute metabolic finisher to bolt onto any lift session. Brutal in the best way." },
  // Leila (AI)
  { id: "fl-leila-1", slug: "leila-restorative", name: "LEILA · RESTORATIVE", trainer_id: "tr-leila", duration_min: 28, intensity: "LO", kind: "Yoga", hero_image: "/assets/editorial-2.png", summary: "Soft restorative flow. Read your sleep score, adjusts the holds." },
  { id: "fl-leila-2", slug: "leila-breath", name: "LEILA · BREATH", trainer_id: "tr-leila", duration_min: 10, intensity: "LO", kind: "Breathwork", hero_image: "/assets/pilates-pink.jpg", summary: "Box breathing → physiological sigh → 4-7-8. Short, decompressing." },
];

export const fallbackProgramSessions: ProgramSession[] = (() => {
  const out: ProgramSession[] = [];
  // Legacy fallback rows: one session per day, free-form (ref_kind='custom').
  // Real programs use the program_builder schema (migration 0006).
  const make = (id: string, program_id: string, day_index: number, name: string, duration_min: number, description: string, kind: string, hero_image: string, video_url: string | null = null): ProgramSession => ({
    id, program_id, day_index, session_index: 0, name, duration_min, description, kind, video_url, hero_image,
    ref_kind: "custom", routine_slug: null, class_slug: null, trainer_id_for_1on1: null, trainer_slug_for_1on1: null,
  });
  for (let d = 1; d <= 21; d++) out.push(make(`s-ime-${d}`, "prog-1", d, `IN MY ELEMENT · Day ${d}`, 35, "Daily Pilates flow + breath work.", "flow", "/assets/floor-mockup.png", d === 1 ? "https://xiimrgdfbucpwugxmkrm.supabase.co/storage/v1/object/public/media/flow.mp4" : null));
  for (let d = 1; d <= 14; d++) out.push(make(`s-coa-${d}`, "prog-2", d, `CITY OF ANGELS · Day ${d}`, 45, "Heavy basics, quick rounds.", "strength", "/assets/IMG_3461.jpg"));
  for (let d = 1; d <= 8; d++)  out.push(make(`s-lrl-${d}`, "prog-3", d, `LIVING ROOM LUXURY · Day ${d}`, 25, "Mat-only Pilates and mobility.", "flow", "/assets/IMG_3467.jpg"));
  for (let d = 1; d <= 12; d++) out.push(make(`s-hb-${d}`,  "prog-4", d, `HEAVY BASICS · Session ${d}`, 50, "Squat / hinge / push / pull / carry.", "strength", "/assets/IMG_3469.jpg"));
  for (let d = 1; d <= 30; d++) out.push(make(`s-sr-${d}`,  "prog-5", d, `SUNRISE 30 · Day ${d}`, 12, "Pre-coffee mobility flow.", "mobility", "/assets/IMG_3467.jpg"));
  for (let d = 1; d <= 18; d++) out.push(make(`s-eb-${d}`,  "prog-6", d, `ENGINE BUILDER · Session ${d}`, 28, "Threshold intervals, scaled by HRV.", "conditioning", "/assets/IMG_3465.jpg"));
  for (let d = 1; d <= 24; d++) out.push(make(`s-rl-${d}`,  "prog-7", d, `REFORMER LADDER · Session ${d}`, 50, "Power Pilates ladder protocol.", "reformer", "/assets/blue-set-rooftop.jpg"));
  for (let d = 1; d <= 24; d++) out.push(make(`s-rtr-${d}`, "prog-8", d, `RETURN TO RUN · Session ${d}`, 35, "Run intervals + strength + mobility.", "run", "/assets/dumbbell-street.jpg"));
  for (let d = 1; d <= 14; d++) out.push(make(`s-br-${d}`,  "prog-9", d, `BREATH RESET · Day ${d}`, 10, "Breathwork reset session.", "breath", "/assets/pilates-pink.jpg"));
  for (let d = 1; d <= 24; d++) out.push(make(`s-pn-${d}`,  "prog-10", d, `POST-NATAL FOUNDATION · Session ${d}`, 35, "Core reconnection + pelvic floor.", "pilates", "/assets/editorial-1.jpg"));
  return out;
})();

export const fallbackPosts: Post[] = [
  { id: "ps1", author_id: null, kind: "trainer_drop", body: "NEW · West Coast Flow Series 04 just dropped. Light reformer + breath. 7 sessions.", media_url: "/assets/blue-set-rooftop.jpg", meta: { author: "KAI · TRAINER", tag: "STAFF" }, created_at: new Date().toISOString() },
  { id: "ps2", author_id: null, kind: "progress", body: "Hit 14 days straight. The streak is real. Pulled up at 5:45a.", media_url: "/assets/IMG_3461.jpg", meta: { author: "AALIYAH M.", streak: 14 }, created_at: new Date(Date.now() - 1000*60*60).toISOString() },
  { id: "ps3", author_id: null, kind: "milestone", body: "PR · Reformer footwork to plank. Held it.", media_url: "/assets/IMG_3467.jpg", meta: { author: "AALIYAH M.", pr: "Plank · 2:30" }, created_at: new Date(Date.now() - 1000*60*60*4).toISOString() },
  { id: "ps4", author_id: null, kind: "event", body: "Sunset rooftop class · Sat 7p · Atlanta HQ. 12 spots.", media_url: "/assets/IMG_3465.jpg", meta: { date: "SAT 5/3 · 7:00P", spots: 12 }, created_at: new Date(Date.now() - 1000*60*60*24).toISOString() },
  { id: "ps5", author_id: null, kind: "announcement", body: "ATL West End is officially open. Come see us.", media_url: "/assets/IMG_3471.jpg", meta: { location: "ATL · WEST END" }, created_at: new Date(Date.now() - 1000*60*60*48).toISOString() },
];
