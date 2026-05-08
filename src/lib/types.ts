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
