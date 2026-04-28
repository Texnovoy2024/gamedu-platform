import type { Task, User, StudentTaskProgress, StudentStats, Difficulty, UserRole, StreakData, CoinData, DailyQuest } from './types'

const STORAGE_KEYS = {
  users: 'gamedu_users',
  tasks: 'gamedu_tasks',
  progress: 'gamedu_progress',
  currentUserId: 'gamedu_current_user_id',
  streaks: 'gamedu_streaks',
  coins: 'gamedu_coins',
  dailyQuests: 'gamedu_daily_quests',
  dailyQuestsDate: 'gamedu_daily_quests_date',
} as const

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(key)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as T[]
    return []
  } catch {
    return []
  }
}

function write<T>(key: string, value: T[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export function getUsers(): User[] {
  return read<User>(STORAGE_KEYS.users)
}

export function saveUsers(users: User[]) {
  write<User>(STORAGE_KEYS.users, users)
}

export function upsertUser(user: User) {
  const trimmedUser = {
    ...user,
    id: user.id.trim(),
    password: user.password.trim(),
    name: user.name.trim(),
  }
  const users = getUsers()
  const index = users.findIndex((u) => u.id === trimmedUser.id)
  if (index >= 0) {
    users[index] = trimmedUser
  } else {
    users.push(trimmedUser)
  }
  saveUsers(users)
}

export function deleteUser(id: string) {
  const filtered = getUsers().filter((u) => u.id !== id)
  saveUsers(filtered)
}

export function findUserByCredentials(id: string, password: string): User | undefined {
  const trimmedId = id.trim()
  const trimmedPassword = password.trim()
  return getUsers().find((u) => u.id === trimmedId && u.password === trimmedPassword)
}

// ─── TASKS ───────────────────────────────────────────────────────────────────

export function getTasks(): Task[] {
  return read<Task>(STORAGE_KEYS.tasks)
}

export function saveTasks(tasks: Task[]) {
  write<Task>(STORAGE_KEYS.tasks, tasks)
}

export function upsertTask(task: Task) {
  const tasks = getTasks()
  const index = tasks.findIndex((t) => t.id === task.id)
  if (index >= 0) {
    tasks[index] = task
  } else {
    tasks.push(task)
  }
  saveTasks(tasks)
}

export function deleteTask(id: string) {
  const filtered = getTasks().filter((t) => t.id !== id)
  saveTasks(filtered)
}

// ─── PROGRESS ────────────────────────────────────────────────────────────────

export function getProgress(): StudentTaskProgress[] {
  return read<StudentTaskProgress>(STORAGE_KEYS.progress)
}

export function saveProgress(progress: StudentTaskProgress[]) {
  write<StudentTaskProgress>(STORAGE_KEYS.progress, progress)
}

export function upsertProgress(record: StudentTaskProgress) {
  const all = getProgress()
  const existingIndex = all.findIndex(
    p => p.studentId === record.studentId && p.taskId === record.taskId
  )
  if (existingIndex >= 0) {
    if (all[existingIndex].status === 'completed') {
      console.warn('Bu topshiriq allaqachon bajarilgan, qayta saqlanmadi')
      return
    }
    all[existingIndex] = record
  } else {
    all.push(record)
  }
  saveProgress(all)
}

// ─── CURRENT USER ────────────────────────────────────────────────────────────

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEYS.currentUserId)
}

export function setCurrentUserId(id: string | null) {
  if (typeof window === 'undefined') return
  if (!id) {
    window.localStorage.removeItem(STORAGE_KEYS.currentUserId)
  } else {
    window.localStorage.setItem(STORAGE_KEYS.currentUserId, id)
  }
}

// ─── STATS & LEVELS ──────────────────────────────────────────────────────────

export function calculateStudentStats(studentId: string): StudentStats {
  const progress = getProgress().filter((p) => p.studentId === studentId && p.status === 'completed')
  const totalXp = progress.reduce((sum, p) => sum + p.earnedXp, 0)
  const completedTasks = progress.length
  const level = calculateLevel(totalXp)
  return { studentId, totalXp, level, completedTasks }
}

export function calculateLevel(xp: number): number {
  if (xp <= 0) return 1
  return Math.floor(Math.sqrt(xp / 120)) + 1
}

export function xpForLevel(level: number): number {
  return (level + 1) ** 2 * 120
}

export function getDifficultyBonus(difficulty: Difficulty): number {
  if (difficulty === 'beginner') return 1
  if (difficulty === 'intermediate') return 1.3
  return 1.7
}

export function awardXpForTask(
  studentId: string,
  task: Task,
  correctCount?: number,
  totalCount?: number
): { newStats: StudentStats; earnedXp: number; earnedCoins: number; leveledUp: boolean; oldLevel: number } | null {
  const existing = getProgress().find(
    p => p.studentId === studentId && p.taskId === task.id && p.status === 'completed'
  )
  if (existing) {
    console.warn('Bu topshiriq allaqachon bajarilgan')
    return null
  }

  const oldStats = calculateStudentStats(studentId)
  const oldLevel = oldStats.level

  // XP hisoblash
  let earnedXp = task.xp
  if (correctCount !== undefined && totalCount !== undefined && totalCount > 0) {
    earnedXp = Math.round((correctCount / totalCount) * task.xp)
    if (correctCount === totalCount && task.bonusXp) {
      earnedXp += task.bonusXp
    }
  } else {
    earnedXp = task.xp + (task.bonusXp || 0)
  }

  // Coin hisoblash (XP ning 10%)
  const earnedCoins = Math.max(1, Math.floor(earnedXp / 10))

  const record: StudentTaskProgress = {
    id: `${studentId}_${task.id}`,
    studentId,
    taskId: task.id,
    status: 'completed',
    earnedXp,
    completedAt: new Date().toISOString(),
  }

  upsertProgress(record)

  // Coin qo'shish
  addCoins(studentId, earnedCoins)

  // Streak yangilash
  updateStreak(studentId)

  // Daily quest yangilash
  updateDailyQuestProgress(studentId, 'complete_tasks', 1)
  updateDailyQuestProgress(studentId, 'earn_xp', earnedXp)
  if (correctCount !== undefined && totalCount !== undefined && correctCount === totalCount) {
    updateDailyQuestProgress(studentId, 'perfect_score', 1)
  }

  const newStats = calculateStudentStats(studentId)
  const leveledUp = newStats.level > oldLevel

  return { newStats, earnedXp, earnedCoins, leveledUp, oldLevel }
}

export function getRanking(): StudentStats[] {
  const users = getUsers().filter((u) => u.role === 'student')
  const rankings: StudentStats[] = users.map((u) => calculateStudentStats(u.id))
  rankings.sort((a, b) => b.totalXp - a.totalXp)
  return rankings
}

// ─── STREAK ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export function getStreak(userId: string): StreakData {
  const all = read<StreakData>(STORAGE_KEYS.streaks)
  return all.find(s => s.userId === userId) ?? {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    activeDates: [],
  }
}

export function updateStreak(userId: string): StreakData {
  const all = read<StreakData>(STORAGE_KEYS.streaks)
  const today = todayStr()
  const yesterday = yesterdayStr()

  let streak = all.find(s => s.userId === userId) ?? {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    activeDates: [],
  }

  if (streak.lastActiveDate === today) {
    // Bugun allaqachon faol — hech narsa o'zgarmaydi
    return streak
  }

  const activeDates = [...new Set([...streak.activeDates, today])]

  if (streak.lastActiveDate === yesterday) {
    // Ketma-ket kun
    streak = {
      ...streak,
      currentStreak: streak.currentStreak + 1,
      lastActiveDate: today,
      activeDates,
    }
  } else {
    // Uzilish yoki birinchi marta
    streak = {
      ...streak,
      currentStreak: 1,
      lastActiveDate: today,
      activeDates,
    }
  }

  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak)

  const updated = all.filter(s => s.userId !== userId)
  updated.push(streak)
  write<StreakData>(STORAGE_KEYS.streaks, updated)

  // Streak bonus XP
  if (streak.currentStreak >= 3) {
    const bonusXp = streak.currentStreak >= 7 ? 50 : streak.currentStreak >= 5 ? 30 : 15
    const progress = getProgress()
    const bonusRecord: StudentTaskProgress = {
      id: `streak_bonus_${userId}_${today}`,
      studentId: userId,
      taskId: `streak_${today}`,
      status: 'completed',
      earnedXp: bonusXp,
      completedAt: new Date().toISOString(),
    }
    const alreadyExists = progress.some(p => p.id === bonusRecord.id)
    if (!alreadyExists) {
      progress.push(bonusRecord)
      saveProgress(progress)
    }
  }

  return streak
}

// ─── COINS ───────────────────────────────────────────────────────────────────

export function getCoinData(userId: string): CoinData {
  const all = read<CoinData>(STORAGE_KEYS.coins)
  return all.find(c => c.userId === userId) ?? { userId, coins: 0, totalEarned: 0 }
}

export function addCoins(userId: string, amount: number) {
  const all = read<CoinData>(STORAGE_KEYS.coins)
  const existing = all.find(c => c.userId === userId)
  if (existing) {
    existing.coins += amount
    existing.totalEarned += amount
  } else {
    all.push({ userId, coins: amount, totalEarned: amount })
  }
  write<CoinData>(STORAGE_KEYS.coins, all)
}

export function spendCoins(userId: string, amount: number): boolean {
  const all = read<CoinData>(STORAGE_KEYS.coins)
  const existing = all.find(c => c.userId === userId)
  if (!existing || existing.coins < amount) return false
  existing.coins -= amount
  write<CoinData>(STORAGE_KEYS.coins, all)
  return true
}

// ─── DAILY QUESTS ────────────────────────────────────────────────────────────

const QUEST_TEMPLATES: Omit<DailyQuest, 'currentCount' | 'completed'>[] = [
  {
    id: 'dq_tasks',
    title: "3 ta topshiriq bajaring",
    description: "Bugun kamida 3 ta topshiriqni muvaffaqiyatli yakunlang",
    icon: '📝',
    targetCount: 3,
    rewardXp: 100,
    rewardCoins: 20,
    type: 'complete_tasks',
  },
  {
    id: 'dq_xp',
    title: "200 XP to'plang",
    description: "Bugun topshiriqlardan 200 XP yig'ing",
    icon: '⚡',
    targetCount: 200,
    rewardXp: 50,
    rewardCoins: 15,
    type: 'earn_xp',
  },
  {
    id: 'dq_perfect',
    title: "Mukammal natija",
    description: "Bitta topshiriqda barcha savollarni to'g'ri javoblang",
    icon: '🎯',
    targetCount: 1,
    rewardXp: 150,
    rewardCoins: 30,
    type: 'perfect_score',
  },
  {
    id: 'dq_login',
    title: "Platformaga kiring",
    description: "Bugun GamEdu ga kiring",
    icon: '🌟',
    targetCount: 1,
    rewardXp: 25,
    rewardCoins: 5,
    type: 'login',
  },
]

export function getDailyQuests(userId: string): DailyQuest[] {
  const today = todayStr()
  const savedDate = localStorage.getItem(STORAGE_KEYS.dailyQuestsDate + '_' + userId)
  const savedQuests = read<DailyQuest>(STORAGE_KEYS.dailyQuests + '_' + userId)

  if (savedDate === today && savedQuests.length > 0) {
    return savedQuests
  }

  // Yangi kun — questlarni reset qilish
  const newQuests: DailyQuest[] = QUEST_TEMPLATES.map(t => ({
    ...t,
    currentCount: t.type === 'login' ? 1 : 0,
    completed: t.type === 'login',
  }))

  write<DailyQuest>(STORAGE_KEYS.dailyQuests + '_' + userId, newQuests)
  localStorage.setItem(STORAGE_KEYS.dailyQuestsDate + '_' + userId, today)

  // Login uchun XP va coin
  const loginQuest = newQuests.find(q => q.type === 'login')
  if (loginQuest) {
    addCoins(userId, loginQuest.rewardCoins)
  }

  return newQuests
}

export function updateDailyQuestProgress(userId: string, type: DailyQuest['type'], amount: number) {
  const quests = getDailyQuests(userId)
  let changed = false

  const updated = quests.map(q => {
    if (q.type !== type || q.completed) return q
    const newCount = Math.min(q.currentCount + amount, q.targetCount)
    const nowCompleted = newCount >= q.targetCount
    if (nowCompleted && !q.completed) {
      // Mukofot berish
      addCoins(userId, q.rewardCoins)
      // XP bonus
      const progress = getProgress()
      const bonusRecord: StudentTaskProgress = {
        id: `quest_${q.id}_${userId}_${todayStr()}`,
        studentId: userId,
        taskId: `quest_${q.id}_${todayStr()}`,
        status: 'completed',
        earnedXp: q.rewardXp,
        completedAt: new Date().toISOString(),
      }
      const alreadyExists = progress.some(p => p.id === bonusRecord.id)
      if (!alreadyExists) {
        progress.push(bonusRecord)
        saveProgress(progress)
      }
      changed = true
    }
    return { ...q, currentCount: newCount, completed: nowCompleted }
  })

  if (changed || updated.some((q, i) => q.currentCount !== quests[i].currentCount)) {
    write<DailyQuest>(STORAGE_KEYS.dailyQuests + '_' + userId, updated)
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`
}

export function roleFromString(role: string): UserRole | null {
  if (role === 'teacher' || role === 'student') return role
  return null
}

// Unvon tizimi
export function getTitleForLevel(level: number): string {
  if (level >= 30) return 'Afsonaviy'
  if (level >= 20) return 'Grandmaster'
  if (level >= 15) return 'Ustoz'
  if (level >= 10) return 'Ekspert'
  if (level >= 7) return 'Ilg\'or'
  if (level >= 5) return 'Tajribali'
  if (level >= 3) return 'O\'rganuvchi'
  return 'Yangi o\'quvchi'
}

export function getAvatarForLevel(level: number): string {
  // Returns an icon key for use with AVATAR_ICONS in ProfilePage
  if (level >= 30) return 'crown'
  if (level >= 20) return 'rocket'
  if (level >= 15) return 'zap'
  if (level >= 10) return 'trophy'
  if (level >= 7)  return 'gem'
  if (level >= 5)  return 'flame'
  if (level >= 3)  return 'target'
  return 'leaf'
}

// ─── KUNLIK AVTOMATIK TOPSHIRIQLAR ───────────────────────────────────────────

import { QUESTION_BANK, SUBJECTS, type Subject } from './data/dailyTasksBank'
import type { MultipleChoiceQuestion, TrueFalseQuestion } from './types'

const DAILY_AUTO_KEY = 'gamedu_daily_auto_tasks'
const DAILY_AUTO_DATE_KEY = 'gamedu_daily_auto_date'
const DAILY_AUTO_DONE_KEY = 'gamedu_daily_auto_done' // completed subject ids per user per day

// Bugungi sana uchun deterministik seed (har kuni boshqa savollar)
function getDaySeed(): number {
  const today = todayStr()
  let hash = 0
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// Seeded pseudo-random (Fisher-Yates)
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface DailyAutoTask {
  subjectId: Subject
  subjectLabel: string
  subjectColor: string
  subjectBorderColor: string
  xpReward: number
  question: MultipleChoiceQuestion | TrueFalseQuestion
  date: string
}

// Har kuni har fandan 1 ta savol tanlaydi
export function getDailyAutoTasks(): DailyAutoTask[] {
  const today = todayStr()
  const savedDate = localStorage.getItem(DAILY_AUTO_DATE_KEY)

  if (savedDate === today) {
    const saved = localStorage.getItem(DAILY_AUTO_KEY)
    if (saved) {
      try { return JSON.parse(saved) } catch { /* regenerate */ }
    }
  }

  const seed = getDaySeed()
  const tasks: DailyAutoTask[] = SUBJECTS.map((subj, subjectIndex) => {
    const subjectQuestions = QUESTION_BANK.filter(q => q.subject === subj.id)
    const shuffled = seededShuffle(subjectQuestions, seed + subjectIndex * 1000)
    const picked = shuffled[0]
    return {
      subjectId: subj.id,
      subjectLabel: subj.label,
      subjectColor: subj.color,
      subjectBorderColor: subj.borderColor,
      xpReward: subj.xpPerTask,
      question: picked as MultipleChoiceQuestion | TrueFalseQuestion,
      date: today,
    }
  })

  localStorage.setItem(DAILY_AUTO_KEY, JSON.stringify(tasks))
  localStorage.setItem(DAILY_AUTO_DATE_KEY, today)
  return tasks
}

// Student bu fandan bugun topshiriqni bajardimi?
export function isDailyAutoTaskDone(userId: string, subjectId: Subject): boolean {
  const key = `${DAILY_AUTO_DONE_KEY}_${userId}`
  const today = todayStr()
  const raw = localStorage.getItem(key)
  if (!raw) return false
  try {
    const data: Record<string, string[]> = JSON.parse(raw)
    return (data[today] ?? []).includes(subjectId)
  } catch { return false }
}

// Bajarilgan deb belgilash va XP berish
export function completeDailyAutoTask(
  userId: string,
  subjectId: Subject,
  xpReward: number
): { earnedXp: number; earnedCoins: number; leveledUp: boolean; newLevel: number } | null {
  if (isDailyAutoTaskDone(userId, subjectId)) return null

  const today = todayStr()
  const key = `${DAILY_AUTO_DONE_KEY}_${userId}`
  const raw = localStorage.getItem(key)
  let data: Record<string, string[]> = {}
  try { if (raw) data = JSON.parse(raw) } catch { /* empty */ }
  data[today] = [...(data[today] ?? []), subjectId]
  localStorage.setItem(key, JSON.stringify(data))

  const oldStats = calculateStudentStats(userId)

  // XP yozish
  const progressRecord: StudentTaskProgress = {
    id: `daily_auto_${userId}_${subjectId}_${today}`,
    studentId: userId,
    taskId: `daily_auto_${subjectId}_${today}`,
    status: 'completed',
    earnedXp: xpReward,
    completedAt: new Date().toISOString(),
  }
  const all = getProgress()
  if (!all.some(p => p.id === progressRecord.id)) {
    all.push(progressRecord)
    saveProgress(all)
  }

  // Coin
  const earnedCoins = Math.max(1, Math.floor(xpReward / 10))
  addCoins(userId, earnedCoins)

  // Streak
  updateStreak(userId)

  // Daily quest
  updateDailyQuestProgress(userId, 'complete_tasks', 1)
  updateDailyQuestProgress(userId, 'earn_xp', xpReward)

  const newStats = calculateStudentStats(userId)
  const leveledUp = newStats.level > oldStats.level

  return { earnedXp: xpReward, earnedCoins, leveledUp, newLevel: newStats.level }
}

// ─── ACHIEVEMENT CHECKER ─────────────────────────────────────────────────────

const ACH_SEEN_KEY = 'gamedu_ach_seen'

function getSeenAchievements(userId: string): string[] {
  const raw = localStorage.getItem(`${ACH_SEEN_KEY}_${userId}`)
  try { return raw ? JSON.parse(raw) : [] } catch { return [] }
}

function markAchievementSeen(userId: string, achId: string) {
  const seen = getSeenAchievements(userId)
  if (!seen.includes(achId)) {
    seen.push(achId)
    localStorage.setItem(`${ACH_SEEN_KEY}_${userId}`, JSON.stringify(seen))
  }
}

export interface NewAchievement {
  id: string
  title: string
  description: string
  rarity: 'oddiy' | 'noyob' | 'epik' | 'afsonaviy'
  category: string
}

// Barcha achievement shartlarini tekshirib, yangi ochilganlarni qaytaradi
export function checkNewAchievements(userId: string): NewAchievement[] {
  const stats    = calculateStudentStats(userId)
  const progress = getProgress().filter(p => p.studentId === userId && p.status === 'completed')
  const streak   = getStreak(userId)
  const coins    = getCoinData(userId)
  const seen     = getSeenAchievements(userId)

  const ALL_ACHIEVEMENTS: (NewAchievement & { unlocked: boolean })[] = [
    { id: 'first-step', title: 'Birinchi qadam',     description: 'Birinchi topshiriqni yakunladingiz.',   rarity: 'oddiy',     category: 'boshlangich', unlocked: progress.length >= 1 },
    { id: 'xp-100',     title: 'XP boshlanishi',     description: '100 XP to\'pladingiz.',                 rarity: 'oddiy',     category: 'boshlangich', unlocked: stats.totalXp >= 100 },
    { id: 'xp-500',     title: 'XP yo\'li',          description: '500 XP to\'pladingiz.',                 rarity: 'oddiy',     category: 'boshlangich', unlocked: stats.totalXp >= 500 },
    { id: 'level-2',    title: 'O\'sish boshlandi',  description: '2-darajaga chiqdingiz.',                rarity: 'oddiy',     category: 'boshlangich', unlocked: stats.level >= 2 },
    { id: 'tasks-5',    title: 'Faol o\'quvchi',     description: '5 ta topshiriq yakunladingiz.',         rarity: 'oddiy',     category: 'faollik',     unlocked: progress.length >= 5 },
    { id: 'tasks-10',   title: 'Marafonchi',         description: '10 ta topshiriq yakunladingiz.',        rarity: 'noyob',     category: 'faollik',     unlocked: progress.length >= 10 },
    { id: 'tasks-25',   title: 'Charchamaydigan',    description: '25 ta topshiriq yakunladingiz.',        rarity: 'noyob',     category: 'faollik',     unlocked: progress.length >= 25 },
    { id: 'tasks-50',   title: 'Topshiriq ustasi',   description: '50 ta topshiriq yakunladingiz.',        rarity: 'epik',      category: 'faollik',     unlocked: progress.length >= 50 },
    { id: 'xp-1500',    title: 'Barqaror o\'sish',   description: '1500 XP to\'pladingiz.',                rarity: 'noyob',     category: 'faollik',     unlocked: stats.totalXp >= 1500 },
    { id: 'xp-5000',    title: 'XP Qahramoni',       description: '5000 XP to\'pladingiz.',                rarity: 'epik',      category: 'faollik',     unlocked: stats.totalXp >= 5000 },
    { id: 'level-5',    title: 'Daraja ustasi',      description: '5-darajaga chiqdingiz.',                rarity: 'noyob',     category: 'mahorat',     unlocked: stats.level >= 5 },
    { id: 'level-10',   title: 'Ekspert',            description: '10-darajaga chiqdingiz.',               rarity: 'epik',      category: 'mahorat',     unlocked: stats.level >= 10 },
    { id: 'level-20',   title: 'Grandmaster',        description: '20-darajaga chiqdingiz.',               rarity: 'afsonaviy', category: 'mahorat',     unlocked: stats.level >= 20 },
    { id: 'coins-100',  title: 'Tanga yig\'uvchi',   description: '100 tanga to\'pladingiz.',              rarity: 'oddiy',     category: 'mahorat',     unlocked: coins.totalEarned >= 100 },
    { id: 'coins-500',  title: 'Boylik',             description: '500 tanga to\'pladingiz.',              rarity: 'noyob',     category: 'mahorat',     unlocked: coins.totalEarned >= 500 },
    { id: 'streak-3',   title: 'Ketma-ket 3 kun',    description: '3 kun ketma-ket kirdingiz.',            rarity: 'oddiy',     category: 'streak',      unlocked: streak.longestStreak >= 3 },
    { id: 'streak-7',   title: 'Haftalik chempion',  description: '7 kun ketma-ket kirdingiz.',            rarity: 'noyob',     category: 'streak',      unlocked: streak.longestStreak >= 7 },
    { id: 'streak-14',  title: '2 haftalik jasorat', description: '14 kun ketma-ket kirdingiz.',           rarity: 'epik',      category: 'streak',      unlocked: streak.longestStreak >= 14 },
    { id: 'streak-30',  title: 'Oylik afsonaviy',    description: '30 kun ketma-ket kirdingiz.',           rarity: 'afsonaviy', category: 'streak',      unlocked: streak.longestStreak >= 30 },
    { id: 'xp-10000',   title: 'Afsonaviy o\'quvchi',description: '10 000 XP to\'pladingiz!',             rarity: 'afsonaviy', category: 'maxsus',      unlocked: stats.totalXp >= 10000 },
    { id: 'tasks-100',  title: 'Yuz topshiriq',      description: '100 ta topshiriq yakunladingiz.',       rarity: 'afsonaviy', category: 'maxsus',      unlocked: progress.length >= 100 },
  ]

  const newlyUnlocked: NewAchievement[] = []

  for (const ach of ALL_ACHIEVEMENTS) {
    if (ach.unlocked && !seen.includes(ach.id)) {
      newlyUnlocked.push({
        id: ach.id, title: ach.title,
        description: ach.description,
        rarity: ach.rarity, category: ach.category,
      })
      markAchievementSeen(userId, ach.id)
    }
  }

  return newlyUnlocked
}
