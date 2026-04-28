import { useRef } from 'react'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import logo from '../assets/logo.png'
import heroBg from '../assets/hero-bg-watercolor-isometric.jpg'
export function LandingPage() {
	const heroRef = useRef<HTMLDivElement>(null)
	const gamificationRef = useRef<HTMLDivElement>(null)
	const howItWorksRef = useRef<HTMLDivElement>(null)
	const resultsRef = useRef<HTMLDivElement>(null)
	const reviewsRef = useRef<HTMLDivElement>(null)

	const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
		if (!ref.current) return

		const yOffset = -80
		const y = ref.current.getBoundingClientRect().top + window.scrollY + yOffset

		window.scrollTo({
			top: y,
			behavior: 'smooth',
		})
	}

	return (
		<div className='min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800 relative overflow-hidden'>

			<nav className='fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b'>
				<div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<img src={logo} className='h-9' />

						<span className='font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text'>
							GamEdu
						</span>
					</div>

					<div className='hidden md:flex gap-8 text-sm font-medium'>
						<button onClick={() => scrollToSection(gamificationRef)}>
							Gamifikatsiya
						</button>

						<button onClick={() => scrollToSection(howItWorksRef)}>
							Qanday ishlaydi
						</button>

						<button onClick={() => scrollToSection(resultsRef)}>
							Natijalar
						</button>

						<button onClick={() => scrollToSection(reviewsRef)}>Fikrlar</button>
					</div>

					<a
						href='/auth'
						className='px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow'
					>
						Tizimga kirish
					</a>
				</div>
			</nav>
			<section
				ref={heroRef}
				className='relative pt-[140px] pb-40 text-center overflow-hidden'
			>
				<div className='absolute inset-0 z-0'>
					<img
						src={heroBg}
						alt='GamEdu background'
						className='w-full h-full object-cover opacity-60'
					/>

					<div className='absolute inset-0 bg-gradient-to-b from-white/40 via-white/30 to-white/70'></div>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7 }}
					className='relative z-10 max-w-4xl mx-auto px-6'
				>
					<div className='inline-block mb-6 px-5 py-2 bg-green-100 text-green-800 rounded-full text-sm'>
						2026-yilgi ta'lim trendi
					</div>

					<h1 className='text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6'>
						Ta'limni haqiqiy{' '}
						<span className='bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text'>
							o'yin maydoniga
						</span>{' '}
						aylantiruvchi platforma
					</h1>

					<p className='text-xl text-slate-600 mb-10'>
						XP, darajalar, badge va reytinglar orqali o‘quvchilarni
						motivatsiyalovchi zamonaviy ta'lim platformasi
					</p>

					<div className='flex justify-center gap-6 flex-wrap'>
						<a
							href='/auth?role=teacher'
							className='px-10 py-4 rounded-2xl text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition'
						>
							O‘qituvchi sifatida kirish
						</a>

						<a
							href='/auth?role=student'
							className='px-10 py-4 rounded-2xl text-lg font-semibold bg-white shadow-md hover:shadow-lg hover:scale-[1.02] transition'
						>
							O‘quvchi sifatida kirish
						</a>
					</div>
				</motion.div>
			</section>

			<section ref={gamificationRef} className='py-32'>
				<div className='max-w-7xl mx-auto px-6'>
					<h2 className='text-4xl md:text-5xl font-bold text-center mb-6'>
						Gamifikatsiya elementlari
					</h2>

					<p className='text-center text-slate-600 max-w-2xl mx-auto mb-20 text-lg'>
						GamEdu platformasi o‘quvchilarni rag‘batlantirish uchun zamonaviy
						gamifikatsiya mexanizmlaridan foydalanadi. Har bir faoliyat natijasi
						darhol mukofotlanadi va motivatsiya oshadi.
					</p>

					<div className='grid md:grid-cols-3 gap-10'>
						{[
							{
								icon: '⭐',
								title: 'XP va Darajalar',
								desc: 'Har bir bajarilgan topshiriq uchun XP yig‘ing. XP orqali darajangiz oshib boradi va yangi imkoniyatlar ochiladi.',
								color: 'from-yellow-400 to-orange-400',
							},

							{
								icon: '🏆',
								title: 'Badge va Yutuqlar',
								desc: 'Maxsus natijalar uchun badge va yutuqlar oling. Bu o‘quvchilarni yanada faol bo‘lishga undaydi.',
								color: 'from-indigo-500 to-purple-500',
							},

							{
								icon: '📊',
								title: 'Reyting jadvali',
								desc: 'Reyting orqali sinfdoshlaringiz bilan sog‘lom raqobat qiling va eng yuqori o‘rinni egallang.',
								color: 'from-emerald-400 to-teal-500',
							},
						].map((item, i) => (
							<motion.div
								key={i}
								initial={{ opacity: 0, y: 40 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: i * 0.1 }}
								className='group p-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/30 to-purple-500/30'
							>
								<div
									className='p-8 bg-white rounded-2xl h-full
                    shadow-md hover:shadow-xl
                    transition-all duration-300
                    group-hover:-translate-y-2'
								>
									<div
										className={`w-16 h-16 flex items-center justify-center rounded-xl 
                    bg-gradient-to-r ${item.color}
                  text-white text-3xl mb-6 mx-auto`}
									>
										{item.icon}
									</div>

									<h3 className='text-xl font-semibold mb-4 text-center'>
										{item.title}
									</h3>

									<p className='text-slate-600 text-center leading-relaxed'>
										{item.desc}
									</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<section ref={howItWorksRef} className='py-32 bg-slate-50'>
				<div className='max-w-6xl mx-auto px-6'>
					<h2 className='text-4xl md:text-5xl font-bold text-center mb-6'>
						Qanday ishlaydi
					</h2>

					<p className='text-center text-slate-600 max-w-2xl mx-auto mb-20 text-lg'>
						GamEdu platformasidan foydalanish juda oddiy. Uchta qadam orqali
						o‘quvchilar bilimini oshirib, motivatsiyani kuchaytirish mumkin.
					</p>

					<div className='relative'>

						<div className='hidden md:block absolute top-1/2 left-0 w-full h-1 bg-indigo-100'></div>

						<div className='grid md:grid-cols-3 gap-10 relative'>
							{[
								{
									step: '1',
									title: "Ro'yxatdan o'ting",
									desc: 'Platformada o‘zingiz uchun profil yarating va o‘quv jarayonini boshlang.',
								},

								{
									step: '2',
									title: 'Topshiriqlarni bajaring',
									desc: 'Berilgan vazifalarni bajarib XP yig‘ing va darajangizni oshiring.',
								},

								{
									step: '3',
									title: 'Reytingda yuqoriga chiqing',
									desc: 'Natijalarni kuzatib boring va eng yuqori o‘rinlar uchun raqobatlashing.',
								},
							].map((item, i) => (
								<motion.div
									key={i}
									initial={{ opacity: 0, y: 40 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5, delay: i * 0.15 }}
									className='bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition text-center'
								>
									<div
										className='w-14 h-14 mx-auto mb-6 flex items-center justify-center
                    rounded-full bg-indigo-100 text-indigo-600 text-xl font-bold'
									>
										{item.step}
									</div>

									<h3 className='text-xl font-semibold mb-4'>{item.title}</h3>

									<p className='text-slate-600 leading-relaxed'>{item.desc}</p>
								</motion.div>
							))}
						</div>
					</div>
				</div>
			</section>

			<section ref={resultsRef} className='py-32 bg-white'>
				<div className='max-w-7xl mx-auto px-6'>
					<h2 className='text-4xl md:text-5xl font-bold text-center mb-6'>
						Natijalar va statistika
					</h2>

					<p className='text-center text-slate-600 max-w-2xl mx-auto mb-20 text-lg'>
						GamEdu platformasi o‘quvchilarning motivatsiyasi va bilim
						samaradorligini oshirishga yordam beradi. Quyidagi natijalar
						platformaning real foydasini ko‘rsatadi.
					</p>

					<div className='grid md:grid-cols-4 gap-10'>
						{[
							{
								value: 2500,
								suffix: '+',
								label: 'Faol o‘quvchi',
								icon: '👨‍🎓',
							},

							{
								value: 85,
								suffix: '%',
								label: 'Motivatsiya o‘sishi',
								icon: '⚡',
							},

							{
								value: 4.8,
								suffix: '/5',
								label: 'Foydalanuvchi bahosi',
								icon: '⭐',
							},

							{
								value: 120,
								suffix: '+',
								label: 'Yaratilgan topshiriq',
								icon: '📝',
							},
						].map((stat, i) => (
							<motion.div
								key={i}
								initial={{ opacity: 0, y: 40 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: i * 0.1 }}
								className='group p-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/30 to-purple-500/30'
							>
								<div
									className='bg-white p-10 rounded-2xl text-center shadow-md
                    hover:shadow-xl transition-all duration-300
                    group-hover:-translate-y-2'
								>
									<div
										className='w-14 h-14 mx-auto mb-6 flex items-center justify-center
                    rounded-full bg-indigo-100 text-indigo-600 text-2xl'
									>
										{stat.icon}
									</div>

									<div className='text-4xl font-bold text-indigo-600 mb-3'>
										<CountUp end={stat.value} duration={2} />

										{stat.suffix}
									</div>

									<p className='text-slate-600 text-lg'>{stat.label}</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<section ref={reviewsRef} className='py-32 bg-slate-50'>
				<div className='max-w-7xl mx-auto px-6'>
					<h2 className='text-4xl md:text-5xl font-bold text-center mb-6'>
						Foydalanuvchilar fikri
					</h2>

					<p className='text-center text-slate-600 max-w-2xl mx-auto mb-20 text-lg'>
						GamEdu platformasi o‘qituvchilar, o‘quvchilar va ota-onalar
						tomonidan faol qo‘llanilmoqda. Quyidagi fikrlar platformaning real
						ta'sirini ko‘rsatadi.
					</p>

					<div className='grid md:grid-cols-3 gap-10'>
						{[
							{
								text: 'GamEdu platformasini joriy qilganimizdan keyin sinfimdagi o‘quvchilarning darsga qiziqishi sezilarli darajada oshdi. Reyting va badge tizimi o‘quvchilarni yanada faol bo‘lishga undayapti.',
								author: 'Dilnoza Rahimova',
								role: 'Informatika o‘qituvchisi',
							},

							{
								text: 'Oldin uy vazifalarini qilish zerikarli edi. GamEdu orqali XP yig‘ish va level oshirish meni har kuni yangi topshiriqlar bajarishga motivatsiya qiladi.',
								author: 'Azizbek Karimov',
								role: '9-sinf o‘quvchisi',
							},

							{
								text: 'Farzandim darsdan keyin ham platformada topshiriqlar bajarishga qiziqmoqda. Bu tizim bolalarda raqobat va motivatsiyani juda yaxshi shakllantirar ekan.',
								author: 'Shaxnoza Abdullayeva',
								role: 'Ota-ona',
							},
						].map((review, i) => (
							<motion.div
								key={i}
								initial={{ opacity: 0, y: 40 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: i * 0.1 }}
								className='bg-white p-10 rounded-2xl shadow-md
                    hover:shadow-xl hover:-translate-y-2
                    transition-all duration-300 text-center'
							>
								<img
									src={`https://i.pravatar.cc/120?img=${i + 10}`}
									className='w-16 h-16 rounded-full mx-auto mb-5'
								/>

								<div className='flex justify-center mb-4 text-yellow-400 text-lg'>
									⭐⭐⭐⭐⭐
								</div>

								<p className='text-slate-600 italic mb-6 leading-relaxed'>
									"{review.text}"
								</p>

								<h4 className='font-semibold text-lg'>{review.author}</h4>

								<p className='text-slate-500 text-sm'>{review.role}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<section className='py-32 text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white'>
				<div className='max-w-4xl mx-auto px-6'>
					<h2 className='text-4xl md:text-5xl font-bold mb-6'>
						Ta'limni yangi darajaga olib chiqing
					</h2>

					<p className='text-lg opacity-90 mb-10'>
						GamEdu yordamida o‘quvchilarning motivatsiyasini oshiring, ta'lim
						jarayonini qiziqarli va samarali qiling.
					</p>

					<a
						href='/auth'
						className='inline-block px-10 py-4 bg-white text-indigo-600 font-semibold
                    rounded-xl shadow-lg hover:scale-105 transition'
					>
						Platformani boshlash
					</a>
				</div>
			</section>

			<footer className='bg-slate-900 text-white pt-20 pb-10'>
				<div className='max-w-7xl mx-auto px-6'>
					<div className='grid md:grid-cols-4 gap-12'>

						<div>
							<h3 className='text-xl font-bold mb-4'>GamEdu</h3>

							<p className='text-slate-400 leading-relaxed'>
								Gamifikatsiyalangan ta'lim platformasi orqali o‘quvchilarning
								motivatsiyasini oshiring va ta'lim jarayonini qiziqarli qiling.
							</p>
						</div>


						<div>
							<h4 className='font-semibold mb-4'>Platforma</h4>

							<ul className='space-y-3 text-slate-400'>
								<li className='hover:text-white transition cursor-pointer'>
									Gamifikatsiya
								</li>

								<li className='hover:text-white transition cursor-pointer'>
									Reyting tizimi
								</li>

								<li className='hover:text-white transition cursor-pointer'>
									Statistika
								</li>

								<li className='hover:text-white transition cursor-pointer'>
									Badge va yutuqlar
								</li>
							</ul>
						</div>


						<div>
							<h4 className='font-semibold mb-4'>Resurslar</h4>

							<ul className='space-y-3 text-slate-400'>
								<li className='hover:text-white transition cursor-pointer'>
									Qo'llanma
								</li>

								<li className='hover:text-white transition cursor-pointer'>
									Blog
								</li>

								<li className='hover:text-white transition cursor-pointer'>
									Yordam markazi
								</li>

								<li className='hover:text-white transition cursor-pointer'>
									FAQ
								</li>
							</ul>
						</div>


						<div>
							<h4 className='font-semibold mb-4'>Ijtimoiy tarmoqlar</h4>

							<ul className='space-y-3 text-slate-400'>
								<li className='hover:text-white transition cursor-pointer'>
									Telegram
								</li>

								<li className='hover:text-white transition cursor-pointer'>
									Instagram
								</li>

								<li className='hover:text-white transition cursor-pointer'>
									YouTube
								</li>

								<li className='hover:text-white transition cursor-pointer'>
									LinkedIn
								</li>
							</ul>
						</div>
					</div>

					<div className='border-t border-slate-800 mt-16 pt-6 text-center text-slate-500 text-sm'>
						© {new Date().getFullYear()} GamEdu. Barcha huquqlar himoyalangan.
					</div>
				</div>
			</footer>
		</div>
	)
}
