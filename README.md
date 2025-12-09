# DisCoTics
Discrete Competition in Informatics

## Anggota Kelompok
- Agape Dimas / 6182401062
- Gabriel Nathan Wibowo / 6182301096
- Michael Vian Tirta Wangsa / 6182401037
- Pearce Nathaniel Nicholas / 6182401015

## Deskripsi Studi Kasus: Pewarnaan Graf pada Bingkisan Snack
Dalam studi kasus ini, kami memodelkan permasalahan penyusunan bingkisan snack sebagai sebuah persoalan *graph coloring* (pewarnaan graf) dengan beberapa batasan (*constraints*). Dodo ingin membuat bingkisan Natal yang berisi berbagai jenis jajanan dan minuman, namun dengan ketentuan tertentu agar setiap bingkisan tetap menarik, seimbang, dan tidak melebihi anggaran.

Aturan dasar pertama adalah bahwa setiap bingkisan tidak boleh berisi dua jajanan dengan rasa yang sama. Artinya, jika terdapat dua item dengan rasa identik, kedua item tersebut tidak boleh ditempatkan pada bingkisan yang sama. Selain itu, diterapkan pula beberapa constraint tambahan, yaitu:
1. Setiap bingkisan memiliki batas harga maksimum, sehingga total harga seluruh item di dalamnya tidak boleh melebihi budget yang ditentukan.
2. Setiap bingkisan harus memuat beragam jenis item, misalnya wajib terdapat kategori tertentu seperti minuman agar bingkisan lebih lengkap.

Setiap item (jajanan atau minuman) dimodelkan sebagai **vertex (simpul)**. Kemudian, **edge (sisi)** ditambahkan antara dua simpul yang mewakili item dengan rasa yang sama atau item yang tidak boleh berada bersama dalam satu bingkisan. Edge tersebut menandakan bahwa kedua item tersebut berkonflik dan tidak dapat dikelompokkan dalam warna (bingkisan) yang sama.

Dengan demikian, permasalahan ini dapat diformulasikan sebagai persoalan vertex coloring, yaitu memberikan warna pada setiap simpul sehingga dua simpul yang terhubung oleh sebuah edge tidak memiliki warna yang sama.
- Satu warna = satu bingkisan.
- Simpul berjajaran (ber-edge) harus memiliki warna berbeda = jajanan tidak boleh berada dalam bingkisan yang sama.

Tujuan akhirnya untuk mendapatkan pewarnaan graf menggunakan jumlah warna seminimal mungkin yang merepresentasikan jumlah minimum bingkisan yang tetap memenuhi batasan rasa unik dalam setiap bingkisan dan tetap memenuhi seluruh batasan. Penyelesaian ini akan menunjukkan bagaimana teknik pewarnaan graf digunakan untuk mengoptimalkan proses pengelompokkan objek dengan batasan tertentu dalam kasus dunia nyata.

## Teknologi yang Digunakan
Aplikasi dibuat menggunakan teknologi web sederhana sehingga dapat dijalankan langsung melalui browser tanpa instalasi tambahan. Teknologi yang digunakan meliputi:
- HTML, digunakan untuk membangun struktur halaman dan elemen dasar yang menampilkan graf dan kontrol untuk input.
- CSS, berfungsi untuk mengatur tampilan visual, tata letak, serta pewarnaan yang digunakan untuk representasi graf.
- JavaScript, menjadi inti dari logika aplikasi, mencakup:
    - Pembentukan graf berdasarkan data yang dimasukkan pengguna
    - Penerapan algoritma pewarnaan graf
    - Visualisasi hasil pewarnaan
    - Perhitungan jumlah warna minimum yang diperlukan

## Cara Menjalankan Aplikasi
Aplikasi dapat dijalankan tanpa instalasi atau pengaturan tambahan. Cukup lakukan langkah berikut:
1. Jalankan file index.html dengan menggunakan browser apa pun (Chrome, Firefox, Edge, dan sebagainya).
2. Aplikasi akan langsung tampil dan siap digunakan.

## Cara Menggunakan Aplikasi
Aplikasi dirancang untuk membantu menyusun bingkisan Natal berdasarkan aturan graph coloring dan batasan tambahan seperti harga dan kategori item. Ikuti langkah-langkah penggunaan berikut:
### 1. Pilih Daftar Snack dan Minuman

Pada panel kiri, pengguna dapat memilih:
- Jenis snack yang ingin dimasukkan
- Rasa dari setiap snack
- Harga masing-masing item
- Kategori item (snack atau minuman)

> Item-item ini akan menjadi vertex dalam graf.

### 2. Isi Parameter pada Tools Panel
Pada panel kanan, pengguna dapat menentukan:
- Jumlah bingkisan yang ingin dibuat
- Budget maksimal per bingkisan
- Minimal jumlah snack per bingkisan
- Minimal jumlah minuman per bingkisan

> Parameter ini menentukan aturan validasi kombinasi bingkisan.

### 3. Lihat Visualisasi Graf Konflik Rasa
Setelah semua item dipilih, aplikasi akan:
- Membangun graf berdasarkan konflik rasa (vertex + edge),
- Menampilkan visualisasinya,
- Menerapkan algoritma pewarnaan graf untuk mengelompokkan item yang boleh digabungkan.

Hasil pewarnaan graf ini ditampilkan agar pengguna memahami bagaimana item dikelompokkan.

### 4. Jalankan Proses Penyusunan Bingkisan
Ketika tombol **Generate** ditekan, aplikasi akan melakukan 3 tahap:
1. **Graph Coloring**, menentukan kelompok item yang bisa digabung tanpa konflik rasa.
2. **Generate All Possible Combinations**, mencoba berbagai kemungkinan kombinasi item menggunakan subset/bitstring.
3. **Validator**, memeriksa kombinasi yang memenuhi:

- Budget,
- Minimal snack,
- Minimal minuman,
- Bebas dari konflik rasa.

Semua kombinasi valid disimpan sebagai kandidat bingkisan.

### 5. Sistem memilih 'Best Combination'
Dari semua kombinasi valid, aplikasi akan menentukan kombinasi terbaik, berdasarkan prioritas berikut:
- Total harga paling mendekati budget,
- Bingkisan yang paling seimbang, yaitu selisih antara jumlah snack dan minuman paling kecil.
- Jika masih terdapat lebih dari satu kandidat, dipilih kombinasi dengan jumlah item total lebih banyak.
- Jika tetap sama, aplikasi memilih salah satu secara acak.

Kombinasi ini ditandai sebagai Optimal Gift Box.

### 6. Sistem menghasilkan N bingkisan final
Untuk jumlah bingkisan yang diminta user:

- Aplikasi akan melakukan *random pick* dari daftar *valid combinations*,sehingga setiap bingkisan memiliki komposisi menarik dan variatif.
- Jika jumlah kombinasi valid lebih sedikit daripada jumlah bingkisan yang diminta, aplikasi akan mengacak pemilihan kombinasi untuk menghasilkan bingkisan lain secara natural.

### 7. Output ditampilkan kepada pengguna
Aplikasi akan menampilkan:

- Graf konflik rasa (vertex & edge)
- Hasil pewarnaan graf
- Bingkisan final sejumlah N
- Bingkisan paling optimal dengan detail isinya dan total harga