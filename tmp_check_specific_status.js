const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const post = await prisma.post.findUnique({
    where: {
      slug: "myron-fresh-and-fi-biography-ethnicity-career-and-controversies-explained-1776017631396",
    },
    select: { status: true },
  });
  console.log(post ? JSON.stringify(post) : "post-not-found");
}

main().finally(() => prisma.$disconnect());
