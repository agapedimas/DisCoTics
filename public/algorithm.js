const items = [];

/**
 * @param { number } jumlahBingkisan
 * @param { number } maksimalHargaPerBingkisan 
 * @param { number } minimalJumlahMakanan 
 * @param { number } minimalJumlahMinuman 
 * @returns { Array<Bingkisan> }
 */
function buatAcak(jumlahBingkisan, maksimalHargaPerBingkisan, minimalJumlahMakanan, minimalJumlahMinuman) {
    const daftarJajanan = dapatkanDaftarJajanan();

    // Step 1: bangun graf konflik
    const graf = bangunGrafKonflik(daftarJajanan);


    // Step 2: Lakukan pewarnaan dengan algoritma Welsh-Powell
    const hasilWarna = welshPowellColoring(daftarJajanan,graf);

    console.log("Graf konflik:",graf);
    console.log("Hasil Coloring:",hasilWarna)

    // Step 3: Tahap Kombinasi

    // Step 4: tahap validasi

    return //... ;
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
                graf[idI].add(Number(idJ)); // simpan sebagai number di dalam Set
                graf[idJ].add(Number(idI));
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

            if (adjU && adjU.has(Number(vId))) {
                // Jika u dan v bertetangga tidak bisa pakai warna sama
                continue;
            }
            
            // Pastikan U tidak berkonflik dengan vertex lain yang sudah memiliki warna currentColor
            //  karena kita mungkin udah memberikan warna currentColor ke beberapa vertex sebelumnya
            let aman = true; // Penanda aman memberikan currencolor ke u

            for (const idInMap in warnaMap) {
                if (warnaMap[idInMap] === currentColor) {
                    // idInMap adalah string key, convert ke number
                    const idNum = Number(idInMap);
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
        const W = warnaMap[String(item.id)]; // Warna item tersebut

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
 * Menghasilkan semua subset dari suatu grup item.
 * Contoh input: [A,C]
 * Output: [[], [A], [C], [A,C]]
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

    // Loop semua angka dari 0 sampai 2^n-1
    // Setiap angka mewakili 1 subset
    for (let mask = 0 ; mask < total ; mask++) {
        
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
 * sebent
 * @param {*} semuaSubsetPerWarna 
 */
function combineSemuaWarna(semuaSubsetPerWarna) {

}