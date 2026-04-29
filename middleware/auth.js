import { getCookie } from "hono/cookie";
import { verifyToken } from "../lib/jwt.js";

export const authMiddleware = async (c, next) => {
  const token = getCookie(c, "token");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const user = await verifyToken(token);
  try {
    c.set("user", {
      id: user.id,
      name: user.name,
      role: user.role,
    });
    await next();
  } catch (error) {
    console.error("jwt verify error:", error);
    return c.json({ error: "invalid token" }, 401);
  }
};
