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
        console.log("Hasil Pewarnaan:");
        console.table(grupPerWarna.map(o => o.daftarJajanan.map(x => x.nama)));
    
        // Kelompok warna dipilih dan diurutkan yang terbaik berdasarkan
        // permintaan user
        grupPerWarna = await seleksiKelompokWarna(grupPerWarna, maksimalHargaPerBingkisan, minimalJumlahMakanan, minimalJumlahMinuman);
        console.log("Hasil Seleksi:");
        console.table(grupPerWarna.map(o => o.daftarJajanan.map(x => x.nama)));
    
        // Sekarang tinggal masukkan barang-barang ke dalam bingkisan
        const daftarBingkisan = await masukkanJajananKeBingkisan(grupPerWarna, jumlahBingkisan); 
    
        return resolve({
            daftarBingkisan: daftarBingkisan,
            daftarPewarnaan: grupPerWarna
        });
    });
}

/**
 * Membangun graf, namun dalam bentuk struktur data 'Adjacency List' yang merepresentasikan graf konflik.
 * Node = Jajanan.
 * Edge = Konflik (jika dua item memiliki RASA yang sama).
 * Menggunakan struktur data 'Set' untuk tetangga agar tidak ada duplikasi tetangga (A bertetangga dengan B, tidak perlu dicatat dua kali)
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
 * Mewarnai graf sedemikian rupa sehingga tidak ada dua simpul bertetangga yang memiliki warna sama.
 * @param { Array<Jajanan> } daftarJajanan - Array objek Jajanan
 * @param { Object.<string, Set<string>> } graf - Adjacency list dari bangunGrafKonflik 
 * @returns { Promise<Object.<string, number>> } warnaMap - Mapping: Key=ID Jajanan, Value = Angka Warna (0, 1, 2...)
 */
async function welshPowellColoring(daftarJajanan, graf) {
    /**
        Tahapan:
        1. Hitung derajat (degree) setiap simpul (jumlah tetangga).
        2. Urutkan simpul berdasarkan derajat secara DESCENDING (terbesar ke terkecil).
        3. Ambil simpul pertama yang belum berwarna, beri warna baru.
        4. Cari simpul lain (non-adjacent) yang bisa dimasukkan ke warna yang sama.
    */
   
    // Kita mapping array jajanan menjadi array objek yang lebih detail
    const vertices = daftarJajanan.map((item, index) => {
        // Ambil jumlah musuh (degree) dari graf. 
        // Jika item tidak punya musuh (undefined), anggap degree 0.
        const degree = graf[item.id] ? graf[item.id].size : 0;
        
        return { 
            id: item.id,         // ID Unik Jajanan (contoh: '101_0')
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

        // Jika Degree sama, Prioritaskan yang HARGA MURAH dulu (Ascending)
        // Agar item-item murah punya kesempatan grouping lebih besar
        const itemA = daftarJajanan[a.originalIndex];
        const itemB = daftarJajanan[b.originalIndex];
        
        return itemA.harga - itemB.harga;
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
 * Seleksi kelompok warna sesuai kriteria dengan menghapus item terlalu mahal dan
 * menghapus beberapa kelompok warna yang isinya sama persis
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
        1. Saring jajanan di dalam setiap kelompok warna agar tidak melibihi maksimal harga per bingkisan.
        2. Cek apakah syarat minimal makan/minum terpenuhi.
        3. Hapus kombinasi bingkisan yang isinya sama persis.
    */

    // Digunakan untuk mendaftarkan daftar isi setiap bingkisan
    const signatureSet = new Set();

    for (const warna of daftarKelompokWarna) {
        let kandidat = [...warna.daftarJajanan];
        
        let daftarMakanan = kandidat.filter(o => o.tipe == "makanan");
        let daftarMinuman = kandidat.filter(o => o.tipe == "minuman");

        if (daftarMakanan.length < minimalJumlahMakanan || daftarMinuman.length < minimalJumlahMinuman)
            continue; 

        // Urutkan makanan dan minuman dari harga terndah ke harga tertinggi
        // supaya dalam setiap warna bisa membuang yang terlalu mahal jika melebihi batas maksimal harga 
        daftarMakanan.sort((a, b) => a.harga - b.harga);
        daftarMinuman.sort((a, b) => a.harga - b.harga);

        let jajananTerpilih = [];
        let totalHarga = 0;

        // Ambil makanan sebanyak minimal, karena wajib memenuhi syarat
        for (let i = 0; i < minimalJumlahMakanan; i++) {
            let item = daftarMakanan[i];
            jajananTerpilih.push(item);
            totalHarga += item.harga;
        }

        // Ambil minuman sebanyak minimal, karena wajib memenuhi syarat
        for (let i = 0; i < minimalJumlahMinuman; i++) {
            let item = daftarMinuman[i];
            jajananTerpilih.push(item);
            totalHarga += item.harga;
        }

        // Cek apakah melampaui batas maksimal harga perbingkisan
        if (maksimalHargaPerBingkisan > 0 && totalHarga > maksimalHargaPerBingkisan)
            continue;

        // Sekarang ambil sisa makanan dan minuman yang terbengkalai,
        // tetapi diurutkan dari yang harga terendah hingga harga tertinggi
        // supaya yang terlalu mahal tidak usah dimasukkan
        let sisaJajanan = [
            ...daftarMakanan.slice(minimalJumlahMakanan),
            ...daftarMinuman.slice(minimalJumlahMinuman)
        ];
        sisaJajanan.sort((a, b) => a.harga - b.harga);

        // Sekarang coba masukkan kembali, selama masih tidak melebihi batas maksimal,
        // maka calon jajanan dimasukkan saja.
        for (const item of sisaJajanan) {
            if (maksimalHargaPerBingkisan === 0 || (totalHarga + item.harga <= maksimalHargaPerBingkisan)) {
                jajananTerpilih.push(item);
                totalHarga += item.harga;
            }
        }

        // Update isi warna dengan hasil seleksi
        warna.daftarJajanan = jajananTerpilih;

        // Sekarang kita pastikan supaya tidak ada dua atau lebih kelompok warna yang memiliki
        // daftar jajanan yang sama persis, supaya nanti saat memasukkan jajanan ke dalam bingkisan
        // tidak diulang-ulang.

        /**
            Tahapan:
            1. Buat signature string, yaitu string yang berisi id-id setiap jajanan.
            2. Setelah itu, cek apakah ada kelompok warna lain yang memiliki signature string yang sama.
            3. Jika ada yang sama, maka kelompok warna saat ini dibuang saja.
         */

        const signatureString = jajananTerpilih
            .map(o => o.id.split('_')[0])                  // Ambil id asli
            .sort()                                        // Urutkan supaya {A, B} dianggap sama dengan {B, A}
            .join('|');                                    // Gabung menjadi string

        // Cek apakah ada kelompok warna lain yang memiliki signature string yang sama
        if (signatureSet.has(signatureString))
            continue;

        signatureSet.add(signatureString);
        
        // Sekarang, berikan skor prioritas, agar yang terbaik diletakkan di awal
        warna.prioritas = -jajananTerpilih.length;
        daftarKelompokWarnaValid.push(warna);
    }

    // Urutkan berdasarkan prioritas tertinggi ke prioritas terendah
    daftarKelompokWarnaValid.sort((a, b) => a.prioritas - b.prioritas);

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
        for (let j = 0; j < warna.daftarJajanan.length; j++) {
            const jajanan = warna.daftarJajanan[j];
            const idJajanan = jajanan.id.split("_")[0];
            const jajananAsli = daftarJajanan.find(o => o.id == idJajanan);

            if (jajananAsli == null)
                continue;
            
            // Jika stok sudah habis, maka warna ini tidak dapat digunakan
            if (jajananAsli.jumlah == 0) {
                // i harus dikurangi, agar kita bisa mereplace dengan warna baru
                i--;
                // pointerWarna dipindah ke warna baru
                pointerWarna++;
                // kembalikan jajanan sebelumnya yang sudah dikurangi stoknya
                for (let k = 0; k < j; k++) {
                    const jajananK = warna.daftarJajanan[k];
                    const idK = jajananK.id.split("_")[0];
                    const jajananAsliK = daftarJajanan.find(o => o.id == idK);
                    if (jajananAsliK) jajananAsliK.jumlah++; 
                }

                dapatDigunakan = false;
                // Lalu break for-loop jajanan per warna
                break;
            }
            else {
                // Kurangi jajanan yang sudah terpakai
                jajananAsli.jumlah--;
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