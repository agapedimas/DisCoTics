Components.ContextMenu.Add("MenuJajanan",  
    [
        {
            Title: "Edit",
            Icon: "f7cf",
            Action: function(element) {
                Input_NamaEdit.value = element.data.nama;
                Input_HargaEdit.value = formatCurrency(element.data.harga);
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
                    Description: "Tekan Shift dan tombol (-) secara bersamaan untuk menghapus tanpa konfirmasi.",
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