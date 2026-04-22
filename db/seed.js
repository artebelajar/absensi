import { db } from "./index.js";
import { usersAbsensi } from "./schema.js";
import bcrypt from "bcryptjs";

const seed = async () => {
    try{
        console.log("Seeding database...");

        const hashedPassword = await bcrypt.hash("password123", 10);

        await db.insert(usersAbsensi).values({
            name: "Admin",
            email: "admin@mail.com",
            password: hashedPassword,
            role: "admin",
            is_active: true,
        });

        await db.insert(usersAbsensi).values([{
            name: "Ahmad",
            email: "ahmad@mail.com",
            password: hashedPassword,
            role: "user",
            is_active: true,
        },{
            name: "Budi",
            email: "budi@mail.com",
            password: hashedPassword,
            role: "user",
            is_active: true,
        }]);

        console.log("Seed Selesai");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
};

seed();