// kelas untuk jajanan
class Item {
    /**
     * @param { string } id
     * @param { string } nama 
     * @param { number } harga 
     * @param { number } jumlah 
     * @param { "coklat" | "stroberi" | "vanilla" | "matcha" | "mocha" | "caramel" } rasa 
     * @param { "makanan" | "minuman" } tipe
     */
    constructor(id, nama, harga, jumlah, rasa, tipe) {
        this.id = id;
        this.nama = nama;
        this.harga = harga;
        this.jumlah = jumlah;
        this.rasa = rasa;
        this.tipe = tipe;
    }
}

// kelas untuk bingkisan
class Bingkisan {
    /**
     * @param { string } id
     * @param { Array<Item> } daftarJajanan
     */
    constructor(id, daftarJajanan) {
        this.id = id;
        this.daftarJajanan = daftarJajanan;
    }
}

/**
 * Mengambil data daftar jajanan dari database
 * @returns { void }
 */
function dapatkanDaftarJajanan() {
    return JSON.parse(localStorage.getItem("jajanan")) || [];
}

/**
 * Mengambil data daftar jajanan dari database,
 * lalu akan mengupdate UI
 * @returns { void }
 */
function tampilkanDaftarJajanan() {
    const daftarJajanan = dapatkanDaftarJajanan();
    
    for (const item of daftarJajanan) {
        const jajan = new Item(item.id, item.nama, item.harga, item.jumlah, item.rasa, item.tipe);
        const jajananElement = renderJajanan(jajan);
        List_DaftarJajanan.append(jajananElement);
    }
}

function renderJajanan(jajan) {
    const nameElement = document.createElement("span");
    nameElement.classList.add("name");
    nameElement.innerText = jajan.nama;

    const priceElement = document.createElement("span");
    priceElement.classList.add("price");
    priceElement.innerText = formatCurrency(jajan.harga);

    const typeElement = document.createElement("span");
    typeElement.classList.add("type");
    typeElement.innerHTML = jajan.tipe;

    const quantityElement = document.createElement("span");
    quantityElement.classList.add("quantity");
    quantityElement.innerHTML = "x" + jajan.jumlah;

    const flavorElement = document.createElement("span");
    flavorElement.classList.add("flavor");
    flavorElement.innerText = jajan.rasa;

    const descriptionElement = document.createElement("div");
    descriptionElement.classList.add("description");
    descriptionElement.append(priceElement);
    descriptionElement.append("•");
    descriptionElement.append(typeElement);
    descriptionElement.append("•");
    descriptionElement.append(flavorElement);

    const groupElement = document.createElement("div");
    groupElement.classList.add("group");
    groupElement.append(nameElement);
    groupElement.append(descriptionElement);

    const menuElement = document.createElement("button");
    menuElement.classList.add("menu");
    menuElement.classList.add("icon");
    menuElement.classList.add("plain")
    menuElement.innerText = "\uf153";

    const actionElement = document.createElement("div");
    actionElement.classList.add("action");
    actionElement.append(quantityElement);
    actionElement.append(menuElement);

    const containerElement = document.createElement("div");
    containerElement.classList.add("stack");
    containerElement.classList.add("jajanan");
    containerElement.append(groupElement);
    containerElement.append(actionElement);
    containerElement.data = jajan;

    menuElement.onclick = function(event) {
        menuElement.data = jajan;
        menuElement.container = containerElement;
        Components.ContextMenu.Open("MenuJajanan", menuElement, event);
    }

    return containerElement;
}

/**
 * Menambah jajanan ke dalam database
 * @param { Item } jajanan 
 * @returns { boolean }
 */
function tambahJajanan(jajanan) {
    jajanan.id = randomizeString();
    let berhasil = true;
    
    const daftarJajanan = dapatkanDaftarJajanan();
    daftarJajanan.push(jajanan);
    localStorage.setItem("jajanan", JSON.stringify(daftarJajanan));
          
    const jajananElement = renderJajanan(jajan);
    List_DaftarJajanan.append(jajananElement);
    
    return berhasil;
}

/**
 * Mengedit salah satu jajanan dari database
 * @param { Item } jajanan 
 * @returns { boolean }
 */
function editJajanan(jajanan) {
    let berhasil = true;
    
    const daftarJajanan = dapatkanDaftarJajanan();

    let jajananDatabase = daftarJajanan.find(o => o.id == jajanan.id);

    if (jajananDatabase == null)
        return false;

    Object.assign(jajananDatabase, jajanan);
    localStorage.setItem("jajanan", JSON.stringify(daftarJajanan));
    
    return berhasil;
}

/**
 * Menghapus jajanan dari database
 * @param { Item } jajanan
 * @returns { boolean } 
 */
function hapusJajanan(jajanan, element) {
    let berhasil = true;

    const daftarJajanan = dapatkanDaftarJajanan().filter(o => o.id != jajanan.id);
    localStorage.setItem("jajanan", JSON.stringify(daftarJajanan));

    if (element)
        element.remove();

    return berhasil;
}

/**
 * Menghapus semua jajanan dari database
 * @returns { boolean } 
 */
function hapusSemuaJajanan() {
    let berhasil = true;

    localStorage.removeItem("jajanan");

    for (const jajananElement of [...List_DaftarJajanan.children].filter(o => o.classList.contains("jajanan")))
        jajananElement.remove();

    return berhasil;
}

// Membuka form 'Jajanan Baru'
function bukaFormJajanan() {
    Input_Nama.value = "";
    Input_Harga.value = formatCurrency(0);
    Input_Jumlah.value = 1;
    Select_Rasa.value = "coklat";
    Select_Tipe.value = "makanan";
    PopOver_FormJajanan.open(List_DaftarJajanan.children[0]);
    PopOver_FormJajanan.onopened = function() {
        Input_Nama.focus();
    }
}

// Tombol 'Batal' dan 'Tambah' pada form 'Jajanan Baru'
Button_BatalFormJajanan.onclick = function() {
    PopOver_FormJajanan.close();
}
Button_SelesaiFormJajanan.onclick = function() {
    const item = new Item(
        null,
        Input_Nama.value.trim(),
        Input_Harga.valueInt || 0,
        parseInt(Input_Jumlah.value) || 1,
        Select_Rasa.value,
        Select_Tipe.value
    )
    tambahJajanan(item);
    PopOver_FormJajanan.close();
}

// Tombol 'Batal' dan 'Tambah' pada form 'Edit Jajanan'
Button_BatalFormJajananEdit.onclick = function() {
    PopOver_FormJajananEdit.close();
}
Button_SelesaiFormJajananEdit.onclick = function() {
    const item = new Item(
        PopOver_FormJajananEdit.data.id,
        Input_NamaEdit.value.trim(),
        Input_HargaEdit.valueInt || 0,
        parseInt(Input_JumlahEdit.value) || 1,
        Select_RasaEdit.value,
        Select_TipeEdit.value
    )

    editJajanan(item);
    const jajananElement = renderJajanan(item);
    PopOver_FormJajananEdit.element.parentNode.replaceChild(jajananElement, PopOver_FormJajananEdit.element);

    PopOver_FormJajananEdit.close();
}

// Tombol 'Buat Kombinasi Bingkisan' untuk meng-generate kombinasi bingkisan dari algorithm.js
Button_BuatKombinasiBingkisan.onclick = function() {
    const daftarBingkisan = generateBingkisan();
    Section_HasilBingkisan.innerHTML = null;

    for (const bingkisan of daftarBingkisan) {
        const bingkisanElement = renderBingkisan(bingkisan);
        Section_HasilBingkisan.append(bingkisanElement);
    }
}

/**
 * Mengubah object 'Bingkisan' menjadi object HTML, lalu ditambahkan
 * ke tampilan daftar hasil bingkisan
 * @param { Bingkisan } bingkisan 
 */
function renderBingkisan(bingkisan) {
    const idElement = document.createElement("span");
    idElement.classList.add("id");
    idElement.innerText = "Bingkisan " + bingkisan.id;

    const containerJajananElement = document.createElement("div");
    containerJajananElement.classList.add("daftarjajanan");

    const containerElement = document.createElement("div");
    containerElement.classList.add("bingkisan");
    containerElement.append(idElement);

    let totalHarga = 0;
    let totalMinuman = 0;
    let totalMakanan = 0;

    for (const jajanan of bingkisan.daftarJajanan) {
        totalHarga += jajanan.harga;
        if (jajanan.tipe == "makanan")
            totalMakanan++;
        else if (jajanan.tipe == "minuman")
            totalMinuman++;

        const nameElement = document.createElement("span");
        nameElement.classList.add("name");
        nameElement.innerText = jajanan.nama;

        const priceElement = document.createElement("span");
        priceElement.classList.add("price");
        priceElement.innerText = formatCurrency(jajanan.harga);

        const typeElement = document.createElement("span");
        typeElement.classList.add("type");
        typeElement.innerHTML = jajanan.tipe;

        const flavorElement = document.createElement("span");
        flavorElement.classList.add("flavor");
        flavorElement.innerText = jajanan.rasa;

        const descriptionElement = document.createElement("div");
        descriptionElement.classList.add("description");
        descriptionElement.append(priceElement);
        descriptionElement.append("•");
        descriptionElement.append(typeElement);
        descriptionElement.append("•");
        descriptionElement.append(flavorElement);

        const jajananElement = document.createElement("div");
        jajananElement.classList.add("jajanan");
        jajananElement.append(nameElement);
        jajananElement.append(descriptionElement);

        containerJajananElement.append(jajananElement);
    }

    const totalHargaElement = document.createElement("span");
    totalHargaElement.classList.add("totalharga");
    totalHargaElement.innerText = formatCurrency(totalHarga);
    totalHargaElement.setAttribute("ad-tooltip", "Total harga");

    const totalMakananElement = document.createElement("span");
    totalMakananElement.classList.add("totalmakanan");
    totalMakananElement.innerText = totalMakanan;
    totalMakananElement.setAttribute("ad-tooltip", "Total makanan");

    const totalMinumanElement = document.createElement("span");
    totalMinumanElement.classList.add("totalminuman");
    totalMinumanElement.innerText = totalMinuman;
    totalMinumanElement.setAttribute("ad-tooltip", "Total minuman");

    const totalElement = document.createElement("div");
    totalElement.classList.add("total");
    totalElement.append(totalHargaElement);
    totalElement.append(totalMakananElement);
    totalElement.append(totalMinumanElement);

    containerElement.append(totalElement);
    containerElement.append(containerJajananElement);

    return containerElement;
}

// Mendaftarkan event input supaya dapat di-formatting dengan mata uang
registerCurrencyInput(Input_Harga);
registerCurrencyInput(Input_HargaEdit);
registerCurrencyInput(Input_MaksHargaBingkisan);

// Tombol 'Tambah Random' dan 'Bersihkan Daftar'
Button_TambahRandom.onclick = function() {
    const rasa = [...Select_Rasa.options];
    const tipe = [...Select_Tipe.options];
    const indeksTerakhir = List_DaftarJajanan.children.length - 1;

    for (let i = indeksTerakhir; i < indeksTerakhir + 5; i++) {
        const item = new Item(
            null,
            "Jajanan " + (i+1), 
            Math.round(Math.random() * 25000 / 250) * 250 + 5000, // range: 5,000 s.d. 30,000
            Math.floor(Math.random() * 100),
            rasa[Math.floor(Math.random() * rasa.length)].value,
            tipe[Math.floor(Math.random() * tipe.length)].value
        )
        tambahJajanan(item);
    }
}
Button_Bersihkan.onclick = function() {
    Components.ActionSheet.Open(
    {
        Title: "Yakin ingin menghapus semua jajanan yang ada di daftar?",
        Description: "Semua yang dihapus tidak dapat dipulihkan.",
        Actions: [
            { 
                Title: "Hapus", Type: "Options.Critical", 
                Action: o => 
                { 
                    hapusSemuaJajanan();
                } 
            },
            { 
                Title: "Batal", Type: "Footer"
            }
        ]
    });
}


function formatCurrency(number) {
    let result = number.toLocaleString("id", { style: "currency", currency: "IDR" });
    result = result.replace(/IDR\s/, "Rp");
    return result;
}

function registerCurrencyInput(input) {
    input.valueInt = 0;

    input.addEventListener("focus", function() {
        this.value = this.value.replace(/[^0-9|,]/g, "");
        this.valueInt = parseInt(this.value || 0);
        this.value = this.valueInt + "";
    });

    input.addEventListener("input", function () {
        this.value = this.value.replace(/[^0-9]/g, "");
        this.valueInt = parseInt(this.value);
    });

    input.addEventListener("blur", function() {
        this.value = formatCurrency(parseInt(this.value.replace(/[^0-9|,]/g, "")) || 0);
    });
}

window.onload = function() {
    tampilkanDaftarJajanan();
}

function randomizeString() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}