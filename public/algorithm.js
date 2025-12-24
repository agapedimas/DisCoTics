

/**
 * OBJECT SOLVER (Jembatan HTML -> ALGORITMA)
 * Bagian ini untuk mengambil data dari input HTML,
 * lalu mengirimnya ke fungsi logika 'buatAcak' di bawah.
 */
const Solver = {
    generateBingkisan: function() {
        // Ambil Data Jajanan
        const daftarMentah = dapatkanDaftarJajanan();
        if (!daftarMentah || daftarMentah.length === 0) {
            alert("Data kosong! Masukkan jajanan dulu.");
            return;
        }

        // Ambil Config
        const jumlahBingkisan = parseInt(document.getElementById("Input_BanyakBingkisan").value) || 1;
        
        // Mendapatkan harga budget
        const inputHargaEl = document.getElementById("Input_MaksHargaBingkisan");
        let rawHarga = inputHargaEl.value; // Contoh: "Rp 25.000,00"
        
        // Buang angka di belakang koma (jika ada koma)
        // Kita split berdasarkan koma, lalu ambil bagian depannya saja
        if (rawHarga.includes(',')) {
            rawHarga = rawHarga.split(',')[0];
        }

        // Sekarang isinya tinggal "Rp 25.000", baru bersihkan angka lain
        const bersihHarga = rawHarga.replace(/[^0-9]/g, ''); 
        
        // Ubah jadi integer
        const maxBudget = parseInt(bersihHarga) || 0;

        // // DEBUGGING
        // console.log("=== CEK BUDGET REVISI ===");
        // console.log("Input Awal:", inputHargaEl.value);
        // console.log("Setelah Potong Koma:", rawHarga);
        // console.log("Budget Final:", maxBudget);
        // console.log("=========================");
        // // --------------------------------------

        const minMakanan = parseInt(document.getElementById("Input_BanyakMakanan").value) || 0;
        const minMinuman = parseInt(document.getElementById("Input_BanyakMinuman").value) || 0;

        // Kerjakan logika utama
        console.log("Memulai Algoritma...");
        const hasilFinal = buatAcak(
            jumlahBingkisan, 
            maxBudget, 
            minMakanan, 
            minMinuman
        );

        // Tampilkan hasilnya
        console.log("=== HASIL FINAL ===");
        console.log(hasilFinal);

        if (hasilFinal.length === 0) {
            alert("Gagal menyusun bingkisan. Coba naikkan budget atau kurangi syarat jumlah.");
        } else {
            // Tampilkan alert sukses
            let pesan = `Berhasil menyusun ${hasilFinal.length} bingkisan!\n`;
            pesan += "Cek Console (F12) untuk melihat detail isinya.";
            alert(pesan);
        }
    }
};





// ! Unccoment kalau sudah fix
// Method utama untuk menjalankan logika
function buatAcak(jumlahBingkisan, maksimalHargaPerBingkisan, minimalJumlahMakanan, minimalJumlahMinuman) {
    
    // Kita ambil data mentah dari script.js
    const dataMentah = dapatkanDaftarJajanan();
    const daftarJajanan = [];

    // Loop setiap item mentah
    dataMentah.forEach(itemAsli => {
        // Jika user minta 5 Coklat, kita buat 5 object Coklat yang berbeda (Node Expansion)
        // Agar setiap coklat dianggap sebagai vertex yang unik di dalam graf
        let qty = itemAsli.jumlah || 1;
        
        for (let i = 0; i < qty; i++) {
            // Kita buat ID unik, misal: "101_0", "101_1", "101_2"
            // Supaya graf bisa membedakan Coklat yang ke-1 dan Coklat yang ke-2
            let idUnik = itemAsli.id + "_" + i;

            // Masukkan ke array daftarJajanan
            daftarJajanan.push(new Item(
                idUnik,           // ID Baru (String unik)
                itemAsli.nama,    // Nama tetap sama
                itemAsli.harga,   
                1,                // Di dalam graf, dia dihitung 1 unit
                itemAsli.rasa, 
                itemAsli.tipe
            ));
        }
    });

    // Cek apakah data kosong setelah expand
    if (daftarJajanan.length === 0) return [];

    // Bangun Graf Konflik
    // (Karena IDnya sudah unik "ID_0", "ID_1", graf akan menganggap mereka item berbeda
    // tapi karena Rasanya sama, mereka akan saling dihubungkan edge konfliknya.
    // Hasilnya, Welsh-Powell akan memaksa Coklat_1, Coklat_2, dst dipisahkan warna dan bingkisannya)
    const graf = bangunGrafKonflik(daftarJajanan);

    // Lakukan Pewarnaan (Welsh-Powell)
    const hasilWarna = welshPowellColoring(daftarJajanan, graf);

    console.log("Hasil Coloring (Qty Handle):", hasilWarna);

    // Kelompokkan item per warna
    const grupPerWarna = kelompokkanPerWarna(daftarJajanan, hasilWarna);
    
    // Optimasi Isi Setiap Warna (Greedy)
    const kandidatBingkisan = grupPerWarna.map((grup, index) => {
        return optimalkanGrup(grup, maksimalHargaPerBingkisan); 
    });

    // Validasi Kelengkapan (Makanan/Minuman)
    const bingkisanValid = kandidatBingkisan.filter(b => 
        validasiKomposisi(b, minimalJumlahMakanan, minimalJumlahMinuman)
    );

    console.log("Kandidat Valid:", bingkisanValid);

    // Cek Ketersediaan
    if (bingkisanValid.length === 0) {
        console.warn("Gagal membuat bingkisan yang memenuhi syarat budget/komposisi.");
        return [];
    }

    // Pilih Bingkisan Terbaik (Finalisasi)
    // Karena kita sudah expand Qty, bingkisan final akan mengambil item-item unik tersebut.
    // Misal Bingkisan 1 dapat "Coklat_0", Bingkisan 2 dapat "Coklat_1".
    const bestItems = pilihBestCombination(bingkisanValid, maksimalHargaPerBingkisan);
    const bingkisanFinal = buatBingkisanFinal(jumlahBingkisan, bingkisanValid, bestItems);

    return bingkisanFinal;
}

/**
 * Method pertama untuk membangun graf
 * * Tujuan: Membuat struktur data 'Adjacency List' yang merepresentasikan graf konflik.
 * Node = Item Jajanan.
 * Edge = Konflik (jika dua item memiliki RASA yang sama).
 * * Menggunakan struktur data 'Set' untuk tetangga agar: Tidak ada duplikasi tetangga (A bertetangga dengan B, tidak perlu dicatat dua kali)
 * @param {Array<Object>} daftarJajanan - Array objek Item { id, nama, harga, jumlah, rasa, tipe }
 * @returns {Object.<string, Set<string>>} graf - Adjacency list. Key = ID Item, Value = Set ID Tetangga.
 */
function bangunGrafKonflik(daftarJajanan) {

    // Inisialisasi Adjacency List kosong
    // Graf direpresentasikan sebagai Object, di mana Key adalah ID Item.
    const graf = {};

    // Loop semua jajanan untuk menyiapkan simpul di dalam graf
    for (const item of daftarJajanan) {
        // Pakai String() untuk memastikan ID konsisten String bukan integer
        const idItem = String(item.id);
        
        // Kalau belum punya musuh/konflik, mulai dari set kosong
        graf[idItem] = new Set(); 
    }

    // Grouping
    // Daripada membandingkan satu-satu secara acak, kita kelompokkan dulu berdasarkan RASA.
    // Strukturnya nanti akan menjadi seperti berikut kurang lebih: { "coklat": [ItemA, ItemB], "keju": [ItemC] }
    const kelompokRasa = {}; 

    for (const item of daftarJajanan) {
        // Cek apakah rasa ini sudah ada di daftar kelompok?
        if (!kelompokRasa[item.rasa]) {
            // Jika belum, buat array baru untuk menampung item rasa ini
            kelompokRasa[item.rasa] = [];
        }

        // Masukkan item ke dalam kelompok rasanya
        kelompokRasa[item.rasa].push(item);
    }

    // Membangun Edge (Garis Konflik)
    // Logika: Semua item dalam satu kelompok rasa SALING BERTETANGGA
    // Contoh: Jika A, B, C sama-sama Coklat. Maka A musuh B, A musuh C, B musuh C.
    
    // Loop setiap jenis rasa yang ada
    for (const rasa in kelompokRasa) {
        
        // Ambil daftar item yang rasanya sama
        const itemsSatuRasa = kelompokRasa[rasa];

        // Nested loop untuk menghubungkan setiap pasangan
        for (let i = 0; i < itemsSatuRasa.length; i++) {
            for (let j = i + 1; j < itemsSatuRasa.length; j++) {
                
                // Ambil ID dari kedua item yang sedang dibandingkan
                const idA = String(itemsSatuRasa[i].id);
                const idB = String(itemsSatuRasa[j].id);

                // Tambahkan Edge (Koneksi) dua arah karena graf engga berarah/undirected
                // Artinya: Jika A konflik dengan B, otomatis B konflik dengan A
                
                graf[idA].add(idB); // A mencatat B sebagai tetangga
                graf[idB].add(idA); // B mencatat A sebagai tetangga
            }
        }
    }

    // Kembalikan graf yang sudah jadi
    // Bentuknya: { "1": Set("2", "3"), "2": Set("1") ... }
    return graf; 
}


// ! WelshPowell Coloring asli, uncomment kalau udah fix
/**
 * Method kedua adalah algoritma welsh-powell
 * *Tujuan: Mewarnai graf sedemikian rupa sehingga tidak ada dua simpul bertetangga yang memiliki warna sama.
 * Langkah-langkah:
 * 1. Hitung derajat (degree) setiap simpul (jumlah tetangga).
 * 2. Urutkan simpul berdasarkan derajat secara DESCENDING (terbesar ke terkecil).
 * 3. Ambil simpul pertama yang belum berwarna, beri warna baru.
 * 4. Cari simpul lain (non-adjacent) yang bisa dimasukkan ke warna yang sama.
 * @param {Array<Object>} daftarJajanan - Array objek Item
 * @param {Object.<string, Set<string>>} graf - Adjacency list dari bangunGrafKonflik 
 * @returns {Object.<string, number>} warnaMap - Mapping: Key=ID Item, Value = Angka Warna (0, 1, 2...)
 */
function welshPowellColoring(daftarJajanan, graf) {

    // Hitung derajat setiap vertex
    // Kita butuh array objek biar bisa disort
    const vertices = daftarJajanan.map(item => {
        const idStr = String(item.id);
        
        // Ambil jumlah tetangga dari graf. Jika tidak ada di graf (isolated), degree = 0
        const degree = graf[idStr] ? graf[idStr].size : 0;
        
        return { id: idStr, degree: degree };
    });

    // 2. Sorting: Urutkan vertex berdasarkan derajat tertinggi (Descending)
    // Jika degree SAMA, kita acak posisinya (Random Tie-Breaker).
    // Ini mencegah algoritma "terjebak" mengelompokkan item yang tipe-nya sama semua.
    vertices.sort((a, b) => {
        if (b.degree !== a.degree) {
            return b.degree - a.degree; // Prioritas utama tetapDegree Besar
        }
        return 0.5 - Math.random(); // yang kedua Acak aja biar variatif
    });

    // Buat map warna nya
    // key = ID Item, value = ID Warna (0, 1, 2, ...)
    const warnaMap = {}; 
    
    // Counter untuk ID warna, dimulai dari 0 (Warna 1)
    let currentColor = 0;

    // Loop untuk mewarnai vertex
    for (let i = 0; i < vertices.length; i++) {
        const vertexV = vertices[i];

        // Jika vertex ini sudah punya warna, lewati.
        if (warnaMap[vertexV.id] !== undefined) {
            continue;
        }

        // Mulai Warna Baru
        // Kasih warna pada vertex V (Vertex dengan derajat tertinggi saat ini)
        warnaMap[vertexV.id] = currentColor;

        // Cari Vertex Lain untuk digabung (Independent Set)
        // Kita cari vertex lain (U) yang:
        // - Belum punya warna
        // - TIDAK bertetangga dengan V
        // - TIDAK bertetangga dengan vertex lain yang sudah masuk di currentColor ini
        
        for (let j = i + 1; j < vertices.length; j++) {
            const vertexU = vertices[j];

            // Syarat pertama: Skip jika sudah berwarna
            if (warnaMap[vertexU.id] !== undefined) continue;

            // Syarat kedua: Cek Konflik
            // Apakah vertexU bertetangga dengan SIAPAPUN yang sudah ada di currentColor?
            const tetanggaU = graf[vertexU.id];
            let aman = true;

            // Cek terhadap semua vertex yang SUDAH diberi warna 'currentColor'
            for (const existingId in warnaMap) {
                if (warnaMap[existingId] === currentColor) {
                    // Jika U bertetangga dengan salah satu member grup ini, maka U gagal masuk.
                    if (tetanggaU && tetanggaU.has(existingId)) {
                        aman = false;
                        break; // Konflik ditemukan, berhenti loop
                    }
                }
            }

            // Jika aman (tidak ada konflik), masukkan U ke warna ini
            if (aman) {
                warnaMap[vertexU.id] = currentColor;
            }
        }

        // Pindah ke warna berikutnya untuk vertex sisa
        currentColor++;
    }

    return warnaMap;
}


/**
 * Method ketiga buat pengelompokkan warnanya
 * Tujuan: Mengubah hasil mapping (ID -> Warna) menjadi bentuk Array of Arrays.
 * Contoh Input: { "A": 0, "B": 1, "C": 0 }
 * Contoh Output: [ [ItemA, ItemC], [ItemB] ]
 * @param {Array<Object>} daftarJajanan - Daftar lengkap item dengan data harga/nama
 * @param {Object.<string, number>} warnaMap - Hasil dari welshPowellColoring
 * @returns {Array<Array<Object>>} - Array berisi kelompok item per warna
 */
function kelompokkanPerWarna(daftarJajanan, warnaMap) {

    // Siapkan objek sementara untuk menampung grup
    // Format: { "0": [ItemA, ItemC], "1": [ItemB] }
    const grupSementara = {};

    // Loop semua item untuk dimasukkan ke wadah warnanya masing-masing
    for (const item of daftarJajanan) {
        // Ambil warna milik item ini dari map
        const idStr = String(item.id);
        const warna = warnaMap[idStr];

        // Jika item tidak punya warna (mungkin terlewat), beri peringatan
        if (warna === undefined) {
            console.warn("Peringatan: Item berikut tidak terwarnai:", item.nama);
            continue; 
        }

        // Jika wadah untuk warna ini belum ada, buat array baru
        if (!grupSementara[warna]) {
            grupSementara[warna] = [];
        }

        // Masukkan item ke wadah yang sesuai
        grupSementara[warna].push(item);
    }

    // Konversi ke bentuk Array terurut (0, 1, 2, ...)
    const hasilAkhir = [];

    // Ambil semua nomor warna yang ada, pastikan jadi angka, lalu urutkan (Sort Ascending)
    const urutanWarna = Object.keys(grupSementara)
        .map(key => parseInt(key))
        .sort((a, b) => a - b);

    // Susun array hasil berdasarkan urutan warna tadi
    for (const w of urutanWarna) {
        hasilAkhir.push(grupSementara[w]);
    }

    return hasilAkhir;
}

/**
 * Method keempat untuk optimasi grup sesuai permintaan user
 * Tujuan: Memastikan setiap kelompok warna mematuhi batas budget.
 * Strategi: Jika total harga > budget, kita buang item termahal satu per satu
 * sampai budget cukup. Atau ambil dari termurah agar jumlah item banyak.
 * @param {Array<Object>} grup - Array item dalam satu warna
 * @param {number} maxBudget - Batas harga (0 = unlimited)
 * @returns {Array<Object>} - Array item yang sudah disaring sesuai budget
 */
function optimalkanGrup(grup, maxBudget) {

    // Cek apakah ada batasan budget?
    // Jika 0 atau null, anggap unlimited -> langsung lolos semua
    if (!maxBudget || maxBudget <= 0) return grup;

    // Hitung total harga saat ini
    let totalHarga = 0;
    for (const item of grup) {
        totalHarga += item.harga;
    }

    // Jika total masih di bawah budget, langsung lolos
    if (totalHarga <= maxBudget) return grup;

    // Jika kemahalan over budget -> Lakukan Optimasi Greedy
    // Yaitu dengan mengurutkan dari yang termurah dulu.
    // Supaya kita bisa memasukkan sebanyak mungkin item ke dalam bingkisan.
    
    // Copy array agar data asli tidak rusak, lalu sort harga (Ascending: Murah -> Mahal)
    const sortedItems = [...grup].sort((a, b) => a.harga - b.harga);
    
    const hasilValid = [];
    let hargaBerjalan = 0;

    for (const item of sortedItems) {
        // Cek jika item ini dimasukkan, apakah jebol?
        if (hargaBerjalan + item.harga <= maxBudget) {
            hasilValid.push(item);
            hargaBerjalan += item.harga;
        } else {
            // Jika sudah tidak muat, berhenti loop. Item sisa (yang mahal) dibuang.
            break; 
        }
    }

    return hasilValid;
}

// ! Validasi komposisi asli, tolong uncomment kalau udah beres ngodingnya
// /**
//  * Method kelimat untuk validasi komposisinya
//  * Tujuan: Mengecek apakah bingkisan memenuhi syarat minimal jumlah makanan/minuman.
//  * @param {Array<Object>} items - Kandidat bingkisan
//  * @param {number} minMakan - Syarat minimal makanan
//  * @param {number} minMinum - Syarat minimal minuman
//  * @returns {boolean} - True jika valid, False jika tidak
//  */
// function validasiKomposisi(items, minMakan, minMinum) {
//     let countMakan = 0;
//     let countMinum = 0;

//     // Hitung jumlah tipe
//     for (const item of items) {
//         if (item.tipe === "makanan") countMakan++;
//         if (item.tipe === "minuman") countMinum++;
//     }

//     // Kembalikan true jika kedua syarat terpenuhi
//     return countMakan >= minMakan && countMinum >= minMinum;
// }

function validasiKomposisi(items, minMakan, minMinum) {
    let countMakan = 0;
    let countMinum = 0;

    for (const item of items) {
        if (item.tipe === "makanan") countMakan++;
        if (item.tipe === "minuman") countMinum++;
    }
    
    // --- CCTV DEBUGGING ---
    console.log(`🔍 Cek Kandidat (Total Harga: ${items.reduce((a,b)=>a+b.harga,0)}):`);
    console.log(`   👉 Isi: [${items.map(i => i.nama).join(", ")}]`);
    console.log(`   📊 Stats: Makanan=${countMakan}/${minMakan}, Minuman=${countMinum}/${minMinum}`);

    if (countMakan < minMakan) {
        console.warn("   ❌ DITOLAK: Kurang Makanan!");
        return false;
    }
    if (countMinum < minMinum) {
        console.warn("   ❌ DITOLAK: Kurang Minuman!");
        return false;
    }
    
    console.log("   ✅ DITERIMA: Komposisi Pas!");
    return true;
}

/**
 * Method terakhir untuk mengeluarkan bingkisan final
 * Tujuan: Mengubah array item menjadi Object Bingkisan final sesuai permintaan user.
 * Jika kandidat valid lebih sedikit dari permintaan user, kita lakukan pengulangan (Round Robin).
 * @param {number} jumlahDiminta - User ingin berapa bingkisan?
 * @param {Array<Array<Object>>} kandidatValid - Daftar bingkisan yang sudah lolos seleksi
 * @returns {Array<Bingkisan>} - Array object Bingkisan siap tampil
 */
function buatBingkisanFinal(jumlahDiminta, kandidatValid) {
    const hasilAkhir = [];
    
    // Loop sebanyak jumlah bingkisan yang diminta user
    for (let i = 0; i < jumlahDiminta; i++) {
        
        // Pilih kandidat menggunakan Modulo (%)
        // Contoh: Ada 2 kandidat (A, B). User minta 3 bingkisan.
        // i=0 -> ambil A
        // i=1 -> ambil B
        // i=2 -> ambil A lagi (karena 2 % 2 = 0)
        const indexPilih = i % kandidatValid.length;
        const isiBingkisan = kandidatValid[indexPilih];

        // Buat Object Bingkisan
        // ID Bingkisan kita buat i+1 (Bingkisan 1, Bingkisan 2, dst)
        const bingkisanBaru = new Bingkisan(i + 1, isiBingkisan);
        
        hasilAkhir.push(bingkisanBaru);
    }

    return hasilAkhir;
}