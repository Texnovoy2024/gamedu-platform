export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  password: string;
  role: UserRole;
  createdAt: string;
  avatar?: string; // emoji avatar
  title?: string;  // unvon
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type TaskType = 
  | 'simple' 
  | 'question' 
  | 'multiple-choice' 
  | 'fill-blank' 
  | 'true-false' 
  | 'project'
  | 'spin-wheel'    // Omad g'ildiragi
  | 'mystery-box'   // Sirli quti
  | 'anagram';      // Anagram

// Savollar uchun umumiy base
export interface QuestionBase {
  questionText: string;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multiple-choice';
  options: string[];
}

export interface FillBlankQuestion extends QuestionBase {
  type: 'fill-blank';
  blanks: string[];
}

export interface TrueFalseQuestion extends QuestionBase {
  type: 'true-false';
  correctAnswer: boolean;
}

export interface SimpleQuestion extends QuestionBase {
  type: 'simple' | 'question';
  correctAnswer?: string;
}

export type AnyQuestion = 
  | MultipleChoiceQuestion 
  | FillBlankQuestion 
  | TrueFalseQuestion 
  | SimpleQuestion;

export interface Task {
  id: string;
  title: string;
  description: string;
  xp: number;
  difficulty: Difficulty;
  createdById: string;
  isPublished: boolean;
  createdAt: string;

  type: TaskType;
  deadline?: string | null;
  bonusXp?: number;
  timeLimit?: number;

  questions?: AnyQuestion[];

  // Eski kod bilan moslik
  questionText?: string;
  options?: string[];
  correctAnswer?: string;

  // Omad g'ildiragi — teacher savollar yozadi, student g'ildirakni aylantiradi
  // questions[] (multiple-choice) dan foydalanadi

  // Sirli quti — teacher variantlar yozadi, biri to'g'ri
  // questions[] (multiple-choice) dan foydalanadi, har savol = bitta quti

  // Anagram — teacher so'zlar yozadi, student harflarni tartibga soladi
  anagramWords?: string[];  // ["TOSHKENT", "SAMARQAND", ...]
}

// Progress
export interface StudentTaskProgress {
  id: string;
  studentId: string;
  taskId: string;
  status: 'pending' | 'completed';
  earnedXp: number;
  completedAt?: string;
}

// Stats
export interface StudentStats {
  studentId: string;
  totalXp: number;
  level: number;
  completedTasks: number;
}

// Streak tizimi
export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  activeDates: string[];
}

// Coin tizimi
export interface CoinData {
  userId: string;
  coins: number;
  totalEarned: number;
}

// Kunlik vazifalar
export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetCount: number;
  currentCount: number;
  rewardXp: number;
  rewardCoins: number;
  completed: boolean;
  type: 'complete_tasks' | 'earn_xp' | 'perfect_score' | 'login';
}

// Achievement kategoriyalari
export type AchievementCategory = 'boshlangich' | 'faollik' | 'mahorat' | 'streak' | 'maxsus';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'oddiy' | 'noyob' | 'epik' | 'afsonaviy';
}

// O'yin rejimi natijasi
export interface GameResult {
  totalQuestions: number;
  correctAnswers: number;
  earnedXp: number;
  earnedCoins: number;
  timeTaken: number;
  speedBonus: number;
  perfectScore: boolean;
  streakBonus: number;
}
