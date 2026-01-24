<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $chaptersData = [
            ["id" => 1, "transliteration" => "Al-Fatihah"],
            ["id" => 2, "transliteration" => "Al-Baqarah"],
            ["id" => 3, "transliteration" => "Ali 'Imran"],
            ["id" => 4, "transliteration" => "An-Nisa"],
            ["id" => 5, "transliteration" => "Al-Ma'idah"],
            ["id" => 6, "transliteration" => "Al-An'am"],
            ["id" => 7, "transliteration" => "Al-A'raf"],
            ["id" => 8, "transliteration" => "Al-Anfal"],
            ["id" => 9, "transliteration" => "At-Tawbah"],
            ["id" => 10, "transliteration" => "Yunus"],
            ["id" => 11, "transliteration" => "Hud"],
            ["id" => 12, "transliteration" => "Yusuf"],
            ["id" => 13, "transliteration" => "Ar-Ra'd"],
            ["id" => 14, "transliteration" => "Ibrahim"],
            ["id" => 15, "transliteration" => "Al-Hijr"],
            ["id" => 16, "transliteration" => "An-Nahl"],
            ["id" => 17, "transliteration" => "Al-Isra"],
            ["id" => 18, "transliteration" => "Al-Kahf"],
            ["id" => 19, "transliteration" => "Maryam"],
            ["id" => 20, "transliteration" => "Taha"],
            ["id" => 21, "transliteration" => "Al-Anbya"],
            ["id" => 22, "transliteration" => "Al-Hajj"],
            ["id" => 23, "transliteration" => "Al-Mu'minun"],
            ["id" => 24, "transliteration" => "An-Nur"],
            ["id" => 25, "transliteration" => "Al-Furqan"],
            ["id" => 26, "transliteration" => "Ash-Shu'ara"],
            ["id" => 27, "transliteration" => "An-Naml"],
            ["id" => 28, "transliteration" => "Al-Qasas"],
            ["id" => 29, "transliteration" => "Al-'Ankabut"],
            ["id" => 30, "transliteration" => "Ar-Rum"],
            ["id" => 31, "transliteration" => "Luqman"],
            ["id" => 32, "transliteration" => "As-Sajdah"],
            ["id" => 33, "transliteration" => "Al-Ahzab"],
            ["id" => 34, "transliteration" => "Saba"],
            ["id" => 35, "transliteration" => "Fatir"],
            ["id" => 36, "transliteration" => "Ya-Sin"],
            ["id" => 37, "transliteration" => "As-Saffat"],
            ["id" => 38, "transliteration" => "Sad"],
            ["id" => 39, "transliteration" => "Az-Zumar"],
            ["id" => 40, "transliteration" => "Ghafir"],
            ["id" => 41, "transliteration" => "Fussilat"],
            ["id" => 42, "transliteration" => "Ash-Shuraa"],
            ["id" => 43, "transliteration" => "Az-Zukhruf"],
            ["id" => 44, "transliteration" => "Ad-Dukhan"],
            ["id" => 45, "transliteration" => "Al-Jathiyah"],
            ["id" => 46, "transliteration" => "Al-Ahqaf"],
            ["id" => 47, "transliteration" => "Muhammad"],
            ["id" => 48, "transliteration" => "Al-Fath"],
            ["id" => 49, "transliteration" => "Al-Hujurat"],
            ["id" => 50, "transliteration" => "Qaf"],
            ["id" => 51, "transliteration" => "Adh-Dhariyat"],
            ["id" => 52, "transliteration" => "At-Tur"],
            ["id" => 53, "transliteration" => "An-Najm"],
            ["id" => 54, "transliteration" => "Al-Qamar"],
            ["id" => 55, "transliteration" => "Ar-Rahman"],
            ["id" => 56, "transliteration" => "Al-Waqi'ah"],
            ["id" => 57, "transliteration" => "Al-Hadid"],
            ["id" => 58, "transliteration" => "Al-Mujadila"],
            ["id" => 59, "transliteration" => "Al-Hashr"],
            ["id" => 60, "transliteration" => "Al-Mumtahanah"],
            ["id" => 61, "transliteration" => "As-Saf"],
            ["id" => 62, "transliteration" => "Al-Jumu'ah"],
            ["id" => 63, "transliteration" => "Al-Munafiqun"],
            ["id" => 64, "transliteration" => "At-Taghabun"],
            ["id" => 65, "transliteration" => "At-Talaq"],
            ["id" => 66, "transliteration" => "At-Tahrim"],
            ["id" => 67, "transliteration" => "Al-Mulk"],
            ["id" => 68, "transliteration" => "Al-Qalam"],
            ["id" => 69, "transliteration" => "Al-Haqqah"],
            ["id" => 70, "transliteration" => "Al-Ma'arij"],
            ["id" => 71, "transliteration" => "Nuh"],
            ["id" => 72, "transliteration" => "Al-Jinn"],
            ["id" => 73, "transliteration" => "Al-Muzzammil"],
            ["id" => 74, "transliteration" => "Al-Muddaththir"],
            ["id" => 75, "transliteration" => "Al-Qiyamah"],
            ["id" => 76, "transliteration" => "Al-Insan"],
            ["id" => 77, "transliteration" => "Al-Mursalat"],
            ["id" => 78, "transliteration" => "An-Naba"],
            ["id" => 79, "transliteration" => "An-Nazi'at"],
            ["id" => 80, "transliteration" => "'Abasa"],
            ["id" => 81, "transliteration" => "At-Takwir"],
            ["id" => 82, "transliteration" => "Al-Infitar"],
            ["id" => 83, "transliteration" => "Al-Mutaffifin"],
            ["id" => 84, "transliteration" => "Al-Inshiqaq"],
            ["id" => 85, "transliteration" => "Al-Buruj"],
            ["id" => 86, "transliteration" => "At-Tariq"],
            ["id" => 87, "transliteration" => "Al-A'la"],
            ["id" => 88, "transliteration" => "Al-Ghashiyah"],
            ["id" => 89, "transliteration" => "Al-Fajr"],
            ["id" => 90, "transliteration" => "Al-Balad"],
            ["id" => 91, "transliteration" => "Ash-Shams"],
            ["id" => 92, "transliteration" => "Al-Layl"],
            ["id" => 93, "transliteration" => "Ad-Duhaa"],
            ["id" => 94, "transliteration" => "Ash-Sharh"],
            ["id" => 95, "transliteration" => "At-Tin"],
            ["id" => 96, "transliteration" => "Al-'Alaq"],
            ["id" => 97, "transliteration" => "Al-Qadr"],
            ["id" => 98, "transliteration" => "Al-Bayyinah"],
            ["id" => 99, "transliteration" => "Az-Zalzalah"],
            ["id" => 100, "transliteration" => "Al-'Adiyat"],
            ["id" => 101, "transliteration" => "Al-Qari'ah"],
            ["id" => 102, "transliteration" => "At-Takathur"],
            ["id" => 103, "transliteration" => "Al-'Asr"],
            ["id" => 104, "transliteration" => "Al-Humazah"],
            ["id" => 105, "transliteration" => "Al-Fil"],
            ["id" => 106, "transliteration" => "Quraysh"],
            ["id" => 107, "transliteration" => "Al-Ma'un"],
            ["id" => 108, "transliteration" => "Al-Kawthar"],
            ["id" => 109, "transliteration" => "Al-Kafirun"],
            ["id" => 110, "transliteration" => "An-Nasr"],
            ["id" => 111, "transliteration" => "Al-Masad"],
            ["id" => 112, "transliteration" => "Al-Ikhlas"],
            ["id" => 113, "transliteration" => "Al-Falaq"],
            ["id" => 114, "transliteration" => "An-Nas"],
        ];

        foreach ($chaptersData as $data) {
            \Illuminate\Support\Facades\DB::table('chapters')
                ->where('id', $data['id'])
                ->update(['name_roman' => $data['transliteration']]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \Illuminate\Support\Facades\DB::table('chapters')->update(['name_roman' => '']);
    }
};
