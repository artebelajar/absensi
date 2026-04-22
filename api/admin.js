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

export default admin;

