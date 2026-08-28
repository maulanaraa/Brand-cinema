/**
 * Basis pengetahuan FAQ untuk chatbot (bagian "R" dari RAG — Retrieval).
 *
 * Data teks tak terstruktur (kebijakan, prosedur, info umum) yang tidak
 * tersimpan di database. Data live (film, harga, concession) diambil dari MongoDB.
 *
 * Cara menambah pengetahuan: tambahkan objek baru ke array di bawah.
 */

export interface FaqEntry {
  id: string;
  topic: string;
  question: string;
  answer: string;
  keywords: string[];
}

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: 'refund',
    topic: 'Refund & Pembatalan',
    question: 'Bagaimana kebijakan refund dan pembatalan tiket?',
    answer:
      'Tiket yang sudah dibayar dapat di-refund maksimal 2 jam sebelum jam tayang. ' +
      'Refund diproses ke metode pembayaran asal dalam 3–7 hari kerja. ' +
      'Pembatalan kurang dari 2 jam sebelum tayang tidak dapat di-refund. ' +
      'Untuk mengajukan refund, buka menu Pesanan Saya lalu pilih tiket yang ingin dibatalkan.',
    keywords: ['refund', 'batal', 'pembatalan', 'uang kembali', 'cancel', 'dana kembali', 'kembalikan'],
  },
  {
    id: 'payment',
    topic: 'Pembayaran',
    question: 'Metode pembayaran apa saja yang tersedia?',
    answer:
      'Kami menerima pembayaran melalui Midtrans yang mendukung kartu kredit/debit, ' +
      'transfer bank (Virtual Account BCA, BNI, Mandiri, dll), e-wallet (GoPay, ShopeePay, dll), ' +
      'dan gerai retail (Alfamart/Indomaret). Pembayaran harus diselesaikan sebelum batas waktu ' +
      'yang tertera, atau pesanan otomatis dibatalkan dan kursi dilepas kembali.',
    keywords: ['bayar', 'pembayaran', 'payment', 'midtrans', 'gopay', 'transfer', 'kartu', 'e-wallet', 'virtual account', 'va'],
  },
  {
    id: 'booking',
    topic: 'Cara Pemesanan',
    question: 'Bagaimana cara memesan tiket?',
    answer:
      'Untuk memesan tiket: (1) pilih film yang sedang tayang, (2) pilih jadwal dan studio, ' +
      '(3) pilih kursi, (4) tambahkan snack bila mau, (5) lakukan pembayaran. ' +
      'Setelah pembayaran berhasil, e-tiket beserta QR code akan tersedia di menu Pesanan Saya ' +
      'dan dikirim ke email Anda.',
    keywords: ['pesan', 'booking', 'beli tiket', 'cara memesan', 'order', 'reservasi', 'pesan tiket'],
  },
  {
    id: 'eticket',
    topic: 'E-Tiket & QR Code',
    question: 'Bagaimana cara menggunakan e-tiket?',
    answer:
      'Setelah pembayaran sukses, Anda mendapat e-tiket dengan QR code di menu Pesanan Saya. ' +
      'Tunjukkan QR code tersebut di pintu masuk studio untuk dipindai petugas. ' +
      'Tidak perlu mencetak tiket fisik. Datang minimal 15 menit sebelum jam tayang.',
    keywords: ['tiket', 'e-tiket', 'qr', 'qr code', 'masuk', 'scan', 'pindai', 'e-ticket'],
  },
  {
    id: 'seat',
    topic: 'Pemilihan Kursi',
    question: 'Bagaimana memilih kursi?',
    answer:
      'Saat memesan, Anda dapat memilih kursi dari denah studio. Kursi berwarna abu-abu sudah terisi ' +
      'dan tidak bisa dipilih. Kursi yang Anda pilih ditandai sementara selama proses pembayaran. ' +
      'Jika pembayaran tidak selesai tepat waktu, kursi otomatis dilepas kembali.',
    keywords: ['kursi', 'seat', 'tempat duduk', 'pilih kursi', 'denah', 'bangku'],
  },
  {
    id: 'account',
    topic: 'Akun',
    question: 'Apakah harus punya akun untuk memesan?',
    answer:
      'Ya, Anda perlu masuk (login) untuk menyelesaikan pemesanan agar e-tiket tersimpan di akun Anda. ' +
      'Anda bisa mendaftar dengan email atau masuk cepat menggunakan akun Google. ' +
      'Lupa password? Gunakan menu Lupa Password di halaman masuk.',
    keywords: ['akun', 'daftar', 'login', 'masuk', 'register', 'password', 'google', 'sign in', 'sign up'],
  },
  {
    id: 'concession',
    topic: 'Makanan & Minuman',
    question: 'Apakah bisa memesan makanan dan minuman?',
    answer:
      'Bisa. Saat proses pemesanan tiket, ada langkah untuk menambahkan snack seperti popcorn, ' +
      'minuman, dan paket combo. Pesanan snack dibayar bersamaan dengan tiket dan dapat diambil ' +
      'di gerai concession bioskop dengan menunjukkan bukti pesanan.',
    keywords: ['makanan', 'minuman', 'snack', 'popcorn', 'combo', 'concession', 'jajan', 'food', 'drink'],
  },
  {
    id: 'hours',
    topic: 'Jam Operasional',
    question: 'Jam berapa bioskop buka?',
    answer:
      'Bioskop buka setiap hari mengikuti jadwal tayang film. Jam tayang paling awal umumnya pukul 11.00 ' +
      'dan tayang terakhir sekitar pukul 21.00–22.00, tergantung durasi film. ' +
      'Silakan cek jadwal masing-masing film untuk jam tayang pastinya.',
    keywords: ['jam', 'buka', 'operasional', 'jam buka', 'tutup', 'jam berapa', 'jadwal buka'],
  },
  {
    id: 'refund-fail',
    topic: 'Pembayaran Gagal',
    question: 'Pembayaran saya gagal / uang terpotong tapi tiket tidak muncul?',
    answer:
      'Jika dana terpotong namun status pesanan belum berhasil, tunggu beberapa menit karena ' +
      'konfirmasi dari penyedia pembayaran kadang tertunda. Status pesanan akan otomatis diperbarui. ' +
      'Jika setelah 1x24 jam tiket tetap tidak muncul sementara dana terpotong, hubungi customer service ' +
      'dengan menyertakan ID pesanan Anda untuk ditelusuri.',
    keywords: ['gagal', 'error', 'terpotong', 'tidak muncul', 'pending', 'bermasalah', 'uang hilang', 'failed'],
  },
];
