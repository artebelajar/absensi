import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { db } from "../db/index.js";
import { usersAbsensi, attendances } from "../db/schema.js";
import { eq, and, gte, lte } from "drizzle-orm";
import bcrypt from "bcryptjs";

const admin = new Hono();

admin.use("*", authMiddleware, adminOnly);

admin.get("/dashboard", (c) => c.text("selamat datang admin"));

admin.post("/users", async (c) => {
  const body = await c.req.json();
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return c.json({ error: "Semua field wajib diisi" }, 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.insert(usersAbsensi).values({
      name,
      email,
      password: hashedPassword,
      role: "user",
      is_active: true,
    });

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

  if (!month) {
    return c.json({ error: "bulan wajib diisi (yyyy-mm)" }, 400);
  }

  const start = new Date(`${month}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const data = await db
    .select({
      id: attendances.id,
      user_id: attendances.user_id,
      check_in: attendances.check_in,
      check_out: attendances.check_out,
      note: attendances.note,
    })
    .from(attendances)
    .where(and(gte(attendances.check_in, start), lte(attendances.check_out, end)));

  return c.json({ data });
});

export default admin;
