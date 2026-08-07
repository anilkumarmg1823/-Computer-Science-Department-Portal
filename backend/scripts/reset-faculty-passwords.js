const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      envConfig.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value;
        }
      });
    }
  } catch (err) {
    console.error('Error loading .env file:', err);
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const newPassword = 'Abcd@123';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const facultyUsers = await prisma.user.findMany({
    where: { role: 'FACULTY' },
    select: { id: true, name: true, email: true }
  });

  console.log(`Found ${facultyUsers.length} faculty user(s).`);

  if (facultyUsers.length === 0) {
    console.log('No faculty users to update.');
    return;
  }

  const result = await prisma.user.updateMany({
    where: { role: 'FACULTY' },
    data: {
      password: hashedPassword,
      needsPasswordChange: true
    }
  });

  console.log(`Updated ${result.count} faculty password(s) to: ${newPassword}`);
  facultyUsers.forEach((u) => {
    console.log(`  - ${u.name} <${u.email}>`);
  });
}

run()
  .catch((err) => {
    console.error('Failed to reset faculty passwords:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
