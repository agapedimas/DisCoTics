# DisCoTics
Discrete Competition in Informatics

## Anggota Kelompok
- Agape Dimas / 6182401062
- Gabriel Nathan Wibowo / 6182301096
- Michael Vian Tirta Wangsa / 6182401037
- Pearce Nathaniel Nicholas / 6182401015

## Deskripsi Studi Kasus
### Penerapan Graph Coloring dalam Penyusunan Bingkisan Snack
Dalam studi kasus ini, kami mengangkat permasalahan penyusunan bingkisan snack sebagai sebuah persoalan pewarnaan graf (_graph coloring_) yang dapat dikombinasikan dengan batasan (_constraints_) tambahan. Dodo ingin membuat bingkisan Natal yang berisi berbagai jenis jajanan dan minuman, namun dengan ketentuan tertentu agar setiap bingkisan tetap menarik, seimbang, dan tidak melebihi anggaran.

### Aturan Penyusunan Bingkisan Snack
Aturan (1) adalah aturan dasar yang merupakan penerapan dari algoritma Welsh-Powell. Sisanya—aturan (2) dan (3)—adalah batasan tambahan yang diperlukan oleh Dodo.

1. Setiap bingkisan tidak boleh berisi dua jajanan dengan rasa yang sama.

2. Setiap bingkisan dapat memiliki batas harga maksimum, sehingga total harga seluruh jajanan di dalamnya tidak boleh melebihi batas yang ditentukan.

3. Setiap bingkisan dapat menentukan komposisi jajanan, misalnya terdapat minimal jumlah makanan dan minuman tertentu.

### Pemodelan Graf

Setiap jajanan dimodelkan sebagai sebuah **simpul** dalam graf. Kemudian, **sisi** ditambahkan antara dua simpul yang merepresentasikan jajanan dengan rasa yang sama atau jajanan yang tidak boleh berada bersama dalam satu bingkisan. Sisi tersebut menandakan adanya konflik antar jajanan.

Dengan demikian, graf yang terbentuk merupakan graf konflik rasa. Proses pewarnaan graf digunakan secara internal oleh sistem untuk memodelkan dan memisahkan jajanan yang saling berkonflik, sehingga dua simpul yang terhubung oleh sebuah sisi tidak dikelompokkan bersama dalam proses penyusunan bingkisan.

Selanjutnya, berdasarkan graf yang telah diwarnai, sistem melakukan proses penyusunan bingkisan dengan mempertimbangkan batasan tambahan seperti budget dan komposisi item. Dengan pendekatan ini, graph coloring berperan sebagai dasar pemodelan dan visualisasi konflik, sementara proses pemilihan kombinasi item memastikan setiap bingkisan yang dihasilkan tetap valid dan optimal.

## Teknologi yang Digunakan
Aplikasi dibuat menggunakan teknologi web sederhana sehingga dapat dijalankan langsung melalui browser tanpa instalasi tambahan. Teknologi yang digunakan meliputi:
- HTML: Membangun struktur halaman dan elemen dasar antarmuka aplikasi.
- CSS: Mengatur tampilan visual, tata letak, serta pewarnaan yang digunakan untuk representasi graf.
- JavaScript: Menjadi inti dari logika aplikasi, mencakup:
    - Pembentukan graf konflik berdasarkan data jajanan yang dimasukkan pengguna.
    - Penerapan algoritma pewarnaan graf untuk memisahkan jajanan yang berkonflik.
    - Proses penyusunan bingkisan berdasarkan hasil pewarnaan graf dan batasan tambahan.
    - Evaluasi dan pemilihan kombinasi bingkisan yang paling optimal.

## Fitur Aplikasi

Website **Pabrik Bingkisan Natal** menyediakan _interface_ interaktif untuk membantu pengguna menyusun bingkisan snack dan minuman berdasarkan aturan yang telah ditentukan. Fitur-fitur utama yang tersedia pada aplikasi ini meliputi:

### 1. Manajemen Daftar Jajanan
Pengguna dapat mengelola daftar jajanan yang akan digunakan dalam penyusunan bingkisan. Fitur yang tersedia antara lain:
- Menambahkan data jajanan baru secara manual melalui form input.
- Mengedit data jajanan yang telah dimasukkan, termasuk nama, harga, jumlah, rasa, dan tipe jajanan.
- Menghapus jajanan dari daftar.
- Menambahkan data jajanan secara acak (_random_) untuk keperluan simulasi.
- Mengosongkan seluruh daftar jajanan dengan satu tombol.

Setiap jajanan memiliki atribut:
- Nama jajanan  
- Harga satuan  
- Jumlah tersedia  
- Rasa  
- Tipe jajanan (makanan atau minuman)


### 2. Form Input dan Edit Jajanan
Aplikasi menyediakan form _pop-up_ untuk:
- Menambahkan jajanan baru.
- Mengedit jajanan yang sudah ada.

Form ini memungkinkan pengguna memperbarui data jajanan secara cepat tanpa perlu berpindah halaman.

### 3. Pengaturan Parameter Bingkisan
Melalui panel **_Tools Jajanan_**, pengguna dapat menentukan aturan penyusunan bingkisan, antara lain:
- Jumlah bingkisan yang ingin dibuat.
- Batas maksimal harga untuk setiap bingkisan.
- Minimal jumlah makanan dalam satu bingkisan.
- Minimal jumlah minuman dalam satu bingkisan.

> Parameter ini digunakan sebagai acuan dalam proses pembuatan kombinasi bingkisan.

### 4. Proses Pembuatan Kombinasi Bingkisan
Pengguna dapat menjalankan proses penyusunan bingkisan dengan menekan tombol **Buat Kombinasi Bingkisan**.  
Sistem akan mengolah data jajanan dan parameter yang telah ditentukan untuk menghasilkan bingkisan yang sesuai dengan aturan yang berlaku.

### 5. Tampilan Hasil Pewarnaan
Aplikasi menampilkan hasil pengelompokan jajanan berdasarkan konflik rasa pada bagian **Daftar Pewarnaan**, sehingga pengguna dapat melihat pembagian jajanan ke dalam kelompok yang berbeda.

### 6. Tampilan Hasil Akhir Bingkisan
Hasil akhir penyusunan bingkisan ditampilkan pada bagian **Hasil Akhir Bingkisan**, yang memuat:
- Daftar bingkisan yang dihasilkan sesuai jumlah yang diminta.
- Detail isi setiap bingkisan.
- Informasi total harga bingkisan.

### 7. Antarmuka Interaktif Berbasis Web
Aplikasi dirancang berbasis web sehingga:
- Dapat dijalankan langsung melalui browser.
- Tidak memerlukan instalasi tambahan.
- Menyediakan tampilan interaktif menggunakan panel, pop-up, dan grid untuk mempermudah penggunaan.

## Cara Menjalankan Aplikasi
Aplikasi dapat dijalankan tanpa instalasi atau pengaturan tambahan. Cukup lakukan langkah berikut:
1. Jalankan file `./public/index.html` dengan menggunakan browser apa pun (Chrome, Firefox, Edge, dan sebagainya).
2. Aplikasi akan langsung tampil dan siap digunakan.

## Cara Menggunakan Aplikasi

Aplikasi dirancang untuk membantu menyusun bingkisan Natal berdasarkan aturan pewarnaan graf dan batasan tambahan seperti harga dan kategori jajanan. Ikuti langkah-langkah penggunaan berikut:

### 1. Pilih Daftar Snack dan Minuman
Pada panel kiri, pengguna dapat memilih:

- Jenis jajanan yang ingin dimasukkan,
- Rasa dari setiap jajanan,
- Harga masing-masing jajanan,
- Kategori jajanan (snack atau minuman).
- Jajanan-jajanan ini akan menjadi simpul dalam graf.

### 2. Isi Parameter pada Tools Panel

Pada panel kanan, pengguna dapat menentukan:

- Jumlah bingkisan yang ingin dibuat,
- Budget maksimal per bingkisan,
- Minimal jumlah snack per bingkisan,
- Minimal jumlah minuman per bingkisan.
- Parameter ini menentukan aturan validasi kombinasi bingkisan.

### 3. Membangun Graf Konflik Rasa

Setelah semua jajanan dipilih, aplikasi akan:

- Membangun graf berdasarkan kesamaan rasa (simpul + sisi),
- Menerapkan algoritma pewarnaan graf untuk mengelompokkan jajanan yang boleh digabungkan.

> Hasil pewarnaan graf digunakan sebagai dasar logika internal sistem dalam menyusun kombinasi jajanan yang bebas konflik rasa.

### 4. Jalankan Proses Penyusunan Bingkisan

Ketika tombol Generate ditekan, aplikasi akan melakukan 3 tahap utama:

- Graph Coloring, untuk memisahkan item-item yang berkonflik rasa ke dalam kelompok warna berbeda.
- Optimasi Seleksi Item (Greedy), sistem mengambil kelompok item dari setiap warna, lalu secara otomatis menyaring item agar sesuai dengan budget (mengutamakan item termurah agar muat banyak).
- Validasi Komposisi, untuk memastikan kandidat bingkisan tersebut memiliki syarat yang diminta, antara lain:

    - Batas budget (Total harga ≤ Maksimal budget),
    - Minimal jumlah makanan,
    - Minimal jumlah minuman,
    - Tidak mengandung konflik rasa.

> Semua kombinasi valid disimpan sebagai kandidat bingkisan.

### 5. Sistem memilih 'Best Combination'

Dari semua kandidat valid, aplikasi akan menentukan satu kombinasi terbaik, berdasarkan prioritas berikut:

- Keseimbangan Item, yaitu selisih antara jumlah makanan dan minuman paling kecil.
- Jumlah Item Terbanyak.

> Kombinasi ini ditandai sebagai Optimal Gift Box.

### 6. Sistem menghasilkan N bingkisan final

Untuk memenuhi jumlah bingkisan yang diminta user (N):

- Bingkisan pertama diisi menggunakan Best Combination.
- Bingkisan selanjutnya diambil secara bergantian (bergilir) dari kandidat valid lainnya agar hasil variatif.
- Jika jumlah kandidat valid lebih sedikit daripada jumlah bingkisan yang diminta, sistem akan mengulangi pengambilan kandidat secara otomatis.

### 7. Output ditampilkan kepada pengguna

Aplikasi akan menampilkan:

- Bingkisan final sejumlah N.
- Bingkisan paling optimal dengan detail isinya dan total harga.
