import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { db } from "../db/index.js";
import { usersAbsensi, attendances } from "../db/schema.js";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";

const user = new Hono();

user.use("*", authMiddleware);

user.post("/check-in", async (c) => {
  const currentUser = c.get("user");

  const now = new Date();

  const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const existing = await db.select()
    .from(attendances)
    .where(and(
        eq(attendances.user_id, currentUser.id),
        gte(attendances.check_in, start),
        lte(attendances.check_out, end)
    ));

    if (existing.length > 0) {
        return c.json({ error: "Anda sudah melakukan check-in hari ini" }, 400);
    }

    await db.insert(attendances).values({
        user_id: currentUser.id,
        check_in: now,
    });

    return c.json({ message: "Check-in berhasil" });
});

user.post("/check-out", async (c) => {
    const currentUser = c.get("user");

    const now = new Date();

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const existing = await db.select()
    .from(attendances)
    .where(and(
        eq(attendances.user_id, currentUser.id),
        gte(attendances.check_in, start),
        lte(attendances.check_out, end)
    ));

    const attendance = existing[0];

    if (!attendance) {
        return c.json({ error: "belum check-in" }, 400);
    }

    if (attendance.check_out) {
        return c.json({ error: "sudah check-out" }, 400);
    }

    await db.update(attendances)
    .set({ check_out: now })
    .where(eq(attendances.id, attendance.id));

    return c.json({ message: "Check-out berhasil" });
});

export default user;