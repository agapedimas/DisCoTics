function generateBingkisan() {
    // Ambil Data Jajanan
    const daftarMentah = dapatkanDaftarJajanan();
    
    if (!daftarMentah || daftarMentah.length === 0) {
        Components.Notification.Send({ 
            Id: "data_kosong", 
            Title: "Data Kosong", 
            Message: "Isi data dahulu sebelum generate.", 
            Icon: "\ufe60" 
        });
        return;
    }

    // Ambil Config Input
    const jumlahBingkisan = parseInt(document.getElementById("Input_BanyakBingkisan").value) || 1;
    
    // Parsing harga manual
    const inputHargaEl = document.getElementById("Input_MaksHargaBingkisan");
    
    // Convert ke Integer
    const maxBudget = inputHargaEl.valueInt; // Pake valueInt karena sudah dibuatkan methodnya di scripts.js

    // Debugging
    console.log(`Budget Final: ${maxBudget} (Input Asli: ${inputHargaEl.value})`);
    // ---------------------------------------------

    const minMakanan = parseInt(document.getElementById("Input_BanyakMakanan").value) || 0;
    const minMinuman = parseInt(document.getElementById("Input_BanyakMinuman").value) || 0;

    // Eksekusi Algoritma
    console.log("Memulai Algoritma...");
    
    const hasilFinal = buatAcak(
        jumlahBingkisan, 
        maxBudget, 
        minMakanan, 
        minMinuman
    );

    // TAMPILKAN HASIL
    console.log("Hasil Final", hasilFinal);

    if (hasilFinal.length === 0) {
        Components.Notification.Send({ 
            Id: "bingkisan_gagal",
            Title: "Gagal Menyusun Bingkisan", 
            Message: "Coba naikkan budget atau kurangi syarat jumlah makanan/minuman.", 
            Icon: "\ufe60" // Icon silang dalam unicode font SF Symbols 
        });
    } else {
        // Tampilkan alert sukses
        Components.Notification.Send({ 
            Id: "bingkisan_berhasil",
            Title: "Berhasil Menyusun Bingkisan", 
            Message: "Sebanyak " + hasilFinal.length + " bingkisan telah disusun secara bervariasi.", 
            Icon: "\uef1c" // Icon centang dalam unicode font SF Symbols 
        });
    }

    return hasilFinal;
}



// Method utama untuk menjalankan logika
function buatAcak(jumlahBingkisan, maksimalHargaPerBingkisan, minimalJumlahMakanan, minimalJumlahMinuman) {
    
    // Ambil data dan ekspansi node nya, untuk memecah stock per itemnya
    // Kita loop manual untuk handle Qty
    const dataMentah = dapatkanDaftarJajanan();
    let daftarJajanan = [];

    dataMentah.forEach(itemAsli => {
        // Ambil Qty, default 1
        let qty = itemAsli.jumlah || 1;
        
        // Loop sebanyak Qty untuk memecah item jadi node unik
        for (let i = 0; i < qty; i++) {
            let idUnik = itemAsli.id + "_" + i; // ID jadi unik: 101_0, 101_1
            daftarJajanan.push(new Item(
                idUnik, itemAsli.nama, itemAsli.harga, 1, itemAsli.rasa, itemAsli.tipe
            ));
        }
    });

    // Sebelum masuk graph, kita scramble dulu urutannya jadi Makan, Minum, Makan...
    // Agar Welsh-Powell mengambil item secara berimbang.
    // Untuk menghindari ketidakseimbangan, misalnya setelah diwarnai, kelompok warna 1 berisi makanan semua, atau sebaliknya
    // Sehingga nanti akhirnya tidak ditemukan komposisi valid.
    daftarJajanan = urutkanSelangSeling(daftarJajanan);

    // Bangun Graf Konflik
    const graf = bangunGrafKonflik(daftarJajanan);

    // Lakukan Pewarnaan
    const hasilWarna = welshPowellColoring(daftarJajanan, graf);
    console.log("Hasil Coloring (Smart):", hasilWarna);

    // Kelompokkan item per warna
    const grupPerWarna = kelompokkanPerWarna(daftarJajanan, hasilWarna);
    
    // Optimasi Isi Setiap Warna (Potong Budget)
    const kandidatBingkisan = grupPerWarna.map(grup => {
        return optimalkanGrup(grup, maksimalHargaPerBingkisan); 
    });

    // Validasi Kelengkapan
    const bingkisanValid = kandidatBingkisan.filter(b => 
        validasiKomposisi(b, minimalJumlahMakanan, minimalJumlahMinuman)
    );

    console.log("Kandidat Valid:", bingkisanValid);

    if (bingkisanValid.length === 0) {
        // Return array kosong agar Solver tahu ini gagal
        return [];
    }
    
    // Lalu susun hasil akhir sesuai jumlah permintaan user
    const bingkisanFinal = buatBingkisanFinal(jumlahBingkisan, bingkisanValid);

    return bingkisanFinal;
}

/**
 * Method helper untuk mengurutkan selang seling input
 * Mengubah urutan agar konflik sejajar tidak bertemu.
 * Makanan: [A, B], Minuman: [C, D]
 * Hasil: [A, D, B, C] (Minuman dibalik)
 */
function urutkanSelangSeling(items) {
    const makanan = items.filter(i => i.tipe === 'makanan');
    
    // Reverse minuman agar pola konfliknya tidak sejajar dengan makanan
    // Contoh: Roti(Coklat) jangan langsung ketemu Susu(Coklat).
    // Tapi ketemu Teh(Vanilla) dulu dari urutan belakang.
    const minuman = items.filter(i => i.tipe === 'minuman').reverse(); 
    
    const hasil = [];
    const maxLen = Math.max(makanan.length, minuman.length);

    for (let i = 0; i < maxLen; i++) {
        if (i < makanan.length) hasil.push(makanan[i]);
        if (i < minuman.length) hasil.push(minuman[i]);
    }
    return hasil;
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

/**
 * Method kedua adalah algoritma welsh-powell
 * *Tujuan: Mewarnai graf sedemikian rupa sehingga tidak ada dua simpul bertetangga yang memiliki warna sama.
 * Langkah-langkah:
 * 1. Hitung derajat (degree) setiap simpul (jumlah tetangga).
 * 2. Urutkan simpul berdasarkan derajat secara DESCENDING (terbesar ke terkecil).
 * 3. Ambil simpul pertama yang belum berwarna, beri warna baru.
 * 4. Cari simpul lain (non-adjacent) yang bisa dimasukkan ke warna yang sama.
 * @param {Array<Item>} daftarJajanan - Array objek Item
 * @param {Object.<string, Set<string>>} graf - Adjacency list dari bangunGrafKonflik 
 * @returns {Object.<string, number>} warnaMap - Mapping: Key=ID Item, Value = Angka Warna (0, 1, 2...)
 */
function welshPowellColoring(daftarJajanan, graf) {

    // Kita mapping array jajanan menjadi array objek yang lebih detail
    const vertices = daftarJajanan.map((item, index) => {
        // Pastikan ID berupa string agar cocok dengan key di object graf
        const idStr = String(item.id);
        
        // Ambil jumlah musuh (degree) dari graf. 
        // Jika item tidak punya musuh (undefined), anggap degree 0.
        const degree = graf[idStr] ? graf[idStr].size : 0;
        
        return { 
            id: idStr,           // ID Unik Item (contoh: '101_0')
            degree: degree,      // Jumlah Konflik (cth: 1)
            originalIndex: index // Simpan nomor urut antrian asli
        };
    });

    // Proses Sorting
    // Aturan Welsh-Powell adalah urutkan dari Degree tertinggi ke terendah.
    vertices.sort((a, b) => {
        
        // Cek Prioritas Utama: DEGREE (Jumlah Konflik)
        if (b.degree !== a.degree) {
            // Urutkan Descending (Besar ke Kecil)
            // Item yang paling banyak konflik harus diwarnai duluan
            return b.degree - a.degree; 
        }

        // Jika Degree-nya sama
        // Paksa urutkan berdasarkan 'originalIndex' (Ascending).
        // Ini menjaga pola "Makan-Minum-Makan-Minum" yang sudah disusun sebelumnya.
        return a.originalIndex - b.originalIndex; 
    });

    // Proses Pewarnaan
    const warnaMap = {};     // Tempat menyimpan hasil: { "ID_Item": AngkaWarna }
    let currentColor = 0;    // Mulai dari Warna ke-0 (Wadah 1)

    // Selama masih ada vertex yang belum kebagian warna
    for (let i = 0; i < vertices.length; i++) {
        const vertexV = vertices[i]; // Ambil kandidat vertex utama

        // Jika vertex ini sudah punya warna, skip.
        if (warnaMap[vertexV.id] !== undefined) {
            continue; 
        }

        // Beri warna baru pada vertex utama ini
        warnaMap[vertexV.id] = currentColor;

        // Cari item di kelompok sama
        // Loop vertex sisanya untuk mencari siapa yang bisa nebeng di warna ini
        for (let j = i + 1; j < vertices.length; j++) {
            const vertexU = vertices[j]; // Kandidat teman

            // Syarat A: Dia belum punya warna
            if (warnaMap[vertexU.id] !== undefined) continue;

            // Syarat B: Cek Konflik (Apakah dia musuh vertexV atau musuh anggota lain?)
            // Ambil daftar musuh si kandidat (vertexU)
            const tetanggaU = graf[vertexU.id];
            let aman = true; // Asumsikan aman dulu

            // Cek satu per satu anggota yang sudah ada di currentColor
            for (const existingId in warnaMap) {
                // Hanya cek yang warnanya sama dengan warna saat ini
                if (warnaMap[existingId] === currentColor) {
                    
                    // Jika kandidat (U) punya hubungan konflik dengan anggota (existingId)
                    if (tetanggaU && tetanggaU.has(existingId)) {
                        aman = false; // Gagal, dia musuh
                        break;        // Hentikan pengecekan, cari kandidat lain
                    }
                }
            }

            // Jika setelah dicek ternyata aman (tidak konflik dengan siapapun di grup ini)
            if (aman) {
                // Masukkan dia ke warna (kelompok) ini
                warnaMap[vertexU.id] = currentColor;
            }
        }

        // Setelah satu putaran warna selesai, ganti ke warna berikutnya (wadah baru)
        currentColor++;
    }

    // Kembalikan peta warna ke fungsi utama
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

/**
 * Method kelimat untuk validasi komposisinya
 * Tujuan: Mengecek apakah bingkisan memenuhi syarat minimal jumlah makanan/minuman.
 * @param {Array<Object>} items - Kandidat bingkisan
 * @param {number} minMakan - Syarat minimal makanan
 * @param {number} minMinum - Syarat minimal minuman
 * @returns {boolean} - True jika valid, False jika tidak
 */
function validasiKomposisi(items, minMakan, minMinum) {
    let countMakan = 0;
    let countMinum = 0;

    // Hitung jumlah tipe
    for (const item of items) {
        if (item.tipe === "makanan") countMakan++;
        if (item.tipe === "minuman") countMinum++;
    }

    // Kembalikan true jika kedua syarat terpenuhi
    return countMakan >= minMakan && countMinum >= minMinum;
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