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
        renderJajanan(jajan);
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
    menuElement.innerText = "\uf6c1";

    const actionElement = document.createElement("div");
    actionElement.classList.add("action");
    actionElement.append(quantityElement);
    actionElement.append(menuElement);

    const containerElement = document.createElement("div");
    containerElement.classList.add("stack");
    containerElement.append(groupElement);
    containerElement.append(actionElement);
    containerElement.data = jajan;

    menuElement.onclick = function() {
        hapusJajanan(jajan, containerElement);
    }

    List_DaftarJajanan.append(containerElement);
}

/**
 * Menambah jajanan ke dalam database
 * @param { Item } jajanan 
 * @returns { boolean }
 */
function tambahJajanan(jajanan) {
    jajanan.id = new Date() * 1;
    let berhasil = true;
    
    const daftarJajanan = dapatkanDaftarJajanan();
    daftarJajanan.push(jajanan);
    localStorage.setItem("jajanan", JSON.stringify(daftarJajanan));
    
    renderJajanan(jajanan);
    
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
registerCurrencyInput(Input_Harga);

function formatCurrency(number) {
    let result = number.toLocaleString(document.documentElement.lang, { style: "currency", currency: "IDR" });
    result = result.replace(/IDR\s/, "Rp");
    return result;
}

function registerCurrencyInput(input) {
    input.addEventListener("focus", function() {
        this.value = this.value.replace(/[^0-9|.]/g, "");
        this.valueInt = parseInt(this.value || 0);
        this.value = this.valueInt + "";
    });

    input.addEventListener("input", function () {
        this.value = this.value.replace(/[^0-9]/g, "");
        this.valueInt = parseInt(this.value);
    });

    input.addEventListener("blur", function() {
        this.value = formatCurrency(parseInt(this.value.replace(/[^0-9|.]/g, "")) || 0);
    });
}

window.onload = function() {
    tampilkanDaftarJajanan();
}