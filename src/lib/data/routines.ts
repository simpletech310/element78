/**
 * Curated AI-Studio routines. Each routine is an ordered list of exercises;
 * every exercise has a target set/rep count and a video clip. The player
 * auto-advances to the next exercise once all sets are marked complete.
 *
 * Same video URL is intentionally reused across exercises — the routines
 * are about the *programmed sequence*, not unique video assets.
 */

const SUPABASE_MEDIA = "https://xiimrgdfbucpwugxmkrm.supabase.co/storage/v1/object/public/media";

// Single placeholder video for now. Swap per-exercise once individual clips
// are produced — no other code changes needed.
const DEFAULT_VIDEO = `${SUPABASE_MEDIA}/flow.mp4`;
const DEFAULT_POSTER = `${SUPABASE_MEDIA}/flow-poster.jpg`;

export type Exercise = {
  slug: string;
  name: string;
  cue: string;
  sets: number;
  reps: number | null;
  hold_seconds?: number;
  rest_seconds: number;
  video_url: string;
  poster_url?: string;
};

export type Routine = {
  slug: string;
  name: string;
  subtitle: string;
  category: "LOWER" | "UPPER" | "CORE" | "FULL" | "MOBILITY" | "REFORMER" | "HIIT";
  intensity: "LO" | "MD" | "HI";
  duration_min: number;
  hero_image: string;
  trainer_name: string;
  description: string;
  exercises: Exercise[];
};

const ex = (
  slug: string,
  name: string,
  cue: string,
  sets: number,
  reps: number | null,
  rest: number,
  hold?: number,
): Exercise => ({
  slug,
  name,
  cue,
  sets,
  reps,
  hold_seconds: hold,
  rest_seconds: rest,
  video_url: DEFAULT_VIDEO,
  poster_url: DEFAULT_POSTER,
});

export const routines: Routine[] = [
  {
    slug: "lower-body-foundation",
    name: "LOWER BODY FOUNDATION",
    subtitle: "Glutes · quads · posterior chain",
    category: "LOWER",
    intensity: "MD",
    duration_min: 32,
    hero_image: "/assets/IMG_3467.jpg",
    trainer_name: "AMARA",
    description: "Six-move ladder to build the engine. Squat, hinge, single-leg, glute. Three sets each, short rests. Shoes optional.",
    exercises: [
      ex("bodyweight-squat", "BODYWEIGHT SQUAT", "Knees track over toes. Sit between the hips. Drive through the heels.", 3, 12, 45),
      ex("glute-bridge", "GLUTE BRIDGE", "Press through the heel. Lift the hip. Hold the squeeze for three.", 3, 12, 45),
      ex("single-leg-bridge", "SINGLE-LEG BRIDGE", "Float the working leg. Don't drop the hip. Slow on the way down.", 3, 10, 45),
      ex("reverse-lunge", "REVERSE LUNGE", "Step long. Knee under shoulder. Push through the front heel to stand.", 3, 10, 50),
      ex("romanian-deadlift", "ROMANIAN DEADLIFT", "Hinge at the hip. Soft knees. Keep the bar close. Long line through the spine.", 3, 12, 60),
      ex("clamshells", "CLAMSHELLS", "Stack the heels. Don't roll the hip. Squeeze the glute med, not the low back.", 3, 15, 30),
    ],
  },
  {
    slug: "upper-body-base",
    name: "UPPER BODY BASE",
    subtitle: "Push · pull · scapular control",
    category: "UPPER",
    intensity: "MD",
    duration_min: 28,
    hero_image: "/assets/IMG_3469.jpg",
    trainer_name: "JAY",
    description: "Five-move upper body block. Push, pull, scapular control. Bodyweight or grab a pair of dumbbells.",
    exercises: [
      ex("push-up", "PUSH-UP", "Plank to the floor. Elbows at 45. Press the floor away.", 3, 10, 60),
      ex("bent-row", "BENT-OVER ROW", "Hinge to 45. Drive the elbow back. Squeeze the lats at the top.", 3, 12, 60),
      ex("shoulder-tap-plank", "SHOULDER-TAP PLANK", "Hips don't rotate. Slow taps. Brace before each rep.", 3, 10, 45),
      ex("overhead-press", "OVERHEAD PRESS", "Stack the rib over the hip. Press up, not forward. Lockout overhead.", 3, 10, 60),
      ex("scapular-pull", "SCAPULAR PULL", "Hang or hold. Initiate from the shoulder blade, not the bicep.", 3, 8, 45),
    ],
  },
  {
    slug: "core-78",
    name: "CORE 78",
    subtitle: "Anti-extension + anti-rotation",
    category: "CORE",
    intensity: "HI",
    duration_min: 22,
    hero_image: "/assets/floor-mockup.png",
    trainer_name: "TASHA",
    description: "Six moves, three sets, brutal in the best way. Builds the brace, not the burn.",
    exercises: [
      ex("dead-bug", "DEAD BUG", "Press the low back into the floor. Opposites move slow.", 3, 10, 30),
      ex("bird-dog", "BIRD DOG", "Long line from heel to fingertip. Don't let the hip rotate.", 3, 10, 30),
      ex("hollow-body", "HOLLOW BODY HOLD", "Low back glued to the floor. Rib down. Breathe shallow.", 3, null, 30, 25),
      ex("side-plank", "SIDE PLANK", "Stack the shoulder over the elbow. Hip up, not forward.", 3, null, 30, 30),
      ex("leg-lower", "LEG LOWER", "Slow on the way down. Press the back into the mat.", 3, 12, 30),
      ex("plank-reach", "PLANK REACH", "Reach long. Don't drop the hip. Stay narrow at the foot if you need.", 3, 10, 45),
    ],
  },
  {
    slug: "full-body-quick",
    name: "FULL BODY QUICK",
    subtitle: "Whole engine in 18",
    category: "FULL",
    intensity: "HI",
    duration_min: 18,
    hero_image: "/assets/dumbbell-street.jpg",
    trainer_name: "MARI · AI",
    description: "Five compound moves, two sets each. Built for the days you have eighteen minutes and that's it.",
    exercises: [
      ex("goblet-squat", "GOBLET SQUAT", "Hold weight at the chest. Sit between the hips. Drive up.", 2, 12, 30),
      ex("rdl", "DUMBBELL RDL", "Hinge. Soft knees. Bar slides down the thigh.", 2, 12, 30),
      ex("push-press", "PUSH PRESS", "Quarter-dip with the legs. Drive the bar overhead in one move.", 2, 10, 30),
      ex("renegade-row", "RENEGADE ROW", "Plank position, weight in each hand. Row one side at a time. Don't rotate.", 2, 10, 30),
      ex("burpee", "BURPEE", "Hands down, hop back, hop forward, stand. Move smooth, not fast.", 2, 8, 30),
    ],
  },
  {
    slug: "morning-mobility",
    name: "MORNING MOBILITY",
    subtitle: "Pre-coffee · 12 minutes",
    category: "MOBILITY",
    intensity: "LO",
    duration_min: 12,
    hero_image: "/assets/IMG_3467.jpg",
    trainer_name: "ZURI · AI",
    description: "Twelve-minute wake-up flow. Every joint, no equipment. Run it every morning before you check your phone.",
    exercises: [
      ex("cat-cow", "CAT COW", "Move slow. Connect breath to shape.", 2, 10, 15),
      ex("worlds-greatest-stretch", "WORLD'S GREATEST STRETCH", "Lunge → reach → twist. Each side, then switch.", 2, 6, 15),
      ex("hip-cars", "HIP CARS", "Big circles, both directions. Move from the hip socket.", 2, 6, 15),
      ex("thoracic-rotation", "THORACIC ROTATION", "Quadruped. Hand to head. Rotate from the upper back.", 2, 8, 15),
      ex("ankle-circles", "ANKLE CIRCLES", "Both directions, both feet. Slow.", 2, 10, 15),
    ],
  },
  {
    slug: "reformer-basics",
    name: "REFORMER BASICS",
    subtitle: "Footwork → core → arms",
    category: "REFORMER",
    intensity: "MD",
    duration_min: 35,
    hero_image: "/assets/blue-set-rooftop.jpg",
    trainer_name: "KAI",
    description: "Pilates reformer fundamentals. Footwork, hundred, short box, arms. Slow tempo, long lines.",
    exercises: [
      ex("footwork-toes", "FOOTWORK · TOES", "Heels lifted. Press out, control back. Even pressure on both feet.", 3, 10, 30),
      ex("footwork-arches", "FOOTWORK · ARCHES", "Arches on the bar. Toes wrap. Same press.", 3, 10, 30),
      ex("hundred", "THE HUNDRED", "Hundred small pumps, breath in five, breath out five. Hold the curl.", 3, null, 30, 30),
      ex("short-box-up", "SHORT BOX · UP STRETCH", "Long line through the spine. Slow rise.", 3, 8, 45),
      ex("arms-supine", "ARMS SUPINE", "Lay back. Pull the straps to the hips. Slow on the way back.", 3, 12, 45),
    ],
  },
  {
    slug: "hiit-rounds",
    name: "HIIT ROUNDS",
    subtitle: "30 work · 30 rest · 8 rounds",
    category: "HIIT",
    intensity: "HI",
    duration_min: 24,
    hero_image: "/assets/IMG_3465.jpg",
    trainer_name: "MARI · AI",
    description: "Eight rounds of 30/30. Three exercises rotating. Heart-rate driven — the AI extends rest if you spike.",
    exercises: [
      ex("squat-jump", "SQUAT JUMP", "Quiet landings. Reset before the next rep.", 3, null, 30, 30),
      ex("mountain-climber", "MOUNTAIN CLIMBER", "Hips low. Drive knees fast. Don't bounce the hips.", 3, null, 30, 30),
      ex("alt-lunge", "ALTERNATING LUNGE", "Step long. Knee tracks over toe. Drive up through the heel.", 3, null, 30, 30),
    ],
  },
];

export function getRoutine(slug: string): Routine | undefined {
  return routines.find(r => r.slug === slug);
}
