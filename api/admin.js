import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { db } from "../db/index.js";
import { usersAbsensi, attendances } from "../db/schema.js";
import { eq, and, gte, lte } from "drizzle-orm";
import bcrypt from "bcryptjs";

const admin = new Hono();

admin.use("*", authMiddleware, adminOnly);

admin.get("/dashboard", (c) => c.json({message: "selamat datang admin"}));

admin.get("/users", async (c) => {
  const data = await db.select({
    id: usersAbsensi.id,
    name: usersAbsensi.name,
    email: usersAbsensi.email,
    role: usersAbsensi.role,
    is_active: usersAbsensi.is_active,
  }).from(usersAbsensi).orderBy(usersAbsensi.name);
  return c.json({ data });
});

admin.post("/users", async (c) => {
  const body = await c.req.json();
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return c.json({ error: "Semua field wajib diisi" }, 400);
  }

  if (!["admin", "user"]) {
    return c.json({ error: "role harus admin atau user" }, 400);
  }

  if (password.length < 6) {
    return c.json({ error: "password minimal 6 karakter" }, 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const [created] = await db.insert(usersAbsensi).values({
      name,
      email,
      password: hashedPassword,
      role: "user",
      is_active: true,
    }).returning({id: usersAbsensi.id, name: usersAbsensi.name, email: usersAbsensi.email});

    return c.json({ message: "User berhasil ditambahkan", user }, 201);
  } catch (error) {
    return c.json({ error: "email sudah digunakan" }, 500);
  }
});

admin.patch("/users/:id/status", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const { is_active } = body;

  if (typeof is_active !== "boolean") {
    return c.json({ error: "is_active harus boolean" }, 400);
  }

  await db
    .update(usersAbsensi)
    .set({ is_active })
    .where(eq(usersAbsensi.id, id));

  return c.json({ message: "Status berhasil diubah" });
});

admin.get("/attendances", async (c) => {
  const month = c.req.query("month");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return c.json({ error: "parameter month wajib di isi" }, 400);
  }

  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const data = await db
    .select({
      id: attendances.id,
      user_id: attendances.user_id,
      name: usersAbsensi.name,
      email: usersAbsensi.email,
      check_in: attendances.check_in,
      check_out: attendances.check_out,
      note: attendances.note,
    })
    .from(attendances)
    .leftJoin(usersAbsensi, eq(attendances.user_id, usersAbsensi.id))
    .where(and(gte(attendances.check_in, start), lte(attendances.check_out, end)))
    .orderBy(attendances.check_in);

  return c.json({ data });
});

export default admin;
