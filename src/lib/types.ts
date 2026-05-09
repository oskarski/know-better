export type Difficulty = "easy" | "medium" | "hard";

export type Question = {
  id: number;
  difficulty: Difficulty;
  question: string;
  answer: string;
  hint: string;
};

export type PublicQuestion = Omit<Question, "answer" | "hint">;

export type QuestionStatus = "unanswered" | "incorrect" | "correct";

export type QuestionView = PublicQuestion & {
  status: QuestionStatus;
  hintUsed: boolean;
  hint?: string;
  savedAnswer: string;
};

export type GameStatus = "open" | "closed";

export type GameStatusView = {
  status: GameStatus;
  closedAt?: string;
};

export type PlayerView = {
  id: string;
  username: string;
};

export type GameSnapshot = {
  player: PlayerView;
  questions: QuestionView[];
  score: number;
  lotteryTickets: number;
  progressPercent: number;
  correctCount: number;
  totalQuestions: number;
  gameStatus: GameStatusView;
};

export type AdminPlayerView = {
  id: string;
  username: string;
  score: number;
  lotteryTickets: number;
  progressPercent: number;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  hintCount: number;
  totalQuestions: number;
  createdAt: string;
  updatedAt: string;
};

export type DrawWinnerView = {
  place: number;
  playerId: string;
  username: string;
  score: number;
  lotteryTickets: number;
  drawnAt: string;
};

export type LotteryPoolEntryView = {
  playerId: string;
  username: string;
  score: number;
  lotteryTickets: number;
};

export type AdminGameState = GameStatusView & {
  winners: DrawWinnerView[];
  lotteryPool: LotteryPoolEntryView[];
  maxWinners: number;
  totalTickets: number;
  remainingTickets: number;
  eligiblePlayerCount: number;
  canDraw: boolean;
};

export type AdminDashboard = {
  players: AdminPlayerView[];
  gameState: AdminGameState;
};

export type GameActionResult =
  | {
      ok: true;
      message: string;
      snapshot: GameSnapshot;
    }
  | {
      ok: false;
      message: string;
    };
