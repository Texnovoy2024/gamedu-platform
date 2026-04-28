import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { findUserByCredentials, generateId, upsertUser, setCurrentUserId } from '../storage';
import type { UserRole } from '../types';
import { Modal } from '../components/Modal';

type Mode = 'login' | 'register';

export function AuthPage() {
  const navigate = useNavigate();
  const [mode] = useState<Mode>('login');
  const [role] = useState<UserRole>('student');
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  
  useEffect(() => {
    const usersRaw = localStorage.getItem('gamedu_users');
    let users: any[] = usersRaw ? JSON.parse(usersRaw) : [];

    if (!Array.isArray(users) || users.length === 0 || !users.some(u => u.id === 'nilufar05')) {
      const defaultTeacher = {
        id: "nilufar05",
        name: "Nilufar (default o'qituvchi)",
        password: "123456",
        role: "teacher",
        createdAt: new Date().toISOString(),
      };

      users = [...users, defaultTeacher];
      localStorage.setItem('gamedu_users', JSON.stringify(users));

      console.log('[Auth] Default teacher hisobi avtomatik qo\'shildi: nilufar05 / 123456');
    }
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!id.trim() || !password.trim() || (mode === 'register' && !name.trim())) {
      setError("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (mode === 'login') {
        const user = findUserByCredentials(id.trim(), password.trim());
        if (!user) {
          setError("ID yoki parol noto'g'ri. Qayta urinib ko'ring.");
          setLoading(false);
          return;
        }

        setCurrentUserId(user.id);
        setLoading(false);
        setSuccessModal({
          open: true,
          message: user.role === 'teacher'
            ? "Xush kelibsiz! O'qituvchi paneliga yo'naltirilmoqdasiz."
            : "Xush kelibsiz! O'quvchi paneliga yo'naltirilmoqdasiz.",
        });

        setTimeout(() => navigate(user.role === 'teacher' ? '/teacher' : '/student'), 900);
      } else {
        const userId = id.trim() || generateId(role === 'teacher' ? 't' : 's');
        const now = new Date().toISOString();

        upsertUser({
          id: userId,
          name: name.trim(),
          password: password.trim(),
          role,
          createdAt: now,
        });

        setCurrentUserId(userId);
        setLoading(false);
        setSuccessModal({
          open: true,
          message: role === 'teacher'
            ? "Hisob muvaffaqiyatli yaratildi! O'qituvchi sifatida davom eting."
            : "Hisob muvaffaqiyatli yaratildi! O'quvchi sifatida boshlang!",
        });

        setTimeout(() => navigate(role === 'teacher' ? '/teacher' : '/student'), 1000);
      }
    }, 400);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center px-4 py-8 font-sans">
      <div className="relative max-w-5xl w-full grid md:grid-cols-2 gap-8 items-stretch">
        {/* Chap taraf — forma */}
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100/60 p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-purple-700 tracking-tight">GamEdu</h1>
            <p className="text-lg text-purple-600/90 mt-1 font-medium">
              {mode === 'login' ? "Tizimga kirish" : "Hisobga kirish"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Foydalanuvchi ID
              </label>
              <input
                value={id}
                onChange={e => setId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition"
                placeholder="ID ni kiriting"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ism-familiya
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition"
                  placeholder="Ismingizni kiriting"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Parol
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition"
                placeholder="Kamida 4 ta belgi"
                autoComplete={mode === 'login' ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3.5 rounded-xl shadow-lg hover:brightness-105 disabled:opacity-60 transition-all mt-3"
            >
              {loading
                ? 'Jarayon...'
                : mode === 'login'
                ? 'Kirish'
                : "Ro'yxatdan o'tish"}
            </button>
          </form>
        </div>

        {/* O'ng taraf — ma'lumot bloki */}
        <div className="hidden md:block bg-white/70 backdrop-blur-sm rounded-3xl border border-purple-100/40 shadow-xl p-8 md:p-10">
          <h2 className="text-2xl font-bold text-purple-700 mb-2">
            GamEdu ta'lim o'yini
          </h2>
          <p className="text-gray-600 mb-6">
            Ta'limni qiziqarli va samarali qiluvchi gamifikatsiya platformasi
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Nima uchun GamEdu?
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span>XP va darajalar orqali motivatsiya oshirish</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span>Reyting va sinf doskasi — sog'lom raqobat</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span>Badge va yutuqlar — quvonchli natijalar</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span>Vizual progress — har qadam ko'rinib turadi</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Tez boshlash</h3>
              <p className="text-gray-600">
                ID va parol bilan 10 soniyada kirib, o'zingizni sinab ko'ring!
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={successModal.open}
        title="Muvaffaqiyat!"
        description={successModal.message}
        tone="success"
        confirmLabel="Davom etish"
        showCancel={false}
        onConfirm={() => setSuccessModal({ open: false, message: '' })}
      />
    </div>
  );
}
