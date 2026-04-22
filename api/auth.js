import { Hono } from "hono";
import { db } from "../db/index.js";
import { usersAbsensi } from "../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {v4 as uuidv4} from "uuid";

const auth = new Hono();

const sessions = new Map();

auth.post("/login", async (c) => {
    const body = await c.req.json();
    const { email, password } = body;

    const result = await db.select().from(usersAbsensi).where(eq(usersAbsensi.email, email));
    const user = result[0];

    if (!user) {
        return c.json({ error: "User tidak ditemukan" }, 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return c.json({ error: "Password salah" }, 401);
    }

    const token = uuidv4();
    sessions.set(token, user);

    return c.json({message: "Login berhasil", token });

});

auth.post("/logout", async (c) => {
    const token = c.req.headers("Authorization");
    sessions.delete(token);

    return c.json({ message: "Logout berhasil" });
});

auth.get("/me", async (c) => {
    const token = c.req.headers("Authorization");
    const user = sessions.get(token);

    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json(user);
});

export default auth;



export {auth, sessions};