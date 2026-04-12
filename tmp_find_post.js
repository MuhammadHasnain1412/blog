const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const post = await prisma.post.findFirst({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  console.log(post ? post.slug : "no-published-posts");
}

main().finally(() => prisma.$disconnect());
