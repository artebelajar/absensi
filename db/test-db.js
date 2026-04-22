import { db } from "./index.js";
import { usersAbsensi } from "./schema.js";

const run = async () => {
    const result = await db.select().from(usersAbsensi);
    console.log(result);
};

run();