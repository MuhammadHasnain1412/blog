const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  console.log("Sitemap should include these slugs:");
  posts.forEach((p) => console.log(`- /posts/${p.slug}`));
}

main().finally(() => prisma.$disconnect());
