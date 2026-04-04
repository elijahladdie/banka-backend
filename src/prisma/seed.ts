import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

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

  const roleRecords: Record<string, { id: string }> = {};

  for (const role of roles) {
    const roleRecord = await prisma.role.upsert({
      where: { slug: role.slug },
      update: { name: role.name, description: role.description },
      create: {
        id: randomUUID(),
        ...role
      }
    });

    roleRecords[role.slug] = { id: roleRecord.id };
  }

  const hashedPassword = await bcrypt.hash("password", 10);

  const manager = await prisma.user.upsert({
    where: { email: "manager@banka.rw" },
    update: {
      firstName: "Default",
      lastName: "Manager",
      phoneNumber: "+250788100001",
      nationalId: "1199880077001111",
      password: hashedPassword,
      status: "active",
      age: 35,
      preferredLanguage: "en"
    },
    create: {
      id: randomUUID(),
      firstName: "Default",
      lastName: "Manager",
      email: "manager@banka.rw",
      phoneNumber: "+250788100001",
      nationalId: "1199880077001111",
      password: hashedPassword,
      status: "active",
      age: 35,
      preferredLanguage: "en"
    }
  });

  const cashier = await prisma.user.upsert({
    where: { email: "cashier@banka.rw" },
    update: {
      firstName: "Default",
      lastName: "Cashier",
      phoneNumber: "+250788100002",
      nationalId: "1199880077002222",
      password: hashedPassword,
      status: "active",
      age: 29,
      preferredLanguage: "en"
    },
    create: {
      id: randomUUID(),
      firstName: "Default",
      lastName: "Cashier",
      email: "cashier@banka.rw",
      phoneNumber: "+250788100002",
      nationalId: "1199880077002222",
      password: hashedPassword,
      status: "active",
      age: 29,
      preferredLanguage: "en"
    }
  });

  const client = await prisma.user.upsert({
    where: { email: "client@banka.rw" },
    update: {
      firstName: "Default",
      lastName: "Client",
      phoneNumber: "+250788100003",
      nationalId: "1199880077003333",
      password: hashedPassword,
      status: "active",
      age: 27,
      preferredLanguage: "en"
    },
    create: {
      id: randomUUID(),
      firstName: "Default",
      lastName: "Client",
      email: "client@banka.rw",
      phoneNumber: "+250788100003",
      nationalId: "1199880077003333",
      password: hashedPassword,
      status: "active",
      age: 27,
      preferredLanguage: "en"
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: manager.id,
        roleId: roleRecords.manager.id
      }
    },
    update: {},
    create: {
      id: randomUUID(),
      userId: manager.id,
      roleId: roleRecords.manager.id
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: cashier.id,
        roleId: roleRecords.cashier.id
      }
    },
    update: {},
    create: {
      id: randomUUID(),
      userId: cashier.id,
      roleId: roleRecords.cashier.id
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: client.id,
        roleId: roleRecords.client.id
      }
    },
    update: {},
    create: {
      id: randomUUID(),
      userId: client.id,
      roleId: roleRecords.client.id
    }
  });

  await prisma.bankAccount.upsert({
    where: { accountNumber: "2026000012345678" },
    update: {
      ownerId: client.id,
      status: "Active",
      type: "saving",
      createdBy: manager.id
    },
    create: {
      id: randomUUID(),
      ownerId: client.id,
      accountNumber: "2026000012345678",
      balance: 100000,
      status: "Active",
      type: "saving",
      createdBy: manager.id
    }
  });
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
