const items = [];

/**
 * @param { number } jumlahBingkisan
 * @param { number } maksimalHargaPerBingkisan 
 * @param { number } minimalJumlahMakanan 
 * @param { number } minimalJumlahMinuman 
 * @returns { Array<Bingkisan> }
 */
function buatAcak(jumlahBingkisan, maksimalHargaPerBingkisan, minimalJumlahMakanan, minimalJumlahMinuman) {
    const daftarJajanan = dapatkanDaftarJajanan().map(o => new Item(
                            o.id, o.nama, o.harga, o.jumlah, o.rasa, o.tipe));

    // Step 1: bangun graf konflik
    const graf = bangunGrafKonflik(daftarJajanan);


    // Step 2: Lakukan pewarnaan dengan algoritma Welsh-Powell
    const hasilWarna = welshPowellColoring(daftarJajanan,graf);

    console.log("Graf konflik:",graf);
    console.log("Hasil Coloring:",hasilWarna)

    // Step 3: Kelompokkan item per warna
    const grupPerWarna = kelompokkanPerWarna(daftarJajanan,hasilWarna);

    // Step 4: Generate subset untuk setiap warna
    const semuaSubsetPerWarna = grupPerWarna.map(grup => generateSubset(grup));

    // Step 5: Combine semua subset jadi daftar semua komninasi
    const semuaKandidat = combineSemuaWarna(semuaSubsetPerWarna);

    // Step 6: Validasi setiap kombinasi
    const kandidatValid = semuaKandidat.filter(k => validasiKombinasi(k, maksimalHargaPerBingkisan, minimalJumlahMakanan, minimalJumlahMinuman));

    console.log("Kandidat valid:",kandidatValid);

    if (kandidatValid.length === 0) {
        console.warn("Tidak ada kombinasi valid.");
        return[];
    }

    // Step 7: Cari kombinasi terbaik
    const best = pilihBestCombination(kandidatValid,maksimalHargaPerBingkisan);

    console.log("Best combination:",best);

    // Step 8: Buat bingkisan final sebanyak jumlahBingkisan
    const bingkisanFinal = buatBingkisanFinal(jumlahBingkisan,kandidatValid,best);

    // Kembalikan semua bingkisan yang sudah terisi

    return bingkisanFinal;
}



function buatAcakDebug(jumlahBingkisan, maksimalHarga, minMakanan, minMinuman) {

    console.log("===== DEBUG: MULAI ALGORITMA =====");

    const daftarJajanan = dapatkanDaftarJajanan();
    console.log("Daftar Jajanan:", daftarJajanan);

    if (daftarJajanan.length === 0) {
        console.warn("Tidak ada jajanan di database.");
        return [];
    }

    // 1. Build graph
    const graf = bangunGrafKonflik(daftarJajanan);
    console.log("Graf Konflik (Adjacency List):", graf);

    // 2. Welsh–Powell Coloring
    const warnaMap = welshPowellColoring(daftarJajanan, graf);
    console.log("Hasil Coloring:", warnaMap);

    // 3. Group by color
    const grupPerWarna = kelompokkanPerWarna(daftarJajanan, warnaMap);
    console.log("Grup per Warna:", grupPerWarna);

    // 4. Subset per warna
    const subsetPerWarna = grupPerWarna.map(grup => generateSubset(grup));
    console.log("Subset per Warna:", subsetPerWarna);

    // 5. Semua kombinasi (cross product)
    const kandidatSemua = combineSemuaWarna(subsetPerWarna);
    console.log("Semua Kandidat Kombinasi:", kandidatSemua);

    // 6. Validasi kombinasi
    const kandidatValid = kandidatSemua.filter(k =>
        validasiKombinasi(k, maksimalHarga, minMakanan, minMinuman)
    );
    console.log("Kandidat Valid:", kandidatValid);

    if (kandidatValid.length === 0) {
        console.warn("Tidak ada kombinasi valid.");
        return [];
    }

    // 7. Best Combination
    const best = pilihBestCombination(kandidatValid, maksimalHarga);
    console.log("BEST Combination:", best);

    // 8. Generate N gift boxes
    const finalBoxes = buatBingkisanFinal(jumlahBingkisan, kandidatValid, best);
    console.log("Bingkisan Final:", finalBoxes);

    console.log("===== DEBUG: SELESAI =====");

    return finalBoxes;
}






/**
 * Membangun adjacency list dari daftar jajanan
 * Representasinya: { <IdItem>: Set(<idTetangga>, ...) }
 * Menggunakan set agar pengecekan menjadi lebih cepat (O(1))
 * 
 * @param {Array<Object>} daftarJajanan - Array objek Item { id, nama, harga, jumlah, rasa, tipe }
 * @returns {Object.<string,Set<number>>} graf - adjacency list, key adalah id (string), value adalah set dari id tetangga (number)
 */
function bangunGrafKonflik(daftarJajanan) {

    // Buat objek kosong untuk adjacency list
    const graf = {};

    // Inisialisasi adjacendy list kosong untuk setiap item
    for (const item of daftarJajanan) {
        // Menggunakan set agar tidak ada duplikasi tetangga
        graf[String(item.id)] = new Set(); // Setiap item belum punya tetangga
    }

    // Kelompokkan item berdasarkan rasa
    const groupByRasa = {}; // { rasa: [item, item, ...] }


    for (const item of daftarJajanan) {
        // Kalau grup rasa belum ada, buat array baru
        if (!groupByRasa[item.rasa]) {
            // Masukkan rasa ke dalam group
            groupByRasa[item.rasa] = [];
        }

        // Masukkan item ke grup sesuai rasa
        groupByRasa[item.rasa].push(item);
    }

    // Untuk setiap rasa, hubungkan semua item dengan rasa sama
    // Contoh: jika 3 item punya rasa coklat, maka A-B, A-C, dan B-C dihubungkan edge
    for (const rasa in groupByRasa) {
        const items = groupByRasa[rasa];

        // Buat edge antar semua pasangan item
        for (let i = 0 ; i < items.length ; i++) {
            for (let j = i + 1 ; j < items.length ; j++) {
                const idI = String(items[i].id);
                const idJ = String(items[j].id);

                // Tambah koneksi dua arah
                graf[idI].add(idJ); // simpan sebagai number di dalam Set
                graf[idJ].add(idI);
            }
        }
    }

    return graf; // Adjacency list yang siap digunakan Welsh-Powell (Object of Sets)
}



/**
 * Welsh–Powell steps:
    1. Hitung derajat tiap vertex
    2. Urutkan vertex berdasarkan derajat (descending)
    3. Warnai vertex paling derajat tinggi menggunakan warna 0
    4. Ambil vertex lain yang tidak adjacent -> beri warna 0
    5. Lanjut warna berikutnya (1,2,3,...) hingga semua terwarnai
 * 
 * @param {Array<Object>} daftarJajanan - Array Item
 * @param {Object.<string, Set<number>>} graf - adjacency list dari bangunGrafKonflik 
 * @returns {Object.<string, number>} warna - mapping idItem -> angka warna (0,1,2,...)
 */
function welshPowellColoring(daftarJajanan, graf) {

    // 1. Siapkan list vertices dengan derajatnya
    const vertices = daftarJajanan.map(item => {
        const idStr = String(item.id);

        // Jika graf[idStr] undefined (kasus item tanpa entry), degree = 0
        const deg = graf[idStr] ? graf[idStr].size : 0;
        return { id: idStr, degree: deg };
    });

    // 2. Urutkan vertex berdasarkan derajat DESC
    // Sort descending
    vertices.sort((a, b) => b.degree - a.degree);

    // 3. Map warna: key = id item, value = nomor warna
    const warnaMap = {}; // awalnya kosong, belum ada vertex berwarna

    // 4. Warna yang tersedia dimulai dari 0
    let currentColor = 0;

    // 5. Proses utama Welsh-Powell
    for (let i = 0 ; i < vertices.length ; i++) {
        const vId = vertices[i].id;

        // Jika vertex vId sudah diwarnai oleh langkah sebelumnya, lewati
        if (warnaMap[vId] !== undefined) {
            continue;
        }

        // Beri warna baru pada vId
        warnaMap[vId] = currentColor;


        // 6. Cari vertex lain yang bisa pakai warna yang sama
        // Coba warnai vertex lain di belakang i (derajat sama atau lebih kecil)
        // dengan warna sama, jika tidak ada konflik dengan vertex yang sudah diberi warna currentColor.
        // Memastikan kandidat tidak berhubungan, tidak ada edge dengan semua vertex
        // yang sudah memiliki warna currentColor
        for (let j = i + 1; j < vertices.length ; j++) {
            const uId = vertices[j].id;
    
            // Kalau udah punya warna kita skip
            if (warnaMap[uId] !== undefined) continue;

            // Cek apakah u berkonflik dengan v
            const adjU = graf[uId];

            if (adjU && adjU.has(vId)) {
                // Jika u dan v bertetangga tidak bisa pakai warna sama
                continue;
            }
            
            // Pastikan U tidak berkonflik dengan vertex lain yang sudah memiliki warna currentColor
            //  karena kita mungkin udah memberikan warna currentColor ke beberapa vertex sebelumnya
            let aman = true; // Penanda aman memberikan currencolor ke u

            for (const idInMap in warnaMap) {
                if (warnaMap[idInMap] === currentColor) {
                    // idInMap adalah string key, convert ke number
                    const idNum = idInMap;
                    // Jika u memiliki adjacency set dan mengandung idNum, berkonflik
                    if (adjU && adjU.has(idNum)) {
                        aman = false;
                        break; // keluar loop
                    }
                }

            }

            if (aman)
                warnaMap[uId] = currentColor;
        }

        // 7. Naikkan warna untuk grup berikutnya
        currentColor++;
    }

    return warnaMap;

}

/**
 * Mengubah mapping warnaMap menjadi grup item per warna
 * @param {Array<Object>} daftarJajanan - daftar lengkap item
 * @param {Object.<string, number>} warnaMap - Mapping idItem -> Nomor warna
 * @returns {Array<Array<Item>>} - Array berisi grup item per warna
 */
function kelompokkanPerWarna(daftarJajanan, warnaMap) {

    // Buat object sementara untuk mapping warna ke array item
    const grup = {};

    // Iterasi semua item di daftar jajanan
    for (const item of daftarJajanan) {
        const w = warnaMap[String(item.id)]; // Warna item tersebut

        if (w === undefined) {
            console.warn("WARNING: Item tidak memiliki warna:", item);
            continue; 
        }


        // Jika belum ada grup untuk warna w, buat array baru
        if (!grup[w]) {
            grup[w] = [];
        }

        // Masukkan item ke grup warna w
        grup[w].push(item);
    }

    // Sekarang grup adalah object, tapi kita ingin outputnya array
    // dengan urutan warna mulai dari 0,1,2,3,...
    // Kita coba ambil semua key warna dulu
    const hasil = [];

    // AMbil semua key (string), ubah ke number, lalu sort dari kecil ke besar
    const semuaWarna = Object.keys(grup).map(x => parseInt(x)).sort((a,b) => a - b);

    // Nah terakhir buat array hasil dalam urutan warna tersebut
    for (const w of semuaWarna) {
        hasil.push(grup[w]); // masukkan array item warna w ke hasil[]
    }

    // Kembalikkan array hasil akhir
    return hasil;
}


/**
 * Menghasilkan semua subset dari suatu grup item. Kecuali subset kosong.
 * Contoh input: [A,C]
 * Output: [[A], [C], [A,C]]
 * 
 * @param {Array<Item>} grup - array item dalam satu warna
 * @returns {Array<Array<Item>>} - semua subset
 */
function generateSubset(grup) {

    // Hasil nanti bakal nampung semua subset
    const hasil = [];

    // n adalah jumlah item dalam grup
    const n = grup.length;

    // Total subset = 2^n
    // (1 << n) artinya geser bit 1 ke kiri n kali, dalam biner 2^n
    const total = 1 << n; // bitmask

    // Loop semua angka dari 1 sampai 2^n-1
    // Setiap angka mewakili 1 subset
    for (let mask = 1 ; mask < total ; mask++) {
        
        // Subset ini akan kita isi sesuai bitmask
        const subset = [];

        // Cek setiap bit mulai dari 0 sampai n-1
        for (let i = 0 ; i < n ; i++) {
            
            // (1 << i) = bit ke-i, yaitu 1,2,4,8,16
            // mask & (1 << i) → mengecek apakah bit mask di posisi i adalah 1
            if (mask & (1 << i)) {
                // jika bit i = 1 -> item ke-i masuk subset
                subset.push(grup[i]);
            }
        }

        // Masukkan subset yang sudah jadi ke hasil[]
        hasil.push(subset);
    }

    // Kembalikkan semua subset
    return hasil;
}

/**
 * Menggabungkan semua subset dari tiap warna menjadi kombinasi akhir
 * Demo input (semuaSubSetPerWarna):
 * [
 *      [ [A], [C] ],       --> Warna 0
 *      [ [B] ],            --> Warna 1
 *      [ [D], [E], [D,E] ] --> Warna 2
 * ]
 * 
 * Ouput (kombinasi):
 * [
 *      [],
 *      [A], [C],
 *      [B], [A,B], [C,B],
 *      [D], [A,D], [C,D], [B,D], [A,B,D], ...
 * ]
 * @param {*} semuaSubsetPerWarna 
 * @returns {Array<Array<Item>>} semua kombinasi item yang mungkin
 */
function combineSemuaWarna(semuaSubsetPerWarna) {

    // 1. Mulai dengan kombinasi kosong
    // Nanti akan dilakukan ini:
    // - Combine dengan subset warna 0
    // - Combine dengan subset warna 1
    // - Combine dengan subset warna 2, dst.
    let kombinasi = [ [] ];

    // 2. Loop setiap warna.
    // SubsetWarna adalah array berisi subset dari warna itu
    for (const SubsetWarna of semuaSubsetPerWarna) {

        // next ini bakal menampung hasil gabung tahap selanjutnya
        const next = [];

        // 3. Loop semua kombinasi yang sudah terbentuk
        for (const existing of kombinasi) {

            // 4. Loop semua subset dari warna saat ini
            for (const sub of SubsetWarna) {

                // 5. Gabungkan existing + sub
                // - Existing = subset dari warna-warna sebelumnya
                // - Sub = subset dari warna sekarang
                const gabungan = [...existing,...sub];

                // 6. Tambahkan gabungan ke next[]
                next.push(gabungan);
            }
        }

        // 7. Setelah semua existing dan seluruh subset warna selesai
        // Update kombinasi menjadi next
        kombinasi = next;
    }

    // 8. Setelah semua warna diproses inilah daftar final kombinasinya
    return kombinasi;
}

/**
 * Method untuk mengecek apakah suatu kombinasi itu valid sesuai aturan
 * 
 * @param {Array<Item>} kombinasi  - Array berisi item dari 1 kandidat bingkisan
 * @param {number} maxHarga - batas maksimal harga perbingkisan
 * @param {number} minMakanan - minimal jumlah makanan
 * @param {number} minMinuman - minimal jumlah minuman
 */
function validasiKombinasi(kombinasi, maxHarga, minMakanan, minMinuman) {

    let totalHarga = 0;
    let makanan = 0;
    let minuman = 0;

    // Double safety untuk memastikan tidak ada rasa yang duplikat
    const rasaSet = new Set();

    // 1. Hitung total harga dan jenis item
    for (const item of kombinasi) {

        // Tambahkan harga item
        totalHarga += item.harga;

        // Cek rasa duplikat
        if (rasaSet.has(item.rasa)) return false;
        rasaSet.add(item.rasa);

        // Hitung jenis
        if (item.tipe === "makanan") {
            makanan++;
        } else if (item.tipe === "minuman") {
            minuman++;
        }
    }

    // 2. Cek batas maksimal budget
    if (totalHarga > maxHarga) {
        return false; // tidak valid
    }

    // 3. Cek minimal makanan
    if (makanan < minMakanan) {
        return false; // Tidak valid
    }

    // 4. Cek minimal minuman
    if (minuman < minMinuman) {
        return false;
    }

    // 5. Jika lolos semua, maka valid
    return true;
}

/**
 * Memilih kombinasi terbaik dari semua kandidat valid
 * @param {Array<Array<Item>>} kandidat - semua kombinasi valid 
 * @param {number} maxHarga - batas maksimal harga per bingkisan
 * @returns {Array<Item>} kombinasi terbaik 
 */
function pilihBestCombination(kandidat, maxHarga) {

    // Jika tidak ada kombinasi valid, return null
    if (kandidat.length === 0) return null;

    // Sekarang hitung semua nilai untuk setiap kandidat
    // Simpan di array untuk di sort
    const nilai = kandidat.map(k => {

        let total = 0;
        let makanan = 0;
        let minuman = 0;

        // k = Array or Warna
        for (const item of k) {
            total += item.harga;
            if (item.tipe === "makanan") makanan++;
            else if (item.tipe === "minuman") minuman++;
        }

        // Kita cek seimbang atau tidak
        const selisih = Math.abs(makanan - minuman);

        return {
            kombinasi: k,
            totalHarga: total,
            selisih: selisih,
            jumlahItem: makanan + minuman
        };
    });

    // Filter hanya ambil yang totalHarga <= maxHarga
    const memenuhiBudget = nilai.filter(o => o.totalHarga <= maxHarga);

    if (memenuhiBudget.length === 0) return null;

    // Sort prioritas untuk menentukan kandidat terbaik berdasarkan:
    // 1. total harga terbesar (paling mendekati maxHarga)
    // 2. Selisih makanan-minuman paling kecil
    // 3. Jumlah item terbanyak
    memenuhiBudget.sort((a,b) => {

        // a. Harga paling mendekati budget, kita pilih yang paling besar dulu
        // Sorting descending
        if (b.totalHarga !== a.totalHarga) return b.totalHarga - a.totalHarga;

        // b. Keseimbangan kategori
        // Sorting ascending
        if (a.selisih !== b.selisih) return a.selisih - b.selisih;

        // c. Jumlah item terbanyak
        // Sorting descending
        if (b.jumlahItem !== a.jumlahItem) return b.jumlahItem - a.jumlahItem;

        // d. Jika masih sama, kita pick random antara kandidat itu
        // Buat tie-breaker
        return (Math.random() < 0.5 ? -1 : 1);
    });

    // Return kandidat terbaik urutan peratma setlah sort

    return memenuhiBudget[0].kombinasi;
}

/**
 * Menghasilkan N bingkisan final untuk user
 * 
 * Nanti hasilnya akan menjadi
 * - Bingkisan pertama = best combination
 * - Sisanya diambil secara acak dari kandidat valid lainnya
 * - Jika kandidat valid terlalu sedikit, kombinasinya boleh berulang
 * 
 * @param {number} jumlah - jumlah bingkisan yang diminta user
 * @param {Array<Array<Item>>} kandidatValid - kombinasi valid hasil filter
 * @param {Array<Item>} best - kombinasi terbaik
 * @returns {Array<Bingkisan>} daftar bingkisan final
 */
function buatBingkisanFinal(jumlah, kandidatValid, best) {

    // Array hasil akhir yang menampung N bingkisan
    const hasil = [];

    // Masukkan best combination untuk bingkisan pertama
    if (best) {
        // Gunakan copy array agar perubahan item di luar tidak memengaruhi isi bingkisan terbaik
        hasil.push(new Bingkisan("BEST", best));
    }

    // Jika user hanya minta 1 bingkisan -> selesai
    if (jumlah === 1) {
        return hasil;
    }

    // Siapkan kandidat lain agar bingkisan lain random
    // Kecuali bingkisan yang terbaik tadi
    const kandidatLain = kandidatValid.filter(k => !samaKombinasi(k,best));

    // Sekarang kita isi bingkisan ke-2 hingga abis
    for (let urutan = hasil.length ; urutan < jumlah ; i++) {

        let pick; // Kombinasi yang akan dipilih untuk bingkisan sekarang

        // Jika kandidat valid cukup banyak, dan belum semua terpakai
        // pick tanpa pengulangan
        if (kandidatLain.length > 0) {

            // Ambil index acak dari kandidatLain
            const randomIdx = Math.floor(Math.random() * kandidatLain.length);

            // Ambil kombinasinya
            pick = kandidatLain[randomIdx];

            // Hapus supaya tidak diambil lagi
            kandidatLain.splice(randomIdx,1);

        } else {

            // Kandidat valid sedikit, dan sudah terpakai semua
            // maka kita random pick, biar natural
            // Ambil dari list kandidat
            const randomIdx = Math.floor(Math.random() * kandidatValid.length);
            pick = kandidatValid[randomIdx];
        }

        // Masukan bingkisan yang sudah dipilih
        hasil.push(new Bingkisan("RANDOM_" + i, pick));
    }

    // Return seluruh bingkisan final
    return hasil;
}

/**
 * Membandingkan isi dari dua kombinasi apakah sama atau tidak
 * Akan dianggap sama jika:
 * - Panjang array sama
 * - Urutan item sama
 * - Setiap item memiliki id yang sama
 *
 * @param {Array<Item>} a
 * @param {Array<Item>} b
 * @returns {boolean}
 */
function samaKombinasi(a, b) {

    // Jika salah satu undefined otomatis tidak sama
    if (!a || !b) return false;

    // Jika panjang berbeda kombinasi juga pasti berbeda
    if (a.length !== b.length) return false;

    // Bandingkan item per index
    for (let i = 0; i < a.length; i++) {
        // Bandingkan via id
        if (a[i].id !== b[i].id) {
            return false;
        }
    }

    // Jika sampai sini terpenuhi, semuanya sama
    return true;
}