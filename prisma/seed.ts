import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@tourmanager.cl" },
    update: {},
    create: {
      email: "admin@tourmanager.cl",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "Tour Manager",
      role: "ADMIN",
      phone: "+56912345678",
    },
  });
  console.log("Admin user created:", admin.email);

  // Create seller
  const sellerPassword = await bcrypt.hash("seller123", 12);
  const seller = await prisma.user.upsert({
    where: { email: "vendedor@tourmanager.cl" },
    update: {},
    create: {
      email: "vendedor@tourmanager.cl",
      passwordHash: sellerPassword,
      firstName: "Carlos",
      lastName: "Mendoza",
      role: "SELLER",
      phone: "+56987654321",
    },
  });
  console.log("Seller user created:", seller.email);

  // Create guide
  const guidePassword = await bcrypt.hash("guide123", 12);
  const guide = await prisma.user.upsert({
    where: { email: "guia@tourmanager.cl" },
    update: {},
    create: {
      email: "guia@tourmanager.cl",
      passwordHash: guidePassword,
      firstName: "Pedro",
      lastName: "Soto",
      role: "GUIDE",
      phone: "+56911223344",
    },
  });
  console.log("Guide user created:", guide.email);

  // Create commission config for seller
  await prisma.commissionConfig.create({
    data: {
      userId: seller.id,
      commissionType: "PERCENTAGE_PER_SALE",
      percentage: 10,
      effectiveFrom: new Date("2026-01-01"),
    },
  });

  // Create tour categories
  const aventura = await prisma.tourCategory.upsert({
    where: { name: "Aventura" },
    update: {},
    create: { name: "Aventura", description: "Tours de aventura y naturaleza", sortOrder: 1 },
  });

  const cultural = await prisma.tourCategory.upsert({
    where: { name: "Cultural" },
    update: {},
    create: { name: "Cultural", description: "Tours culturales e históricos", sortOrder: 2 },
  });

  const gastronomico = await prisma.tourCategory.upsert({
    where: { name: "Gastronómico" },
    update: {},
    create: { name: "Gastronómico", description: "Tours gastronómicos", sortOrder: 3 },
  });

  // Create tours
  const tour1 = await prisma.tour.create({
    data: {
      name: "Torres del Paine Full Day",
      description: "Recorrido completo por el Parque Nacional Torres del Paine, incluyendo los miradores principales, lagos y glaciares.",
      categoryId: aventura.id,
      durationMinutes: 720,
      meetingPoint: "Hotel Las Torres, Puerto Natales",
      priceAdult: 95000,
      priceChild: 55000,
      minPriceAdult: 80000,
      minPriceChild: 45000,
      directCost: 25000,
      maxPax: 15,
      includedItems: ["Transporte", "Guía bilingüe", "Almuerzo", "Entrada al parque"],
      excludedItems: ["Bebidas alcohólicas", "Propinas"],
    },
  });

  const tour2 = await prisma.tour.create({
    data: {
      name: "Glaciar Grey - Navegación",
      description: "Navegación por el Lago Grey hasta el imponente Glaciar Grey, con vistas panorámicas únicas.",
      categoryId: aventura.id,
      durationMinutes: 480,
      meetingPoint: "Muelle Lago Grey",
      priceAdult: 120000,
      priceChild: 70000,
      minPriceAdult: 100000,
      minPriceChild: 60000,
      directCost: 45000,
      maxPax: 20,
      includedItems: ["Navegación", "Guía", "Snack a bordo", "Whisky con hielo milenario"],
      excludedItems: ["Almuerzo", "Transporte al muelle"],
    },
  });

  const tour3 = await prisma.tour.create({
    data: {
      name: "City Tour Puerto Natales",
      description: "Recorrido por los principales atractivos de la ciudad, museos y costanera.",
      categoryId: cultural.id,
      durationMinutes: 180,
      meetingPoint: "Plaza de Armas, Puerto Natales",
      priceAdult: 25000,
      priceChild: 15000,
      minPriceAdult: 20000,
      minPriceChild: 12000,
      directCost: 5000,
      maxPax: 25,
      includedItems: ["Guía local", "Entrada a museo"],
      excludedItems: ["Alimentación", "Transporte extra"],
    },
  });

  const tour4 = await prisma.tour.create({
    data: {
      name: "Ruta Gastronómica Patagónica",
      description: "Degustación de platos típicos de la Patagonia en los mejores restaurantes locales.",
      categoryId: gastronomico.id,
      durationMinutes: 240,
      meetingPoint: "Mercado Municipal, Puerto Natales",
      priceAdult: 65000,
      priceChild: 35000,
      minPriceAdult: 55000,
      minPriceChild: 30000,
      directCost: 30000,
      maxPax: 12,
      includedItems: ["4 paradas gastronómicas", "Bebidas incluidas", "Guía especializado"],
      excludedItems: ["Consumo adicional"],
    },
  });

  // Create schedules for tours
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
  for (const day of days) {
    await prisma.tourSchedule.create({
      data: {
        tourId: tour1.id,
        dayOfWeek: day,
        departureTime: "07:00",
      },
    });
  }

  for (const day of ["MONDAY", "WEDNESDAY", "FRIDAY", "SATURDAY"] as const) {
    await prisma.tourSchedule.create({
      data: {
        tourId: tour2.id,
        dayOfWeek: day,
        departureTime: "09:00",
      },
    });
  }

  // Create a vehicle
  await prisma.vehicle.create({
    data: {
      plateNumber: "ABCD-12",
      name: "Van Toyota HiAce 15 PAX",
      capacity: 15,
      vehicleType: "van",
    },
  });

  await prisma.vehicle.create({
    data: {
      plateNumber: "EFGH-34",
      name: "Bus Mercedes 30 PAX",
      capacity: 30,
      vehicleType: "bus",
    },
  });

  // Create sample bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const passenger1 = await prisma.passenger.create({
    data: {
      firstName: "Juan",
      lastName: "Pérez",
      nationality: "Chilena",
      documentType: "RUT",
      documentNumber: "12.345.678-9",
      email: "juan@email.com",
      phone: "+56955555555",
    },
  });

  const passenger2 = await prisma.passenger.create({
    data: {
      firstName: "María",
      lastName: "López",
      nationality: "Argentina",
      documentType: "DNI",
      documentNumber: "30456789",
      email: "maria@email.com",
    },
  });

  const booking1 = await prisma.booking.create({
    data: {
      tourId: tour1.id,
      tourDate: tomorrow,
      departureTime: "07:00",
      adultCount: 2,
      childCount: 0,
      unitPriceAdult: 95000,
      unitPriceChild: 55000,
      totalAmount: 190000,
      sellerId: seller.id,
      guideId: guide.id,
      status: "CONFIRMED",
      passengers: {
        create: [
          { passengerId: passenger1.id, paxType: "ADULT", unitPrice: 95000 },
          { passengerId: passenger2.id, paxType: "ADULT", unitPrice: 95000 },
        ],
      },
    },
  });

  await prisma.bookingStatusHistory.create({
    data: {
      bookingId: booking1.id,
      fromStatus: null,
      toStatus: "RESERVED",
      changedBy: seller.id,
    },
  });

  await prisma.bookingStatusHistory.create({
    data: {
      bookingId: booking1.id,
      fromStatus: "RESERVED",
      toStatus: "CONFIRMED",
      changedBy: admin.id,
    },
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
