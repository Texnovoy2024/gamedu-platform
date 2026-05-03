import { db } from './firebase'
import { ref, get, set, remove } from 'firebase/database'
import type {
  Task, User, StudentTaskProgress, StudentStats,
  Difficulty, UserRole, StreakData, CoinData, DailyQuest
} from './types'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`
}

export function roleFromString(role: string): UserRole | null {
  if (role === 'teacher' || role === 'student') return role
  return null
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

// Firebase dan object ni array ga aylantirish
function objToArray<T>(obj: Record<string, T> | null): T[] {
  if (!obj) return []
  return Object.values(obj)
}

// ─── CURRENT USER (localStorage da qoladi — session uchun) ───────────────────

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('gamedu_current_user_id')
}

export function setCurrentUserId(id: string | null) {
  if (typeof window === 'undefined') return
  if (!id) {
    window.localStorage.removeItem('gamedu_current_user_id')
  } else {
    window.localStorage.setItem('gamedu_current_user_id', id)
  }
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const snap = await get(ref(db, 'users'))
  return objToArray<User>(snap.val())
}

export async function upsertUser(user: User): Promise<void> {
  const trimmed: User = {
    ...user,
    id: user.id.trim(),
    password: user.password.trim(),
    name: user.name.trim(),
  }
  await set(ref(db, `users/${trimmed.id}`), trimmed)
}

export async function deleteUser(id: string): Promise<void> {
  await remove(ref(db, `users/${id}`))
}

export async function findUserByCredentials(id: string, password: string): Promise<User | undefined> {
  const trimmedId = id.trim()
  const trimmedPassword = password.trim()
  const snap = await get(ref(db, `users/${trimmedId}`))
  if (!snap.exists()) return undefined
  const user: User = snap.val()
  if (user.password === trimmedPassword) return user
  return undefined
}

// ─── TASKS ───────────────────────────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  const snap = await get(ref(db, 'tasks'))
  return objToArray<Task>(snap.val())
}

export async function upsertTask(task: Task): Promise<void> {
  await set(ref(db, `tasks/${task.id}`), task)
}

export async function deleteTask(id: string): Promise<void> {
  await remove(ref(db, `tasks/${id}`))
}

// ─── PROGRESS ────────────────────────────────────────────────────────────────

export async function getProgress(): Promise<StudentTaskProgress[]> {
  const snap = await get(ref(db, 'progress'))
  return objToArray<StudentTaskProgress>(snap.val())
}

export async function saveProgress(progress: StudentTaskProgress[]): Promise<void> {
  // Firebase da to'liq overwrite — faqat MiniGamesPage uchun
  const obj: Record<string, StudentTaskProgress> = {}
  for (const p of progress) { obj[p.id] = p }
  await set(ref(db, 'progress'), obj)
}

export async function upsertProgress(record: StudentTaskProgress): Promise<void> {
  const snap = await get(ref(db, `progress/${record.id}`))
  if (snap.exists()) {
    const existing: StudentTaskProgress = snap.val()
    if (existing.status === 'completed') {
      console.warn('Bu topshiriq allaqachon bajarilgan, qayta saqlanmadi')
      return
    }
  }
  await set(ref(db, `progress/${record.id}`), record)
}

// ─── STATS & LEVELS ──────────────────────────────────────────────────────────

export async function calculateStudentStats(studentId: string): Promise<StudentStats> {
  const allProgress = await getProgress()
  const progress = allProgress.filter(p => p.studentId === studentId && p.status === 'completed')
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

export async function awardXpForTask(
  studentId: string,
  task: Task,
  correctCount?: number,
  totalCount?: number
): Promise<{ newStats: StudentStats; earnedXp: number; earnedCoins: number; leveledUp: boolean; oldLevel: number } | null> {
  const allProgress = await getProgress()
  const existing = allProgress.find(
    p => p.studentId === studentId && p.taskId === task.id && p.status === 'completed'
  )
  if (existing) {
    console.warn('Bu topshiriq allaqachon bajarilgan')
    return null
  }

  const oldStats = await calculateStudentStats(studentId)
  const oldLevel = oldStats.level

  let earnedXp = task.xp
  if (correctCount !== undefined && totalCount !== undefined && totalCount > 0) {
    earnedXp = Math.round((correctCount / totalCount) * task.xp)
    if (correctCount === totalCount && task.bonusXp) {
      earnedXp += task.bonusXp
    }
  } else {
    earnedXp = task.xp + (task.bonusXp || 0)
  }

  const earnedCoins = Math.max(1, Math.floor(earnedXp / 10))

  const record: StudentTaskProgress = {
    id: `${studentId}_${task.id}`,
    studentId,
    taskId: task.id,
    status: 'completed',
    earnedXp,
    completedAt: new Date().toISOString(),
  }

  await upsertProgress(record)
  await addCoins(studentId, earnedCoins)
  await updateStreak(studentId)
  await updateDailyQuestProgress(studentId, 'complete_tasks', 1)
  await updateDailyQuestProgress(studentId, 'earn_xp', earnedXp)
  if (correctCount !== undefined && totalCount !== undefined && correctCount === totalCount) {
    await updateDailyQuestProgress(studentId, 'perfect_score', 1)
  }

  const newStats = await calculateStudentStats(studentId)
  const leveledUp = newStats.level > oldLevel

  return { newStats, earnedXp, earnedCoins, leveledUp, oldLevel }
}

export async function getRanking(): Promise<StudentStats[]> {
  const users = await getUsers()
  const students = users.filter(u => u.role === 'student')
  const rankings = await Promise.all(students.map(u => calculateStudentStats(u.id)))
  rankings.sort((a, b) => b.totalXp - a.totalXp)
  return rankings
}

// ─── STREAK ──────────────────────────────────────────────────────────────────

export async function getStreak(userId: string): Promise<StreakData> {
  const snap = await get(ref(db, `streaks/${userId}`))
  return snap.val() ?? {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    activeDates: [],
  }
}

export async function updateStreak(userId: string): Promise<StreakData> {
  const today = todayStr()
  const yesterday = yesterdayStr()

  let streak: StreakData = await getStreak(userId)

  if (streak.lastActiveDate === today) return streak

  const activeDates = [...new Set([...streak.activeDates, today])]

  if (streak.lastActiveDate === yesterday) {
    streak = { ...streak, currentStreak: streak.currentStreak + 1, lastActiveDate: today, activeDates }
  } else {
    streak = { ...streak, currentStreak: 1, lastActiveDate: today, activeDates }
  }

  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak)
  await set(ref(db, `streaks/${userId}`), streak)

  if (streak.currentStreak >= 3) {
    const bonusXp = streak.currentStreak >= 7 ? 50 : streak.currentStreak >= 5 ? 30 : 15
    const bonusId = `streak_bonus_${userId}_${today}`
    const existSnap = await get(ref(db, `progress/${bonusId}`))
    if (!existSnap.exists()) {
      const bonusRecord: StudentTaskProgress = {
        id: bonusId,
        studentId: userId,
        taskId: `streak_${today}`,
        status: 'completed',
        earnedXp: bonusXp,
        completedAt: new Date().toISOString(),
      }
      await set(ref(db, `progress/${bonusId}`), bonusRecord)
    }
  }

  return streak
}

// ─── COINS ───────────────────────────────────────────────────────────────────

export async function getCoinData(userId: string): Promise<CoinData> {
  const snap = await get(ref(db, `coins/${userId}`))
  return snap.val() ?? { userId, coins: 0, totalEarned: 0 }
}

export async function addCoins(userId: string, amount: number): Promise<void> {
  const current = await getCoinData(userId)
  await set(ref(db, `coins/${userId}`), {
    userId,
    coins: current.coins + amount,
    totalEarned: current.totalEarned + amount,
  })
}

export async function spendCoins(userId: string, amount: number): Promise<boolean> {
  const current = await getCoinData(userId)
  if (current.coins < amount) return false
  await set(ref(db, `coins/${userId}`), { ...current, coins: current.coins - amount })
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

export async function getDailyQuests(userId: string): Promise<DailyQuest[]> {
  const today = todayStr()
  const snap = await get(ref(db, `dailyQuests/${userId}`))
  const data = snap.val() as { date: string; quests: DailyQuest[] } | null

  if (data && data.date === today && data.quests?.length > 0) {
    return data.quests
  }

  const newQuests: DailyQuest[] = QUEST_TEMPLATES.map(t => ({
    ...t,
    currentCount: t.type === 'login' ? 1 : 0,
    completed: t.type === 'login',
  }))

  await set(ref(db, `dailyQuests/${userId}`), { date: today, quests: newQuests })

  const loginQuest = newQuests.find(q => q.type === 'login')
  if (loginQuest) {
    await addCoins(userId, loginQuest.rewardCoins)
  }

  return newQuests
}

export async function updateDailyQuestProgress(
  userId: string,
  type: DailyQuest['type'],
  amount: number
): Promise<void> {
  const quests = await getDailyQuests(userId)
  let changed = false

  const updated = await Promise.all(quests.map(async q => {
    if (q.type !== type || q.completed) return q
    const newCount = Math.min(q.currentCount + amount, q.targetCount)
    const nowCompleted = newCount >= q.targetCount
    if (nowCompleted && !q.completed) {
      await addCoins(userId, q.rewardCoins)
      const bonusId = `quest_${q.id}_${userId}_${todayStr()}`
      const existSnap = await get(ref(db, `progress/${bonusId}`))
      if (!existSnap.exists()) {
        const bonusRecord: StudentTaskProgress = {
          id: bonusId,
          studentId: userId,
          taskId: `quest_${q.id}_${todayStr()}`,
          status: 'completed',
          earnedXp: q.rewardXp,
          completedAt: new Date().toISOString(),
        }
        await set(ref(db, `progress/${bonusId}`), bonusRecord)
      }
      changed = true
    }
    return { ...q, currentCount: newCount, completed: nowCompleted }
  }))

  if (changed || updated.some((q, i) => q.currentCount !== quests[i].currentCount)) {
    await set(ref(db, `dailyQuests/${userId}`), { date: todayStr(), quests: updated })
  }
}

// ─── UNVON TIZIMI ────────────────────────────────────────────────────────────

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

function getDaySeed(): number {
  const today = todayStr()
  let hash = 0
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

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

// Kunlik avtomatik topshiriqlar — deterministik, Firebase ga saqlanmaydi (hamma uchun bir xil)
export function getDailyAutoTasks(): DailyAutoTask[] {
  const today = todayStr()
  const seed = getDaySeed()
  return SUBJECTS.map((subj, subjectIndex) => {
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
}

export async function isDailyAutoTaskDone(userId: string, subjectId: Subject): Promise<boolean> {
  const today = todayStr()
  const snap = await get(ref(db, `dailyAutoDone/${userId}/${today}/${subjectId}`))
  return snap.exists()
}

export async function completeDailyAutoTask(
  userId: string,
  subjectId: Subject,
  xpReward: number
): Promise<{ earnedXp: number; earnedCoins: number; leveledUp: boolean; newLevel: number } | null> {
  const done = await isDailyAutoTaskDone(userId, subjectId)
  if (done) return null

  const today = todayStr()
  await set(ref(db, `dailyAutoDone/${userId}/${today}/${subjectId}`), true)

  const oldStats = await calculateStudentStats(userId)

  const progressId = `daily_auto_${userId}_${subjectId}_${today}`
  const existSnap = await get(ref(db, `progress/${progressId}`))
  if (!existSnap.exists()) {
    const progressRecord: StudentTaskProgress = {
      id: progressId,
      studentId: userId,
      taskId: `daily_auto_${subjectId}_${today}`,
      status: 'completed',
      earnedXp: xpReward,
      completedAt: new Date().toISOString(),
    }
    await set(ref(db, `progress/${progressId}`), progressRecord)
  }

  const earnedCoins = Math.max(1, Math.floor(xpReward / 10))
  await addCoins(userId, earnedCoins)
  await updateStreak(userId)
  await updateDailyQuestProgress(userId, 'complete_tasks', 1)
  await updateDailyQuestProgress(userId, 'earn_xp', xpReward)

  const newStats = await calculateStudentStats(userId)
  const leveledUp = newStats.level > oldStats.level

  return { earnedXp: xpReward, earnedCoins, leveledUp, newLevel: newStats.level }
}

// ─── ACHIEVEMENT CHECKER ─────────────────────────────────────────────────────

export interface NewAchievement {
  id: string
  title: string
  description: string
  rarity: 'oddiy' | 'noyob' | 'epik' | 'afsonaviy'
  category: string
}

export async function checkNewAchievements(userId: string): Promise<NewAchievement[]> {
  const stats    = await calculateStudentStats(userId)
  const allProg  = await getProgress()
  const progress = allProg.filter(p => p.studentId === userId && p.status === 'completed')
  const streak   = await getStreak(userId)
  const coins    = await getCoinData(userId)

  const seenSnap = await get(ref(db, `achievementsSeen/${userId}`))
  const seen: string[] = seenSnap.val() ?? []

  const ALL_ACHIEVEMENTS: (NewAchievement & { unlocked: boolean })[] = [
    { id: 'first-step', title: 'Birinchi qadam',      description: 'Birinchi topshiriqni yakunladingiz.',   rarity: 'oddiy',     category: 'boshlangich', unlocked: progress.length >= 1 },
    { id: 'xp-100',     title: 'XP boshlanishi',      description: '100 XP to\'pladingiz.',                 rarity: 'oddiy',     category: 'boshlangich', unlocked: stats.totalXp >= 100 },
    { id: 'xp-500',     title: 'XP yo\'li',           description: '500 XP to\'pladingiz.',                 rarity: 'oddiy',     category: 'boshlangich', unlocked: stats.totalXp >= 500 },
    { id: 'level-2',    title: 'O\'sish boshlandi',   description: '2-darajaga chiqdingiz.',                rarity: 'oddiy',     category: 'boshlangich', unlocked: stats.level >= 2 },
    { id: 'tasks-5',    title: 'Faol o\'quvchi',      description: '5 ta topshiriq yakunladingiz.',         rarity: 'oddiy',     category: 'faollik',     unlocked: progress.length >= 5 },
    { id: 'tasks-10',   title: 'Marafonchi',          description: '10 ta topshiriq yakunladingiz.',        rarity: 'noyob',     category: 'faollik',     unlocked: progress.length >= 10 },
    { id: 'tasks-25',   title: 'Charchamaydigan',     description: '25 ta topshiriq yakunladingiz.',        rarity: 'noyob',     category: 'faollik',     unlocked: progress.length >= 25 },
    { id: 'tasks-50',   title: 'Topshiriq ustasi',    description: '50 ta topshiriq yakunladingiz.',        rarity: 'epik',      category: 'faollik',     unlocked: progress.length >= 50 },
    { id: 'xp-1500',    title: 'Barqaror o\'sish',    description: '1500 XP to\'pladingiz.',                rarity: 'noyob',     category: 'faollik',     unlocked: stats.totalXp >= 1500 },
    { id: 'xp-5000',    title: 'XP Qahramoni',        description: '5000 XP to\'pladingiz.',                rarity: 'epik',      category: 'faollik',     unlocked: stats.totalXp >= 5000 },
    { id: 'level-5',    title: 'Daraja ustasi',       description: '5-darajaga chiqdingiz.',                rarity: 'noyob',     category: 'mahorat',     unlocked: stats.level >= 5 },
    { id: 'level-10',   title: 'Ekspert',             description: '10-darajaga chiqdingiz.',               rarity: 'epik',      category: 'mahorat',     unlocked: stats.level >= 10 },
    { id: 'level-20',   title: 'Grandmaster',         description: '20-darajaga chiqdingiz.',               rarity: 'afsonaviy', category: 'mahorat',     unlocked: stats.level >= 20 },
    { id: 'coins-100',  title: 'Tanga yig\'uvchi',    description: '100 tanga to\'pladingiz.',              rarity: 'oddiy',     category: 'mahorat',     unlocked: coins.totalEarned >= 100 },
    { id: 'coins-500',  title: 'Boylik',              description: '500 tanga to\'pladingiz.',              rarity: 'noyob',     category: 'mahorat',     unlocked: coins.totalEarned >= 500 },
    { id: 'streak-3',   title: 'Ketma-ket 3 kun',     description: '3 kun ketma-ket kirdingiz.',            rarity: 'oddiy',     category: 'streak',      unlocked: streak.longestStreak >= 3 },
    { id: 'streak-7',   title: 'Haftalik chempion',   description: '7 kun ketma-ket kirdingiz.',            rarity: 'noyob',     category: 'streak',      unlocked: streak.longestStreak >= 7 },
    { id: 'streak-14',  title: '2 haftalik jasorat',  description: '14 kun ketma-ket kirdingiz.',           rarity: 'epik',      category: 'streak',      unlocked: streak.longestStreak >= 14 },
    { id: 'streak-30',  title: 'Oylik afsonaviy',     description: '30 kun ketma-ket kirdingiz.',           rarity: 'afsonaviy', category: 'streak',      unlocked: streak.longestStreak >= 30 },
    { id: 'xp-10000',   title: 'Afsonaviy o\'quvchi', description: '10 000 XP to\'pladingiz!',             rarity: 'afsonaviy', category: 'maxsus',      unlocked: stats.totalXp >= 10000 },
    { id: 'tasks-100',  title: 'Yuz topshiriq',       description: '100 ta topshiriq yakunladingiz.',       rarity: 'afsonaviy', category: 'maxsus',      unlocked: progress.length >= 100 },
  ]

  const newlyUnlocked: NewAchievement[] = []
  const updatedSeen = [...seen]

  for (const ach of ALL_ACHIEVEMENTS) {
    if (ach.unlocked && !seen.includes(ach.id)) {
      newlyUnlocked.push({ id: ach.id, title: ach.title, description: ach.description, rarity: ach.rarity, category: ach.category })
      updatedSeen.push(ach.id)
    }
  }

  if (newlyUnlocked.length > 0) {
    await set(ref(db, `achievementsSeen/${userId}`), updatedSeen)
  }

  return newlyUnlocked
}
