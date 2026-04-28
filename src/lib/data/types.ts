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
};

export type ProgramSession = {
  id: string;
  program_id: string;
  day_index: number;
  name: string;
  duration_min: number;
  description: string | null;
  kind: string;
  video_url: string | null;
  hero_image: string | null;
};

export type ProgramEnrollment = {
  id: string;
  user_id: string;
  program_id: string;
  status: "active" | "completed" | "paused" | "left";
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
