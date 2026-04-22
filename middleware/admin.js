export const adminOnly = async (c, next) => {
    const user = c.get("user");
    if (user.role !== "admin") {
        return c.json({ error: "Unauthorized" }, 401);
    }
    await next();
};