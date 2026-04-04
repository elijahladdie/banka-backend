import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

declare const process: {
  exit: (code?: number) => never;
};

const prisma = new PrismaClient();

async function main() {
  const roles = [
    {
      name: "Client",
      slug: "client",
      description: "Regular bank customer who can manage their own accounts and transfers"
    },
    {
      name: "Cashier",
      slug: "cashier",
      description: "Bank teller who processes deposits and withdrawals for clients"
    },
    {
      name: "Manager",
      slug: "manager",
      description: "Bank administrator with full access to users, accounts, and statistics"
    }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { slug: role.slug },
      update: { name: role.name, description: role.description },
      create: {
        id: randomUUID(),
        ...role
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed completed");
  })
  .catch(async (error) => {
    await prisma.$disconnect();
    console.error(error);
    process.exit(1);
  });
