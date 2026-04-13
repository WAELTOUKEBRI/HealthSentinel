import "dotenv/config"; // This is the magic line!
import { defineConfig } from "@prisma/config";

export default defineConfig({
  // Tell Prisma where your schema is since we moved the config to root
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

