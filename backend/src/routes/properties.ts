import { Hono } from "hono";
import { createUserClient, supabaseAdmin } from "../lib/supabase.js";
import { mapProperty } from "../lib/mappers.js";
import {
  createPropertySchema,
  updatePropertySchema,
} from "../schemas/validation.js";
import type { PropertyRow } from "../types/models.js";
import { requireAuth, type AuthVariables } from "../middleware/auth.js";

const properties = new Hono<{ Variables: AuthVariables }>();

properties.get("/", async (c) => {
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  const rows = (data ?? []) as PropertyRow[];
  return c.json({ properties: rows.map(mapProperty) });
});

properties.get("/:id", async (c) => {
  const id = c.req.param("id");

  const { data, error } = await supabaseAdmin
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle<PropertyRow>();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  if (!data) {
    return c.json({ error: "Property not found" }, 404);
  }

  return c.json({ property: mapProperty(data) });
});

properties.post("/", requireAuth, async (c) => {
  const body: unknown = await c.req.json();
  const parsed = createPropertySchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const user = c.get("user");
  const token = c.get("accessToken");
  const client = createUserClient(token);

  const insertRow = {
    name: parsed.data.name,
    description: parsed.data.description,
    location: parsed.data.location,
    price_per_night: parsed.data.pricePerNight,
    availability: parsed.data.availability,
    user_id: user.id,
    listing_agent_id: parsed.data.listingAgentId ?? null,
  };

  const { data, error } = await client
    .from("properties")
    .insert(insertRow)
    .select("*")
    .single<PropertyRow>();

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json({ property: mapProperty(data) }, 201);
});

properties.put("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const body: unknown = await c.req.json();
  const parsed = updatePropertySchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const token = c.get("accessToken");
  const client = createUserClient(token);

  const updateRow: Partial<PropertyRow> = {};
  if (parsed.data.name !== undefined) updateRow.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateRow.description = parsed.data.description;
  if (parsed.data.location !== undefined) updateRow.location = parsed.data.location;
  if (parsed.data.pricePerNight !== undefined)
    updateRow.price_per_night = parsed.data.pricePerNight;
  if (parsed.data.availability !== undefined)
    updateRow.availability = parsed.data.availability;
  if (parsed.data.listingAgentId !== undefined)
    updateRow.listing_agent_id = parsed.data.listingAgentId;

  updateRow.updated_at = new Date().toISOString();

  const { data, error } = await client
    .from("properties")
    .update(updateRow)
    .eq("id", id)
    .select("*")
    .maybeSingle<PropertyRow>();

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  if (!data) {
    return c.json({ error: "Property not found or not authorized" }, 404);
  }

  return c.json({ property: mapProperty(data) });
});

properties.delete("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const token = c.get("accessToken");
  const client = createUserClient(token);

  const { data, error } = await client
    .from("properties")
    .delete()
    .eq("id", id)
    .select("*")
    .maybeSingle<PropertyRow>();

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  if (!data) {
    return c.json({ error: "Property not found or not authorized" }, 404);
  }

  return c.json({ message: "Property deleted", property: mapProperty(data) });
});

export default properties;
