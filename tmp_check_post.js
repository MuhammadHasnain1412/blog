const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const slug =
    "myron-fresh-and-fi-biography-ethnicity-career-and-controversies-explained-1776017631396";
  const post = await prisma.post.findUnique({
    where: { slug: slug },
    select: { id: true, title: true, status: true, publishedAt: true },
  });

  if (post) {
    console.log("Post found:");
    console.log(JSON.stringify(post, null, 2));
  } else {
    console.log("Post NOT found with slug: " + slug);
    // Let's try to find similar slugs
    const similar = await prisma.post.findMany({
      where: { slug: { contains: "myron-fresh" } },
      select: { slug: true, status: true },
    });
    console.log("Similar posts:", similar);
  }
}

main().finally(() => prisma.$disconnect());
