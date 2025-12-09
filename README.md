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
