import { Router, type IRouter, type Request } from "express";
import { getAuth } from "@clerk/express";
import { and, asc, eq, sql } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { db, matchesTable, participantsTable, tournamentsTable } from "@workspace/db";
import {
  CreateTournamentBody, CreateTournamentResponse, GetTournamentParams, GetTournamentResponse,
  GetRegistrationStatusBody, GetRegistrationStatusParams, GetRegistrationStatusResponse, ListTournamentsResponse,
  RegisterParticipantBody, RegisterParticipantParams, RegisterParticipantResponse,
  StartTournamentParams, StartTournamentResponse, UpdateParticipantBody, UpdateParticipantParams,
  UpdateParticipantResponse, UpdateTournamentMatchBody, UpdateTournamentMatchParams, UpdateTournamentMatchResponse,
} from "@workspace/api-zod";
import {
  bracketSize,
  calculateStandings,
  pairKey,
  pairSwissRound,
  playoffSize,
  playoffStage,
  roundRobinFixtures,
  swissRoundCount,
  validateScore,
} from "../domain/competition";

const router: IRouter = Router();
const userId = (req: Request) => {
  const auth = getAuth(req);
  return auth?.sessionClaims?.userId as string | undefined || auth?.userId;
};
const slugify = (name: string) => `${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "duel"}-${Math.random().toString(36).slice(2, 8)}`;
const fail = (res: any, status: number, error: string) => { res.status(status).json({ error }); };
const trackingTokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

async function tournamentFor(slug: string) {
  return (await db.select().from(tournamentsTable).where(eq(tournamentsTable.slug, slug)))[0];
}
async function owned(req: Request, res: any, slug: string) {
  const owner = userId(req);
  if (!owner) { fail(res, 401, "Unauthorized"); return; }
  const tournament = await tournamentFor(slug);
  if (!tournament) { fail(res, 404, "Tournament not found"); return; }
  if (tournament.ownerId !== owner) { fail(res, 403, "You do not own this tournament"); return; }
  return tournament;
}
function participant(row: typeof participantsTable.$inferSelect) {
  return { id: row.id, nickname: row.nickname, status: row.status as "pending" | "approved" | "rejected", seed: row.seed, createdAt: row.createdAt };
}
type DbExecutor = Pick<typeof db, "select" | "insert" | "update">;
async function standings(tournamentId: number, format: string | null, executor: DbExecutor = db) {
  const people = await executor.select().from(participantsTable).where(eq(participantsTable.tournamentId, tournamentId));
  const all = await executor.select().from(matchesTable).where(and(eq(matchesTable.tournamentId, tournamentId), eq(matchesTable.stage, "classification"), eq(matchesTable.status, "completed")));
  return calculateStandings(people, all, format);
}
async function detail(t: typeof tournamentsTable.$inferSelect, organizer: boolean) {
  const people = await db.select().from(participantsTable).where(eq(participantsTable.tournamentId, t.id)).orderBy(asc(participantsTable.createdAt));
  const rows = await db.select().from(matchesTable).where(eq(matchesTable.tournamentId, t.id)).orderBy(asc(matchesTable.stage), asc(matchesTable.round), asc(matchesTable.id));
  const names = new Map(people.map(p => [p.id, p.nickname]));
  const visiblePeople = organizer ? people : people.filter(person => person.status === "approved");
  return { id:t.id, slug:t.slug, name:t.name, status:t.status as any, format:t.format as any, swissRounds:t.swissRounds, registrationDeadline:t.registrationDeadline, maxParticipants:t.maxParticipants, isOrganizer:organizer,
    participants: visiblePeople.map(participant), matches: rows.map(m => ({ id:m.id, stage:m.stage, round:m.round, status:m.status as any, targetScore:m.targetScore, player1Id:m.player1Id, player2Id:m.player2Id, player1Name:m.player1Id ? names.get(m.player1Id)! : null, player2Name:m.player2Id ? names.get(m.player2Id)! : null, player1Score:m.player1Score, player2Score:m.player2Score })), standings: await standings(t.id,t.format), createdAt:t.createdAt };
}
async function makeSwissRound(t: typeof tournamentsTable.$inferSelect, round: number, executor: DbExecutor = db) {
  const rank = await standings(t.id, "swiss", executor), completed = await executor.select().from(matchesTable).where(and(eq(matchesTable.tournamentId,t.id),eq(matchesTable.stage,"classification"),eq(matchesTable.status,"completed")));
  const prior = new Set(completed.filter(m=>m.player1Id&&m.player2Id).map(m=>pairKey(m.player1Id!,m.player2Id!)));
  const { pairs, byeParticipantId } = pairSwissRound(rank.map(x=>x.participantId), prior);
  await executor.insert(matchesTable).values(pairs.map(([player1Id,player2Id])=>({tournamentId:t.id,stage:"classification",round,status:"ready",targetScore:15,player1Id,player2Id})));
  if(byeParticipantId) await executor.insert(matchesTable).values({tournamentId:t.id,stage:"classification",round,status:"completed",targetScore:15,player1Id:byeParticipantId,winnerId:byeParticipantId,player1Score:null,player2Score:null});
}
async function generatePlayoffs(t: typeof tournamentsTable.$inferSelect, executor: DbExecutor = db) {
  const existing = await executor.select().from(matchesTable).where(and(eq(matchesTable.tournamentId, t.id), eq(matchesTable.stage, "playoff_final")));
  if (existing.length) return;
  const ranked = await standings(t.id, t.format, executor);
  const qualifiers = ranked.slice(0, playoffSize(ranked.length)).map(x => x.participantId);
  const size = bracketSize(qualifiers.length);
  const first: ({ player1Id: number | null; player2Id: number | null })[] = [];
  for (let i = 0; i < size / 2; i++) first.push({ player1Id: qualifiers[i] ?? null, player2Id: qualifiers[size - 1 - i] ?? null });
  let count = size / 2, round = 1;
  while (count) {
    await executor.insert(matchesTable).values(Array.from({ length: count }, (_, index) => ({
      tournamentId: t.id, stage: playoffStage(size, count), round, status: round === 1 && first[index].player1Id && first[index].player2Id ? "ready" : "pending",
      targetScore: count === 1 ? 30 : 25, player1Id: round === 1 ? first[index].player1Id : null, player2Id: round === 1 ? first[index].player2Id : null,
    })));
    count /= 2; round++;
  }
  await advancePlayoffByes(t.id, executor);
}
async function advancePlayoffByes(tournamentId: number, executor: DbExecutor = db) {
  // A bye only exists in the initially seeded round. Complete it and then let
  // normal round propagation decide whether its parent is ready.
  const firstRound = await executor.select().from(matchesTable).where(and(eq(matchesTable.tournamentId, tournamentId), eq(matchesTable.round, 1)));
  for (const match of firstRound.filter(m => m.stage.startsWith("playoff_") && m.status === "pending" && Boolean(m.player1Id) !== Boolean(m.player2Id))) {
    const winnerId = match.player1Id ?? match.player2Id!;
    await executor.update(matchesTable).set({ status: "completed", winnerId, player1Score: null, player2Score: null }).where(eq(matchesTable.id, match.id));
  }
  await propagateCompletedPlayoffRounds(tournamentId, executor);
}
async function propagateCompletedPlayoffRounds(tournamentId: number, executor: DbExecutor = db) {
  const rows = await executor.select().from(matchesTable).where(eq(matchesTable.tournamentId, tournamentId)).orderBy(asc(matchesTable.round), asc(matchesTable.id));
  const playoff = rows.filter(m => m.stage.startsWith("playoff_"));
  const rounds = [...new Set(playoff.map(m => m.round))].sort((a,b) => a-b);
  for (const round of rounds.slice(0, -1)) {
    const current = playoff.filter(m => m.round === round);
    if (!current.every(m => m.status === "completed" && m.winnerId)) continue;
    const next = playoff.filter(m => m.round === round + 1);
    for (let i=0;i<current.length;i++) {
      const parent = next[Math.floor(i / 2)];
      if (!parent) continue;
      const field = i % 2 === 0 ? "player1Id" : "player2Id";
      if (parent[field] !== current[i].winnerId) await executor.update(matchesTable).set({ [field]: current[i].winnerId! }).where(and(eq(matchesTable.id, parent.id), eq(matchesTable.tournamentId, tournamentId)));
    }
    const refreshed = await executor.select().from(matchesTable).where(and(eq(matchesTable.tournamentId,tournamentId),eq(matchesTable.round,round+1)));
    for (const m of refreshed.filter(x => x.stage.startsWith("playoff_") && x.status === "pending" && x.player1Id && x.player2Id)) await executor.update(matchesTable).set({status:"ready"}).where(and(eq(matchesTable.id,m.id), eq(matchesTable.tournamentId, tournamentId)));
  }
  const [final] = playoff.filter(m => m.stage === "playoff_final");
  if (final?.status === "completed") await executor.update(tournamentsTable).set({ status: "completed" }).where(eq(tournamentsTable.id, tournamentId));
}

router.get("/tournaments", async (req,res): Promise<void> => { const id=userId(req); if(!id){fail(res,401,"Unauthorized");return;} const rows=await db.select().from(tournamentsTable).where(eq(tournamentsTable.ownerId,id)); const out=[] as any[]; for(const t of rows){const n=await db.select().from(participantsTable).where(eq(participantsTable.tournamentId,t.id));out.push({id:t.id,slug:t.slug,name:t.name,status:t.status,participantCount:n.length,createdAt:t.createdAt});} res.json(ListTournamentsResponse.parse(out)); });
router.post("/tournaments", async (req,res): Promise<void> => { const id=userId(req), body=CreateTournamentBody.safeParse(req.body); if(!id){fail(res,401,"Unauthorized");return;} if(!body.success){fail(res,400,body.error.message);return;} let slug=slugify(body.data.name); while(await tournamentFor(slug)) slug=slugify(body.data.name); const [t]=await db.insert(tournamentsTable).values({ownerId:id,slug,name:body.data.name.trim(),registrationDeadline:body.data.registrationDeadline ?? null,maxParticipants:body.data.maxParticipants ?? null}).returning(); res.status(201).json(CreateTournamentResponse.parse(await detail(t,true))); });
router.get("/tournaments/:slug", async(req,res):Promise<void>=>{const p=GetTournamentParams.safeParse(req.params);if(!p.success){fail(res,400,p.error.message);return;}const t=await tournamentFor(p.data.slug);if(!t){fail(res,404,"Tournament not found");return;}res.json(GetTournamentResponse.parse(await detail(t,userId(req)===t.ownerId)));});
router.post("/tournaments/:slug/registrations", async(req,res):Promise<void>=>{const p=RegisterParticipantParams.safeParse(req.params),b=RegisterParticipantBody.safeParse(req.body);if(!p.success||!b.success){fail(res,400,p.error?.message ?? b.error?.message ?? "Invalid request");return;}const nickname=b.data.nickname.trim();if(nickname.length<2){fail(res,400,"Nickname must be at least 2 characters");return;}const trackingToken=randomBytes(32).toString("base64url");try{const row=await db.transaction(async(tx)=>{await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${p.data.slug}))`);const [t]=await tx.select().from(tournamentsTable).where(eq(tournamentsTable.slug,p.data.slug));if(!t)throw new Error("NOT_FOUND");if(t.status!=="registration"||(t.registrationDeadline&&t.registrationDeadline<new Date()))throw new Error("CLOSED");const current=await tx.select({id:participantsTable.id}).from(participantsTable).where(eq(participantsTable.tournamentId,t.id));if(t.maxParticipants&&current.length>=t.maxParticipants)throw new Error("CAPACITY");const [created]=await tx.insert(participantsTable).values({tournamentId:t.id,nickname,nicknameNormalized:nickname.normalize("NFKC").toLocaleLowerCase(),trackingTokenHash:trackingTokenHash(trackingToken)}).returning();return created;});res.status(201).json(RegisterParticipantResponse.parse({trackingToken,nickname:row.nickname,status:row.status,createdAt:row.createdAt}));}catch(error){const code=error instanceof Error?error.message:"";if(code==="NOT_FOUND"){fail(res,404,"Tournament not found");return;}if(code==="CLOSED"){fail(res,409,"Registration is closed");return;}if(code==="CAPACITY"){fail(res,409,"Tournament is at capacity");return;}fail(res,409,"Nickname is already registered");}});
router.post("/tournaments/:slug/registrations/status", async(req,res):Promise<void>=>{const p=GetRegistrationStatusParams.safeParse(req.params),b=GetRegistrationStatusBody.safeParse(req.body);if(!p.success||!b.success){fail(res,400,p.error?.message??b.error?.message??"Invalid request");return;}const t=await tournamentFor(p.data.slug);if(!t){fail(res,404,"Tournament not found");return;}const [row]=await db.select().from(participantsTable).where(and(eq(participantsTable.tournamentId,t.id),eq(participantsTable.trackingTokenHash,trackingTokenHash(b.data.trackingToken))));if(!row){fail(res,404,"Registration not found");return;}res.json(GetRegistrationStatusResponse.parse({nickname:row.nickname,status:row.status,tournamentStatus:t.status,createdAt:row.createdAt}));});
router.patch("/tournaments/:slug/participants/:participantId", async(req,res):Promise<void>=>{const p=UpdateParticipantParams.safeParse(req.params),b=UpdateParticipantBody.safeParse(req.body);if(!p.success||!b.success){fail(res,400,p.error?.message ?? b.error?.message ?? "Invalid request");return;}const t=await owned(req,res,p.data.slug);if(!t)return;if(t.status!=="registration"){fail(res,409,"Participants are locked after the tournament starts");return;}const values:any={...b.data};if(values.nickname){values.nickname=values.nickname.trim();values.nicknameNormalized=values.nickname.normalize("NFKC").toLocaleLowerCase();}const [row]=await db.update(participantsTable).set(values).where(and(eq(participantsTable.id,p.data.participantId),eq(participantsTable.tournamentId,t.id))).returning();if(!row){fail(res,404,"Participant not found");return;}res.json(UpdateParticipantResponse.parse(participant(row)));});
router.post("/tournaments/:slug/start", async(req,res):Promise<void>=>{const p=StartTournamentParams.safeParse(req.params);if(!p.success){fail(res,400,p.error.message);return;}const owner=userId(req);if(!owner){fail(res,401,"Unauthorized");return;}try{const started=await db.transaction(async(tx)=>{await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${p.data.slug}))`);const [t]=await tx.select().from(tournamentsTable).where(eq(tournamentsTable.slug,p.data.slug));if(!t)throw new Error("NOT_FOUND");if(t.ownerId!==owner)throw new Error("FORBIDDEN");if(t.status!=="registration")throw new Error("STARTED");const people=await tx.select().from(participantsTable).where(and(eq(participantsTable.tournamentId,t.id),eq(participantsTable.status,"approved")));if(people.length<3)throw new Error("TOO_FEW");const format=people.length<=6?"round_robin":"swiss",rounds=format==="round_robin"?null:swissRoundCount(people.length);const [row]=await tx.update(tournamentsTable).set({status:"active",format,swissRounds:rounds}).where(and(eq(tournamentsTable.id,t.id),eq(tournamentsTable.status,"registration"))).returning();if(!row)throw new Error("STARTED");if(format==="round_robin"){const fixtures=roundRobinFixtures(people.map(x=>x.id));await tx.insert(matchesTable).values(fixtures.flatMap((pairs,r)=>pairs.map(([player1Id,player2Id])=>({tournamentId:t.id,stage:"classification",round:r+1,status:r===0?"ready":"pending",targetScore:15,player1Id,player2Id}))));}else await makeSwissRound(row,1,tx);return row;});res.json(StartTournamentResponse.parse(await detail(started,true)));}catch(error){const code=error instanceof Error?error.message:"";if(code==="NOT_FOUND"){fail(res,404,"Tournament not found");return;}if(code==="FORBIDDEN"){fail(res,403,"You do not own this tournament");return;}if(code==="TOO_FEW"){fail(res,409,"At least 3 approved participants are required");return;}if(code==="STARTED"){fail(res,409,"Tournament has already started");return;}throw error;}});
router.patch("/tournaments/:slug/matches/:matchId", async(req,res):Promise<void>=>{const p=UpdateTournamentMatchParams.safeParse(req.params),b=UpdateTournamentMatchBody.safeParse(req.body);if(!p.success||!b.success){fail(res,400,p.error?.message ?? b.error?.message ?? "Invalid request");return;}const owner=userId(req);if(!owner){fail(res,401,"Unauthorized");return;}try{const result=await db.transaction(async(tx)=>{await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${p.data.slug}))`);const [t]=await tx.select().from(tournamentsTable).where(eq(tournamentsTable.slug,p.data.slug));if(!t)throw new Error("NOT_FOUND");if(t.ownerId!==owner)throw new Error("FORBIDDEN");const [match]=await tx.select().from(matchesTable).where(and(eq(matchesTable.id,p.data.matchId),eq(matchesTable.tournamentId,t.id)));if(!match)throw new Error("MATCH_NOT_FOUND");if(match.status==="pending"||!match.player1Id||!match.player2Id)throw new Error("NOT_READY");const a=b.data.player1Score,c=b.data.player2Score;if(!validateScore(a,c,match.targetScore))throw new Error(`INVALID_SCORE:${match.targetScore}`);const winnerId=a===match.targetScore?match.player1Id:match.player2Id;if(match.status==="completed"&&match.stage==="classification"){const playoffs=await tx.select().from(matchesTable).where(and(eq(matchesTable.tournamentId,t.id),eq(matchesTable.stage,"playoff_final")));if(playoffs.length)throw new Error("CLASSIFICATION_LOCKED");}if(match.status==="completed"&&match.stage.startsWith("playoff_")&&match.winnerId!==winnerId){const current=await tx.select().from(matchesTable).where(and(eq(matchesTable.tournamentId,t.id),eq(matchesTable.round,match.round))).orderBy(asc(matchesTable.id));const playoffCurrent=current.filter(x=>x.stage.startsWith("playoff_"));const index=playoffCurrent.findIndex(x=>x.id===match.id);const next=await tx.select().from(matchesTable).where(and(eq(matchesTable.tournamentId,t.id),eq(matchesTable.round,match.round+1))).orderBy(asc(matchesTable.id));const parent=next.filter(x=>x.stage.startsWith("playoff_"))[Math.floor(index/2)];if(parent&&(parent.status==="ready"||parent.status==="completed"))throw new Error("DOWNSTREAM_LOCKED");}const [updated]=await tx.update(matchesTable).set({player1Score:a,player2Score:c,winnerId,status:"completed"}).where(and(eq(matchesTable.id,match.id),eq(matchesTable.tournamentId,t.id))).returning();if(match.stage==="classification"){const all=await tx.select().from(matchesTable).where(and(eq(matchesTable.tournamentId,t.id),eq(matchesTable.stage,"classification")));const thisRound=all.filter(x=>x.round===match.round).map(x=>x.id===updated.id?updated:x);if(thisRound.every(x=>x.status==="completed")){if(t.format==="round_robin"){const next=all.filter(x=>x.round===match.round+1);if(next.length)await tx.update(matchesTable).set({status:"ready"}).where(and(eq(matchesTable.tournamentId,t.id),eq(matchesTable.stage,"classification"),eq(matchesTable.round,match.round+1)));}else if(match.round<(t.swissRounds??0)){const next=all.filter(x=>x.round===match.round+1);if(!next.length)await makeSwissRound(t,match.round+1,tx);}}const refreshed=await tx.select().from(matchesTable).where(and(eq(matchesTable.tournamentId,t.id),eq(matchesTable.stage,"classification")));const finished=t.format==="round_robin"?refreshed.every(x=>x.status==="completed"):refreshed.some(x=>x.round===(t.swissRounds??0))&&refreshed.filter(x=>x.round===(t.swissRounds??0)).every(x=>x.status==="completed");if(finished)await generatePlayoffs(t,tx);}else if(match.stage.startsWith("playoff_"))await propagateCompletedPlayoffRounds(t.id,tx);return {t,updated};});res.json(UpdateTournamentMatchResponse.parse((await detail(result.t,true)).matches.find(x=>x.id===result.updated.id)!));}catch(error){const code=error instanceof Error?error.message:"";if(code==="NOT_FOUND"){fail(res,404,"Tournament not found");return;}if(code==="FORBIDDEN"){fail(res,403,"You do not own this tournament");return;}if(code==="MATCH_NOT_FOUND"){fail(res,404,"Match not found");return;}if(code==="NOT_READY"){fail(res,409,"Match is not ready for scoring");return;}if(code==="CLASSIFICATION_LOCKED"){fail(res,409,"Classification results are locked after playoff seeding");return;}if(code==="DOWNSTREAM_LOCKED"){fail(res,409,"Cannot change a result after its downstream match has begun");return;}if(code.startsWith("INVALID_SCORE:")){const target=code.split(":")[1];fail(res,400,`Exactly one player must reach ${target}, with the opponent below ${target}`);return;}throw error;}});
export default router;