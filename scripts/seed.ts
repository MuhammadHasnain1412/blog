import { PrismaClient, user_role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🚀 Starting The Daily Mixa Database Seeding...");

  // Clear existing data to ensure a clean slate
  await db.post.deleteMany({});
  await db.category.deleteMany({});

  // 1. Create ADMIN User
  const adminEmail = "admin@thedailymixa.com";
  const adminPassword = "admin123";
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash },
    create: {
      email: adminEmail,
      name: "Super Admin",
      passwordHash: adminHash,
      role: user_role.ADMIN,
    },
  });

  // 2. Create EDITOR User
  const editorEmail = "editor@thedailymixa.com";
  const editorPassword = "editor123";
  const editorHash = await bcrypt.hash(editorPassword, 10);

  const editor = await db.user.upsert({
    where: { email: editorEmail },
    update: { passwordHash: editorHash },
    create: {
      email: editorEmail,
      name: "Chief Editor",
      passwordHash: editorHash,
      role: user_role.EDITOR,
    },
  });

  // 3. Create AUTHOR User
  const authorEmail = "author@thedailymixa.com";
  const authorPassword = "author123";
  const authorHash = await bcrypt.hash(authorPassword, 10);

  const author = await db.user.upsert({
    where: { email: authorEmail },
    update: { passwordHash: authorHash },
    create: {
      email: authorEmail,
      name: "Staff Author",
      passwordHash: authorHash,
      role: user_role.AUTHOR,
    },
  });

  console.log("\n✅ Seeding Successful!");
  console.log("--------------------------------------------------");
  console.log("LOGIN CREDENTIALS:");
  console.log("--------------------------------------------------");
  console.log(`ADMIN:  Email: ${adminEmail}  | Pass: ${adminPassword}`);
  console.log(`EDITOR: Email: ${editorEmail} | Pass: ${editorPassword}`);
  console.log(`AUTHOR: Email: ${authorEmail} | Pass: ${authorPassword}`);
  console.log("--------------------------------------------------");
  console.log("Use these to test Different Role Permissions.");
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
