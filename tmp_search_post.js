const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { title: { contains: "Myron", mode: "insensitive" } },
        { title: { contains: "Fresh", mode: "insensitive" } },
        { slug: { contains: "myron", mode: "insensitive" } },
      ],
    },
    select: { slug: true, title: true, status: true },
  });
  console.log("Search results:");
  console.log(JSON.stringify(posts, null, 2));
}

main().finally(() => prisma.$disconnect());
