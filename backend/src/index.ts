import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./routes/auth.js";
import properties from "./routes/properties.js";
import bookings from "./routes/bookings.js";

const app = new Hono();

const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

app.use(
  "*",
  cors({
    origin: frontendUrl,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

app.get("/health", (c) => c.json({ status: "ok", service: "john-bnb-api" }));

app.route("/api/auth", auth);
app.route("/api/properties", properties);
app.route("/api/bookings", bookings);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

const port = Number(process.env.PORT ?? 3001);

console.log(`John BnB API running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
