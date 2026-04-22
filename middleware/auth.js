import { sessions } from "../api/auth.js"

export const authMiddleware = async (c, next) => {
    const token = c.req.headers("Authorization");
    const user = sessions.get(token);

    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("user", user);
    await next();
};