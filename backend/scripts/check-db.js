import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const tables = await pool.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
  );
  console.log(
    "TABLES:",
    tables.rows.map((r) => r.table_name).join(", ") || "(none)",
  );

  for (const t of tables.rows) {
    const count = await pool.query(
      `select count(*)::int as c from "${t.table_name}"`,
    );
    console.log(`${t.table_name}: ${count.rows[0].c}`);
  }
} catch (error) {
  console.log("ERR:", error.message);
} finally {
  await pool.end();
}
