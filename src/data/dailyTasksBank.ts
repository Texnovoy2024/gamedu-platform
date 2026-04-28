
import type { MultipleChoiceQuestion, TrueFalseQuestion } from '../types'

export type Subject = 'dasturlash' | 'matematika' | 'tarix' | 'ingliz' | 'fizika' | 'biologiya'

export interface SubjectConfig {
  id: Subject
  label: string
  color: string
  borderColor: string
  xpPerTask: number
}

export const SUBJECTS: SubjectConfig[] = [
  { id: 'dasturlash', label: 'Dasturlash',  color: 'text-blue-300',    borderColor: 'border-blue-500/40 bg-blue-950/20',    xpPerTask: 40 },
  { id: 'matematika', label: 'Matematika',  color: 'text-yellow-300',  borderColor: 'border-yellow-500/40 bg-yellow-950/20', xpPerTask: 35 },
  { id: 'tarix',      label: 'Tarix',       color: 'text-amber-300',   borderColor: 'border-amber-500/40 bg-amber-950/20',   xpPerTask: 30 },
  { id: 'ingliz',     label: 'Ingliz tili', color: 'text-emerald-300', borderColor: 'border-emerald-500/40 bg-emerald-950/20', xpPerTask: 30 },
  { id: 'fizika',     label: 'Fizika',      color: 'text-purple-300',  borderColor: 'border-purple-500/40 bg-purple-950/20', xpPerTask: 35 },
  { id: 'biologiya',  label: 'Biologiya',   color: 'text-teal-300',    borderColor: 'border-teal-500/40 bg-teal-950/20',    xpPerTask: 30 },
]

export type BankQuestion = (MultipleChoiceQuestion | TrueFalseQuestion) & { subject: Subject }

export const QUESTION_BANK: BankQuestion[] = [
  // ─── DASTURLASH ──────────────────────────────────────────────────────────────
  { subject: 'dasturlash', type: 'multiple-choice', questionText: "JavaScript'da massiv uzunligini qaytaruvchi xususiyat qaysi?", options: ['size', 'count', 'length *', 'len'] },
  { subject: 'dasturlash', type: 'multiple-choice', questionText: "Python'da ro'yxat yaratish uchun qaysi belgi ishlatiladi?", options: ['() *', '[] *', '{}', '<>'] },
  { subject: 'dasturlash', type: 'multiple-choice', questionText: "HTML'da sarlavha tegining to'g'ri yozilishi qaysi?", options: ['<heading>', '<h1> *', '<head>', '<title>'] },
  { subject: 'dasturlash', type: 'multiple-choice', questionText: "CSS'da matn rangini o'zgartiruvchi xususiyat qaysi?", options: ['text-color', 'font-color', 'color *', 'foreground'] },
  { subject: 'dasturlash', type: 'multiple-choice', questionText: "JavaScript'da qat'iy tenglikni tekshiruvchi operator qaysi?", options: ['==', '=', '=== *', '!='] },
  { subject: 'dasturlash', type: 'true-false', questionText: "Python katta-kichik harfga sezgir (case-sensitive) til hisoblanadi.", correctAnswer: true },
  { subject: 'dasturlash', type: 'true-false', questionText: "HTML — dasturlash tili hisoblanadi.", correctAnswer: false },
  { subject: 'dasturlash', type: 'multiple-choice', questionText: "Git'da yangi branch yaratish buyrug'i qaysi?", options: ['git new branch', 'git branch <nom> *', 'git create branch', 'git add branch'] },
  { subject: 'dasturlash', type: 'multiple-choice', questionText: "Qaysi ma'lumot turi faqat ikkita qiymat qabul qiladi?", options: ['String', 'Integer', 'Boolean *', 'Float'] },
  { subject: 'dasturlash', type: 'true-false', questionText: "SQL — ma'lumotlar bazasi bilan ishlash uchun mo'ljallangan til.", correctAnswer: true },
  { subject: 'dasturlash', type: 'multiple-choice', questionText: "O'zgaruvchi nomi qaysi belgi bilan boshlanishi mumkin emas?", options: ['_ (pastki chiziq)', 'Harf', 'Raqam *', '$ belgisi'] },
  { subject: 'dasturlash', type: 'multiple-choice', questionText: "JavaScript'da konsolga chiqaruvchi funksiya qaysi?", options: ['print()', 'echo()', 'console.log() *', 'write()'] },
  { subject: 'dasturlash', type: 'multiple-choice', questionText: "Qaysi til asosan veb-sahifalar dizayni uchun ishlatiladi?", options: ['Python', 'Java', 'CSS *', 'C++'] },
  { subject: 'dasturlash', type: 'true-false', questionText: "React — JavaScript kutubxonasi hisoblanadi.", correctAnswer: true },

  // ─── MATEMATIKA ──────────────────────────────────────────────────────────────
  { subject: 'matematika', type: 'multiple-choice', questionText: "2³ ning qiymati nechaga teng?", options: ['6', '9', '8 *', '12'] },
  { subject: 'matematika', type: 'multiple-choice', questionText: "Aylana yuzasi formulasi qaysi?", options: ['2πr', 'πr² *', '4πr²', 'πd'] },
  { subject: 'matematika', type: 'multiple-choice', questionText: "√144 ning qiymati nechaga teng?", options: ['11', '13', '12 *', '14'] },
  { subject: 'matematika', type: 'true-false', questionText: "Har qanday sonning 0 ga ko'paytmasi 0 ga teng.", correctAnswer: true },
  { subject: 'matematika', type: 'multiple-choice', questionText: "Uchburchak ichki burchaklari yig'indisi nechaga teng?", options: ['90°', '270°', '180° *', '360°'] },
  { subject: 'matematika', type: 'multiple-choice', questionText: "0.5 ni kasrga aylantiring:", options: ['1/4', '1/3', '1/2 *', '2/3'] },
  { subject: 'matematika', type: 'true-false', questionText: "Manfiy son kvadratga ko'tarilsa, natija musbat bo'ladi.", correctAnswer: true },
  { subject: 'matematika', type: 'multiple-choice', questionText: "To'g'ri to'rtburchak perimetri formulasi qaysi?", options: ['a × b', '2(a + b) *', 'a² + b²', '4a'] },
  { subject: 'matematika', type: 'multiple-choice', questionText: "100 ning 25% i nechaga teng?", options: ['20', '30', '25 *', '15'] },
  { subject: 'matematika', type: 'multiple-choice', questionText: "Eng kichik natural son qaysi?", options: ['0', '1 *', '-1', '2'] },
  { subject: 'matematika', type: 'multiple-choice', questionText: "3! (3 faktorial) nechaga teng?", options: ['3', '9', '6 *', '12'] },
  { subject: 'matematika', type: 'true-false', questionText: "Pi (π) soni taxminan 3.14 ga teng.", correctAnswer: true },

  // ─── TARIX ───────────────────────────────────────────────────────────────────
  { subject: 'tarix', type: 'multiple-choice', questionText: "O'zbekiston mustaqilligini qaysi yilda qo'lga kiritdi?", options: ['1990', '1992', '1991 *', '1993'] },
  { subject: 'tarix', type: 'multiple-choice', questionText: "Amir Temur qaysi shaharni poytaxt qilgan?", options: ['Buxoro', 'Xiva', 'Samarqand *', 'Toshkent'] },
  { subject: 'tarix', type: 'true-false', questionText: "Ulug'bek rasadxonasi Samarqandda qurilgan.", correctAnswer: true },
  { subject: 'tarix', type: 'multiple-choice', questionText: "Birinchi jahon urushi qaysi yillarda bo'lgan?", options: ['1939-1945', '1914-1918 *', '1917-1921', '1904-1905'] },
  { subject: 'tarix', type: 'multiple-choice', questionText: "Ipak yo'li qayerdan qayergacha cho'zilgan?", options: ['Faqat Osiyo', 'Xitoydan Yevropagacha *', 'Faqat O\'rta Osiyo', 'Afrika va Osiyo'] },
  { subject: 'tarix', type: 'true-false', questionText: "Al-Xorazmiy algebra fanining asoschisi hisoblanadi.", correctAnswer: true },
  { subject: 'tarix', type: 'multiple-choice', questionText: "O'zbekistonning birinchi Prezidenti kim?", options: ['Shavkat Mirziyoyev', 'Islam Karimov *', 'Nursulton Nazarboyev', 'Saparmurat Niyozov'] },
  { subject: 'tarix', type: 'multiple-choice', questionText: "Registon maydoni qaysi shaharda joylashgan?", options: ['Toshkent', 'Buxoro', 'Samarqand *', 'Namangan'] },
  { subject: 'tarix', type: 'true-false', questionText: "Ikkinchi jahon urushi 1945-yilda tugagan.", correctAnswer: true },
  { subject: 'tarix', type: 'multiple-choice', questionText: "Qaysi davlat birinchi bo'lib kosmosga inson uchirgan?", options: ['AQSh', 'Xitoy', 'SSSR *', 'Germaniya'] },

  // ─── INGLIZ TILI ─────────────────────────────────────────────────────────────
  { subject: 'ingliz', type: 'multiple-choice', questionText: "'Kitob' so'zining inglizcha tarjimasi qaysi?", options: ['Pen', 'Table', 'Book *', 'Chair'] },
  { subject: 'ingliz', type: 'multiple-choice', questionText: "\"I ___ a student\" jumlasida bo'sh joyga nima kerak?", options: ['is', 'are', 'am *', 'be'] },
  { subject: 'ingliz', type: 'true-false', questionText: "\"She don't like coffee\" jumlasi grammatik jihatdan to'g'ri.", correctAnswer: false },
  { subject: 'ingliz', type: 'multiple-choice', questionText: "'Katta' so'zining inglizcha antonimi qaysi?", options: ['Tall', 'Small *', 'Fast', 'Heavy'] },
  { subject: 'ingliz', type: 'multiple-choice', questionText: "\"Yesterday\" so'zi qaysi zamonni bildiradi?", options: ['Present', 'Future', 'Past *', 'Perfect'] },
  { subject: 'ingliz', type: 'multiple-choice', questionText: "\"Beautiful\" so'zining o'zbek tarjimasi qaysi?", options: ['Kuchli', 'Tez', 'Chiroyli *', 'Baland'] },
  { subject: 'ingliz', type: 'true-false', questionText: "Ingliz tilida 26 ta harf mavjud.", correctAnswer: true },
  { subject: 'ingliz', type: 'multiple-choice', questionText: "\"They ___ playing football now\" jumlasida bo'sh joyga nima kerak?", options: ['is', 'was', 'are *', 'were'] },
  { subject: 'ingliz', type: 'multiple-choice', questionText: "'Uy' so'zining inglizcha tarjimasi qaysi?", options: ['Car', 'House *', 'Tree', 'Road'] },
  { subject: 'ingliz', type: 'true-false', questionText: "\"Go\" fe'lining o'tgan zamoni \"went\" hisoblanadi.", correctAnswer: true },

  // ─── FIZIKA ──────────────────────────────────────────────────────────────────
  { subject: 'fizika', type: 'multiple-choice', questionText: "Yorug'likning vakuumdagi tezligi taxminan qancha?", options: ['300 000 km/s *', '150 000 km/s', '3 000 km/s', '30 000 km/s'] },
  { subject: 'fizika', type: 'multiple-choice', questionText: "Kuch birligi SI tizimida qanday nomlanadi?", options: ['Vatt', 'Joul', 'Nyuton *', 'Paskal'] },
  { subject: 'fizika', type: 'true-false', questionText: "Issiqlik har doim sovuq jismdan issiq jismga o'tadi.", correctAnswer: false },
  { subject: 'fizika', type: 'multiple-choice', questionText: "Elektr qarshilik birligi qaysi?", options: ['Amper', 'Volt', 'Om *', 'Vatt'] },
  { subject: 'fizika', type: 'multiple-choice', questionText: "Erkin tushish tezlanishi taxminan qancha?", options: ['5 m/s²', '15 m/s²', '9.8 m/s² *', '20 m/s²'] },
  { subject: 'fizika', type: 'true-false', questionText: "Ovoz to'lqinlari vakuumda tarqala oladi.", correctAnswer: false },
  { subject: 'fizika', type: 'multiple-choice', questionText: "Quvvat formulasi qaysi?", options: ['P = F × t', 'P = m × a', 'P = W / t *', 'P = V × R'] },
  { subject: 'fizika', type: 'multiple-choice', questionText: "Atom yadrosida qaysi zarralar mavjud?", options: ['Elektron va proton', 'Proton va neytron *', 'Faqat proton', 'Elektron va neytron'] },
  { subject: 'fizika', type: 'true-false', questionText: "Massa va og'irlik bir xil tushunchalar hisoblanadi.", correctAnswer: false },

  // ─── BIOLOGIYA ───────────────────────────────────────────────────────────────
  { subject: 'biologiya', type: 'multiple-choice', questionText: "Fotosintez jarayoni qaysi organellada sodir bo'ladi?", options: ['Mitoxondriya', 'Xloroplast *', 'Yadro', 'Ribosoma'] },
  { subject: 'biologiya', type: 'multiple-choice', questionText: "Inson tanasida nechta suyak mavjud (kattalar)?", options: ['206 *', '180', '250', '300'] },
  { subject: 'biologiya', type: 'true-false', questionText: "Viruslar tirik organizmlar hisoblanadi.", correctAnswer: false },
  { subject: 'biologiya', type: 'multiple-choice', questionText: "DNK qayerda joylashgan?", options: ['Sitoplazma', 'Membrana', 'Yadro *', 'Ribosoma'] },
  { subject: 'biologiya', type: 'multiple-choice', questionText: "Qon guruhlarining nechta turi mavjud (ABO tizimi)?", options: ['2', '3', '4 *', '5'] },
  { subject: 'biologiya', type: 'true-false', questionText: "O'simliklar nafas olish jarayonida CO₂ chiqaradi.", correctAnswer: true },
  { subject: 'biologiya', type: 'multiple-choice', questionText: "Eng katta hujayra organelli qaysi?", options: ['Ribosoma', 'Mitoxondriya', 'Yadro *', 'Lizosoma'] },
  { subject: 'biologiya', type: 'multiple-choice', questionText: "Inson qonida kislorod tashuvchi hujayra qaysi?", options: ['Leykosit', 'Trombotsit', 'Eritrosit *', 'Plazma'] },
  { subject: 'biologiya', type: 'true-false', questionText: "Inson miyasi o'ng va chap yarim sharlardan iborat.", correctAnswer: true },
]
