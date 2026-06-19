import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  engine: "classic", // Tells Prisma to use the native local engine layout
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL, // Directly reads from your .env file natively
  },
});
