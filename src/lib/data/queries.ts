import { createClient } from "@/lib/supabase/server";
import type { ClassRow, Location, Post, Product, ProductVariant, Trainer } from "./types";
import { fallbackProducts, fallbackClasses, fallbackTrainers, fallbackLocations, fallbackPosts } from "./fallback";

function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function listProducts(): Promise<Product[]> {
  if (!isConfigured()) return fallbackProducts;
  const sb = createClient();
  const { data } = await sb.from("products").select("*").order("sort_order", { ascending: true });
  return (data as Product[]) ?? fallbackProducts;
}

export async function getProduct(slug: string): Promise<{ product: Product; variants: ProductVariant[] } | null> {
  if (!isConfigured()) {
    const product = fallbackProducts.find(p => p.slug === slug);
    return product ? { product, variants: [] } : null;
  }
  const sb = createClient();
  const { data: product } = await sb.from("products").select("*").eq("slug", slug).single();
  if (!product) return null;
  const { data: variants } = await sb.from("product_variants").select("*").eq("product_id", product.id);
  return { product: product as Product, variants: (variants as ProductVariant[]) ?? [] };
}

export async function listLocations(): Promise<Location[]> {
  if (!isConfigured()) return fallbackLocations;
  const sb = createClient();
  const { data } = await sb.from("locations").select("*").order("sort_order");
  return (data as Location[]) ?? fallbackLocations;
}

export async function listTrainers(): Promise<Trainer[]> {
  if (!isConfigured()) return fallbackTrainers;
  const sb = createClient();
  const { data } = await sb.from("trainers").select("*").order("name");
  return (data as Trainer[]) ?? fallbackTrainers;
}

export async function getTrainer(slug: string): Promise<Trainer | null> {
  if (!isConfigured()) return fallbackTrainers.find(t => t.slug === slug) ?? null;
  const sb = createClient();
  const { data } = await sb.from("trainers").select("*").eq("slug", slug).single();
  return (data as Trainer) ?? null;
}

export async function listClasses(): Promise<ClassRow[]> {
  if (!isConfigured()) return fallbackClasses;
  const sb = createClient();
  const { data } = await sb.from("classes").select("*").gte("starts_at", new Date().toISOString()).order("starts_at").limit(40);
  return (data as ClassRow[]) ?? fallbackClasses;
}

export async function getClass(id: string): Promise<ClassRow | null> {
  if (!isConfigured()) return fallbackClasses.find(c => c.id === id) ?? null;
  const sb = createClient();
  const { data } = await sb.from("classes").select("*").eq("id", id).single();
  return (data as ClassRow) ?? null;
}

export async function listPosts(): Promise<Post[]> {
  if (!isConfigured()) return fallbackPosts;
  const sb = createClient();
  const { data } = await sb.from("posts").select("*").order("created_at", { ascending: false }).limit(20);
  return (data as Post[]) ?? fallbackPosts;
}
