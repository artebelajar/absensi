import { Hono } from "hono";
import { db } from "../db/index.js";
import { usersAbsensi } from "../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import {v4 as uuidv4} from "uuid";
import { createToken, verifyToken } from "../lib/jwt.js";

const auth = new Hono();

auth.post("/login", async (c) => {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
        return c.json({ error: "email dan password wajib diisi" }, 401);
    }

    const result = await db.select().from(usersAbsensi).where(eq(usersAbsensi.email, email));
    const user = result[0];

    if (!user) {
        return c.json({ error: "User tidak ditemukan" }, 401);
    }
    if (!user.is_active) {
        return c.json({ error: "User tidak aktif" }, 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return c.json({ error: "email dan Password salah" }, 401);
    }

    const token = await createToken({
        id: user.id,
        name: user.name,
        role: user.role
    });
    setCookie(c, "token", token, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
    });

    return c.json({message: "Login berhasil", role: user.role});

});

auth.post("/logout", async (c) => {
    deleteCookie(c, "token", { path: "/" });

    return c.json({ message: "Logout berhasil" });
});

auth.get("/me", async (c) => {
    const token = getCookie(c, "token");

    if (!token) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    try {
        const user = await verifyToken(token);
        return c.json({user: {id: user.id, name: user.name, role: user.role}})       
    } catch (error) {
        console.error('jwt verify error:', error)
        return c.json({ message: "session tidak valid atau sudah expired" }, 401);
    }
});

export default auth;



export {auth};