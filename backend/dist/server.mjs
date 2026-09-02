// src/server.ts
import "dotenv/config";

// src/app.ts
import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";

// src/lib/env.ts
function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}
var env = {
  jwtSecret: required("JWT_SECRET"),
  internalCronSecret: required("INTERNAL_CRON_SECRET"),
  coingeckoApiUrl: process.env.COINGECKO_API_URL ?? "https://api.coingecko.com/api/v3",
  // CORS allowlist — comma-separated origins (e.g. the deployed Vercel frontend URL). Falls back
  // to allowing any origin in local dev, where there's no fixed frontend URL to pin.
  frontendOrigins: process.env.FRONTEND_ORIGIN?.split(",").map((o) => o.trim()) ?? null
};

// src/routes/auth.ts
import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";

// src/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";

// src/generated/prisma/client.ts
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// src/generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.10.0",
  "engineVersion": "0edf323efd1d98336f3f0a68684b56f689b900d3",
  "activeProvider": "postgresql",
  "inlineSchema": 'generator client {\n  provider = "prisma-client"\n  output   = "../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nenum Asset {\n  BTC\n  ETH\n  SOL\n}\n\nenum OrderSide {\n  BUY\n  SELL\n}\n\nenum OrderType {\n  MARKET\n  LIMIT\n}\n\nenum OrderStatus {\n  PENDING\n  FILLED\n  CANCELLED\n}\n\nmodel User {\n  id           String   @id @default(cuid())\n  email        String   @unique\n  passwordHash String\n  displayName  String\n  createdAt    DateTime @default(now())\n\n  // starting demo balance: $10,000.00\n  balanceCents BigInt @default(1000000)\n\n  positions Position[]\n  orders    Order[]\n  trades    Trade[]\n}\n\nmodel Position {\n  id             String @id @default(cuid())\n  userId         String\n  asset          Asset\n  // held quantity, 1e8 minor-units per coin (satoshi-style), never negative (no shorting in v1)\n  quantity       BigInt @default(0)\n  // cost basis in cents, for realized/unrealized PnL calc\n  costBasisCents BigInt @default(0)\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, asset])\n}\n\nmodel Order {\n  id              String      @id @default(cuid())\n  userId          String\n  asset           Asset\n  side            OrderSide\n  type            OrderType\n  status          OrderStatus @default(PENDING)\n  quantity        BigInt\n  limitPriceCents BigInt?\n  createdAt       DateTime    @default(now())\n  filledAt        DateTime?\n  cancelledAt     DateTime?\n\n  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n  trade Trade?\n\n  @@index([userId])\n  @@index([status, asset])\n}\n\nmodel Trade {\n  id         String    @id @default(cuid())\n  orderId    String    @unique\n  userId     String\n  asset      Asset\n  side       OrderSide\n  quantity   BigInt\n  priceCents BigInt\n  executedAt DateTime  @default(now())\n\n  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)\n  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId, executedAt])\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"passwordHash","kind":"scalar","type":"String"},{"name":"displayName","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"balanceCents","kind":"scalar","type":"BigInt"},{"name":"positions","kind":"object","type":"Position","relationName":"PositionToUser"},{"name":"orders","kind":"object","type":"Order","relationName":"OrderToUser"},{"name":"trades","kind":"object","type":"Trade","relationName":"TradeToUser"}],"dbName":null,"schema":null},"Position":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"asset","kind":"enum","type":"Asset"},{"name":"quantity","kind":"scalar","type":"BigInt"},{"name":"costBasisCents","kind":"scalar","type":"BigInt"},{"name":"user","kind":"object","type":"User","relationName":"PositionToUser"}],"dbName":null,"schema":null},"Order":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"asset","kind":"enum","type":"Asset"},{"name":"side","kind":"enum","type":"OrderSide"},{"name":"type","kind":"enum","type":"OrderType"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"quantity","kind":"scalar","type":"BigInt"},{"name":"limitPriceCents","kind":"scalar","type":"BigInt"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"filledAt","kind":"scalar","type":"DateTime"},{"name":"cancelledAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"OrderToUser"},{"name":"trade","kind":"object","type":"Trade","relationName":"OrderToTrade"}],"dbName":null,"schema":null},"Trade":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"asset","kind":"enum","type":"Asset"},{"name":"side","kind":"enum","type":"OrderSide"},{"name":"quantity","kind":"scalar","type":"BigInt"},{"name":"priceCents","kind":"scalar","type":"BigInt"},{"name":"executedAt","kind":"scalar","type":"DateTime"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToTrade"},{"name":"user","kind":"object","type":"User","relationName":"TradeToUser"}],"dbName":null,"schema":null}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","positions","order","trade","orders","trades","_count","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","data","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","create","update","User.upsertOne","User.deleteOne","User.deleteMany","having","_avg","_sum","_min","_max","User.groupBy","User.aggregate","Position.findUnique","Position.findUniqueOrThrow","Position.findFirst","Position.findFirstOrThrow","Position.findMany","Position.createOne","Position.createMany","Position.createManyAndReturn","Position.updateOne","Position.updateMany","Position.updateManyAndReturn","Position.upsertOne","Position.deleteOne","Position.deleteMany","Position.groupBy","Position.aggregate","Order.findUnique","Order.findUniqueOrThrow","Order.findFirst","Order.findFirstOrThrow","Order.findMany","Order.createOne","Order.createMany","Order.createManyAndReturn","Order.updateOne","Order.updateMany","Order.updateManyAndReturn","Order.upsertOne","Order.deleteOne","Order.deleteMany","Order.groupBy","Order.aggregate","Trade.findUnique","Trade.findUniqueOrThrow","Trade.findFirst","Trade.findFirstOrThrow","Trade.findMany","Trade.createOne","Trade.createMany","Trade.createManyAndReturn","Trade.updateOne","Trade.updateMany","Trade.updateManyAndReturn","Trade.upsertOne","Trade.deleteOne","Trade.deleteMany","Trade.groupBy","Trade.aggregate","AND","OR","NOT","id","orderId","userId","Asset","asset","OrderSide","side","quantity","priceCents","executedAt","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","OrderType","type","OrderStatus","status","limitPriceCents","createdAt","filledAt","cancelledAt","costBasisCents","email","passwordHash","displayName","balanceCents","every","some","none","userId_asset","is","isNot","connectOrCreate","upsert","disconnect","delete","connect","createMany","set","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "lgIqQAwEAACTAQAgBwAAlAEAIAgAAJUBACBSAACPAQAwUwAAFAAQVAAAjwEAMFUBAAAAAW9AAJEBACFzAQAAAAF0AQCQAQAhdQEAkAEAIXYEAJIBACEBAAAAAQAgCQMAAJoBACBSAACiAQAwUwAAAwAQVAAAogEAMFUBAJABACFXAQCQAQAhWQAAlwFZIlwEAJIBACFyBACSAQAhAQMAAP4BACAKAwAAmgEAIFIAAKIBADBTAAADABBUAACiAQAwVQEAAAABVwEAkAEAIVkAAJcBWSJcBACSAQAhcgQAkgEAIXoAAKEBACADAAAAAwAgAQAABAAwAgAABQAgEAMAAJoBACAGAACgAQAgUgAAmwEAMFMAAAcAEFQAAJsBADBVAQCQAQAhVwEAkAEAIVkAAJcBWSJbAACYAVsiXAQAkgEAIWsAAJwBayJtAACdAW0ibgQAngEAIW9AAJEBACFwQACfAQAhcUAAnwEAIQUDAAD-AQAgBgAA_wEAIG4AALEBACBwAACxAQAgcQAAsQEAIBADAACaAQAgBgAAoAEAIFIAAJsBADBTAAAHABBUAACbAQAwVQEAAAABVwEAkAEAIVkAAJcBWSJbAACYAVsiXAQAkgEAIWsAAJwBayJtAACdAW0ibgQAngEAIW9AAJEBACFwQACfAQAhcUAAnwEAIQMAAAAHACABAAAIADACAAAJACANAwAAmgEAIAUAAJkBACBSAACWAQAwUwAACwAQVAAAlgEAMFUBAJABACFWAQCQAQAhVwEAkAEAIVkAAJcBWSJbAACYAVsiXAQAkgEAIV0EAJIBACFeQACRAQAhAQAAAAsAIAIDAAD-AQAgBQAA_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-ADBTAABTABBUAAB-ADBVAQBtACFXAQBtACFZAABuWSJbAABvWyJcBABwACFrAAB_ayJtAACAAW0ibgQAgQEAIW9AAHEAIXBAAIIBACFxQACCAQAhAwAAAAcAIAEAAFIAMBsAAFMAIAMAAAAHACABAAAIADACAAAJACABAAAADgAgAQAAAA4AIAMAAAALACABAAANADACAAAOACADAAAACwAgAQAADQAwAgAADgAgAwAAAAsAIAEAAA0AMAIAAA4AIAoDAACwAQAgBQAArwEAIFUBAAAAAVYBAAAAAVcBAAAAAVkAAABZAlsAAABbAlwEAAAAAV0EAAAAAV5AAAAAAQEPAABbACAIVQEAAAABVgEAAAABVwEAAAABWQAAAFkCWwAAAFsCXAQAAAABXQQAAAABXkAAAAABAQ8AAF0AMAEPAABdADAKAwAArgEAIAUAAK0BACBVAQCoAQAhVgEAqAEAIVcBAKgBACFZAACpAVkiWwAAqgFbIlwEAKsBACFdBACrAQAhXkAArAEAIQIAAAAOACAPAABgACAIVQEAqAEAIVYBAKgBACFXAQCoAQAhWQAAqQFZIlsAAKoBWyJcBACrAQAhXQQAqwEAIV5AAKwBACECAAAACwAgDwAAYgAgAgAAAAsAIA8AAGIAIAMAAAAOACAWAABbACAXAABgACABAAAADgAgAQAAAAsAIAUJAACjAQAgHAAApAEAIB0AAKcBACAeAACmAQAgHwAApQEAIAtSAABsADBTAABpABBUAABsADBVAQBtACFWAQBtACFXAQBtACFZAABuWSJbAABvWyJcBABwACFdBABwACFeQABxACEDAAAACwAgAQAAaAAwGwAAaQAgAwAAAAsAIAEAAA0AMAIAAA4AIAtSAABsADBTAABpABBUAABsADBVAQBtACFWAQBtACFXAQBtACFZAABuWSJbAABvWyJcBABwACFdBABwACFeQABxACEOCQAAcwAgHgAAfQAgHwAAfQAgXwEAAAABYAEAAAAEYQEAAAAEYgEAAAABYwEAAAABZAEAAAABZQEAAAABZgEAfAAhZwEAAAABaAEAAAABaQEAAAABBwkAAHMAIB4AAHsAIB8AAHsAIF8AAABZAmAAAABZCGEAAABZCGYAAHpZIgcJAABzACAeAAB5ACAfAAB5ACBfAAAAWwJgAAAAWwhhAAAAWwhmAAB4WyINCQAAcwAgHAAAdgAgHQAAdwAgHgAAdwAgHwAAdwAgXwQAAAABYAQAAAAEYQQAAAAEYgQAAAABYwQAAAABZAQAAAABZQQAAAABZgQAdQAhCwkAAHMAIB4AAHQAIB8AAHQAIF9AAAAAAWBAAAAABGFAAAAABGJAAAAAAWNAAAAAAWRAAAAAAWVAAAAAAWZAAHIAIQsJAABzACAeAAB0ACAfAAB0ACBfQAAAAAFgQAAAAARhQAAAAARiQAAAAAFjQAAAAAFkQAAAAAFlQAAAAAFmQAByACEIXwIAAAABYAIAAAAEYQIAAAAEYgIAAAABYwIAAAABZAIAAAABZQIAAAABZgIAcwAhCF9AAAAAAWBAAAAABGFAAAAABGJAAAAAAWNAAAAAAWRAAAAAAWVAAAAAAWZAAHQAIQ0JAABzACAcAAB2ACAdAAB3ACAeAAB3ACAfAAB3ACBfBAAAAAFgBAAAAARhBAAAAARiBAAAAAFjBAAAAAFkBAAAAAFlBAAAAAFmBAB1ACEIXwgAAAABYAgAAAAEYQgAAAAEYggAAAABYwgAAAABZAgAAAABZQgAAAABZggAdgAhCF8EAAAAAWAEAAAABGEEAAAABGIEAAAAAWMEAAAAAWQEAAAAAWUEAAAAAWYEAHcAIQcJAABzACAeAAB5ACAfAAB5ACBfAAAAWwJgAAAAWwhhAAAAWwhmAAB4WyIEXwAAAFsCYAAAAFsIYQAAAFsIZgAAeVsiBwkAAHMAIB4AAHsAIB8AAHsAIF8AAABZAmAAAABZCGEAAABZCGYAAHpZIgRfAAAAWQJgAAAAWQhhAAAAWQhmAAB7WSIOCQAAcwAgHgAAfQAgHwAAfQAgXwEAAAABYAEAAAAEYQEAAAAEYgEAAAABYwEAAAABZAEAAAABZQEAAAABZgEAfAAhZwEAAAABaAEAAAABaQEAAAABC18BAAAAAWABAAAABGEBAAAABGIBAAAAAWMBAAAAAWQBAAAAAWUBAAAAAWYBAH0AIWcBAAAAAWgBAAAAAWkBAAAAAQ5SAAB-ADBTAABTABBUAAB-ADBVAQBtACFXAQBtACFZAABuWSJbAABvWyJcBABwACFrAAB_ayJtAACAAW0ibgQAgQEAIW9AAHEAIXBAAIIBACFxQACCAQAhBwkAAHMAIB4AAIwBACAfAACMAQAgXwAAAGsCYAAAAGsIYQAAAGsIZgAAiwFrIgcJAABzACAeAACKAQAgHwAAigEAIF8AAABtAmAAAABtCGEAAABtCGYAAIkBbSINCQAAhAEAIBwAAIcBACAdAACIAQAgHgAAiAEAIB8AAIgBACBfBAAAAAFgBAAAAAVhBAAAAAViBAAAAAFjBAAAAAFkBAAAAAFlBAAAAAFmBACGAQAhCwkAAIQBACAeAACFAQAgHwAAhQEAIF9AAAAAAWBAAAAABWFAAAAABWJAAAAAAWNAAAAAAWRAAAAAAWVAAAAAAWZAAIMBACELCQAAhAEAIB4AAIUBACAfAACFAQAgX0AAAAABYEAAAAAFYUAAAAAFYkAAAAABY0AAAAABZEAAAAABZUAAAAABZkAAgwEAIQhfAgAAAAFgAgAAAAVhAgAAAAViAgAAAAFjAgAAAAFkAgAAAAFlAgAAAAFmAgCEAQAhCF9AAAAAAWBAAAAABWFAAAAABWJAAAAAAWNAAAAAAWRAAAAAAWVAAAAAAWZAAIUBACENCQAAhAEAIBwAAIcBACAdAACIAQAgHgAAiAEAIB8AAIgBACBfBAAAAAFgBAAAAAVhBAAAAAViBAAAAAFjBAAAAAFkBAAAAAFlBAAAAAFmBACGAQAhCF8IAAAAAWAIAAAABWEIAAAABWIIAAAAAWMIAAAAAWQIAAAAAWUIAAAAAWYIAIcBACEIXwQAAAABYAQAAAAFYQQAAAAFYgQAAAABYwQAAAABZAQAAAABZQQAAAABZgQAiAEAIQcJAABzACAeAACKAQAgHwAAigEAIF8AAABtAmAAAABtCGEAAABtCGYAAIkBbSIEXwAAAG0CYAAAAG0IYQAAAG0IZgAAigFtIgcJAABzACAeAACMAQAgHwAAjAEAIF8AAABrAmAAAABrCGEAAABrCGYAAIsBayIEXwAAAGsCYAAAAGsIYQAAAGsIZgAAjAFrIghSAACNAQAwUwAAPQAQVAAAjQEAMFUBAG0AIVcBAG0AIVkAAG5ZIlwEAHAAIXIEAHAAIQlSAACOAQAwUwAAJwAQVAAAjgEAMFUBAG0AIW9AAHEAIXMBAG0AIXQBAG0AIXUBAG0AIXYEAHAAIQwEAACTAQAgBwAAlAEAIAgAAJUBACBSAACPAQAwUwAAFAAQVAAAjwEAMFUBAJABACFvQACRAQAhcwEAkAEAIXQBAJABACF1AQCQAQAhdgQAkgEAIQtfAQAAAAFgAQAAAARhAQAAAARiAQAAAAFjAQAAAAFkAQAAAAFlAQAAAAFmAQB9ACFnAQAAAAFoAQAAAAFpAQAAAAEIX0AAAAABYEAAAAAEYUAAAAAEYkAAAAABY0AAAAABZEAAAAABZUAAAAABZkAAdAAhCF8EAAAAAWAEAAAABGEEAAAABGIEAAAAAWMEAAAAAWQEAAAAAWUEAAAAAWYEAHcAIQN3AAADACB4AAADACB5AAADACADdwAABwAgeAAABwAgeQAABwAgA3cAAAsAIHgAAAsAIHkAAAsAIA0DAACaAQAgBQAAmQEAIFIAAJYBADBTAAALABBUAACWAQAwVQEAkAEAIVYBAJABACFXAQCQAQAhWQAAlwFZIlsAAJgBWyJcBACSAQAhXQQAkgEAIV5AAJEBACEEXwAAAFkCYAAAAFkIYQAAAFkIZgAAe1kiBF8AAABbAmAAAABbCGEAAABbCGYAAHlbIhIDAACaAQAgBgAAoAEAIFIAAJsBADBTAAAHABBUAACbAQAwVQEAkAEAIVcBAJABACFZAACXAVkiWwAAmAFbIlwEAJIBACFrAACcAWsibQAAnQFtIm4EAJ4BACFvQACRAQAhcEAAnwEAIXFAAJ8BACF7AAAHACB8AAAHACAOBAAAkwEAIAcAAJQBACAIAACVAQAgUgAAjwEAMFMAABQAEFQAAI8BADBVAQCQAQAhb0AAkQEAIXMBAJABACF0AQCQAQAhdQEAkAEAIXYEAJIBACF7AAAUACB8AAAUACAQAwAAmgEAIAYAAKABACBSAACbAQAwUwAABwAQVAAAmwEAMFUBAJABACFXAQCQAQAhWQAAlwFZIlsAAJgBWyJcBACSAQAhawAAnAFrIm0AAJ0BbSJuBACeAQAhb0AAkQEAIXBAAJ8BACFxQACfAQAhBF8AAABrAmAAAABrCGEAAABrCGYAAIwBayIEXwAAAG0CYAAAAG0IYQAAAG0IZgAAigFtIghfBAAAAAFgBAAAAAVhBAAAAAViBAAAAAFjBAAAAAFkBAAAAAFlBAAAAAFmBACIAQAhCF9AAAAAAWBAAAAABWFAAAAABWJAAAAAAWNAAAAAAWRAAAAAAWVAAAAAAWZAAIUBACEPAwAAmgEAIAUAAJkBACBSAACWAQAwUwAACwAQVAAAlgEAMFUBAJABACFWAQCQAQAhVwEAkAEAIVkAAJcBWSJbAACYAVsiXAQAkgEAIV0EAJIBACFeQACRAQAhewAACwAgfAAACwAgAlcBAAAAAVkAAABZAgkDAACaAQAgUgAAogEAMFMAAAMAEFQAAKIBADBVAQCQAQAhVwEAkAEAIVkAAJcBWSJcBACSAQAhcgQAkgEAIQAAAAAAAYMBAQAAAAEBgwEAAABZAgGDAQAAAFsCBYMBBAAAAAGGAQQAAAABhwEEAAAAAYgBBAAAAAGJAQQAAAABAYMBQAAAAAEFFgAAjwIAIBcAAJUCACB9AACQAgAgfgAAlAIAIIEBAAAJACAFFgAAjQIAIBcAAJICACB9AACOAgAgfgAAkQIAIIEBAAABACADFgAAjwIAIH0AAJACACCBAQAACQAgAxYAAI0CACB9AACOAgAggQEAAAEAIAAAAAAAAAGDAQAAAGsCAYMBAAAAbQIFgwEEAAAAAYYBBAAAAAGHAQQAAAABiAEEAAAAAYkBBAAAAAEBgwFAAAAAAQUWAACIAgAgFwAAiwIAIH0AAIkCACB-AACKAgAggQEAAAEAIAcWAAC9AQAgFwAAwAEAIH0AAL4BACB-AAC_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-AQAgBgAA_wEAIG4AALEBACBwAACxAQAgcQAAsQEAIAMEAAD6AQAgBwAA-wEAIAgAAPwBACACAwAA_gEAIAUAAP0BACAEVQEAAAABWQAAAFkCXAQAAAABcgQAAAABClUBAAAAAVkAAABZAlsAAABbAlwEAAAAAWsAAABrAm0AAABtAm4EAAAAAW9AAAAAAXBAAAAAAXFAAAAAAQdVAQAAAAFWAQAAAAFZAAAAWQJbAAAAWwJcBAAAAAFdBAAAAAFeQAAAAAEIBwAA-AEAIAgAAPkBACBVAQAAAAFvQAAAAAFzAQAAAAF0AQAAAAF1AQAAAAF2BAAAAAECAAAAAQAgFgAAgwIAIAMAAAAUACAWAACDAgAgFwAAhwIAIAoAAAAUACAHAADRAQAgCAAA0gEAIA8AAIcCACBVAQCoAQAhb0AArAEAIXMBAKgBACF0AQCoAQAhdQEAqAEAIXYEAKsBACEIBwAA0QEAIAgAANIBACBVAQCoAQAhb0AArAEAIXMBAKgBACF0AQCoAQAhdQEAqAEAIXYEAKsBACEIBAAA9wEAIAgAAPkBACBVAQAAAAFvQAAAAAFzAQAAAAF0AQAAAAF1AQAAAAF2BAAAAAECAAAAAQAgFgAAiAIAIAMAAAAUACAWAACIAgAgFwAAjAIAIAoAAAAUACAEAADQAQAgCAAA0gEAIA8AAIwCACBVAQCoAQAhb0AArAEAIXMBAKgBACF0AQCoAQAhdQEAqAEAIXYEAKsBACEIBAAA0AEAIAgAANIBACBVAQCoAQAhb0AArAEAIXMBAKgBACF0AQCoAQAhdQEAqAEAIXYEAKsBACEIBAAA9wEAIAcAAPgBACBVAQAAAAFvQAAAAAFzAQAAAAF0AQAAAAF1AQAAAAF2BAAAAAECAAAAAQAgFgAAjQIAIAwDAADCAQAgVQEAAAABVwEAAAABWQAAAFkCWwAAAFsCXAQAAAABawAAAGsCbQAAAG0CbgQAAAABb0AAAAABcEAAAAABcUAAAAABAgAAAAkAIBYAAI8CACADAAAAFAAgFgAAjQIAIBcAAJMCACAKAAAAFAAgBAAA0AEAIAcAANEBACAPAACTAgAgVQEAqAEAIW9AAKwBACFzAQCoAQAhdAEAqAEAIXUBAKgBACF2BACrAQAhCAQAANABACAHAADRAQAgVQEAqAEAIW9AAKwBACFzAQCoAQAhdAEAqAEAIXUBAKgBACF2BACrAQAhAwAAAAcAIBYAAI8CACAXAACWAgAgDgAAAAcAIAMAALsBACAPAACWAgAgVQEAqAEAIVcBAKgBACFZAACpAVkiWwAAqgFbIlwEAKsBACFrAAC3AWsibQAAuAFtIm4EALkBACFvQACsAQAhcEAAugEAIXFAALoBACEMAwAAuwEAIFUBAKgBACFXAQCoAQAhWQAAqQFZIlsAAKoBWyJcBACrAQAhawAAtwFrIm0AALgBbSJuBAC5AQAhb0AArAEAIXBAALoBACFxQAC6AQAhBAQGAgcKAwgPBAkABQEDAAECAwABBgwEAgMAAQUAAwMEEAAHEQAIEgAAAAAFCQAKHAALHQAMHgANHwAOAAAAAAAFCQAKHAALHQAMHgANHwAOAQMAAQEDAAEFCQATHAAUHQAVHgAWHwAXAAAAAAAFCQATHAAUHQAVHgAWHwAXAQMAAQEDAAEFCQAcHAAdHQAeHgAfHwAgAAAAAAAFCQAcHAAdHQAeHgAfHwAgAgMAAQUAAwIDAAEFAAMFCQAlHAAmHQAnHgAoHwApAAAAAAAFCQAlHAAmHQAnHgAoHwApCgIBCxMBDBYBDRcBDhgBEBoBERwGEh0HEx8BFCEGFSIIGCMBGSQBGiUGICgJISkPIioCIysCJCwCJS0CJi4CJzACKDIGKTMQKjUCKzcGLDgRLTkCLjoCLzsGMD4SMT8YMkADM0EDNEIDNUMDNkQDN0YDOEgGOUkZOksDO00GPE4aPU8DPlADP1EGQFQbQVUhQlYEQ1cERFgERVkERloER1wESF4GSV8iSmEES2MGTGQjTWUETmYET2cGUGokUWsq"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("node:buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// src/generated/prisma/internal/prismaNamespace.ts
import * as runtime2 from "@prisma/client/runtime/client";
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var defineExtension = runtime2.Extensions.defineExtension;

// src/generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/lib/prisma.ts
function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}
var prisma = globalThis.__prisma ?? createClient();
if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

// src/lib/auth.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var TOKEN_EXPIRY = "7d";
function hashPassword(password) {
  return bcrypt.hash(password, 10);
}
function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function signToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: TOKEN_EXPIRY });
}
function verifyToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new Error("Invalid token payload");
  }
  return payload.sub;
}

// src/routes/auth.ts
var authRouter = Router();
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many attempts. Please try again later." }
});
var registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(60)
});
authRouter.post("/register", authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { email, password, displayName } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ success: false, error: "Email already registered" });
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash, displayName } });
  const token = signToken(user.id);
  res.status(201).json({ success: true, data: { token, user: { id: user.id, email: user.email, displayName: user.displayName } } });
});
var loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
authRouter.post("/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid input" });
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !await verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ success: false, error: "Invalid email or password" });
  }
  const token = signToken(user.id);
  res.json({ success: true, data: { token, user: { id: user.id, email: user.email, displayName: user.displayName } } });
});

// src/routes/me.ts
import { Router as Router2 } from "express";

// src/middleware/auth.ts
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) {
    return res.status(401).json({ success: false, error: "Missing bearer token" });
  }
  try {
    req.userId = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

// src/routes/me.ts
var meRouter = Router2();
meRouter.use(requireAuth);
meRouter.get("/", async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  res.json({
    success: true,
    data: { id: user.id, email: user.email, displayName: user.displayName, balanceCents: user.balanceCents }
  });
});

// src/routes/orders.ts
import { Router as Router3 } from "express";
import { z as z2 } from "zod";

// src/lib/money.ts
var QTY_SCALE = 100000000n;
function parseQuantity(input) {
  const value = Number(input);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Quantity must be a positive number");
  }
  return BigInt(Math.round(value * Number(QTY_SCALE)));
}
function parseCents(input) {
  const value = Number(input);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Price must be a positive number");
  }
  return BigInt(Math.round(value * 100));
}
function costCents(quantity, priceCentsPerUnit) {
  return quantity * priceCentsPerUnit / QTY_SCALE;
}

// src/lib/limitOrder.ts
function crossesLimit(side, currentPriceCents, limitPriceCents) {
  return side === "BUY" ? currentPriceCents <= limitPriceCents : currentPriceCents >= limitPriceCents;
}

// src/lib/errors.ts
var InsufficientBalanceError = class extends Error {
  constructor() {
    super("Insufficient balance");
    this.name = "InsufficientBalanceError";
  }
};
var InsufficientPositionError = class extends Error {
  constructor() {
    super("Insufficient position");
    this.name = "InsufficientPositionError";
  }
};
var OrderNotFoundError = class extends Error {
  constructor() {
    super("Order not found");
    this.name = "OrderNotFoundError";
  }
};

// src/services/priceService.ts
var COINGECKO_ID = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana"
};
var CACHE_TTL_MS = 1e4;
var cache = null;
async function getVerifiedPricesCents() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.pricesCents;
  }
  const ids = Object.values(COINGECKO_ID).join(",");
  const url = `${env.coingeckoApiUrl}/simple/price?ids=${ids}&vs_currencies=usd`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko request failed: ${res.status}`);
  const data = await res.json();
  const pricesCents = Object.fromEntries(
    Object.entries(COINGECKO_ID).map(([symbol, id]) => {
      const usd = data[id]?.usd;
      if (typeof usd !== "number") throw new Error(`No price returned for ${symbol}`);
      return [symbol, BigInt(Math.round(usd * 100))];
    })
  );
  cache = { fetchedAt: Date.now(), pricesCents };
  return pricesCents;
}
async function getVerifiedPriceCents(asset) {
  const prices = await getVerifiedPricesCents();
  return prices[asset];
}

// src/services/orderExecution.ts
async function fillPendingOrderTx(tx, order, fillPriceCents) {
  const cost = costCents(order.quantity, fillPriceCents);
  if (order.side === "BUY") {
    const guarded = await tx.user.updateMany({
      where: { id: order.userId, balanceCents: { gte: cost } },
      data: { balanceCents: { decrement: cost } }
    });
    if (guarded.count === 0) throw new InsufficientBalanceError();
    await tx.position.upsert({
      where: { userId_asset: { userId: order.userId, asset: order.asset } },
      create: { userId: order.userId, asset: order.asset, quantity: order.quantity, costBasisCents: cost },
      update: { quantity: { increment: order.quantity }, costBasisCents: { increment: cost } }
    });
  } else {
    const guarded = await tx.position.updateMany({
      where: { userId: order.userId, asset: order.asset, quantity: { gte: order.quantity } },
      data: { quantity: { decrement: order.quantity } }
    });
    if (guarded.count === 0) throw new InsufficientPositionError();
    const position = await tx.position.findUniqueOrThrow({
      where: { userId_asset: { userId: order.userId, asset: order.asset } }
    });
    const priorQuantity = position.quantity + order.quantity;
    const costBasisReduction = priorQuantity > 0n ? position.costBasisCents * order.quantity / priorQuantity : 0n;
    await tx.position.update({
      where: { userId_asset: { userId: order.userId, asset: order.asset } },
      data: { costBasisCents: { decrement: costBasisReduction } }
    });
    await tx.user.update({
      where: { id: order.userId },
      data: { balanceCents: { increment: cost } }
    });
  }
  await tx.order.update({
    where: { id: order.id },
    data: { status: "FILLED", filledAt: /* @__PURE__ */ new Date() }
  });
  await tx.trade.create({
    data: {
      orderId: order.id,
      userId: order.userId,
      asset: order.asset,
      side: order.side,
      quantity: order.quantity,
      priceCents: fillPriceCents
    }
  });
}
async function placeMarketOrder(userId, asset, side, quantity) {
  const priceCents = await getVerifiedPriceCents(asset);
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: { userId, asset, side, type: "MARKET", quantity, status: "PENDING" }
    });
    await fillPendingOrderTx(tx, order, priceCents);
    return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: { trade: true } });
  });
}
async function placeLimitOrder(userId, asset, side, quantity, limitPriceCents) {
  const currentPriceCents = await getVerifiedPriceCents(asset);
  const crossesNow = crossesLimit(side, currentPriceCents, limitPriceCents);
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: { userId, asset, side, type: "LIMIT", quantity, limitPriceCents, status: "PENDING" }
    });
    if (crossesNow) {
      await fillPendingOrderTx(tx, order, currentPriceCents);
    }
    return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: { trade: true } });
  });
}
async function cancelOrder(userId, orderId) {
  const result = await prisma.order.updateMany({
    where: { id: orderId, userId, status: "PENDING" },
    data: { status: "CANCELLED", cancelledAt: /* @__PURE__ */ new Date() }
  });
  if (result.count === 0) throw new OrderNotFoundError();
}

// src/routes/orders.ts
var ordersRouter = Router3();
ordersRouter.use(requireAuth);
var assetSchema = z2.enum(["BTC", "ETH", "SOL"]);
var sideSchema = z2.enum(["BUY", "SELL"]);
var marketOrderSchema = z2.object({
  asset: assetSchema,
  side: sideSchema,
  quantity: z2.string()
});
ordersRouter.post("/market", async (req, res) => {
  const parsed = marketOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid input" });
  }
  try {
    const quantity = parseQuantity(parsed.data.quantity);
    const order = await placeMarketOrder(req.userId, parsed.data.asset, parsed.data.side, quantity);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    if (err instanceof InsufficientBalanceError || err instanceof InsufficientPositionError) {
      return res.status(422).json({ success: false, error: err.message });
    }
    if (err instanceof Error) {
      return res.status(400).json({ success: false, error: err.message });
    }
    throw err;
  }
});
var limitOrderSchema = z2.object({
  asset: assetSchema,
  side: sideSchema,
  quantity: z2.string(),
  limitPrice: z2.string()
});
ordersRouter.post("/limit", async (req, res) => {
  const parsed = limitOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid input" });
  }
  try {
    const quantity = parseQuantity(parsed.data.quantity);
    const limitPriceCents = parseCents(parsed.data.limitPrice);
    const order = await placeLimitOrder(req.userId, parsed.data.asset, parsed.data.side, quantity, limitPriceCents);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    if (err instanceof InsufficientBalanceError || err instanceof InsufficientPositionError) {
      return res.status(422).json({ success: false, error: err.message });
    }
    if (err instanceof Error) {
      return res.status(400).json({ success: false, error: err.message });
    }
    throw err;
  }
});
ordersRouter.delete("/:id", async (req, res) => {
  try {
    await cancelOrder(req.userId, req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    if (err instanceof OrderNotFoundError) {
      return res.status(404).json({ success: false, error: "Order not found or not cancellable" });
    }
    throw err;
  }
});
var statusQuerySchema = z2.enum(["PENDING", "FILLED", "CANCELLED"]).optional();
ordersRouter.get("/", async (req, res) => {
  const parsed = statusQuerySchema.safeParse(req.query.status);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid status filter" });
  }
  const orders = await prisma.order.findMany({
    where: { userId: req.userId, ...parsed.data ? { status: parsed.data } : {} },
    orderBy: { createdAt: "desc" },
    include: { trade: true }
  });
  res.json({ success: true, data: orders });
});

// src/routes/portfolio.ts
import { Router as Router4 } from "express";

// src/services/pnl.ts
var STARTING_BALANCE_CENTS = 1000000n;
function unrealizedValueCents(positions, pricesCents) {
  return positions.reduce((sum, p) => sum + p.quantity * pricesCents[p.asset] / QTY_SCALE, 0n);
}
function totalPnlCents(balanceCents, positions, pricesCents) {
  return balanceCents + unrealizedValueCents(positions, pricesCents) - STARTING_BALANCE_CENTS;
}

// src/routes/portfolio.ts
var portfolioRouter = Router4();
portfolioRouter.use(requireAuth);
portfolioRouter.get("/", async (req, res) => {
  const [user, positions, prices] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: req.userId } }),
    prisma.position.findMany({ where: { userId: req.userId, quantity: { gt: 0n } } }),
    getVerifiedPricesCents()
  ]);
  const positionsWithMarket = positions.map((p) => {
    const asset = p.asset;
    const marketValueCents = p.quantity * prices[asset] / 100000000n;
    return { ...p, currentPriceCents: prices[asset], marketValueCents };
  });
  res.json({
    success: true,
    data: {
      balanceCents: user.balanceCents,
      positions: positionsWithMarket,
      unrealizedValueCents: unrealizedValueCents(positions, prices),
      totalPnlCents: totalPnlCents(user.balanceCents, positions, prices)
    }
  });
});

// src/routes/trades.ts
import { Router as Router5 } from "express";
var tradesRouter = Router5();
tradesRouter.use(requireAuth);
tradesRouter.get("/", async (req, res) => {
  const trades = await prisma.trade.findMany({
    where: { userId: req.userId },
    orderBy: { executedAt: "desc" },
    take: 200
  });
  res.json({ success: true, data: trades });
});

// src/routes/leaderboard.ts
import { Router as Router6 } from "express";
var leaderboardRouter = Router6();
leaderboardRouter.get("/", async (_req, res) => {
  const [users, prices] = await Promise.all([
    prisma.user.findMany({ include: { positions: true } }),
    getVerifiedPricesCents()
  ]);
  const ranked = users.map((user) => ({
    displayName: user.displayName,
    balanceCents: user.balanceCents,
    pnlCents: totalPnlCents(
      user.balanceCents,
      user.positions.filter((p) => p.quantity > 0n).map((p) => ({ ...p, asset: p.asset })),
      prices
    )
  })).sort((a, b) => a.pnlCents > b.pnlCents ? -1 : a.pnlCents < b.pnlCents ? 1 : 0);
  res.json({ success: true, data: ranked });
});

// src/routes/internal.ts
import { timingSafeEqual } from "node:crypto";
import { Router as Router7 } from "express";

// src/jobs/checkFills.ts
async function checkFills() {
  const pending = await prisma.order.findMany({
    where: { status: "PENDING", type: "LIMIT" }
  });
  if (pending.length === 0) return { checked: 0, filled: 0, skipped: 0 };
  const prices = await getVerifiedPricesCents();
  let filled = 0;
  let skipped = 0;
  for (const order of pending) {
    const asset = order.asset;
    const currentPrice = prices[asset];
    const limitPrice = order.limitPriceCents;
    if (!crossesLimit(order.side, currentPrice, limitPrice)) continue;
    try {
      await prisma.$transaction(async (tx) => {
        const fresh = await tx.order.findUnique({ where: { id: order.id } });
        if (!fresh || fresh.status !== "PENDING") return;
        await fillPendingOrderTx(
          tx,
          { id: fresh.id, userId: fresh.userId, asset, side: fresh.side, quantity: fresh.quantity },
          currentPrice
        );
      });
      filled += 1;
    } catch (err) {
      if (err instanceof InsufficientBalanceError || err instanceof InsufficientPositionError) {
        skipped += 1;
      } else {
        throw err;
      }
    }
  }
  return { checked: pending.length, filled, skipped };
}

// src/routes/internal.ts
var internalRouter = Router7();
function isValidCronSecret(provided) {
  if (typeof provided !== "string") return false;
  const expected = Buffer.from(env.internalCronSecret);
  const actual = Buffer.from(provided);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
internalRouter.post("/check-fills", async (req, res) => {
  if (!isValidCronSecret(req.headers["x-cron-secret"])) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  const result = await checkFills();
  res.json({ success: true, data: result });
});

// src/app.ts
function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors(env.frontendOrigins ? { origin: env.frontendOrigins } : {}));
  app.use(express.json());
  app.set("json replacer", (_key, value) => typeof value === "bigint" ? value.toString() : value);
  const api = express.Router();
  api.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));
  api.use("/auth", authRouter);
  api.use("/me", meRouter);
  api.use("/orders", ordersRouter);
  api.use("/portfolio", portfolioRouter);
  api.use("/trades", tradesRouter);
  api.use("/leaderboard", leaderboardRouter);
  api.use("/internal", internalRouter);
  app.use("/api", api);
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal server error" });
  });
  return app;
}

// src/server.ts
var port = process.env.PORT ? Number(process.env.PORT) : 3001;
createApp().listen(port, () => {
  console.log(`paper-trader backend listening on http://localhost:${port}`);
});
var FILL_CHECK_INTERVAL_MS = 5 * 60 * 1e3;
void checkFills().catch((err) => console.error("checkFills failed", err));
setInterval(() => {
  void checkFills().catch((err) => console.error("checkFills failed", err));
}, FILL_CHECK_INTERVAL_MS);
