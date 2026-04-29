export type Location = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  status: "active" | "waitlist";
  hero_image: string | null;
  lat: number | null;
  lng: number | null;
  sort_order: number;
  /** Real street address. Only the active flagship has one today; the
   *  waitlist cities just hold the city/state pair until they open. */
  address: string | null;
};

export type Trainer = {
  id: string;
  slug: string;
  name: string;
  headline: string | null;
  bio: string | null;
  specialties: string[];
  avatar_url: string | null;
  hero_image: string | null;
  home_location_id: string | null;
  rating: number;
  is_ai?: boolean;
  years_experience?: number | null;
  cert?: string | null;
};

export type ClassRow = {
  id: string;
  slug: string;
  location_id: string | null;
  trainer_id: string | null;
  name: string;
  kind: string | null;
  starts_at: string;
  duration_min: number;
  capacity: number;
  booked: number;
  intensity: string | null;
  room: string | null;
  hero_image: string | null;
  price_cents: number;
  requires_payment: boolean;
  summary: string | null;
  what_to_bring: string | null;
  /** When true, the detail page renders a SpotPicker. Class capacity should
   *  be small (1–10 for new classes; legacy seeds may exceed). */
  has_equipment: boolean;
  /** With `has_equipment`, render the picker as two mirrored halves with a
   *  center aisle — matches a reformer studio layout. */
  mirrored_layout: boolean;
  /** Class lifecycle. Default 'scheduled'. */
  status?: "scheduled" | "cancelled" | "completed";
  cancelled_at?: string | null;
  completed_at?: string | null;
};

export type Booking = {
  id: string;
  user_id: string;
  class_id: string;
  status: string;
  paid_status: "free" | "pending" | "paid" | "refunded" | "cancelled";
  price_cents_paid: number;
  surface: string;
  notes: string | null;
  spot_number: number | null;
  created_at: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  category: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  description: string | null;
  hero_image: string | null;
  gallery: string[];
  tag: string | null;
  in_stock: boolean;
  sort_order: number;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  color: string | null;
  size: string | null;
  sku: string | null;
  in_stock: boolean;
};

export type Program = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  hero_image: string | null;
  duration_label: string | null;
  total_sessions: number;
  intensity: string | null;
  kind: "in_app" | "in_person" | "both";
  surfaces: string[];
  sort_order: number;
  price_cents: number;
  requires_payment: boolean;
  trainer_id?: string | null;
  /** Trainer-builder fields (migration 0006). */
  status?: "draft" | "published" | "archived";
  author_trainer_id?: string | null;
};

export type ProgramSessionRefKind = "routine" | "class_kind" | "trainer_1on1" | "custom";

/**
 * Flows — short solo videos (AI Studio sessions). Curated per trainer for now;
 * not a real DB table yet, lives in fallback data.
 */
export type Flow = {
  id: string;
  slug: string;
  name: string;
  trainer_id: string;
  duration_min: number;
  intensity: string;
  kind: string;
  hero_image: string;
  summary: string;
};

export type ProgramSession = {
  id: string;
  program_id: string;
  day_index: number;
  /** 0-based ordering of multiple sessions within a single day. Default 0. */
  session_index: number;
  name: string;
  duration_min: number;
  description: string | null;
  kind: string;
  video_url: string | null;
  hero_image: string | null;
  /** What kind of work this session points to. Legacy rows = "custom". */
  ref_kind: ProgramSessionRefKind;
  /** AI Studio routine slug when ref_kind = "routine". */
  routine_slug: string | null;
  /** Class slug (e.g. "power-pilates") when ref_kind = "class_kind". User
   *  fulfills by attending any instance of that class type. */
  class_slug: string | null;
  /** Trainer to book a 1-on-1 with when ref_kind = "trainer_1on1". */
  trainer_id_for_1on1: string | null;
  /** Cached trainer slug — lets the program page deep-link straight to
   *  /trainers/<slug>/book without an extra DB lookup. */
  trainer_slug_for_1on1: string | null;
};

export type ProgramEnrollment = {
  id: string;
  user_id: string;
  program_id: string;
  status: "active" | "completed" | "paused" | "left" | "pending_payment";
  started_at: string;
  completed_at: string | null;
  current_day: number;
};

export type ProgramCompletion = {
  id: string;
  enrollment_id: string;
  session_id: string;
  completed_at: string;
  duration_actual_min: number | null;
  surface: "app" | "gym" | "class";
  /** How the completion was registered. "manual" is the legacy/default. */
  source: "routine" | "class" | "trainer_1on1" | "manual";
  class_booking_id: string | null;
  trainer_booking_id: string | null;
};

/**
 * 1-on-1 trainer booking.
 */
export type TrainerSessionMode = "video" | "in_person";
export type TrainerSessionRuleMode = TrainerSessionMode | "both";

export type TrainerSessionSettings = {
  trainer_id: string;
  price_cents: number;
  duration_min: number;
  modes: TrainerSessionMode[];
  buffer_min: number;
  booking_window_days: number;
  in_person_location_id: string | null;
  bio_for_1on1: string | null;
};

export type TrainerAvailabilityRule = {
  id: string;
  trainer_id: string;
  weekday: number;            // 0=Sun … 6=Sat
  start_minute: number;       // mins from midnight
  end_minute: number;
  mode: TrainerSessionRuleMode;
  is_active: boolean;
};

export type TrainerAvailabilityBlock = {
  id: string;
  trainer_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

export type TrainerBookingStatus =
  | "pending_trainer"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed"
  | "no_show";

export type TrainerBookingPaidStatus = "free" | "pending" | "paid" | "refunded";

export type TrainerBooking = {
  id: string;
  trainer_id: string;
  user_id: string;
  /** Parent trainer_sessions row. Populated for new bookings; legacy rows
   *  were backfilled with private 1-attendee sessions in migration 0009. */
  session_id: string | null;
  starts_at: string;
  ends_at: string;
  mode: TrainerSessionMode;
  location_id: string | null;
  status: TrainerBookingStatus;
  paid_status: TrainerBookingPaidStatus;
  price_cents: number;
  client_goals: string | null;
  trainer_notes: string | null;
  routine_slug: string | null;
  video_provider: string | null;
  video_room_url: string | null;
  video_room_name: string | null;
  duration_actual_min: number | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Parent row for one or more trainer_bookings. capacity=1, is_group=false is a
 * private 1-on-1; capacity>=2, is_group=true is a group session that multiple
 * members share a single Daily room for. See migration 0009.
 */
export type TrainerSessionStatus =
  | "open"
  | "full"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type TrainerSessionRow = {
  id: string;
  trainer_id: string;
  starts_at: string;
  ends_at: string;
  mode: TrainerSessionMode;
  location_id: string | null;
  capacity: number;
  price_cents: number;
  status: TrainerSessionStatus;
  is_group: boolean;
  title: string | null;
  description: string | null;
  routine_slug: string | null;
  video_provider: string | null;
  video_room_url: string | null;
  video_room_name: string | null;
  trainer_notes: string | null;
  duration_actual_min: number | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * A bookable slot generated from rules + blocks + existing bookings. Ephemeral
 * — never stored in the DB; computed at query time.
 */
export type GeneratedSlot = {
  starts_at: string;          // ISO
  ends_at: string;
  mode: TrainerSessionMode;
};

export type Post = {
  id: string;
  author_id: string | null;
  kind: string;
  body: string | null;
  media_url: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};
