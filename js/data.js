// Isi program "Jadwal Gym Mingguan": 3 hari beban (Dorong, Tarik, Kaki), 3 set tiap gerakan.
// Semua angka di sini bisa diubah tanpa menyentuh logika aplikasi.

export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const TARGETS = {
  kcal: 2400,
  proteinMin: 140,
  proteinMax: 150,
  steps: 8000,
  sleepMin: 7,
  sleepMax: 8,
  waterMin: 2.5,
  waterMax: 3,
  // Laju perubahan berat (kg per minggu yang turun)
  lossRateMin: 0.25,
  lossRateMax: 0.5,
  lossRateTooFast: 0.75,
  lossRateDoctor: 1.0,
};

export const REST_SECONDS = 90;

export const CARDIO = {
  early: { min: 15, max: 20 }, // minggu 1–4
  later: { min: 25, max: 30 }, // mulai minggu 5
  laterFromWeek: 5,
  speed: 5.0,
  incline: '3–6',
};

// slug: { name, machine, muscle, repMin, repMax, timed, perSide, weight, steps, avoid, q }
export const EXERCISES = {
  chestpress: { name: 'Dorong Dada (duduk)', machine: 'Chest Press Machine', muscle: 'Dada, bahu depan, lengan belakang', repMin: 10, repMax: 12,
    steps: ['Atur kursi sampai pegangan sejajar tengah dada.', 'Tarik bahu ke belakang dan bawah.', 'Dorong ke depan, kembalikan pelan 2–3 detik.'],
    avoid: 'Siku melebar lurus ke samping. Jaga sekitar 45–60° dari badan.', q: 'chest press machine' },
  incline: { name: 'Dorong Dada Atas', machine: 'Incline Dumbbell Press', muscle: 'Dada bagian atas', repMin: 10, repMax: 12,
    steps: ['Atur sandaran bangku agak miring, sekitar 30°.', 'Pegang dumbbell di samping dada.', 'Dorong ke atas, turunkan pelan.'],
    avoid: 'Mulai terlalu berat. Pakai dumbbell yang bisa kamu angkat ke posisi awal dengan mudah.', q: 'incline dumbbell press' },
  shoulder: { name: 'Dorong ke Atas Kepala', machine: 'Shoulder Press Machine', muscle: 'Bahu', repMin: 10, repMax: 12,
    steps: ['Atur kursi sampai pegangan sejajar bahu.', 'Punggung menempel sandaran.', 'Dorong ke atas, turunkan pelan.'],
    avoid: 'Punggung bawah melengkung dari sandaran.', q: 'shoulder press machine' },
  lateral: { name: 'Angkat Tangan ke Samping', machine: 'Lateral Raise', muscle: 'Bahu samping', repMin: 12, repMax: 15,
    steps: ['Berdiri, dumbbell ringan di samping badan.', 'Angkat ke samping dengan siku sedikit menekuk.', 'Berhenti setinggi bahu, turunkan pelan.'],
    avoid: 'Mengayun badan. Kalau begitu, bebannya terlalu berat.', q: 'lateral raise dumbbell' },
  pushdown: { name: 'Tekan Kabel ke Bawah', machine: 'Triceps Pushdown', muscle: 'Lengan belakang', repMin: 10, repMax: 12,
    steps: ['Berdiri menghadap kabel, pegang tali atau palang.', 'Siku menempel di samping badan.', 'Tekan ke bawah sampai lurus, naikkan pelan.'],
    avoid: 'Siku ikut maju-mundur atau badan membungkuk menekan.', q: 'triceps pushdown' },
  pulldown: { name: 'Tarik Palang ke Dada', machine: 'Lat Pulldown', muscle: 'Punggung samping', repMin: 10, repMax: 12,
    steps: ['Duduk, kunci paha di bawah bantalan.', 'Pegang palang lebih lebar dari bahu.', 'Tarik ke dada atas, naikkan pelan.'],
    avoid: 'Menarik palang ke belakang leher.', q: 'lat pulldown' },
  cablerow: { name: 'Tarik Kabel (duduk)', machine: 'Seated Cable Row', muscle: 'Punggung tengah', repMin: 10, repMax: 12,
    steps: ['Duduk tegak, kaki di pijakan, lutut sedikit menekuk.', 'Tarik pegangan ke perut.', 'Rapatkan tulang belikat, lalu lepas pelan.'],
    avoid: 'Mengayun badan ke belakang untuk membantu menarik.', q: 'seated cable row' },
  row: { name: 'Tarik Dumbbell Satu Tangan', machine: 'One-Arm Dumbbell Row', muscle: 'Punggung', repMin: 10, repMax: 12, perSide: true,
    steps: ['Satu lutut dan satu tangan bertumpu di bangku.', 'Punggung lurus, dumbbell menggantung.', 'Tarik siku ke arah pinggang, turunkan pelan.'],
    avoid: 'Punggung melengkung atau badan memutar.', q: 'one arm dumbbell row' },
  curl: { name: 'Angkat Dumbbell ke Bahu', machine: 'Dumbbell Curl', muscle: 'Lengan depan (bisep)', repMin: 10, repMax: 12,
    steps: ['Berdiri, dumbbell di samping badan, telapak menghadap depan.', 'Tekuk siku, angkat ke arah bahu.', 'Turunkan pelan 2–3 detik.'],
    avoid: 'Mengayun badan atau siku maju ke depan.', q: 'dumbbell curl' },
  legpress: { name: 'Dorong Kaki', machine: 'Leg Press', muscle: 'Paha dan bokong', repMin: 10, repMax: 12,
    steps: ['Duduk, punggung menempel sandaran.', 'Telapak kaki rata di papan, selebar bahu.', 'Dorong pelan, lalu tekuk kembali.'],
    avoid: 'Mengunci lutut sampai lurus total saat mendorong.', q: 'leg press' },
  goblet: { name: 'Jongkok Bawa Dumbbell', machine: 'Goblet Squat', muscle: 'Paha dan bokong', repMin: 10, repMax: 12,
    steps: ['Pegang satu dumbbell tegak di depan dada.', 'Kaki selebar bahu, turun seperti mau duduk.', 'Dorong lewat tumit untuk berdiri.'],
    avoid: 'Tumit terangkat atau lutut masuk ke dalam.', q: 'goblet squat' },
  legcurl: { name: 'Tekuk Kaki Tengkurap', machine: 'Lying Leg Curl', muscle: 'Paha belakang', repMin: 10, repMax: 12,
    steps: ['Tengkurap, bantalan di atas pergelangan kaki.', 'Tekuk kaki ke arah bokong.', 'Luruskan pelan.'],
    avoid: 'Pinggul terangkat dari bangku.', q: 'lying leg curl' },
  deadbug: { name: 'Serangga Terbalik', machine: 'Dead Bug', muscle: 'Otot perut dalam', repMin: 8, repMax: 8, perSide: true, weight: false,
    steps: ['Berbaring, tangan ke atas, lutut membentuk sudut siku.', 'Tekan punggung bawah ke matras.', 'Julurkan tangan dan kaki yang berlawanan, kembali, ganti sisi.'],
    avoid: 'Punggung bawah terangkat dari matras.', q: 'dead bug exercise' },
  plank: { name: 'Tahan Badan Lurus', machine: 'Plank', muscle: 'Perut dan core', repMin: 20, repMax: 30, timed: true, weight: false,
    steps: ['Tumpu pada lengan bawah dan ujung kaki.', 'Kencangkan perut dan bokong.', 'Napas tetap jalan.'],
    avoid: 'Pinggul turun atau menungging terlalu tinggi.', q: 'plank' },
  revcrunch: { name: 'Angkat Pinggul Berbaring', machine: 'Reverse Crunch', muscle: 'Perut', repMin: 10, repMax: 12, weight: false,
    steps: ['Berbaring, lutut menekuk, tangan di lantai.', 'Gulung pinggul sedikit dari lantai, bawa lutut ke dada.', 'Turunkan pelan.'],
    avoid: 'Mengayun kaki memakai momentum.', q: 'reverse crunch' },
};

// Lengkapi nilai bawaan
for (const [slug, e] of Object.entries(EXERCISES)) {
  e.slug = slug;
  e.timed = !!e.timed;
  e.perSide = !!e.perSide;
  e.weight = e.weight !== false;
}

// Urutan tetap: Dorong → Tarik → Kaki. dow: 0 = Minggu ... 6 = Sabtu
export const ROUTINES = [
  { slug: 'dorong', name: 'Dorong', focus: 'Dada · bahu · lengan belakang', dow: 1, sets: 3, list: ['chestpress', 'incline', 'shoulder', 'lateral', 'pushdown', 'plank'] },
  { slug: 'tarik', name: 'Tarik', focus: 'Punggung · lengan depan · perut', dow: 3, sets: 3, list: ['pulldown', 'cablerow', 'row', 'curl', 'deadbug'] },
  { slug: 'kaki', name: 'Kaki', focus: 'Paha · bokong · perut', dow: 5, sets: 3, list: ['legpress', 'goblet', 'legcurl', 'revcrunch', 'plank'] },
];

// Protein per menu dari program; kalori per menu perkiraan kasar supaya totalnya ±2.400 kkal.
export const MEALS = {
  sarapan: { label: 'Sarapan', menu: '3 telur rebus atau dadar, nasi 150 g (atau 2 roti gandum), 1 pisang', protein: 26, kcal: 550 },
  siang: { label: 'Siang', menu: 'Nasi 250 g, ayam bakar atau rebus 150 g, tempe 50 g, sayur', protein: 61, kcal: 750 },
  camilan: { label: 'Camilan / sebelum gym', menu: '1 pisang, susu 250 ml, segenggam kacang (30 g)', protein: 16, kcal: 425 },
  malam: { label: 'Malam', menu: 'Nasi 200 g, ikan atau ayam 150 g, tahu 100 g, sayur', protein: 47, kcal: 675 },
};

export const SWAPS = [
  ['2 telur', 12],
  ['Dada ayam matang 100 g', 31],
  ['Paha ayam tanpa kulit 100 g', 25],
  ['Ikan (nila, tongkol, lele bakar) 100 g', 22],
  ['Daging sapi 100 g', 26],
  ['Tempe 100 g', 19],
  ['Tahu 100 g', 8],
];

// Lauk warteg: perkiraan per porsi warteg biasa [nama, protein g, kkal]. Bukan data gizi resmi.
export const WARTEG = {
  'Lauk hewani': [
    ['Ayam bakar / goreng, 1 potong', 20, 230],
    ['Ayam dada goreng, 1 potong besar', 25, 280],
    ['Ayam opor, 1 potong', 18, 250],
    ['Telur balado / dadar, 1 butir', 6, 120],
    ['Ikan tongkol balado, 1 potong', 15, 150],
    ['Ikan kembung goreng, 1 ekor', 18, 200],
    ['Lele goreng, 1 ekor', 13, 240],
    ['Pindang / pepes ikan, 1 potong', 15, 130],
    ['Semur / rendang daging, 1 potong', 12, 180],
    ['Ati ampela, 1 pasang', 11, 150],
    ['Udang balado, 1 porsi', 10, 130],
    ['Cumi cabe hijau, 1 porsi', 9, 120],
  ],
  'Lauk nabati': [
    ['Tempe orek / goreng, 2 potong', 9, 160],
    ['Tahu goreng / bacem, 2 potong', 7, 150],
  ],
  'Nasi & sayur': [
    ['Nasi, 1 porsi warteg', 5, 260],
    ['Nasi, ½ porsi', 3, 130],
    ['Sayur asem / sayur bening', 1, 40],
    ['Tumis kangkung / capcay / buncis', 2, 90],
    ['Terong balado', 1, 150],
  ],
};

export const WARTEG_TIPS = [
  'Pola aman: nasi 1 porsi + 2 lauk hewani + tempe atau tahu + sayur.',
  'Pilih bakar, pindang, semur, balado. Gorengan tepung (bakwan, tahu isi) dan perkedel bukan sumber protein.',
  'Kuah santan kental dan sambal minyak secukupnya; minta kuah sedikit.',
  'Minum air putih atau teh tawar, bukan es teh manis.',
  'Kalau siang cuma dapat ±40 g protein, tambah telur rebus atau susu di camilan.',
];

export const GUIDE_URL = 'https://claude.ai/artifact/a1dd331c-61f1-4609-9274-3be6804afcd2';
