import { IncomingRequestCfProperties } from "@cloudflare/workers-types"

import { nanoid } from "nanoid"

import { Hono } from "hono"
export interface Env {
  VIEWS: KVNamespace
}

const app = new Hono<{ Bindings: Env }>()

app.get("/:projectId/capture", async (c) => {
  const id = nanoid()
  const key = `${c.req.param().projectId}:${id}`

  const geo = c.req.cf as any

  let value = await c.env.VIEWS.put(key, `_v${key}`, {
    metadata: {
      time: new Date().toISOString(),
      ip: c.req.headers.get("CF-Connecting-IP") || "unknown",
      realIp: c.req.headers.get("X-Real-IP") || "unknown",
      ua: c.req.headers.get("User-Agent") || "unknown",
      country: geo?.country || "unknown",
      city: geo?.city || "unknown",
      region: geo?.region || "unknown",
      longitude: geo?.longitude || "unknown",
      latitude: geo?.latitude || "unknown",
    },
    expirationTtl: 60 * 30,
  })

  return c.json({
    message: "Captured",
  })
})

app.get("/:projectId/live-usage", async (c) => {
  let views = await c.env.VIEWS.list({
    prefix: `${c.req.param().projectId}:`,
  })
  return c.json(views)
})

export default app
