import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { db } from "../db/index.js";
import { usersAbsensi, attendances } from "../db/schema.js";
import { eq, and, gte, lte, isNull } from "drizzle-orm";

const user = new Hono();

user.use("*", authMiddleware);

async function findUser(identifier) {
  if (Number(identifier)) {
    const result = await db
      .select()
      .from(usersAbsensi)
      .where(eq(usersAbsensi.id, Number(identifier)));
    return result[0];
  }

  const result = await db
    .select()
    .from(usersAbsensi)
    .where(eq(usersAbsensi.email, identifier));
  return result[0];
}

user.post("/check-in", async (c) => {
  const body = await c.req.json();
  const { identifier } = body;

  if (!identifier) {
    return c.json({ error: "identifier wajib diisi" }, 400);
  }

  const user = await findUser(identifier);

  if (!user) {
    return c.json({ error: "User tidak ditemukan" }, 404);
  }

  if (!user.is_active) {
    return c.json({ error: "User tidak aktif" }, 403);
  }

  const now = new Date();

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const existing = await db
    .select()
    .from(attendances)
    .where(
      and(
        eq(attendances.user_id, user.id),
        gte(attendances.check_in, start),
        lte(attendances.check_out, end),
      ),
    );

  if (existing.length > 0) {
    return c.json({ error: "Anda sudah melakukan check-in hari ini" }, 400);
  }

  await db.insert(attendances).values({
    user_id: user.id,
    check_in: now,
  });

  return c.json({ message: `Check-in berhasil (${user.name}))` });
});

user.post("/check-out", async (c) => {
  const body = await c.req.json();
  const { identifier } = body;

  if (!identifier) {
    return c.json({ error: "identifier wajib diisi" }, 400);
  }

  const user = await findUser(identifier);

  if (!user) {
    return c.json({ error: "User tidak ditemukan" }, 404);
  }

  const now = new Date();
  const wibTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  
  const startOfDay = new Date(wibTime);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(wibTime);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await db
    .select()
    .from(attendances)
    .where(
      and(
        eq(attendances.user_id, user.id),
        gte(attendances.check_in, startOfDay),
        lte(attendances.check_in, endOfDay),
        isNull(attendances.check_out) 
      ),
    );

  const attendance = existing[0];

  if (!attendance) {
    const anyAttendanceToday = await db
      .select()
      .from(attendances)
      .where(
        and(
          eq(attendances.user_id, user.id),
          gte(attendances.check_in, startOfDay),
          lte(attendances.check_in, endOfDay)
        )
      );
    
    console.log("Any attendance today (including checked-out):", anyAttendanceToday);
    
    return c.json({ 
      message: "belum check-in hari ini",
      debug: anyAttendanceToday.length > 0 ? "Sudah check-out sebelumnya" : "Tidak ada record"
    }, 400);
  }

  await db
    .update(attendances)
    .set({ check_out: now })
    .where(eq(attendances.id, attendance.id));

  return c.json({ message: `Check-out berhasil (${user.name})` });
});

export default user;
