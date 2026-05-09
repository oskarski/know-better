import "server-only";

import { randomInt, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { getPublicQuestions, getQuestionById, getQuestions } from "@/lib/questions";
import { normalizeAnswer } from "@/lib/normalization";
import { calculateLotteryTickets, calculateScore } from "@/lib/scoring";
import type {
  AdminDashboard,
  AdminGameState,
  AdminPlayerView,
  DrawWinnerView,
  GameSnapshot,
  GameStatus,
  QuestionStatus,
  QuestionView,
} from "@/lib/types";

export const SESSION_COOKIE = "knowbetter_player_id";

type StoredAnswer = {
  value: string;
  status: QuestionStatus;
  hintUsed: boolean;
  checkedAt?: string;
  hintRevealedAt?: string;
};

type StoredPlayer = {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  answers: Record<string, StoredAnswer>;
};

type StoredGameMeta = {
  status: GameStatus;
  closedAt?: string;
  winners: DrawWinnerView[];
  updatedAt: string;
};

type StoredGame = {
  players: Record<string, StoredPlayer>;
  meta?: StoredGameMeta;
};

const dataDirectory = path.join(process.cwd(), "data");
const storePath = path.join(dataDirectory, "game-state.json");
let writeQueue: Promise<unknown> = Promise.resolve();
const maxWinners = 3;

type RedisConfig = {
  token: string;
  url: string;
};

function emptyStore(): StoredGame {
  return {
    meta: defaultGameMeta(),
    players: {},
  };
}

function getRedisConfig(): RedisConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (url && token) {
    return {
      token,
      url,
    };
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Brak konfiguracji Redis. Na Vercel ustaw UPSTASH_REDIS_REST_URL i UPSTASH_REDIS_REST_TOKEN.",
    );
  }

  return null;
}

function storagePrefix() {
  return process.env.KNOWBETTER_STORAGE_PREFIX ?? "knowbetter";
}

function redisPlayerKey(playerId: string) {
  return `${storagePrefix()}:player:${playerId}`;
}

function redisMetaKey() {
  return `${storagePrefix()}:meta`;
}

async function redisCommand<T>(command: unknown[]): Promise<T> {
  const config = getRedisConfig();

  if (!config) {
    throw new Error("Redis nie jest skonfigurowany.");
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  const payload = (await response.json()) as { error?: string; result?: T };

  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? "Nie udało się wykonać operacji Redis.");
  }

  return payload.result as T;
}

async function redisGetPlayer(playerId: string) {
  const rawPlayer = await redisCommand<string | null>(["GET", redisPlayerKey(playerId)]);

  if (!rawPlayer) {
    return null;
  }

  return JSON.parse(rawPlayer) as StoredPlayer;
}

async function redisSavePlayer(player: StoredPlayer) {
  await redisCommand<"OK">(["SET", redisPlayerKey(player.id), JSON.stringify(player)]);
}

async function redisDeletePlayer(playerId: string) {
  await redisCommand<number>(["DEL", redisPlayerKey(playerId)]);
}

async function redisGetMeta() {
  const rawMeta = await redisCommand<string | null>(["GET", redisMetaKey()]);

  if (!rawMeta) {
    return defaultGameMeta();
  }

  return normalizeMeta(JSON.parse(rawMeta) as Partial<StoredGameMeta>);
}

async function redisSaveMeta(meta: StoredGameMeta) {
  await redisCommand<"OK">(["SET", redisMetaKey(), JSON.stringify(meta)]);
}

async function redisPlayerKeys() {
  const keys: string[] = [];
  let cursor = "0";

  do {
    const result = await redisCommand<[string, string[]]>([
      "SCAN",
      cursor,
      "MATCH",
      `${storagePrefix()}:player:*`,
      "COUNT",
      100,
    ]);

    cursor = String(result[0]);
    keys.push(...result[1]);
  } while (cursor !== "0");

  return keys;
}

async function redisGetAllPlayers() {
  const keys = await redisPlayerKeys();

  if (keys.length === 0) {
    return [];
  }

  const rawPlayers = await redisCommand<(string | null)[]>(["MGET", ...keys]);

  return rawPlayers
    .filter((rawPlayer): rawPlayer is string => Boolean(rawPlayer))
    .map((rawPlayer) => JSON.parse(rawPlayer) as StoredPlayer);
}

async function ensureStoreFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, JSON.stringify(emptyStore(), null, 2), "utf8");
  }
}

async function readStore(): Promise<StoredGame> {
  await ensureStoreFile();
  const content = await readFile(storePath, "utf8");
  return JSON.parse(content) as StoredGame;
}

async function writeStore(store: StoredGame) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryPath = `${storePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(store, null, 2), "utf8");
  await rename(temporaryPath, storePath);
}

async function updateStore<T>(updater: (store: StoredGame) => T | Promise<T>) {
  const operation = writeQueue.then(async () => {
    const store = await readStore();
    const result = await updater(store);
    await writeStore(store);
    return result;
  });

  writeQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

function cleanUsername(username: string) {
  return username.trim().replace(/\s+/g, " ").slice(0, 32);
}

function usernameKey(username: string) {
  return normalizeAnswer(cleanUsername(username));
}

function now() {
  return new Date().toISOString();
}

function defaultGameMeta(): StoredGameMeta {
  return {
    status: "open",
    winners: [],
    updatedAt: now(),
  };
}

function normalizeMeta(meta?: Partial<StoredGameMeta>): StoredGameMeta {
  return {
    status: meta?.status === "closed" ? "closed" : "open",
    closedAt: meta?.closedAt,
    winners: Array.isArray(meta?.winners) ? meta.winners : [],
    updatedAt: meta?.updatedAt ?? now(),
  };
}

function ensureMeta(store: StoredGame) {
  store.meta = normalizeMeta(store.meta);
  return store.meta;
}

function resetMeta(store: StoredGame) {
  store.meta = defaultGameMeta();
  return store.meta;
}

function cloneAnswers(answers: Record<string, StoredAnswer>) {
  return Object.fromEntries(
    Object.entries(answers).map(([questionId, answer]) => [questionId, { ...answer }]),
  ) as Record<string, StoredAnswer>;
}

function answeredCount(player: StoredPlayer) {
  return Object.values(player.answers).filter((answer) => answer.status !== "unanswered").length;
}

function choosePrimaryPlayer(players: StoredPlayer[]) {
  return players.reduce((best, candidate) => {
    const bestScore = calculateScore(best.answers);
    const candidateScore = calculateScore(candidate.answers);

    if (candidateScore !== bestScore) {
      return candidateScore > bestScore ? candidate : best;
    }

    if (answeredCount(candidate) !== answeredCount(best)) {
      return answeredCount(candidate) > answeredCount(best) ? candidate : best;
    }

    return candidate.createdAt < best.createdAt ? candidate : best;
  });
}

function chooseStoredAnswer(current: StoredAnswer | undefined, incoming: StoredAnswer) {
  if (!current) {
    return { ...incoming };
  }

  if (current.status === "correct" || incoming.status === "correct") {
    if (current.status !== "correct") {
      return { ...incoming };
    }

    if (incoming.status !== "correct") {
      return { ...current };
    }

    if (current.hintUsed !== incoming.hintUsed) {
      return current.hintUsed ? { ...incoming } : { ...current };
    }
  }

  if (current.hintUsed !== incoming.hintUsed) {
    return {
      ...(incoming.checkedAt && incoming.checkedAt > (current.checkedAt ?? "") ? incoming : current),
      hintUsed: true,
      hintRevealedAt: current.hintRevealedAt ?? incoming.hintRevealedAt,
    };
  }

  const currentDate = current.checkedAt ?? current.hintRevealedAt ?? "";
  const incomingDate = incoming.checkedAt ?? incoming.hintRevealedAt ?? "";

  return incomingDate > currentDate ? { ...incoming } : { ...current };
}

function mergePlayerAnswers(players: StoredPlayer[]) {
  return players.reduce<Record<string, StoredAnswer>>((answers, player) => {
    for (const [questionId, answer] of Object.entries(player.answers)) {
      answers[questionId] = chooseStoredAnswer(answers[questionId], answer);
    }

    return answers;
  }, {});
}

function playersWithSameName(store: StoredGame, username: string) {
  const key = usernameKey(username);
  return Object.values(store.players).filter((player) => usernameKey(player.username) === key);
}

function syncPlayersWithSameName(store: StoredGame, username: string) {
  const matchingPlayers = playersWithSameName(store, username);

  if (matchingPlayers.length === 0) {
    return null;
  }

  const primaryPlayer = choosePrimaryPlayer(matchingPlayers);

  if (matchingPlayers.length === 1) {
    return primaryPlayer;
  }

  const mergedAnswers = mergePlayerAnswers(matchingPlayers);
  const updatedAt = now();

  for (const player of matchingPlayers) {
    player.answers = cloneAnswers(mergedAnswers);
    player.updatedAt = updatedAt;
  }

  return primaryPlayer;
}

function makeSnapshot(player: StoredPlayer, meta: StoredGameMeta): GameSnapshot {
  const fullQuestions = getQuestions();
  const publicQuestions = getPublicQuestions();
  const questions: QuestionView[] = publicQuestions.map((question) => {
    const storedAnswer = player.answers[String(question.id)];
    const fullQuestion = fullQuestions.find((item) => item.id === question.id);

    return {
      ...question,
      status: storedAnswer?.status ?? "unanswered",
      hintUsed: storedAnswer?.hintUsed ?? false,
      hint: storedAnswer?.hintUsed ? fullQuestion?.hint : undefined,
      savedAnswer: storedAnswer?.value ?? "",
    };
  });

  const score = calculateScore(player.answers);
  const lotteryTickets = calculateLotteryTickets(score);

  return {
    player: {
      id: player.id,
      username: player.username,
    },
    questions,
    score,
    lotteryTickets,
    progressPercent: Math.min(100, Math.round((score / 18) * 100)),
    correctCount: questions.filter((question) => question.status === "correct").length,
    totalQuestions: questions.length,
    gameStatus: {
      status: meta.status,
      closedAt: meta.closedAt,
    },
  };
}

function makeAdminPlayerView(player: StoredPlayer): AdminPlayerView {
  const answers = Object.values(player.answers);
  const score = calculateScore(player.answers);
  const correctCount = answers.filter((answer) => answer.status === "correct").length;
  const hintCount = answers.filter((answer) => answer.hintUsed).length;
  const totalQuestions = getQuestions().length;

  return {
    id: player.id,
    username: player.username,
    score,
    lotteryTickets: calculateLotteryTickets(score),
    progressPercent: Math.min(100, Math.round((score / 18) * 100)),
    answeredCount: answers.filter((answer) => answer.status !== "unanswered").length,
    correctCount,
    incorrectCount: answers.filter((answer) => answer.status === "incorrect").length,
    hintCount,
    totalQuestions,
    createdAt: player.createdAt,
    updatedAt: player.updatedAt,
  };
}

function sortAdminPlayers(players: AdminPlayerView[]) {
  return players.sort((first, second) => {
    if (second.score !== first.score) {
      return second.score - first.score;
    }

    if (second.correctCount !== first.correctCount) {
      return second.correctCount - first.correctCount;
    }

    const updatedDifference = Date.parse(second.updatedAt) - Date.parse(first.updatedAt);

    if (updatedDifference !== 0) {
      return updatedDifference;
    }

    return first.username.localeCompare(second.username, "pl");
  });
}

function uniquePlayersByName(players: StoredPlayer[]) {
  const groups = new Map<string, StoredPlayer[]>();

  for (const player of players) {
    const key = usernameKey(player.username);
    groups.set(key, [...(groups.get(key) ?? []), player]);
  }

  return Array.from(groups.values()).map(choosePrimaryPlayer);
}

function resetPlayerProgress(player: StoredPlayer) {
  player.answers = {};
  player.updatedAt = now();
  return player;
}

function ensureGameIsOpen(meta: StoredGameMeta) {
  if (meta.status === "closed") {
    throw new Error("Gra jest zakończona. Odpowiedzi nie są już przyjmowane.");
  }
}

function removePlayerFromWinners(meta: StoredGameMeta, playerId: string) {
  meta.winners = meta.winners
    .filter((winner) => winner.playerId !== playerId)
    .map((winner, index) => ({
      ...winner,
      place: index + 1,
    }));
  meta.updatedAt = now();
}

function makeAdminGameState(meta: StoredGameMeta, players: AdminPlayerView[]): AdminGameState {
  const winnerIds = new Set(meta.winners.map((winner) => winner.playerId));
  const eligiblePlayers = players.filter(
    (player) => player.lotteryTickets > 0 && !winnerIds.has(player.id),
  );

  return {
    status: meta.status,
    closedAt: meta.closedAt,
    winners: meta.winners,
    maxWinners,
    totalTickets: players.reduce((sum, player) => sum + player.lotteryTickets, 0),
    remainingTickets: eligiblePlayers.reduce((sum, player) => sum + player.lotteryTickets, 0),
    eligiblePlayerCount: eligiblePlayers.length,
    canDraw:
      meta.status === "closed" &&
      meta.winners.length < maxWinners &&
      eligiblePlayers.length > 0,
  };
}

function makeAdminDashboard(meta: StoredGameMeta, players: StoredPlayer[]): AdminDashboard {
  const adminPlayers = sortAdminPlayers(uniquePlayersByName(players).map(makeAdminPlayerView));

  return {
    players: adminPlayers,
    gameState: makeAdminGameState(meta, adminPlayers),
  };
}

function closeMeta(meta: StoredGameMeta) {
  if (meta.status === "closed") {
    return meta;
  }

  const closedAt = now();
  meta.status = "closed";
  meta.closedAt = closedAt;
  meta.updatedAt = closedAt;
  return meta;
}

function chooseNextWinner(meta: StoredGameMeta, players: AdminPlayerView[]) {
  if (meta.status !== "closed") {
    throw new Error("Najpierw zamknij grę.");
  }

  if (meta.winners.length >= maxWinners) {
    throw new Error("Wylosowano już wszystkich zwycięzców.");
  }

  const winnerIds = new Set(meta.winners.map((winner) => winner.playerId));
  const eligiblePlayers = players.filter(
    (player) => player.lotteryTickets > 0 && !winnerIds.has(player.id),
  );
  const totalTickets = eligiblePlayers.reduce((sum, player) => sum + player.lotteryTickets, 0);

  if (totalTickets === 0) {
    throw new Error("Nie ma już graczy z losami.");
  }

  let winningTicket = randomInt(1, totalTickets + 1);
  const selectedPlayer =
    eligiblePlayers.find((player) => {
      winningTicket -= player.lotteryTickets;
      return winningTicket <= 0;
    }) ?? eligiblePlayers[eligiblePlayers.length - 1];

  const winner: DrawWinnerView = {
    place: meta.winners.length + 1,
    playerId: selectedPlayer.id,
    username: selectedPlayer.username,
    score: selectedPlayer.score,
    lotteryTickets: selectedPlayer.lotteryTickets,
    drawnAt: now(),
  };

  meta.winners = [...meta.winners, winner];
  meta.updatedAt = winner.drawnAt;

  return winner;
}

function applySubmittedAnswer(player: StoredPlayer, questionId: number, answer: string) {
  const question = getQuestionById(questionId);

  if (!question) {
    throw new Error("Nie znaleziono pytania.");
  }

  const key = String(questionId);
  const existingAnswer = player.answers[key];

  if (existingAnswer?.status === "correct") {
    return;
  }

  const normalizedUserAnswer = normalizeAnswer(answer);
  const normalizedCorrectAnswer = normalizeAnswer(question.answer);
  const status: QuestionStatus =
    normalizedUserAnswer.length > 0 && normalizedUserAnswer === normalizedCorrectAnswer
      ? "correct"
      : "incorrect";

  player.answers[key] = {
    value: answer.trim().replace(/\s+/g, " ").slice(0, 160),
    status,
    hintUsed: existingAnswer?.hintUsed ?? false,
    hintRevealedAt: existingAnswer?.hintRevealedAt,
    checkedAt: now(),
  };
  player.updatedAt = now();
}

function applyHintUsage(player: StoredPlayer, questionId: number) {
  const question = getQuestionById(questionId);

  if (!question) {
    throw new Error("Nie znaleziono pytania.");
  }

  const key = String(questionId);
  const existingAnswer = player.answers[key];

  if (existingAnswer?.status === "correct") {
    return;
  }

  player.answers[key] = {
    value: existingAnswer?.value ?? "",
    status: existingAnswer?.status ?? "unanswered",
    hintUsed: true,
    checkedAt: existingAnswer?.checkedAt,
    hintRevealedAt: existingAnswer?.hintRevealedAt ?? now(),
  };
  player.updatedAt = now();
}

async function redisFindOrCreatePlayer(username: string) {
  const cleanedUsername = cleanUsername(username);

  if (cleanedUsername.length < 2) {
    throw new Error("Podaj imię składające się z co najmniej 2 znaków.");
  }

  const id = usernameKey(cleanedUsername);
  const existingPlayer = await redisGetPlayer(id);

  if (existingPlayer) {
    return existingPlayer;
  }

  const createdAt = now();
  const player: StoredPlayer = {
    id,
    username: cleanedUsername,
    createdAt,
    updatedAt: createdAt,
    answers: {},
  };

  await redisSavePlayer(player);
  return player;
}

async function redisSubmitAnswer(playerId: string, questionId: number, answer: string) {
  const [player, meta] = await Promise.all([redisGetPlayer(playerId), redisGetMeta()]);

  if (!player) {
    throw new Error("Sesja wygasła. Wejdź do gry ponownie.");
  }

  ensureGameIsOpen(meta);
  applySubmittedAnswer(player, questionId, answer);
  await redisSavePlayer(player);
  return makeSnapshot(player, meta);
}

async function redisRevealHint(playerId: string, questionId: number) {
  const [player, meta] = await Promise.all([redisGetPlayer(playerId), redisGetMeta()]);

  if (!player) {
    throw new Error("Sesja wygasła. Wejdź do gry ponownie.");
  }

  ensureGameIsOpen(meta);
  applyHintUsage(player, questionId);
  await redisSavePlayer(player);
  return makeSnapshot(player, meta);
}

async function redisListAdminPlayers() {
  const players = await redisGetAllPlayers();
  return sortAdminPlayers(uniquePlayersByName(players).map(makeAdminPlayerView));
}

async function redisGetAdminDashboard() {
  const [players, meta] = await Promise.all([redisGetAllPlayers(), redisGetMeta()]);
  return makeAdminDashboard(meta, players);
}

async function redisClearPlayerState(playerId: string) {
  const player = await redisGetPlayer(playerId);

  if (!player) {
    throw new Error("Nie znaleziono gracza.");
  }

  resetPlayerProgress(player);
  await redisSavePlayer(player);
}

async function redisClearAllPlayerStates() {
  const players = await redisGetAllPlayers();
  const meta = defaultGameMeta();

  await Promise.all(
    [
      ...players.map(async (player) => {
        resetPlayerProgress(player);
        await redisSavePlayer(player);
      }),
      redisSaveMeta(meta),
    ],
  );
}

async function redisDeletePlayerState(playerId: string) {
  const [player, meta] = await Promise.all([redisGetPlayer(playerId), redisGetMeta()]);

  if (!player) {
    throw new Error("Nie znaleziono gracza.");
  }

  removePlayerFromWinners(meta, playerId);

  await Promise.all([redisDeletePlayer(playerId), redisSaveMeta(meta)]);
}

async function redisCloseGame() {
  const meta = await redisGetMeta();
  closeMeta(meta);
  await redisSaveMeta(meta);
  return meta;
}

async function redisDrawNextWinner() {
  const [players, meta] = await Promise.all([redisGetAllPlayers(), redisGetMeta()]);
  const adminPlayers = sortAdminPlayers(uniquePlayersByName(players).map(makeAdminPlayerView));
  const winner = chooseNextWinner(meta, adminPlayers);

  await redisSaveMeta(meta);
  return winner;
}

export async function findOrCreatePlayer(username: string) {
  if (getRedisConfig()) {
    return redisFindOrCreatePlayer(username);
  }

  const cleanedUsername = cleanUsername(username);

  if (cleanedUsername.length < 2) {
    throw new Error("Podaj imię składające się z co najmniej 2 znaków.");
  }

  return updateStore((store) => {
    const existingPlayer = syncPlayersWithSameName(store, cleanedUsername);

    if (existingPlayer) {
      return existingPlayer;
    }

    const id = randomUUID();
    const createdAt = now();

    store.players[id] = {
      id,
      username: cleanedUsername,
      createdAt,
      updatedAt: createdAt,
      answers: {},
    };

    return store.players[id];
  });
}

export async function getGameSnapshot(playerId: string) {
  if (getRedisConfig()) {
    const [player, meta] = await Promise.all([redisGetPlayer(playerId), redisGetMeta()]);
    return player ? makeSnapshot(player, meta) : null;
  }

  return updateStore((store) => {
    const meta = ensureMeta(store);
    const sessionPlayer = store.players[playerId];

    if (!sessionPlayer) {
      return null;
    }

    const player = syncPlayersWithSameName(store, sessionPlayer.username) ?? sessionPlayer;
    return makeSnapshot(player, meta);
  });
}

export async function submitAnswer(playerId: string, questionId: number, answer: string) {
  if (getRedisConfig()) {
    return redisSubmitAnswer(playerId, questionId, answer);
  }

  return updateStore((store) => {
    const meta = ensureMeta(store);
    const sessionPlayer = store.players[playerId];

    if (!sessionPlayer) {
      throw new Error("Sesja wygasła. Wejdź do gry ponownie.");
    }

    ensureGameIsOpen(meta);
    const player = syncPlayersWithSameName(store, sessionPlayer.username) ?? sessionPlayer;

    applySubmittedAnswer(player, questionId, answer);

    const syncedPlayer = syncPlayersWithSameName(store, player.username) ?? player;
    return makeSnapshot(syncedPlayer, meta);
  });
}

export async function revealHint(playerId: string, questionId: number) {
  if (getRedisConfig()) {
    return redisRevealHint(playerId, questionId);
  }

  return updateStore((store) => {
    const meta = ensureMeta(store);
    const sessionPlayer = store.players[playerId];

    if (!sessionPlayer) {
      throw new Error("Sesja wygasła. Wejdź do gry ponownie.");
    }

    ensureGameIsOpen(meta);
    const player = syncPlayersWithSameName(store, sessionPlayer.username) ?? sessionPlayer;

    applyHintUsage(player, questionId);

    const syncedPlayer = syncPlayersWithSameName(store, player.username) ?? player;
    return makeSnapshot(syncedPlayer, meta);
  });
}

export async function listAdminPlayers() {
  if (getRedisConfig()) {
    return redisListAdminPlayers();
  }

  return updateStore((store) => {
    for (const player of Object.values(store.players)) {
      syncPlayersWithSameName(store, player.username);
    }

    return sortAdminPlayers(uniquePlayersByName(Object.values(store.players)).map(makeAdminPlayerView));
  });
}

export async function getAdminDashboard() {
  if (getRedisConfig()) {
    return redisGetAdminDashboard();
  }

  return updateStore((store) => {
    const meta = ensureMeta(store);

    for (const player of Object.values(store.players)) {
      syncPlayersWithSameName(store, player.username);
    }

    return makeAdminDashboard(meta, Object.values(store.players));
  });
}

export async function clearPlayerState(playerId: string) {
  if (getRedisConfig()) {
    return redisClearPlayerState(playerId);
  }

  return updateStore((store) => {
    const player = store.players[playerId];

    if (!player) {
      throw new Error("Nie znaleziono gracza.");
    }

    for (const matchingPlayer of playersWithSameName(store, player.username)) {
      resetPlayerProgress(matchingPlayer);
    }
  });
}

export async function clearAllPlayerStates() {
  if (getRedisConfig()) {
    return redisClearAllPlayerStates();
  }

  return updateStore((store) => {
    for (const player of Object.values(store.players)) {
      resetPlayerProgress(player);
    }

    resetMeta(store);
  });
}

export async function deletePlayerState(playerId: string) {
  if (getRedisConfig()) {
    return redisDeletePlayerState(playerId);
  }

  return updateStore((store) => {
    const meta = ensureMeta(store);
    const player = store.players[playerId];

    if (!player) {
      throw new Error("Nie znaleziono gracza.");
    }

    for (const matchingPlayer of playersWithSameName(store, player.username)) {
      delete store.players[matchingPlayer.id];
      removePlayerFromWinners(meta, matchingPlayer.id);
    }
  });
}

export async function closeGame() {
  if (getRedisConfig()) {
    return redisCloseGame();
  }

  return updateStore((store) => {
    const meta = ensureMeta(store);
    return closeMeta(meta);
  });
}

export async function drawNextWinner() {
  if (getRedisConfig()) {
    return redisDrawNextWinner();
  }

  return updateStore((store) => {
    const meta = ensureMeta(store);

    for (const player of Object.values(store.players)) {
      syncPlayersWithSameName(store, player.username);
    }

    const players = sortAdminPlayers(
      uniquePlayersByName(Object.values(store.players)).map(makeAdminPlayerView),
    );

    return chooseNextWinner(meta, players);
  });
}
