<?php

namespace Database\Seeders;

use App\Models\Exercise;
use App\Models\Routine;
use Illuminate\Database\Seeder;

/**
 * Isi program dari "Jadwal Gym Mingguan": 3 hari beban (Dorong, Tarik, Kaki),
 * 3 set tiap gerakan. Aman dijalankan ulang (updateOrCreate).
 */
class ProgramSeeder extends Seeder
{
    public function run(): void
    {
        $exercises = [
            'chestpress' => ['Dorong Dada (duduk)', 'Chest Press Machine', 'Dada, bahu depan, lengan belakang', 10, 12,
                ['Atur kursi sampai pegangan sejajar tengah dada.', 'Tarik bahu ke belakang dan bawah.', 'Dorong ke depan, kembalikan pelan 2–3 detik.'],
                'Siku melebar lurus ke samping. Jaga sekitar 45–60° dari badan.', 'chest press machine'],
            'incline' => ['Dorong Dada Atas', 'Incline Dumbbell Press', 'Dada bagian atas', 10, 12,
                ['Atur sandaran bangku agak miring, sekitar 30°.', 'Pegang dumbbell di samping dada.', 'Dorong ke atas, turunkan pelan.'],
                'Mulai terlalu berat. Pakai dumbbell yang bisa kamu angkat ke posisi awal dengan mudah.', 'incline dumbbell press'],
            'shoulder' => ['Dorong ke Atas Kepala', 'Shoulder Press Machine', 'Bahu', 10, 12,
                ['Atur kursi sampai pegangan sejajar bahu.', 'Punggung menempel sandaran.', 'Dorong ke atas, turunkan pelan.'],
                'Punggung bawah melengkung dari sandaran.', 'shoulder press machine'],
            'lateral' => ['Angkat Tangan ke Samping', 'Lateral Raise', 'Bahu samping', 12, 15,
                ['Berdiri, dumbbell ringan di samping badan.', 'Angkat ke samping dengan siku sedikit menekuk.', 'Berhenti setinggi bahu, turunkan pelan.'],
                'Mengayun badan. Kalau begitu, bebannya terlalu berat.', 'lateral raise dumbbell'],
            'pushdown' => ['Tekan Kabel ke Bawah', 'Triceps Pushdown', 'Lengan belakang', 10, 12,
                ['Berdiri menghadap kabel, pegang tali atau palang.', 'Siku menempel di samping badan.', 'Tekan ke bawah sampai lurus, naikkan pelan.'],
                'Siku ikut maju-mundur atau badan membungkuk menekan.', 'triceps pushdown'],
            'pulldown' => ['Tarik Palang ke Dada', 'Lat Pulldown', 'Punggung samping', 10, 12,
                ['Duduk, kunci paha di bawah bantalan.', 'Pegang palang lebih lebar dari bahu.', 'Tarik ke dada atas, naikkan pelan.'],
                'Menarik palang ke belakang leher.', 'lat pulldown'],
            'cablerow' => ['Tarik Kabel (duduk)', 'Seated Cable Row', 'Punggung tengah', 10, 12,
                ['Duduk tegak, kaki di pijakan, lutut sedikit menekuk.', 'Tarik pegangan ke perut.', 'Rapatkan tulang belikat, lalu lepas pelan.'],
                'Mengayun badan ke belakang untuk membantu menarik.', 'seated cable row'],
            'row' => ['Tarik Dumbbell Satu Tangan', 'One-Arm Dumbbell Row', 'Punggung', 10, 12,
                ['Satu lutut dan satu tangan bertumpu di bangku.', 'Punggung lurus, dumbbell menggantung.', 'Tarik siku ke arah pinggang, turunkan pelan.'],
                'Punggung melengkung atau badan memutar.', 'one arm dumbbell row', ['per_side' => true]],
            'curl' => ['Angkat Dumbbell ke Bahu', 'Dumbbell Curl', 'Lengan depan (bisep)', 10, 12,
                ['Berdiri, dumbbell di samping badan, telapak menghadap depan.', 'Tekuk siku, angkat ke arah bahu.', 'Turunkan pelan 2–3 detik.'],
                'Mengayun badan atau siku maju ke depan.', 'dumbbell curl'],
            'legpress' => ['Dorong Kaki', 'Leg Press', 'Paha dan bokong', 10, 12,
                ['Duduk, punggung menempel sandaran.', 'Telapak kaki rata di papan, selebar bahu.', 'Dorong pelan, lalu tekuk kembali.'],
                'Mengunci lutut sampai lurus total saat mendorong.', 'leg press'],
            'goblet' => ['Jongkok Bawa Dumbbell', 'Goblet Squat', 'Paha dan bokong', 10, 12,
                ['Pegang satu dumbbell tegak di depan dada.', 'Kaki selebar bahu, turun seperti mau duduk.', 'Dorong lewat tumit untuk berdiri.'],
                'Tumit terangkat atau lutut masuk ke dalam.', 'goblet squat'],
            'legcurl' => ['Tekuk Kaki Tengkurap', 'Lying Leg Curl', 'Paha belakang', 10, 12,
                ['Tengkurap, bantalan di atas pergelangan kaki.', 'Tekuk kaki ke arah bokong.', 'Luruskan pelan.'],
                'Pinggul terangkat dari bangku.', 'lying leg curl'],
            'deadbug' => ['Serangga Terbalik', 'Dead Bug', 'Otot perut dalam', 8, 8,
                ['Berbaring, tangan ke atas, lutut membentuk sudut siku.', 'Tekan punggung bawah ke matras.', 'Julurkan tangan dan kaki yang berlawanan, kembali, ganti sisi.'],
                'Punggung bawah terangkat dari matras.', 'dead bug exercise', ['per_side' => true, 'uses_weight' => false]],
            'plank' => ['Tahan Badan Lurus', 'Plank', 'Perut dan core', 20, 30,
                ['Tumpu pada lengan bawah dan ujung kaki.', 'Kencangkan perut dan bokong.', 'Napas tetap jalan.'],
                'Pinggul turun atau menungging terlalu tinggi.', 'plank', ['is_timed' => true, 'uses_weight' => false]],
            'revcrunch' => ['Angkat Pinggul Berbaring', 'Reverse Crunch', 'Perut', 10, 12,
                ['Berbaring, lutut menekuk, tangan di lantai.', 'Gulung pinggul sedikit dari lantai, bawa lutut ke dada.', 'Turunkan pelan.'],
                'Mengayun kaki memakai momentum.', 'reverse crunch', ['uses_weight' => false]],
        ];

        $ids = [];
        foreach ($exercises as $slug => $e) {
            $flags = $e[8] ?? [];
            $ids[$slug] = Exercise::updateOrCreate(['slug' => $slug], [
                'name' => $e[0],
                'machine_name' => $e[1],
                'muscle' => $e[2],
                'rep_min' => $e[3],
                'rep_max' => $e[4],
                'steps' => $e[5],
                'avoid' => $e[6],
                'video_query' => $e[7],
                'is_timed' => $flags['is_timed'] ?? false,
                'per_side' => $flags['per_side'] ?? false,
                'uses_weight' => $flags['uses_weight'] ?? true,
            ])->id;
        }

        $routines = [
            ['dorong', 'Dorong', 'Dada · bahu · lengan belakang', 1, 1, ['chestpress', 'incline', 'shoulder', 'lateral', 'pushdown', 'plank']],
            ['tarik', 'Tarik', 'Punggung · lengan depan · perut', 3, 2, ['pulldown', 'cablerow', 'row', 'curl', 'deadbug']],
            ['kaki', 'Kaki', 'Paha · bokong · perut', 5, 3, ['legpress', 'goblet', 'legcurl', 'revcrunch', 'plank']],
        ];

        foreach ($routines as [$slug, $name, $focus, $dow, $pos, $list]) {
            $routine = Routine::updateOrCreate(['slug' => $slug], [
                'name' => $name, 'focus' => $focus, 'day_of_week' => $dow, 'position' => $pos,
            ]);
            $routine->exercises()->sync(collect($list)->mapWithKeys(fn ($s, $i) => [
                $ids[$s] => ['position' => $i + 1, 'sets' => 3],
            ])->all());
        }
    }
}
