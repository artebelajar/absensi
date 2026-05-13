import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { db } from "../db/index.js";
import { usersAbsensi, attendances } from "../db/schema.js";
import { eq, and, gte, lte } from "drizzle-orm";
import bcrypt from "bcryptjs";
import ExcelJS from 'exceljs';

const admin = new Hono();

admin.use("*", authMiddleware, adminOnly);

admin.get("/dashboard", (c) => c.json({message: "selamat datang admin"}));

admin.get("/users", async (c) => {
  const data = await db.select({
    id: usersAbsensi.id,
    name: usersAbsensi.name,
    email: usersAbsensi.email,
    role: usersAbsensi.role,
    is_active: usersAbsensi.is_active,
  }).from(usersAbsensi);
  return c.json({ data });
});

admin.post("/users", async (c) => {
  const body = await c.req.json();
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return c.json({ error: "Semua field wajib diisi" }, 400);
  }

  if (!["admin", "user"]) {
    return c.json({ error: "role harus admin atau user" }, 400);
  }

  if (password.length < 6) {
    return c.json({ error: "password minimal 6 karakter" }, 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const [created] = await db.insert(usersAbsensi).values({
      name,
      email,
      password: hashedPassword,
      role: "user",
      is_active: true,
    }).returning({id: usersAbsensi.id, name: usersAbsensi.name, email: usersAbsensi.email});

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

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return c.json({ error: "parameter month wajib di isi" }, 400);
  }

  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const data = await db
    .select({
      id: attendances.id,
      user_id: attendances.user_id,
      name: usersAbsensi.name,
      email: usersAbsensi.email,
      check_in: attendances.check_in,
      check_out: attendances.check_out,
      note: attendances.note,
    })
    .from(attendances)
    .leftJoin(usersAbsensi, eq(attendances.user_id, usersAbsensi.id))
    .where(and(gte(attendances.check_in, start), lte(attendances.check_out, end)))
    .orderBy(attendances.check_in);

  return c.json({ data });
});

// Tambahkan endpoint ini di admin.js
admin.get('/export/absensi-excel', async (c) => {
  try {
    const month = c.req.query("month");
    
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return c.json({ error: "parameter month wajib diisi (format: YYYY-MM)" }, 400);
    }
    
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    
    const data = await db
      .select({
        id: attendances.id,
        user_id: attendances.user_id,
        name: usersAbsensi.name,
        email: usersAbsensi.email,
        check_in: attendances.check_in,
        check_out: attendances.check_out,
        note: attendances.note,
      })
      .from(attendances)
      .leftJoin(usersAbsensi, eq(attendances.user_id, usersAbsensi.id))
      .where(and(gte(attendances.check_in, start), lte(attendances.check_in, end)))
      .orderBy(attendances.check_in);
    
    // Buat Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Absensi ${month}`);
    
    // Definisikan kolom
    worksheet.columns = [
      { header: 'NO', key: 'no', width: 8 },
      { header: 'NAMA', key: 'name', width: 25 },
      { header: 'EMAIL', key: 'email', width: 30 },
      { header: 'CHECK IN', key: 'check_in', width: 20 },
      { header: 'CHECK OUT', key: 'check_out', width: 20 },
    ];
    
    // Styling header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    
    let no = 1;
    data.forEach(absensi => {
      worksheet.addRow({
        no: no++,
        name: absensi.name || '-',
        email: absensi.email || '-',
        check_in: absensi.check_in ? formatDateTime(absensi.check_in) : '-',
        check_out: absensi.check_out ? formatDateTime(absensi.check_out) : '-',
        note: absensi.note || '-',
      });
    });
    
    const totalRow = worksheet.addRow({
      no: `TOTAL: ${data.length} Data`,
      name: '',
      email: '',
      check_in: '',
      check_out: ''
    });
    totalRow.getCell(6).font = { bold: true };
    
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Set header response
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="absensi_${month}_${Date.now()}.xlsx"`);
    
    return c.body(buffer);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Gagal export Excel absensi' }, 500);
  }
});

function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  const tanggal = d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const waktu = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  return `${tanggal} ${waktu}`;
}

export default admin;
