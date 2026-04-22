import { is } from "drizzle-orm";
import { check } from "drizzle-orm/gel-core";
import {pgTable,serial, text, boolean, timestamp, integer, PgRole} from "drizzle-orm/pg-core";

export const usersAbsensi = pgTable("users_absensi", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").notNull().default("user"),
    is_active: boolean("is_active").default(true),
});

export const attendances = pgTable("attendances", {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id),
    check_in: timestamp("check_in").defaultNow(),
    check_out: timestamp("check_out"),
    note: text("note"),
});