import { PrismaClient } from "@prisma/client";

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export interface WardrobeItem {
  id?: number;
  name: string;
  clothType: string;
  gsm?: number | null;
  fabric?: string | null;
  color?: string | null;
  size?: string | null;
  brand?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  condition?: string | null;
  season?: string | null;
  occasion?: string | null;
  location?: string | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WardrobeCollection {
  id?: number;
  name: string;
  description?: string | null;
  itemIds?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Wardrobe Items functions
export async function getItemById(id: number) {
  return await prisma.wardrobeItem.findUnique({
    where: { id },
  });
}

export async function getAllItems() {
  return await prisma.wardrobeItem.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createItem(data: {
  name: string;
  clothType: string;
  gsm?: number | null;
  fabric?: string | null;
  color?: string | null;
  size?: string | null;
  brand?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  condition?: string | null;
  season?: string | null;
  occasion?: string | null;
  location?: string | null;
  notes?: string | null;
}) {
  return await prisma.wardrobeItem.create({
    data,
  });
}

export async function updateItem(id: number, data: Partial<{
  name: string;
  clothType: string;
  gsm?: number | null;
  fabric?: string | null;
  color?: string | null;
  size?: string | null;
  brand?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  condition?: string | null;
  season?: string | null;
  occasion?: string | null;
  location?: string | null;
  notes?: string | null;
}>) {
  return await prisma.wardrobeItem.update({
    where: { id },
    data,
  });
}

export async function deleteItem(id: number) {
  return await prisma.wardrobeItem.delete({
    where: { id },
  });
}

export async function getItemsByType(clothType: string) {
  return await prisma.wardrobeItem.findMany({
    where: { clothType },
  });
}

export async function getItemsByOccasion(occasion: string) {
  return await prisma.wardrobeItem.findMany({
    where: {
      OR: [
        { occasion: { equals: occasion, mode: "insensitive" } },
        { occasion: { contains: occasion, mode: "insensitive" } },
      ],
    },
  });
}

// Wardrobe Collections functions
export async function getCollectionById(id: number) {
  return await prisma.wardrobeCollection.findUnique({
    where: { id },
  });
}

export async function getAllCollections() {
  return await prisma.wardrobeCollection.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createCollection(data: {
  name: string;
  description?: string | null;
  itemIds?: string | null;
}) {
  return await prisma.wardrobeCollection.create({
    data,
  });
}

export async function updateCollection(id: number, data: Partial<{
  name: string;
  description?: string | null;
  itemIds?: string | null;
}>) {
  return await prisma.wardrobeCollection.update({
    where: { id },
    data,
  });
}

export async function deleteCollection(id: number) {
  return await prisma.wardrobeCollection.delete({
    where: { id },
  });
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export { prisma };
