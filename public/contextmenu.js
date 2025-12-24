Components.ContextMenu.Add("MenuJajanan",  
    [
        {
            Title: "Edit",
            Icon: "f7cf",
            Action: function(element) {
                Input_NamaEdit.value = element.data.nama;
                Input_HargaEdit.value = formatCurrency(element.data.harga);
                Input_HargaEdit.valueInt = parseInt(element.data.harga) || 0;
                Input_JumlahEdit.value = element.data.jumlah;
                Select_RasaEdit.value = element.data.rasa;
                Select_TipeEdit.value = element.data.tipe;
                PopOver_FormJajananEdit.open(element.container);
                PopOver_FormJajananEdit.data = element.data;
                PopOver_FormJajananEdit.element = element.container;
            }
        },
        "separator",
        {
            Title: "Hapus",
            Icon: "fd3c",
            Type: "Critical",
            Action: function(element) {  
                const jajan = element.data;
                Components.ActionSheet.Open(
                {
                    Title: "Yakin ingin menghapus jajanan '" + jajan.nama + "'?",
                    Description: "Kamu bisa buat lagi kapan saja jika butuh.",
                    Actions: [
                        { 
                            Title: "Hapus", Type: "Options.Critical", 
                            Action: o => 
                            { 
                                hapusJajanan(jajan, element.container);
                            } 
                        },
                        { 
                            Title: "Batal", Type: "Footer"
                        }
                    ]
                });
            }
        }
    ]);