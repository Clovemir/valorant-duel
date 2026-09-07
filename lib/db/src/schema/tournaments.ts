import { createInsertSchema } from "drizzle-zod";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const tournamentsTable = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  status: text("status").notNull().default("registration"),
  format: text("format"),
  swissRounds: integer("swiss_rounds"),
  registrationDeadline: timestamp("registration_deadline", { withTimezone: true }),
  maxParticipants: integer("max_participants"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const participantsTable = pgTable(
  "participants",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id").notNull().references(() => tournamentsTable.id, { onDelete: "cascade" }),
    nickname: text("nickname").notNull(),
    nicknameNormalized: text("nickname_normalized").notNull(),
    status: text("status").notNull().default("pending"),
    seed: integer("seed"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("participants_tournament_nickname_unique").on(table.tournamentId, table.nicknameNormalized)],
);

export const matchesTable = pgTable("tournament_matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournamentsTable.id, { onDelete: "cascade" }),
  stage: text("stage").notNull(),
  round: integer("round").notNull(),
  status: text("status").notNull().default("pending"),
  targetScore: integer("target_score").notNull(),
  player1Id: integer("player1_id").references(() => participantsTable.id, { onDelete: "set null" }),
  player2Id: integer("player2_id").references(() => participantsTable.id, { onDelete: "set null" }),
  player1Score: integer("player1_score"),
  player2Score: integer("player2_score"),
  winnerId: integer("winner_id").references(() => participantsTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTournamentSchema = createInsertSchema(tournamentsTable).omit({ id: true, createdAt: true });
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournamentsTable.$inferSelect;
export const insertParticipantSchema = createInsertSchema(participantsTable).omit({ id: true, createdAt: true });
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participantsTable.$inferSelect;
export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true, createdAt: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type TournamentMatch = typeof matchesTable.$inferSelect;