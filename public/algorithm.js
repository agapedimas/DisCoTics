/**
 * Fungsi utama untuk menghasilkan bingkisan
 *
 * @param {number} jumlahBingkisan
 * @param {number} maksimalHargaPerBingkisan
 * @param {number} minimalJumlahMakanan
 * @param {number} minimalJumlahMinuman
 * @returns {Array<Bingkisan>}
 */
function buatAcak(
    jumlahBingkisan,
    maksimalHargaPerBingkisan,
    minimalJumlahMakanan,
    minimalJumlahMinuman
) {

    // 1. Ambil daftar jajanan dari storage 
    const daftarJajanan = dapatkanDaftarJajanan().map(
        o => new Item(o.id, o.nama, o.harga, o.jumlah, o.rasa, o.tipe)
    );

    if (daftarJajanan.length === 0) {
        console.warn("Tidak ada jajanan di database.");
        return [];
    }

    // 2. Bangun graf konflik & lakukan pewarnaan graf
    const grafKonflik = bangunGrafKonflik(daftarJajanan);

    // warnaMap digunakan sebagai pemodelan konflik graf (sesuai tema graph coloring),
    // namun tidak secara langsung menentukan isi bingkisan.
    const warnaMap = colorGrafKonflik(daftarJajanan, grafKonflik);

    // Pewarnaan graf dipakai sebagai pemodelan konflik (internal)
    console.log("Graf konflik:", grafKonflik);
    console.log("Hasil pewarnaan graf:", warnaMap);

    // 3. Cari semua kombinasi valid dengan DFS
    const kandidatValid = cariKombinasiValid(
        daftarJajanan,
        maksimalHargaPerBingkisan,
        minimalJumlahMakanan,
        minimalJumlahMinuman
    );

    if (kandidatValid.length === 0) {
        console.warn("Tidak ditemukan kombinasi bingkisan yang valid.");
        return [];
    }

    console.log("Jumlah kandidat valid:", kandidatValid.length);

    // 4. Pilih kombinasi terbaik
    const bestCombination = pilihBestCombination(
        kandidatValid,
        maksimalHargaPerBingkisan
    );

    console.log("Best combination:", bestCombination);

    // 5. Susun N bingkisan final
    const hasil = buatBingkisanFinal(
        jumlahBingkisan,
        kandidatValid,
        bestCombination
    );

    return hasil;
}



/**
 * Membangun graf konflik berdasarkan rasa
 * Vertex  : Item
 * Edge    : dua item dengan rasa sama (tidak boleh bersama)
 *
 * @param {Array<Item>} daftarJajanan
 * @returns {Object.<string, Set<string>>} adjacency list
 */
function bangunGrafKonflik(daftarJajanan) {
    const graf = {};

    // Inisialisasi simpul
    for (const item of daftarJajanan) {
        graf[item.id] = new Set();
    }

    // Kelompokkan berdasarkan rasa
    const byRasa = {};
    for (const item of daftarJajanan) {
        if (!byRasa[item.rasa]) byRasa[item.rasa] = [];
        byRasa[item.rasa].push(item);
    }

    // Tambahkan edge untuk item dengan rasa sama
    for (const rasa in byRasa) {
        const items = byRasa[rasa];
        for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
                graf[items[i].id].add(items[j].id);
                graf[items[j].id].add(items[i].id);
            }
        }
    }

    return graf;
}

/**
 * Pewarnaan graf konflik menggunakan pendekatan greedy (Welsh–Powell sederhana)
 * Digunakan sebagai pemodelan konflik, bukan solusi akhir bingkisan.
 *
 * @param {Array<Item>} daftarJajanan
 * @param {Object.<string, Set<string>>} graf
 * @returns {Object.<string, number>} mapping itemId -> warna
 */
function colorGrafKonflik(daftarJajanan, graf) {

    // Urutkan simpul berdasarkan derajat menurun
    const vertices = [...daftarJajanan].sort(
        (a, b) => graf[b.id].size - graf[a.id].size
    );

    const warnaMap = {};
    let currentColor = 0;

    for (const v of vertices) {
        if (warnaMap[v.id] !== undefined) continue;

        warnaMap[v.id] = currentColor;

        for (const u of vertices) {
            if (warnaMap[u.id] !== undefined) continue;

            const konflik = graf[u.id];
            let aman = true;

            for (const id in warnaMap) {
                if (warnaMap[id] === currentColor && konflik.has(id)) {
                    aman = false;
                    break;
                }
            }

            if (aman) {
                warnaMap[u.id] = currentColor;
            }
        }

        currentColor++;
    }

    return warnaMap;
}

/**
 * Mencari semua kombinasi bingkisan yang valid menggunakan DFS + pruning
 *
 * @param {Array<Item>} items - daftar semua item
 * @param {number} maxHarga
 * @param {number} minMakanan
 * @param {number} minMinuman
 * @returns {Array<Array<Item>>} semua kombinasi valid
 */
function cariKombinasiValid(items, maxHarga, minMakanan, minMinuman) {

    const hasil = [];

    function dfs(
        index,
        kombinasi,
        totalHarga,
        makanan,
        minuman,
        rasaSet
    ) {

        // === PRUNING 1: budget ===
        if (totalHarga > maxHarga) return;

        // === Jika sudah melewati semua item ===
        if (index === items.length) {

            // Cek constraint akhir
            if (makanan >= minMakanan && minuman >= minMinuman) {
                hasil.push([...kombinasi]);
            }
            return;
        }

        const item = items[index];

        // === OPSI 1: TIDAK ambil item ini ===
        dfs(
            index + 1,
            kombinasi,
            totalHarga,
            makanan,
            minuman,
            rasaSet
        );

        // === OPSI 2: ambil item ini (jika aman) ===
        if (!rasaSet.has(item.rasa)) {

            // Ambil item
            rasaSet.add(item.rasa);
            kombinasi.push(item);

            dfs(
                index + 1,
                kombinasi,
                totalHarga + item.harga,
                makanan + (item.tipe === "makanan" ? 1 : 0),
                minuman + (item.tipe === "minuman" ? 1 : 0),
                rasaSet
            );

            // Backtrack
            kombinasi.pop();
            rasaSet.delete(item.rasa);
        }
    }

    dfs(0, [], 0, 0, 0, new Set());

    return hasil;
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

function buatBingkisanFinal(jumlah, kandidatValid, best) {

    const hasil = [];

    if (jumlah <= 0) return [];

    if (best) {
        hasil.push(new Bingkisan("BEST", [...best]));
    }

    if (jumlah === 1) {
        return hasil;
    }

    const kandidatLain = kandidatValid.filter(k => !samaKombinasi(k, best));

    for (let urutan = hasil.length; urutan < jumlah; urutan++) {

        let pick;

        if (kandidatLain.length > 0) {
            const randomIdx = Math.floor(Math.random() * kandidatLain.length);
            pick = kandidatLain[randomIdx];
            kandidatLain.splice(randomIdx, 1);
        } else {
            const randomIdx = Math.floor(Math.random() * kandidatValid.length);
            pick = kandidatValid[randomIdx];
        }

        hasil.push(new Bingkisan("RANDOM_" + urutan, [...pick]));
    }

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