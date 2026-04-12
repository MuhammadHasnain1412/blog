const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    where: { slug: { contains: "myron" } },
    select: { slug: true, status: true },
  });
  console.log(posts.length > 0 ? JSON.stringify(posts) : "no-similar-posts");
}

main().finally(() => prisma.$disconnect());
