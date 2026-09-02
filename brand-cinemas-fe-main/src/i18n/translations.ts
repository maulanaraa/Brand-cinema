export type Language = 'id' | 'en' | 'ko'

export const LANGUAGES: { code: Language; label: string; name: string }[] = [
  { code: 'id', label: 'ID', name: 'Indonesia' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ko', label: 'KO', name: '한국어' },
]

export const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  id: 'id-ID',
  en: 'en-US',
  ko: 'ko-KR',
}

type TranslationKey =
  | 'home'
  | 'movies'
  | 'myBookings'
  | 'profile'
  | 'myTickets'
  | 'admin'
  | 'signIn'
  | 'signUp'
  | 'signOut'
  | 'signedOut'
  | 'signOutError'
  | 'language'
  | 'search'
  | 'account'
  | 'tickets'
  | 'cinemas'
  | 'promotions'
  | 'quickLinks'
  | 'contactUs'
  | 'city'
  | 'cinema'
  | 'date'
  | 'selectCity'
  | 'selectDate'
  | 'selectLocation'
  | 'loading'
  | 'noCities'
  | 'noCinemas'
  | 'searchMovies'
  | 'changeLocation'
  | 'nowPlaying'
  | 'comingSoon'
  | 'inTheaters'
  | 'viewDetails'
  | 'viewAllMovies'
  | 'nowPlayingSubtitle'
  | 'comingSoonSubtitle'
  | 'footerTagline'
  | 'footerCopyright'
  | 'minutes'
  | 'buyTickets'
  | 'watchTrailer'
  | 'closeTrailer'
  | 'story'
  | 'synopsis'
  | 'director'
  | 'cast'
  | 'toBeAnnounced'
  | 'movieNotFound'
  | 'backToMovies'
  | 'bookNow'
  | 'selectShowtime'
  | 'estFinish'
  | 'noUpcomingShowtimes'
  | 'continueToSeats'
  | 'noShowtimesYet'
  | 'noShowtimesHint'
  // Auth
  | 'welcomeBack'
  | 'signInSubtitle'
  | 'orContinueWithEmail'
  | 'emailAddress'
  | 'password'
  | 'forgotPasswordLink'
  | 'enterEmail'
  | 'enterPassword'
  | 'dontHaveAccount'
  | 'createAccount'
  | 'createAccountTitle'
  | 'registerSubtitle'
  | 'fullName'
  | 'enterFullName'
  | 'confirmPassword'
  | 'enterConfirmPassword'
  | 'alreadyHaveAccount'
  | 'forgotPasswordTitle'
  | 'forgotPasswordSubtitle'
  | 'sendResetLink'
  | 'checkYourEmail'
  | 'resetEmailSent'
  | 'backToSignIn'
  | 'emailRequired'
  | 'invalidEmail'
  | 'passwordRequired'
  | 'passwordMinLength'
  | 'fullNameRequired'
  | 'nameMaxLength'
  | 'confirmPasswordRequired'
  | 'passwordsDoNotMatch'
  | 'emailAlreadyRegistered'
  | 'registrationFailed'
  | 'registrationSuccessful'
  | 'tryAgainError'
  | 'invalidCredentials'
  | 'googleLoginFailed'
  | 'googleSessionExpired'
  | 'googleEmailNotVerified'
  | 'googleTooManyAttempts'
  | 'googleCancelled'
  | 'unableToConnect'
  | 'welcomeBackToast'
  | 'resetPasswordSuccessToast'
  // Admin shell
  | 'adminPanel'
  | 'adminNavDashboard'
  | 'adminNavMovies'
  | 'adminNavCarousel'
  | 'adminNavCities'
  | 'adminNavCinemas'
  | 'adminNavHalls'
  | 'adminNavShowtimes'
  | 'adminNavFnB'
  | 'adminNavUsers'
  | 'adminNavBookings'
  | 'adminNavReports'
  | 'backToCinema'
  | 'administrator'
  | 'welcomeBackAdmin'
  | 'expandSidebar'
  | 'collapseSidebar'
  | 'openMenu'
  | 'closeMenu'
  // Admin dashboard
  | 'dashboardOverview'
  | 'revenue'
  | 'thisWeek'
  | 'dailyAvg'
  | 'revenueOverview'
  | 'noRevenueData'
  | 'quickActions'
  | 'addNewMovie'
  | 'createShowtime'
  | 'manageCarousel'
  | 'manageUsers'
  | 'systemStatus'
  | 'database'
  | 'apiService'
  | 'bookingSystem'
  | 'online'
  | 'running'
  | 'activeStatus'
  | 'recentBookings'
  | 'noBookingsYet'
  | 'popularMovies'
  | 'seats'
  | 'noConfirmedBookings'
  // Admin page chrome
  | 'confirmDeletion'
  | 'editMovie'
  | 'editHall'
  | 'addNewHall'
  | 'editCity'
  | 'addNewCity'
  | 'editCinema'
  | 'addNewCinema'
  | 'editShowtime'
  | 'addNewShowtime'
  | 'editUser'
  | 'addNewUser'
  | 'editCarouselItem'
  | 'addNewCarouselItem'
  | 'editFoodItem'
  | 'addNewFoodItem'
  | 'foodAndBeverage'
  | 'deleteFnBItem'
  | 'bookingDetails'
  | 'bookingNotFound'
  | 'customerInfo'
  | 'weeklyRevenue'
  | 'foodItems'
  // Profile page
  | 'accountInformation'
  | 'role'
  | 'bookingSummary'
  | 'totalBookings'
  | 'confirmed'
  | 'cancelled'
  | 'viewMyBookings'
  | 'accountActions'
  | 'adminDashboard'
  | 'manageBookingsHint'
  | 'roleAdmin'
  | 'roleUser'
  | 'fnbEyebrow'
  | 'fnbTitle'
  | 'fnbSubtitle'
  | 'fnbSpecialPromo'
  | 'fnbBannerTitle'
  | 'fnbBannerDesc'
  | 'fnbStartingFrom'
  | 'fnbExploreMenu'

const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  en: {
    home: 'Home',
    movies: 'Movies',
    myBookings: 'My Bookings',
    profile: 'Profile',
    myTickets: 'My Tickets',
    admin: 'Admin',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    signedOut: 'Signed out successfully',
    signOutError: 'Error signing out',
    language: 'Language',
    search: 'Search',
    account: 'Account',
    tickets: 'Tickets',
    cinemas: 'Cinemas',
    promotions: 'Promotions',
    quickLinks: 'Quick Links',
    contactUs: 'Contact Us',
    city: 'City',
    cinema: 'Cinema',
    date: 'Date',
    selectCity: 'Select city',
    selectDate: 'Select date',
    selectLocation: 'Select location',
    loading: 'Loading…',
    noCities: 'No cities available',
    noCinemas: 'No cinemas in this city',
    searchMovies: 'Search movies',
    changeLocation: 'Change location',
    nowPlaying: 'Now Playing',
    comingSoon: 'Coming Soon',
    inTheaters: 'In theaters',
    viewDetails: 'View Details',
    viewAllMovies: 'View All Movies',
    nowPlayingSubtitle: 'Pick a film, choose your studio, and reserve seats in a few taps.',
    comingSoonSubtitle: 'Upcoming releases ready for trailers, reminders, and presale tickets.',
    footerTagline:
      'Premium moviegoing with curated showtimes, comfortable halls, quick checkout, and e-tickets ready before the lights go down.',
    footerCopyright: 'Demo booking experience for KADA Project.',
    minutes: 'minutes',
    buyTickets: 'Buy Tickets',
    watchTrailer: 'Watch Trailer',
    closeTrailer: 'Close',
    story: 'Story',
    synopsis: 'Synopsis',
    director: 'Director',
    cast: 'Cast',
    toBeAnnounced: 'To be announced',
    movieNotFound: 'Movie Not Found',
    backToMovies: 'Back to Movies',
    bookNow: 'Book now',
    selectShowtime: 'Select Showtime',
    estFinish: 'Est. finish',
    noUpcomingShowtimes: 'No upcoming showtimes for this date.',
    continueToSeats: 'Continue to Seats',
    noShowtimesYet: 'No showtimes yet',
    noShowtimesHint: 'Check back soon for available sessions.',
    welcomeBack: 'Welcome Back',
    signInSubtitle: 'Sign in as user or admin to continue',
    orContinueWithEmail: 'or continue with email',
    emailAddress: 'Email Address',
    password: 'Password',
    forgotPasswordLink: 'Forgot password?',
    enterEmail: 'Enter your email',
    enterPassword: 'Enter your password',
    dontHaveAccount: "Don't have an account?",
    createAccount: 'Create Account',
    createAccountTitle: 'Create Account',
    registerSubtitle: 'Join us to start booking your favorite movies',
    fullName: 'Full Name',
    enterFullName: 'Enter your full name',
    confirmPassword: 'Confirm Password',
    enterConfirmPassword: 'Confirm your password',
    alreadyHaveAccount: 'Already have an account?',
    forgotPasswordTitle: 'Forgot Password',
    forgotPasswordSubtitle: "Enter your email and we'll send you a reset link",
    sendResetLink: 'Send Reset Link',
    checkYourEmail: 'Check Your Email',
    resetEmailSent: 'If that email is registered, a password reset link has been sent. Please check your inbox.',
    backToSignIn: 'Back to Sign In',
    emailRequired: 'Email is required',
    invalidEmail: 'Invalid email address',
    passwordRequired: 'Password is required',
    passwordMinLength: 'Password must be at least 8 characters',
    fullNameRequired: 'Full name is required',
    nameMaxLength: 'Name must be at most 100 characters',
    confirmPasswordRequired: 'Please confirm your password',
    passwordsDoNotMatch: 'Passwords do not match',
    emailAlreadyRegistered: 'Email already registered',
    registrationFailed: 'Registration failed',
    registrationSuccessful: 'Registration successful!',
    tryAgainError: 'An error occurred. Please try again.',
    invalidCredentials: 'Invalid email or password',
    googleLoginFailed: 'Google login failed. Please try again.',
    googleSessionExpired: 'Google session expired. Please try again.',
    googleEmailNotVerified: 'Your Google email is not verified.',
    googleTooManyAttempts: 'Too many attempts. Please try again in 15 minutes.',
    googleCancelled: 'Google login was cancelled or failed.',
    unableToConnect: 'Unable to connect to server. Please check your connection.',
    welcomeBackToast: 'Welcome back!',
    resetPasswordSuccessToast: 'Password reset successful. Please sign in with your new password.',
    adminPanel: 'Admin Panel',
    adminNavDashboard: 'Dashboard',
    adminNavMovies: 'Movies',
    adminNavCarousel: 'Carousel',
    adminNavCities: 'Cities',
    adminNavCinemas: 'Cinemas',
    adminNavHalls: 'Halls',
    adminNavShowtimes: 'Showtimes',
    adminNavFnB: 'F&B',
    adminNavUsers: 'Users',
    adminNavBookings: 'Bookings',
    adminNavReports: 'Reports',
    backToCinema: 'Back to Cinema',
    administrator: 'Administrator',
    welcomeBackAdmin: 'Welcome back',
    expandSidebar: 'Expand sidebar',
    collapseSidebar: 'Collapse sidebar',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    dashboardOverview: 'Overview of your cinema management system',
    revenue: 'Revenue',
    thisWeek: 'This Week',
    dailyAvg: 'Daily Avg',
    revenueOverview: 'Revenue Overview',
    noRevenueData: 'No revenue data available.',
    quickActions: 'Quick Actions',
    addNewMovie: 'Add New Movie',
    createShowtime: 'Create Showtime',
    manageCarousel: 'Manage Carousel',
    manageUsers: 'Manage Users',
    systemStatus: 'System Status',
    database: 'Database',
    apiService: 'API Service',
    bookingSystem: 'Booking System',
    online: 'Online',
    running: 'Running',
    activeStatus: 'Active',
    recentBookings: 'Recent Bookings',
    noBookingsYet: 'No bookings yet.',
    popularMovies: 'Popular Movies',
    seats: 'seats',
    noConfirmedBookings: 'No confirmed bookings yet.',
    confirmDeletion: 'Confirm Deletion',
    editMovie: 'Edit Movie',
    editHall: 'Edit Hall',
    addNewHall: 'Add New Hall',
    editCity: 'Edit City',
    addNewCity: 'Add New City',
    editCinema: 'Edit Cinema',
    addNewCinema: 'Add New Cinema',
    editShowtime: 'Edit Showtime',
    addNewShowtime: 'Add New Showtime',
    editUser: 'Edit User',
    addNewUser: 'Add New User',
    editCarouselItem: 'Edit Carousel Item',
    addNewCarouselItem: 'Add New Carousel Item',
    editFoodItem: 'Edit Food Item',
    addNewFoodItem: 'Add New Food Item',
    foodAndBeverage: 'Food & Beverage',
    deleteFnBItem: 'Delete F&B Item',
    bookingDetails: 'Booking Details',
    bookingNotFound: 'Booking not found',
    customerInfo: 'Customer Info',
    weeklyRevenue: 'Weekly Revenue',
    foodItems: 'Food Items',
    accountInformation: 'Account Information',
    role: 'Role',
    bookingSummary: 'Booking Summary',
    totalBookings: 'Total Bookings',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    viewMyBookings: 'View My Bookings',
    accountActions: 'Account Actions',
    adminDashboard: 'Admin Dashboard',
    manageBookingsHint: 'Manage your bookings and account details from this page.',
    roleAdmin: 'Admin',
    roleUser: 'User',
    fnbEyebrow: 'Concessions & Refreshments',
    fnbTitle: 'Enhance Your Movie Experience',
    fnbSubtitle: 'Freshly popped warm popcorn, signature cold drinks, and value combo packages ready for showtime.',
    fnbSpecialPromo: 'SPECIAL COMBO',
    fnbBannerTitle: 'Signature Cinema Combo',
    fnbBannerDesc: 'Crispy buttered popcorn paired with ice-cold beverages at special combo prices to elevate your movie time.',
    fnbStartingFrom: 'Starting from',
    fnbExploreMenu: 'Book Tickets & Snacks',
  },
  id: {
    home: 'Beranda',
    movies: 'Film',
    myBookings: 'Pesanan Saya',
    profile: 'Profil',
    myTickets: 'Tiket Saya',
    admin: 'Admin',
    signIn: 'Masuk',
    signUp: 'Daftar',
    signOut: 'Keluar',
    signedOut: 'Berhasil keluar',
    signOutError: 'Gagal keluar',
    language: 'Bahasa',
    search: 'Cari',
    account: 'Akun',
    tickets: 'Tiket',
    cinemas: 'Bioskop',
    promotions: 'Promo',
    quickLinks: 'Tautan Cepat',
    contactUs: 'Hubungi Kami',
    city: 'Kota',
    cinema: 'Bioskop',
    date: 'Tanggal',
    selectCity: 'Pilih kota',
    selectDate: 'Pilih tanggal',
    selectLocation: 'Pilih lokasi',
    loading: 'Memuat…',
    noCities: 'Tidak ada kota',
    noCinemas: 'Tidak ada bioskop di kota ini',
    searchMovies: 'Cari film',
    changeLocation: 'Ubah lokasi',
    nowPlaying: 'Sedang Tayang',
    comingSoon: 'Segera Tayang',
    inTheaters: 'Di bioskop',
    viewDetails: 'Lihat Detail',
    viewAllMovies: 'Lihat Semua Film',
    nowPlayingSubtitle: 'Pilih film, pilih studio, dan pesan kursi dalam beberapa ketukan.',
    comingSoonSubtitle: 'Film mendatang siap untuk trailer, pengingat, dan tiket prapenjualan.',
    footerTagline:
      'Pengalaman nonton premium dengan jadwal pilihan, aula nyaman, checkout cepat, dan e-tiket siap sebelum lampu dimatikan.',
    footerCopyright: 'Demo pemesanan tiket untuk Proyek KADA.',
    minutes: 'menit',
    buyTickets: 'Beli Tiket',
    watchTrailer: 'Tonton Trailer',
    closeTrailer: 'Tutup',
    story: 'Cerita',
    synopsis: 'Sinopsis',
    director: 'Sutradara',
    cast: 'Pemeran',
    toBeAnnounced: 'Akan diumumkan',
    movieNotFound: 'Film Tidak Ditemukan',
    backToMovies: 'Kembali ke Film',
    bookNow: 'Pesan sekarang',
    selectShowtime: 'Pilih Jadwal',
    estFinish: 'Selesai sekitar',
    noUpcomingShowtimes: 'Tidak ada jadwal untuk tanggal ini.',
    continueToSeats: 'Lanjut ke Kursi',
    noShowtimesYet: 'Belum ada jadwal',
    noShowtimesHint: 'Cek lagi nanti untuk sesi yang tersedia.',
    welcomeBack: 'Selamat Datang Kembali',
    signInSubtitle: 'Masuk sebagai pengguna atau admin untuk melanjutkan',
    orContinueWithEmail: 'atau lanjut dengan email',
    emailAddress: 'Alamat Email',
    password: 'Kata Sandi',
    forgotPasswordLink: 'Lupa kata sandi?',
    enterEmail: 'Masukkan email Anda',
    enterPassword: 'Masukkan kata sandi',
    dontHaveAccount: 'Belum punya akun?',
    createAccount: 'Buat Akun',
    createAccountTitle: 'Buat Akun',
    registerSubtitle: 'Bergabung untuk mulai memesan film favorit Anda',
    fullName: 'Nama Lengkap',
    enterFullName: 'Masukkan nama lengkap',
    confirmPassword: 'Konfirmasi Kata Sandi',
    enterConfirmPassword: 'Konfirmasi kata sandi Anda',
    alreadyHaveAccount: 'Sudah punya akun?',
    forgotPasswordTitle: 'Lupa Kata Sandi',
    forgotPasswordSubtitle: 'Masukkan email dan kami akan kirim tautan reset',
    sendResetLink: 'Kirim Tautan Reset',
    checkYourEmail: 'Periksa Email Anda',
    resetEmailSent:
      'Jika email terdaftar, tautan reset kata sandi telah dikirim. Silakan periksa kotak masuk Anda.',
    backToSignIn: 'Kembali ke Masuk',
    emailRequired: 'Email wajib diisi',
    invalidEmail: 'Alamat email tidak valid',
    passwordRequired: 'Kata sandi wajib diisi',
    passwordMinLength: 'Kata sandi minimal 8 karakter',
    fullNameRequired: 'Nama lengkap wajib diisi',
    nameMaxLength: 'Nama maksimal 100 karakter',
    confirmPasswordRequired: 'Harap konfirmasi kata sandi',
    passwordsDoNotMatch: 'Kata sandi tidak cocok',
    emailAlreadyRegistered: 'Email sudah terdaftar',
    registrationFailed: 'Pendaftaran gagal',
    registrationSuccessful: 'Pendaftaran berhasil!',
    tryAgainError: 'Terjadi kesalahan. Silakan coba lagi.',
    invalidCredentials: 'Email atau kata sandi salah',
    googleLoginFailed: 'Login Google gagal. Silakan coba lagi.',
    googleSessionExpired: 'Sesi Google berakhir. Silakan coba lagi.',
    googleEmailNotVerified: 'Email Google Anda belum diverifikasi.',
    googleTooManyAttempts: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.',
    googleCancelled: 'Login Google dibatalkan atau gagal.',
    unableToConnect: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.',
    welcomeBackToast: 'Selamat datang kembali!',
    resetPasswordSuccessToast: 'Reset kata sandi berhasil. Silakan masuk dengan kata sandi baru.',
    adminPanel: 'Panel Admin',
    adminNavDashboard: 'Dasbor',
    adminNavMovies: 'Film',
    adminNavCarousel: 'Carousel',
    adminNavCities: 'Kota',
    adminNavCinemas: 'Bioskop',
    adminNavHalls: 'Studio',
    adminNavShowtimes: 'Jadwal',
    adminNavFnB: 'F&B',
    adminNavUsers: 'Pengguna',
    adminNavBookings: 'Pesanan',
    adminNavReports: 'Laporan',
    backToCinema: 'Kembali ke Bioskop',
    administrator: 'Administrator',
    welcomeBackAdmin: 'Selamat datang kembali',
    expandSidebar: 'Perluas sidebar',
    collapseSidebar: 'Ciutkan sidebar',
    openMenu: 'Buka menu',
    closeMenu: 'Tutup menu',
    dashboardOverview: 'Ringkasan sistem manajemen bioskop Anda',
    revenue: 'Pendapatan',
    thisWeek: 'Minggu Ini',
    dailyAvg: 'Rata-rata Harian',
    revenueOverview: 'Ringkasan Pendapatan',
    noRevenueData: 'Belum ada data pendapatan.',
    quickActions: 'Aksi Cepat',
    addNewMovie: 'Tambah Film Baru',
    createShowtime: 'Buat Jadwal',
    manageCarousel: 'Kelola Carousel',
    manageUsers: 'Kelola Pengguna',
    systemStatus: 'Status Sistem',
    database: 'Database',
    apiService: 'Layanan API',
    bookingSystem: 'Sistem Pemesanan',
    online: 'Online',
    running: 'Berjalan',
    activeStatus: 'Aktif',
    recentBookings: 'Pesanan Terbaru',
    noBookingsYet: 'Belum ada pesanan.',
    popularMovies: 'Film Populer',
    seats: 'kursi',
    noConfirmedBookings: 'Belum ada pesanan terkonfirmasi.',
    confirmDeletion: 'Konfirmasi Penghapusan',
    editMovie: 'Edit Film',
    editHall: 'Edit Studio',
    addNewHall: 'Tambah Studio Baru',
    editCity: 'Edit Kota',
    addNewCity: 'Tambah Kota Baru',
    editCinema: 'Edit Bioskop',
    addNewCinema: 'Tambah Bioskop Baru',
    editShowtime: 'Edit Jadwal',
    addNewShowtime: 'Tambah Jadwal Baru',
    editUser: 'Edit Pengguna',
    addNewUser: 'Tambah Pengguna Baru',
    editCarouselItem: 'Edit Item Carousel',
    addNewCarouselItem: 'Tambah Item Carousel',
    editFoodItem: 'Edit Item F&B',
    addNewFoodItem: 'Tambah Item F&B',
    foodAndBeverage: 'Makanan & Minuman',
    deleteFnBItem: 'Hapus Item F&B',
    bookingDetails: 'Detail Pesanan',
    bookingNotFound: 'Pesanan tidak ditemukan',
    customerInfo: 'Info Pelanggan',
    weeklyRevenue: 'Pendapatan Mingguan',
    foodItems: 'Item Makanan',
    accountInformation: 'Informasi Akun',
    role: 'Peran',
    bookingSummary: 'Ringkasan Pesanan',
    totalBookings: 'Total Pesanan',
    confirmed: 'Dikonfirmasi',
    cancelled: 'Dibatalkan',
    viewMyBookings: 'Lihat Pesanan Saya',
    accountActions: 'Aksi Akun',
    adminDashboard: 'Dasbor Admin',
    manageBookingsHint: 'Kelola pesanan dan detail akun Anda dari halaman ini.',
    roleAdmin: 'Admin',
    roleUser: 'Pengguna',
    fnbEyebrow: 'Snack & Minuman Bioskop',
    fnbTitle: 'Lengkapi Keseruan Nonton Kamu',
    fnbSubtitle: 'Pilihan popcorn renyah hangat, minuman segar pilihan, dan paket combo hemat favorit bioskop.',
    fnbSpecialPromo: 'PROMO SPESIAL',
    fnbBannerTitle: 'Signature Combo Nonton Seru',
    fnbBannerDesc: 'Popcorn mentega gurih renyah dipadukan dengan minuman dingin segar pilihan untuk menemani momen nontonmu.',
    fnbStartingFrom: 'Mulai dari',
    fnbExploreMenu: 'Pesan Tiket & Snack',
  },
  ko: {
    home: '홈',
    movies: '영화',
    myBookings: '내 예매',
    profile: '프로필',
    myTickets: '내 티켓',
    admin: '관리자',
    signIn: '로그인',
    signUp: '회원가입',
    signOut: '로그아웃',
    signedOut: '로그아웃되었습니다',
    signOutError: '로그아웃 오류',
    language: '언어',
    search: '검색',
    account: '계정',
    tickets: '티켓',
    cinemas: '영화관',
    promotions: '프로모션',
    quickLinks: '바로가기',
    contactUs: '문의하기',
    city: '도시',
    cinema: '영화관',
    date: '날짜',
    selectCity: '도시 선택',
    selectDate: '날짜 선택',
    selectLocation: '위치 선택',
    loading: '로딩 중…',
    noCities: '도시가 없습니다',
    noCinemas: '이 도시에 영화관이 없습니다',
    searchMovies: '영화 검색',
    changeLocation: '위치 변경',
    nowPlaying: '상영 중',
    comingSoon: '개봉 예정',
    inTheaters: '상영관',
    viewDetails: '상세 보기',
    viewAllMovies: '모든 영화 보기',
    nowPlayingSubtitle: '영화를 고르고 상영관을 선택한 뒤 몇 번의 탭으로 좌석을 예약하세요.',
    comingSoonSubtitle: '예고편, 알림, 사전 판매 티켓을 위한 개봉 예정작입니다.',
    footerTagline:
      '엄선된 상영 시간, 편안한 상영관, 빠른 결제, 그리고 불이 꺼지기 전에 준비되는 e-티켓의 프리미엄 관람 경험.',
    footerCopyright: 'KADA 프로젝트용 예매 데모입니다.',
    minutes: '분',
    buyTickets: '티켓 구매',
    watchTrailer: '예고편 보기',
    closeTrailer: '닫기',
    story: '스토리',
    synopsis: '줄거리',
    director: '감독',
    cast: '출연',
    toBeAnnounced: '추후 공개',
    movieNotFound: '영화를 찾을 수 없습니다',
    backToMovies: '영화 목록으로',
    bookNow: '지금 예매',
    selectShowtime: '상영 시간 선택',
    estFinish: '예상 종료',
    noUpcomingShowtimes: '이 날짜에는 예정된 상영이 없습니다.',
    continueToSeats: '좌석 선택으로',
    noShowtimesYet: '아직 상영 시간이 없습니다',
    noShowtimesHint: '곧 가능한 회차를 다시 확인해 주세요.',
    welcomeBack: '다시 오신 것을 환영합니다',
    signInSubtitle: '사용자 또는 관리자로 로그인하여 계속하세요',
    orContinueWithEmail: '또는 이메일로 계속',
    emailAddress: '이메일 주소',
    password: '비밀번호',
    forgotPasswordLink: '비밀번호를 잊으셨나요?',
    enterEmail: '이메일을 입력하세요',
    enterPassword: '비밀번호를 입력하세요',
    dontHaveAccount: '계정이 없으신가요?',
    createAccount: '계정 만들기',
    createAccountTitle: '계정 만들기',
    registerSubtitle: '가입하고 좋아하는 영화를 예매하세요',
    fullName: '이름',
    enterFullName: '이름을 입력하세요',
    confirmPassword: '비밀번호 확인',
    enterConfirmPassword: '비밀번호를 다시 입력하세요',
    alreadyHaveAccount: '이미 계정이 있으신가요?',
    forgotPasswordTitle: '비밀번호 찾기',
    forgotPasswordSubtitle: '이메일을 입력하시면 재설정 링크를 보내드립니다',
    sendResetLink: '재설정 링크 보내기',
    checkYourEmail: '이메일을 확인하세요',
    resetEmailSent: '등록된 이메일이라면 비밀번호 재설정 링크가 발송되었습니다. 받은편지함을 확인하세요.',
    backToSignIn: '로그인으로 돌아가기',
    emailRequired: '이메일은 필수입니다',
    invalidEmail: '유효하지 않은 이메일 주소입니다',
    passwordRequired: '비밀번호는 필수입니다',
    passwordMinLength: '비밀번호는 최소 8자 이상이어야 합니다',
    fullNameRequired: '이름은 필수입니다',
    nameMaxLength: '이름은 최대 100자까지입니다',
    confirmPasswordRequired: '비밀번호를 확인해 주세요',
    passwordsDoNotMatch: '비밀번호가 일치하지 않습니다',
    emailAlreadyRegistered: '이미 등록된 이메일입니다',
    registrationFailed: '회원가입에 실패했습니다',
    registrationSuccessful: '회원가입이 완료되었습니다!',
    tryAgainError: '오류가 발생했습니다. 다시 시도해 주세요.',
    invalidCredentials: '이메일 또는 비밀번호가 올바르지 않습니다',
    googleLoginFailed: 'Google 로그인에 실패했습니다. 다시 시도해 주세요.',
    googleSessionExpired: 'Google 세션이 만료되었습니다. 다시 시도해 주세요.',
    googleEmailNotVerified: 'Google 이메일이 인증되지 않았습니다.',
    googleTooManyAttempts: '시도 횟수가 너무 많습니다. 15분 후 다시 시도해 주세요.',
    googleCancelled: 'Google 로그인이 취소되었거나 실패했습니다.',
    unableToConnect: '서버에 연결할 수 없습니다. 연결을 확인해 주세요.',
    welcomeBackToast: '다시 오신 것을 환영합니다!',
    resetPasswordSuccessToast: '비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해 주세요.',
    adminPanel: '관리자 패널',
    adminNavDashboard: '대시보드',
    adminNavMovies: '영화',
    adminNavCarousel: '캐러셀',
    adminNavCities: '도시',
    adminNavCinemas: '영화관',
    adminNavHalls: '상영관',
    adminNavShowtimes: '상영 시간',
    adminNavFnB: 'F&B',
    adminNavUsers: '사용자',
    adminNavBookings: '예매',
    adminNavReports: '보고서',
    backToCinema: '시네마로 돌아가기',
    administrator: '관리자',
    welcomeBackAdmin: '다시 오신 것을 환영합니다',
    expandSidebar: '사이드바 펼치기',
    collapseSidebar: '사이드바 접기',
    openMenu: '메뉴 열기',
    closeMenu: '메뉴 닫기',
    dashboardOverview: '영화관 관리 시스템 개요',
    revenue: '매출',
    thisWeek: '이번 주',
    dailyAvg: '일평균',
    revenueOverview: '매출 개요',
    noRevenueData: '매출 데이터가 없습니다.',
    quickActions: '빠른 작업',
    addNewMovie: '새 영화 추가',
    createShowtime: '상영 시간 만들기',
    manageCarousel: '캐러셀 관리',
    manageUsers: '사용자 관리',
    systemStatus: '시스템 상태',
    database: '데이터베이스',
    apiService: 'API 서비스',
    bookingSystem: '예매 시스템',
    online: '온라인',
    running: '실행 중',
    activeStatus: '활성',
    recentBookings: '최근 예매',
    noBookingsYet: '아직 예매가 없습니다.',
    popularMovies: '인기 영화',
    seats: '좌석',
    noConfirmedBookings: '확정된 예매가 아직 없습니다.',
    confirmDeletion: '삭제 확인',
    editMovie: '영화 수정',
    editHall: '상영관 수정',
    addNewHall: '새 상영관 추가',
    editCity: '도시 수정',
    addNewCity: '새 도시 추가',
    editCinema: '영화관 수정',
    addNewCinema: '새 영화관 추가',
    editShowtime: '상영 시간 수정',
    addNewShowtime: '새 상영 시간 추가',
    editUser: '사용자 수정',
    addNewUser: '새 사용자 추가',
    editCarouselItem: '캐러셀 항목 수정',
    addNewCarouselItem: '새 캐러셀 항목 추가',
    editFoodItem: 'F&B 항목 수정',
    addNewFoodItem: '새 F&B 항목 추가',
    foodAndBeverage: '식음료',
    deleteFnBItem: 'F&B 항목 삭제',
    bookingDetails: '예매 상세',
    bookingNotFound: '예매를 찾을 수 없습니다',
    customerInfo: '고객 정보',
    weeklyRevenue: '주간 매출',
    foodItems: '음식 항목',
    accountInformation: '계정 정보',
    role: '역할',
    bookingSummary: '예매 요약',
    totalBookings: '총 예매',
    confirmed: '확정',
    cancelled: '취소됨',
    viewMyBookings: '내 예매 보기',
    accountActions: '계정 작업',
    adminDashboard: '관리자 대시보드',
    manageBookingsHint: '이 페이지에서 예매와 계정 정보를 관리하세요.',
    roleAdmin: '관리자',
    roleUser: '사용자',
    fnbEyebrow: '스낵 & 음료',
    fnbTitle: '영화와 함께 즐기는 특별한 스낵',
    fnbSubtitle: '따뜻하고 바삭한 팝콘과 시원한 음료, 알찬 콤보 세트로 영화를 더욱 특별하게 즐겨보세요.',
    fnbSpecialPromo: '스페셜 콤보',
    fnbBannerTitle: '시그니처 시네마 콤보',
    fnbBannerDesc: '고소한 버터 팝콘과 시원한 음료의 완벽한 조합, 특별 할인가로 만나보세요.',
    fnbStartingFrom: '시작가',
    fnbExploreMenu: '티켓 & 스낵 예약',
  },
}

export type { TranslationKey }

export function translate(language: Language, key: TranslationKey): string {
  return dictionaries[language][key] ?? dictionaries.en[key] ?? key
}
