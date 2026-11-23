<?php

/*
| Target & menu harian dari program "Jadwal Gym Mingguan".
| Angka protein per menu diambil dari program; kalori per menu adalah perkiraan
| kasar (nasi, lauk, sedikit minyak) supaya totalnya ±2.400 kkal.
*/

return [

    'targets' => [
        'kcal' => 2400,
        'protein_min' => 140,
        'protein_max' => 150,
        'steps' => 8000,
        'sleep_min' => 7,
        'sleep_max' => 8,
        'water_min' => 2.5,
        'water_max' => 3,
        // Laju perubahan berat (kg per minggu, negatif = turun)
        'loss_rate_min' => 0.25,
        'loss_rate_max' => 0.5,
        'loss_rate_too_fast' => 0.75,
        'loss_rate_doctor' => 1.0,
    ],

    'rest_seconds' => 90,

    'cardio' => [
        'early' => ['min' => 15, 'max' => 20],   // minggu 1–4
        'later' => ['min' => 25, 'max' => 30],   // mulai minggu 5
        'later_from_week' => 5,
        'speed' => 5.0,
        'incline' => '3–6',
    ],

    'meals' => [
        'sarapan' => [
            'label' => 'Sarapan',
            'menu' => '3 telur rebus atau dadar, nasi 150 g (atau 2 roti gandum), 1 pisang',
            'protein' => 26,
            'kcal' => 550,
        ],
        'siang' => [
            'label' => 'Siang',
            'menu' => 'Nasi 250 g, ayam bakar atau rebus 150 g, tempe 50 g, sayur',
            'protein' => 61,
            'kcal' => 750,
        ],
        'camilan' => [
            'label' => 'Camilan / sebelum gym',
            'menu' => '1 pisang, susu 250 ml, segenggam kacang (30 g)',
            'protein' => 16,
            'kcal' => 425,
        ],
        'malam' => [
            'label' => 'Malam',
            'menu' => 'Nasi 200 g, ikan atau ayam 150 g, tahu 100 g, sayur',
            'protein' => 47,
            'kcal' => 675,
        ],
    ],

    // Tukar lauk: protein per porsi
    'swaps' => [
        ['2 telur', 12],
        ['Dada ayam matang 100 g', 31],
        ['Paha ayam tanpa kulit 100 g', 25],
        ['Ikan (nila, tongkol, lele bakar) 100 g', 22],
        ['Daging sapi 100 g', 26],
        ['Tempe 100 g', 19],
        ['Tahu 100 g', 8],
    ],

    // Tautan ke panduan gerakan bergambar
    'guide_url' => 'https://claude.ai/artifact/a1dd331c-61f1-4609-9274-3be6804afcd2',
];
