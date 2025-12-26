/**
 * Method utama untuk menjalankan logika
 * @param { number } jumlahBingkisan 
 * @param { number } maksimalHargaPerBingkisan 
 * @param { number } minimalJumlahMakanan 
 * @param { number } minimalJumlahMinuman 
 * @returns { Promise<{ 
 *      daftarBingkisan: Array<Bingkisan>,
 *      daftarPewarnaan: Array<Array<Jajanan>>
 * }>}
 */
function buatDaftarBingkisan(jumlahBingkisan, maksimalHargaPerBingkisan, minimalJumlahMakanan, minimalJumlahMinuman) {
    // Counter global, digunakan untuk sleep loop agar UI tidak freezing
    window.x = 0;

    // Dibuat new Promise() untuk mengeksekusinya secara asinkronus
    return new Promise(async function(resolve) {
        // Ambil data dan ekspansi node nya, untuk memecah stock per itemnya
        // Kita loop manual untuk handle Qty
        const dataMentah = dapatkanDaftarJajanan();
        let daftarJajanan = [];
        
        for (const jajananAsli of dataMentah) {
            // Setiap jajanan akan dipecah jadi satu per satu
            for (let i = 0; i < jajananAsli.jumlah; i++) {
                const idUnik = jajananAsli.id + "_" + i;
                daftarJajanan.push(new Jajanan(
                    idUnik,
                    jajananAsli.nama,
                    jajananAsli.harga,
                    1,
                    jajananAsli.rasa,
                    jajananAsli.tipe
                ))
            }
        }
    
        // Bangun graf konflik
        const graf = await bangunGrafKonflik(daftarJajanan);
    
        // Lakukan pewarnaan
        const hasilWarna = await welshPowellColoring(daftarJajanan, graf);
    
        // Kelompokkan jajanan berdasarkan warna
        let grupPerWarna = await kelompokkanPerWarna(daftarJajanan, hasilWarna);
        // console.log("Hasil Pewarnaan:");
        // console.table(grupPerWarna.map(o => o.daftarJajanan.map(x => x.nama)));
    
        // Kelompok warna dipilih dan diurutkan yang terbaik berdasarkan
        // permintaan user
        grupPerWarna = await seleksiKelompokWarna(grupPerWarna, maksimalHargaPerBingkisan, minimalJumlahMakanan, minimalJumlahMinuman);
        // console.log("Hasil Seleksi:");
        // console.table(grupPerWarna.map(o => o.daftarJajanan.map(x => x.nama)));
    
        // Sekarang tinggal masukkan barang-barang ke dalam bingkisan
        const daftarBingkisan = await masukkanJajananKeBingkisan(grupPerWarna, jumlahBingkisan); 
    
        return resolve({
            daftarBingkisan: daftarBingkisan,
            daftarPewarnaan: grupPerWarna
        });
    });
}

/**
 * Method pertama untuk membangun graf
 * * Tujuan: Membuat struktur data 'Adjacency List' yang merepresentasikan graf konflik.
 * Node = Jajanan.
 * Edge = Konflik (jika dua item memiliki RASA yang sama).
 * * Menggunakan struktur data 'Set' untuk tetangga agar: Tidak ada duplikasi tetangga (A bertetangga dengan B, tidak perlu dicatat dua kali)
 * @param { Array<Jajanan> } daftarJajanan - Array objek Jajanan { id, nama, harga, jumlah, rasa, tipe }
 * @returns { Promise<Object.<string, Set<string>>> } graf - Adjacency list. Key = ID Jajanan, Value = Set ID Tetangga.
 */
async function bangunGrafKonflik(daftarJajanan) {

    // Inisialisasi Adjacency List kosong
    // Graf direpresentasikan sebagai Object, di mana Key adalah ID Jajanan.
    const graf = {};

    // Loop semua jajanan untuk menyiapkan simpul di dalam graf
    for (const item of daftarJajanan) {
        // Kalau belum punya musuh/konflik, mulai dari set kosong
        graf[item.id] = new Set(); 
    }

    // Grouping
    // Daripada membandingkan satu-satu secara acak, kita kelompokkan dulu berdasarkan RASA.
    // Strukturnya nanti akan menjadi seperti berikut kurang lebih: { "coklat": [JajananA, JajananB], "keju": [JajananC] }
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
 * @param { Array<Jajanan> } daftarJajanan - Array objek Jajanan
 * @param { Object.<string, Set<string>> } graf - Adjacency list dari bangunGrafKonflik 
 * @returns { Promise<Object.<string, number>> } warnaMap - Mapping: Key=ID Jajanan, Value = Angka Warna (0, 1, 2...)
 */
async function welshPowellColoring(daftarJajanan, graf) {
    // Kita mapping array jajanan menjadi array objek yang lebih detail
    const vertices = daftarJajanan.map((item, index) => {
        // Ambil jumlah musuh (degree) dari graf. 
        // Jika item tidak punya musuh (undefined), anggap degree 0.
        const degree = graf[item.id] ? graf[item.id].size : 0;
        
        return { 
            id: item.id,           // ID Unik Jajanan (contoh: '101_0')
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
            // Jajanan yang paling banyak konflik harus diwarnai duluan
            return b.degree - a.degree; 
        }

        // Jika Degree-nya sama
        // Paksa urutkan berdasarkan 'originalIndex' (Ascending).
        // Ini menjaga pola "Makan-Minum-Makan-Minum" yang sudah disusun sebelumnya.
        return a.originalIndex - b.originalIndex; 
    });

    // Proses Pewarnaan
    const warnaMap = {};     // Tempat menyimpan hasil: { "ID_Jajanan": AngkaWarna }
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
                if (window.x++ % 500000 == 0)
                    await Delay(0);

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
 * Method untuk mengelompokkan jajanan berdasarkan warna
 * Tujuan: Mengubah hasil mapping (ID -> Warna) menjadi bentuk Array of Arrays.
 * Contoh Input: { "A": 0, "B": 1, "C": 0 }
 * Contoh Output: [ [JajananA, JajananC], [JajananB] ]
 * @param { Array<Jajanan> } daftarJajanan - Daftar lengkap item dengan data harga/nama
 * @param { Object.<string, number> } warnaMap - Hasil dari welshPowellColoring
 * @returns { Promise<Array<Warna>> } - Array berisi kelompok item per warna
 */
async function kelompokkanPerWarna(daftarJajanan, warnaMap) {
    const daftarWarna = [];

    // Loop semua item untuk dimasukkan ke wadah warnanya masing-masing
    for (const item of daftarJajanan) {
        // Ambil warna milik item ini dari map
        const warna = warnaMap[item.id];

        // Jika item tidak punya warna (mungkin terlewat), beri peringatan
        if (warna === undefined) {
            console.warn("Peringatan: Jajanan berikut tidak terwarnai:", item.nama);
            continue; 
        }

        // Jika wadah untuk warna ini belum ada, buat array baru
        if (daftarWarna[warna] == null) {
            daftarWarna[warna] = new Warna(warna, -1, []);
        }

        // Masukkan item ke wadah yang sesuai
        daftarWarna[warna].daftarJajanan.push(item);
    }
    
    return daftarWarna;
}

/**
 * Seleksi kelompok warna sesuai kriteria
 * @param { Array<Warna> } daftarKelompokWarna 
 * @param { number } maksimalHargaPerBingkisan 
 * @param { number } minimalJumlahMakanan 
 * @param { number } minimalJumlahMinuman 
 * @returns { Promise<Array<Warna>> }
 */
async function seleksiKelompokWarna(daftarKelompokWarna, maksimalHargaPerBingkisan, minimalJumlahMakanan, minimalJumlahMinuman) {
    const daftarKelompokWarnaValid = [];
    /**
        Tahapan:

        1. Cek harga, apakah melebihi budget? Jika ya, eliminasi
        2. Cek apakah sesuai minimal minuman dan makanan? Jika tidak, eliminasi
        3. Cek komposisi makanan dan minuman:
            Cek selisih, jika:
            - |makanan - minuman| == 0 -> Beri skor prioritas 0
            - |makanan - minuman| == 1 -> Beri skor prioritas 1,
            dst.
     */

    for (const warna of daftarKelompokWarna) {
        let totalHarga = 0;
        let totalMakanan = 0;
        let totalMinuman = 0;

        for (const jajanan of warna.daftarJajanan) {
            totalHarga += jajanan.harga;
            if (jajanan.tipe == "makanan")
                totalMakanan++;
            else if (jajanan.tipe == "minuman")
                totalMinuman++;
        }
        
        // Cek 2 tahapan tadi, apakah perlu dieliminasi
        let apakahDieliminasi = false;

        // jika maksimalHargaPerBingkisan bernilai 0,
        // maka asumsinya tidak ada batasan
        if (maksimalHargaPerBingkisan > 0 && totalHarga > maksimalHargaPerBingkisan)
            apakahDieliminasi = true;
        if (totalMakanan < minimalJumlahMakanan)
            apakahDieliminasi = true;
        if (totalMinuman < minimalJumlahMinuman)
            apakahDieliminasi = true;

        // Jika tidak dieliminasi, maka masukkan ke daftar valid
        if (apakahDieliminasi == false)
            daftarKelompokWarnaValid.push(warna);

        // Sekarang, berikan skor prioritas, agar yang terbaik diletakkan di awal
        warna.prioritas = Math.abs(totalMakanan - totalMinuman);
    }

    // Urutkan daftarKelompokWarnaValid berdasarkan prioritas
    daftarKelompokWarnaValid.sort((a,b) => a.prioritas - b.prioritas);

    return daftarKelompokWarnaValid;
}

/**
 * Masukkan barang-barang ke dalam bingkisan sesuai kelompok warna
 * @param { Array<Warna> } daftarKelompokWarna 
 * @param { number } jumlahBingkisan 
 * @returns { Promise<Array<Bingkisan>> }
 */
async function masukkanJajananKeBingkisan(daftarKelompokWarna, jumlahBingkisan) {
    const daftarBingkisan = [];

    // Daftar jajanan ini digunakan sebagai acuan, apakah stok
    // jajanan masih tersedia atau tidak
    const daftarJajanan = dapatkanDaftarJajanan();
    let pointerWarna = 0;

    for (let i = 0; i < jumlahBingkisan && pointerWarna < daftarKelompokWarna.length; i++) {
        const warna = daftarKelompokWarna[pointerWarna];
        let dapatDigunakan = true;

        // Cek stok jajanan untuk setiap warna
        for (const jajanan of warna.daftarJajanan) {
            const idJajanan = jajanan.id.substring(0, jajanan.id.indexOf("_"));
            const jajananAsli = daftarJajanan.find(o => o.id == idJajanan);

            if (jajananAsli == null) {
                continue;
            }

            // Jika stok sudah habis, maka warna ini tidak dapat digunakan
            if (jajananAsli.jumlah-- <= 0) {
                // i harus dikurangi, agar kita bisa mereplace dengan warna baru
                i--;
                // pointerWarna dipindah ke warna baru
                pointerWarna++;
                dapatDigunakan = false;
                // Lalu break for-loop jajanan per warna
                break;
            }
        }

        // Jika dapat digunakan, masukkan ke daftar bingkisan
        if (dapatDigunakan == true) {
            const bingkisan = new Bingkisan(i+1, warna.daftarJajanan);
            daftarBingkisan.push(bingkisan);
        }
    }

    return daftarBingkisan;
}