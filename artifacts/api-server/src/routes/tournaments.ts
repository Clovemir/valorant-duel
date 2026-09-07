import { Router, type IRouter, type Request } from "express";
import { getAuth } from "@clerk/express";
import { and, asc, eq } from "drizzle-orm";
import { db, matchesTable, participantsTable, tournamentsTable } from "@workspace/db";
import {
  CreateTournamentBody, CreateTournamentResponse, GetTournamentParams, GetTournamentResponse,
  ListTournamentsResponse, RegisterParticipantBody, RegisterParticipantParams, RegisterParticipantResponse,
  StartTournamentParams, StartTournamentResponse, UpdateParticipantBody, UpdateParticipantParams,
  UpdateParticipantResponse, UpdateTournamentMatchBody, UpdateTournamentMatchParams, UpdateTournamentMatchResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const userId = (req: Request) => {
  const auth = getAuth(req);
  return auth?.sessionClaims?.userId as string | undefined || auth?.userId;
};
const slugify = (name: string) => `${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "duel"}-${Math.random().toString(36).slice(2, 8)}`;
const fail = (res: any, status: number, error: string) => { res.status(status).json({ error }); };
const swissRoundCount = (n: number) => n <= 12 ? 4 : n <= 24 ? 5 : n <= 48 ? 6 : Math.min(10, Math.ceil(Math.log2(n)) + 1);

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
async function standings(tournamentId: number, format: string | null) {
  const people = await db.select().from(participantsTable).where(eq(participantsTable.tournamentId, tournamentId));
  const all = await db.select().from(matchesTable).where(and(eq(matchesTable.tournamentId, tournamentId), eq(matchesTable.stage, "classification"), eq(matchesTable.status, "completed")));
  const values = new Map(people.filter(p => p.status === "approved").map(p => [p.id, { participantId: p.id, nickname: p.nickname, played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, differential: 0, opponents: [] as number[] }]));
  for (const m of all) {
    if (!m.player1Id || !m.player2Id) { if (m.winnerId) values.get(m.winnerId)!.wins++; continue; }
    const a = values.get(m.player1Id), b = values.get(m.player2Id); if (!a || !b) continue;
    a.played++; b.played++; a.pointsFor += m.player1Score ?? 0; a.pointsAgainst += m.player2Score ?? 0; b.pointsFor += m.player2Score ?? 0; b.pointsAgainst += m.player1Score ?? 0;
    a.opponents.push(b.participantId); b.opponents.push(a.participantId);
    if (m.winnerId === a.participantId) { a.wins++; b.losses++; } else { b.wins++; a.losses++; }
  }
  for (const x of values.values()) x.differential = x.pointsFor - x.pointsAgainst;
  const list = [...values.values()];
  const wins = new Map(list.map(x => [x.participantId, x.wins]));
  list.sort((a,b) => b.wins-a.wins || (format === "swiss" ? b.opponents.reduce((s,id)=>s+(wins.get(id) ?? 0),0)-a.opponents.reduce((s,id)=>s+(wins.get(id) ?? 0),0) : 0) || b.differential-a.differential || b.pointsFor-a.pointsFor || a.nickname.localeCompare(b.nickname));
  return list.map(({ opponents, ...x }, i) => ({ ...x, rank: i + 1 }));
}
async function detail(t: typeof tournamentsTable.$inferSelect, organizer: boolean) {
  const people = await db.select().from(participantsTable).where(eq(participantsTable.tournamentId, t.id)).orderBy(asc(participantsTable.createdAt));
  const rows = await db.select().from(matchesTable).where(eq(matchesTable.tournamentId, t.id)).orderBy(asc(matchesTable.stage), asc(matchesTable.round), asc(matchesTable.id));
  const names = new Map(people.map(p => [p.id, p.nickname]));
  return { id:t.id, slug:t.slug, name:t.name, status:t.status as any, format:t.format as any, swissRounds:t.swissRounds, registrationDeadline:t.registrationDeadline, maxParticipants:t.maxParticipants, isOrganizer:organizer,
    participants: people.map(participant), matches: rows.map(m => ({ id:m.id, stage:m.stage, round:m.round, status:m.status as any, targetScore:m.targetScore, player1Id:m.player1Id, player2Id:m.player2Id, player1Name:m.player1Id ? names.get(m.player1Id)! : null, player2Name:m.player2Id ? names.get(m.player2Id)! : null, player1Score:m.player1Score, player2Score:m.player2Score })), standings: await standings(t.id,t.format), createdAt:t.createdAt };
}
function circle(ids: number[]) {
  const slots: (number | null)[] = ids.length % 2 ? [...ids, null] : [...ids], out: [number, number][][] = [];
  for (let r=0;r<slots.length-1;r++) { out.push([]); for(let i=0;i<slots.length/2;i++) if(slots[i] && slots[slots.length-1-i]) out[r].push([slots[i]!,slots[slots.length-1-i]!]); const last=slots.pop()!; slots.splice(1,0,last); } return out;
}
async function makeSwissRound(t: typeof tournamentsTable.$inferSelect, round: number) {
  const rank = await standings(t.id, "swiss"), completed = await db.select().from(matchesTable).where(and(eq(matchesTable.tournamentId,t.id),eq(matchesTable.stage,"classification"),eq(matchesTable.status,"completed")));
  const prior = new Set(completed.filter(m=>m.player1Id&&m.player2Id).map(m=>[m.player1Id!,m.player2Id!].sort((a,b)=>a-b).join(":")));
  const pool = rank.map(x=>x.participantId), pairs: [number,number][]=[];
  while(pool.length>1) { const a=pool.shift()!; let ix=pool.findIndex(b=>!prior.has([a,b].sort((x,y)=>x-y).join(":"))); if(ix<0) ix=0; pairs.push([a,pool.splice(ix,1)[0]]); }
  await db.insert(matchesTable).values(pairs.map(([player1Id,player2Id])=>({tournamentId:t.id,stage:"classification",round,status:"ready",targetScore:15,player1Id,player2Id})));
  if(pool.length) await db.insert(matchesTable).values({tournamentId:t.id,stage:"classification",round,status:"completed",targetScore:15,player1Id:pool[0],winnerId:pool[0],player1Score:15,player2Score:0});
}
const playoffSize = (n: number) => n === 3 ? 3 : n <= 6 ? 4 : n <= 15 ? Math.min(8, 2 ** Math.floor(Math.log2(n))) : n <= 31 ? 16 : 32;
const bracketSize = (n: number) => 2 ** Math.ceil(Math.log2(n));
function playoffStage(size: number, matches: number) {
  if (matches === 1) return "playoff_final";
  if (matches === 2) return "playoff_semifinal";
  if (matches === 4) return "playoff_quarterfinal";
  return `playoff_round_${size}`;
}
async function generatePlayoffs(t: typeof tournamentsTable.$inferSelect) {
  const existing = await db.select().from(matchesTable).where(and(eq(matchesTable.tournamentId, t.id), eq(matchesTable.stage, "playoff_final")));
  if (existing.length) return;
  const ranked = await standings(t.id, t.format);
  const qualifiers = ranked.slice(0, playoffSize(ranked.length)).map(x => x.participantId);
  const size = bracketSize(qualifiers.length);
  const first: ({ player1Id: number | null; player2Id: number | null })[] = [];
  for (let i = 0; i < size / 2; i++) first.push({ player1Id: qualifiers[i] ?? null, player2Id: qualifiers[size - 1 - i] ?? null });
  let count = size / 2, round = 1;
  while (count) {
    await db.insert(matchesTable).values(Array.from({ length: count }, (_, index) => ({
      tournamentId: t.id, stage: playoffStage(size, count), round, status: round === 1 && first[index].player1Id && first[index].player2Id ? "ready" : "pending",
      targetScore: count === 1 ? 30 : 25, player1Id: round === 1 ? first[index].player1Id : null, player2Id: round === 1 ? first[index].player2Id : null,
    })));
    count /= 2; round++;
  }
  await advancePlayoffByes(t.id);
}
async function advancePlayoffByes(tournamentId: number) {
  // A bye only exists in the initially seeded round. Complete it and then let
  // normal round propagation decide whether its parent is ready.
  const firstRound = await db.select().from(matchesTable).where(and(eq(matchesTable.tournamentId, tournamentId), eq(matchesTable.round, 1)));
  for (const match of firstRound.filter(m => m.stage.startsWith("playoff_") && m.status === "pending" && Boolean(m.player1Id) !== Boolean(m.player2Id))) {
    const winnerId = match.player1Id ?? match.player2Id!;
    await db.update(matchesTable).set({ status: "completed", winnerId, player1Score: match.player1Id ? match.targetScore : 0, player2Score: match.player2Id ? match.targetScore : 0 }).where(eq(matchesTable.id, match.id));
  }
  await propagateCompletedPlayoffRounds(tournamentId);
}
async function propagateCompletedPlayoffRounds(tournamentId: number) {
  const rows = await db.select().from(matchesTable).where(eq(matchesTable.tournamentId, tournamentId)).orderBy(asc(matchesTable.round), asc(matchesTable.id));
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
      if (parent[field] !== current[i].winnerId) await db.update(matchesTable).set({ [field]: current[i].winnerId! }).where(eq(matchesTable.id, parent.id));
    }
    const refreshed = await db.select().from(matchesTable).where(and(eq(matchesTable.tournamentId,tournamentId),eq(matchesTable.round,round+1)));
    for (const m of refreshed.filter(x => x.stage.startsWith("playoff_") && x.status === "pending" && x.player1Id && x.player2Id)) await db.update(matchesTable).set({status:"ready"}).where(eq(matchesTable.id,m.id));
  }
  const [final] = playoff.filter(m => m.stage === "playoff_final");
  if (final?.status === "completed") await db.update(tournamentsTable).set({ status: "completed" }).where(eq(tournamentsTable.id, tournamentId));
}

router.get("/tournaments", async (req,res): Promise<void> => { const id=userId(req); if(!id){fail(res,401,"Unauthorized");return;} const rows=await db.select().from(tournamentsTable).where(eq(tournamentsTable.ownerId,id)); const out=[] as any[]; for(const t of rows){const n=await db.select().from(participantsTable).where(eq(participantsTable.tournamentId,t.id));out.push({id:t.id,slug:t.slug,name:t.name,status:t.status,participantCount:n.length,createdAt:t.createdAt});} res.json(ListTournamentsResponse.parse(out)); });
router.post("/tournaments", async (req,res): Promise<void> => { const id=userId(req), body=CreateTournamentBody.safeParse(req.body); if(!id){fail(res,401,"Unauthorized");return;} if(!body.success){fail(res,400,body.error.message);return;} let slug=slugify(body.data.name); while(await tournamentFor(slug)) slug=slugify(body.data.name); const [t]=await db.insert(tournamentsTable).values({ownerId:id,slug,name:body.data.name.trim(),registrationDeadline:body.data.registrationDeadline ?? null,maxParticipants:body.data.maxParticipants ?? null}).returning(); res.status(201).json(CreateTournamentResponse.parse(await detail(t,true))); });
router.get("/tournaments/:slug", async(req,res):Promise<void>=>{const p=GetTournamentParams.safeParse(req.params);if(!p.success){fail(res,400,p.error.message);return;}const t=await tournamentFor(p.data.slug);if(!t){fail(res,404,"Tournament not found");return;}res.json(GetTournamentResponse.parse(await detail(t,userId(req)===t.ownerId)));});
router.post("/tournaments/:slug/registrations", async(req,res):Promise<void>=>{const p=RegisterParticipantParams.safeParse(req.params),b=RegisterParticipantBody.safeParse(req.body);if(!p.success||!b.success){fail(res,400,p.error?.message ?? b.error?.message ?? "Invalid request");return;}const nickname=b.data.nickname.trim();if(nickname.length<2){fail(res,400,"Nickname must be at least 2 characters");return;}const t=await tournamentFor(p.data.slug);if(!t){fail(res,404,"Tournament not found");return;}if(t.status!=="registration"||(t.registrationDeadline&&t.registrationDeadline<new Date())){fail(res,409,"Registration is closed");return;}const current=await db.select().from(participantsTable).where(eq(participantsTable.tournamentId,t.id));if(t.maxParticipants&&current.length>=t.maxParticipants){fail(res,409,"Tournament is at capacity");return;}try{const [row]=await db.insert(participantsTable).values({tournamentId:t.id,nickname,nicknameNormalized:nickname.toLocaleLowerCase()}).returning();res.status(201).json(RegisterParticipantResponse.parse(participant(row)));}catch{fail(res,409,"Nickname is already registered");}});
router.patch("/tournaments/:slug/participants/:participantId", async(req,res):Promise<void>=>{const p=UpdateParticipantParams.safeParse(req.params),b=UpdateParticipantBody.safeParse(req.body);if(!p.success||!b.success){fail(res,400,p.error?.message ?? b.error?.message ?? "Invalid request");return;}const t=await owned(req,res,p.data.slug);if(!t)return;const values:any={...b.data};if(values.nickname){values.nickname=values.nickname.trim();values.nicknameNormalized=values.nickname.toLowerCase();}const [row]=await db.update(participantsTable).set(values).where(and(eq(participantsTable.id,p.data.participantId),eq(participantsTable.tournamentId,t.id))).returning();if(!row){fail(res,404,"Participant not found");return;}res.json(UpdateParticipantResponse.parse(participant(row)));});
router.post("/tournaments/:slug/start", async(req,res):Promise<void>=>{const p=StartTournamentParams.safeParse(req.params);if(!p.success){fail(res,400,p.error.message);return;}const t=await owned(req,res,p.data.slug);if(!t)return;if(t.status!=="registration"){fail(res,409,"Tournament has already started");return;}const people=await db.select().from(participantsTable).where(and(eq(participantsTable.tournamentId,t.id),eq(participantsTable.status,"approved")));if(people.length<3){fail(res,409,"At least 3 approved participants are required");return;}const format=people.length<=6?"round_robin":"swiss", rounds=format==="round_robin"?null:swissRoundCount(people.length);const [started]=await db.update(tournamentsTable).set({status:"active",format,swissRounds:rounds}).where(eq(tournamentsTable.id,t.id)).returning();if(format==="round_robin"){const fixtures=circle(people.map(x=>x.id));await db.insert(matchesTable).values(fixtures.flatMap((pairs,r)=>pairs.map(([player1Id,player2Id])=>({tournamentId:t.id,stage:"classification",round:r+1,status:r===0?"ready":"pending",targetScore:15,player1Id,player2Id}))));}else await makeSwissRound(started,1);res.json(StartTournamentResponse.parse(await detail(started,true)));});
router.patch("/tournaments/:slug/matches/:matchId", async(req,res):Promise<void>=>{const p=UpdateTournamentMatchParams.safeParse(req.params),b=UpdateTournamentMatchBody.safeParse(req.body);if(!p.success||!b.success){fail(res,400,p.error?.message ?? b.error?.message ?? "Invalid request");return;}const t=await owned(req,res,p.data.slug);if(!t)return;const [match]=await db.select().from(matchesTable).where(and(eq(matchesTable.id,p.data.matchId),eq(matchesTable.tournamentId,t.id)));if(!match){fail(res,404,"Match not found");return;}if(match.status==="pending"||!match.player1Id||!match.player2Id){fail(res,409,"Match is not ready for scoring");return;}
  const target=match.targetScore,a=b.data.player1Score,c=b.data.player2Score;if(!((a===target&&c<target)||(c===target&&a<target))){fail(res,400,`Exactly one player must reach ${target}, with the opponent below ${target}`);return;}const winnerId=a===target?match.player1Id:match.player2Id;
  if(match.status==="completed" && match.stage==="classification"){const playoffs=await db.select().from(matchesTable).where(and(eq(matchesTable.tournamentId,t.id),eq(matchesTable.stage,"playoff_final")));if(playoffs.length){fail(res,409,"Classification results are locked after playoff seeding");return;}}
  if(match.status==="completed" && match.stage.startsWith("playoff_") && match.winnerId!==winnerId){const child=(await db.select().from(matchesTable).where(and(eq(matchesTable.tournamentId,t.id),eq(matchesTable.round,match.round+1)))).find(x=>x.stage.startsWith("playoff_"));if(child&&(child.status==="ready"||child.status==="completed")){fail(res,409,"Cannot change a result after its downstream match has begun");return;}}
  const [updated]=await db.update(matchesTable).set({player1Score:a,player2Score:c,winnerId,status:"completed"}).where(eq(matchesTable.id,match.id)).returning();
  if(match.stage==="classification"){const all=await db.select().from(matchesTable).where(and(eq(matchesTable.tournamentId,t.id),eq(matchesTable.stage,"classification")));const thisRound=all.filter(x=>x.round===match.round);if(thisRound.every(x=>x.status==="completed")){if(t.format==="round_robin"){const next=all.filter(x=>x.round===match.round+1);if(next.length)await db.update(matchesTable).set({status:"ready"}).where(and(eq(matchesTable.tournamentId,t.id),eq(matchesTable.stage,"classification"),eq(matchesTable.round,match.round+1)));}else if(match.round<(t.swissRounds??0)){const next=all.filter(x=>x.round===match.round+1);if(!next.length)await makeSwissRound(t,match.round+1);}}const refreshed=await db.select().from(matchesTable).where(and(eq(matchesTable.tournamentId,t.id),eq(matchesTable.stage,"classification")));const finished=t.format==="round_robin"?refreshed.every(x=>x.status==="completed"):refreshed.filter(x=>x.round===(t.swissRounds??0)).length>0&&refreshed.filter(x=>x.round===(t.swissRounds??0)).every(x=>x.status==="completed");if(finished)await generatePlayoffs(t);}else if(match.stage.startsWith("playoff_"))await propagateCompletedPlayoffRounds(t.id);
  res.json(UpdateTournamentMatchResponse.parse((await detail(t,true)).matches.find(x=>x.id===updated.id)!));});
export default router;