window.addEventListener('DOMContentLoaded', event => {


	/*
	firebase.auth().sendPasswordResetEmail('imuratony@gmail.com').then(function() {
		alert("mail gönderildi")
	  })
	  .catch(function(error) {
		alert("smtp hatası")
	  });
	  */
	init((initData) => {
		let tableOptions = document.getElementById("periodDropDown").options;
		startTable(initData[tableOptions[tableOptions.selectedIndex].innerText], (responseTable) => {
			$('#hot-display-license-info').remove();
		})
	})
	document.getElementById('importFile').setAttribute("hidden", true);
});
setTimeout(() => {
	table.addHook("afterOnCellMouseDown", function () {
		console.log(table.getDataAtRow(arguments[1].row));
	});
}, 1000);

$('#periodDropDown').change(event => {
	$("#grid-table").html("");
	$('#hot-display-license-info').remove();
	let tableOptions = document.getElementById("periodDropDown").options;
	let changePeriod = tableOptions[tableOptions.selectedIndex].innerText;
	startTable(fireData[changePeriod], () => { });
})

$('.btn-add').click(function () {

	try {
		let detail = document.getElementsByClassName("form-control").name.value;
		let amount = document.getElementsByClassName("form-control").amount.value;
		document.getElementById('importFile').setAttribute("hidden", true);
		if (detail.trim() == "" || amount.trim() == "") {
			throw new Error("Kayıt Başarısız.\nAlanlar boş bırakılarak kayıt işlemi gerçekleştirilemez");
		}
		let tableOptions = document.getElementById("periodDropDown").options;
		let historyPeriod = tableOptions[tableOptions.selectedIndex].innerText;
		var pushData = {
			name: detail,
			amount: amount,
			date: new Date().toLocaleDateString('tr-TR', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + new Date().toLocaleTimeString('tr-TR')
		};
		fireData[historyPeriod].push(pushData);

		PocketRealtime.setValue({
			path: historyPeriod,
			params: fireData[historyPeriod],
			done: (response) => {
				successAddPaymentValidation(historyPeriod);
			},
			fail: (error) => {
				throwAddPaymentValidation(error);
			}
		});

	} catch (error) {
		throwAddPaymentValidation(error);
	}
})

$('.btn-add-period').click(function () {

	try {
		let period = document.getElementsByClassName("form-control").periodName.value;
		if (period.trim() == "") {
			throw new Error("Kayıt Başarısız.\nAlanlar boş bırakılarak kayıt işlemi gerçekleştirilemez");
		}
		PocketRealtime.setValue({
			path: period,
			params: [{ "name": "", "amount": "" }],
			done: (response) => {
				successAddPeriodValidation();
			},
			fail: (error) => {
				throwAddPeriodValidation(error);
			}
		});
	} catch (error) {
		throwAddPeriodValidation(error);
	}
})

$('.save').click(function () {
	var tableData = table.getData();
	var restoredData = [];

	for (let i = 0; i < tableData.length; i++) {
		if (tableData[i][0] != "TOPLAM") {
			var rowData = {
				name: tableData[i][0],
				amount: tableData[i][1],
				date: tableData[i][2]
			}
			restoredData.push(rowData);
		}
	}
	let tableOptions = document.getElementById("periodDropDown").options;
	let historyPeriod = tableOptions[tableOptions.selectedIndex].innerText;

	PocketRealtime.setValue({
		path: historyPeriod,
		params: restoredData,
		done: (response) => {
			if (response) successSaveChange(historyPeriod)
			else throwSaveChange("false")

		},
		fail: (error) => {
			throwSaveChange(error)
		}
	});
})

$('.backup').click(function () {
	backupValidation((validate) => {
		if (validate) {
			if (confirm('Veritabanı kayıtlarını yedekleyip indirmek istiyor musun?' + "\n" + "Dosya Boyutu: " + (JSON.stringify(fireData).length / 1024).toFixed(2) + " MB")) {
				try {
					$.ajax({
						type: "GET",
						url: 'https://worldtimeapi.org/api/timezone/Europe/Istanbul',
						success: function (data) {
							if (!isNull(data) && !isUndefined(data)) {
								onDownload("GelirGider_" + data.datetime.substring(0, 10) + "_" + data.datetime.substring(11, 19).replaceAll(':', '.') + "_backup")
							}
						},
						fail: function (error) {
							throw new Error(error)
						},
						timeout: 10000
					})
				} catch (error) {
					onDownload("GelirGider_backup_AJAXERR");
				}
			}
		}
		else if (!validate) {
			alert("Authentication Error")
		}
	})
})

$('.importFile').click(function () {
	try {
		var files = document.getElementById('file').files;
		if (files.length <= 0) {
			throwAddFileValidation("Yüklenmeye çalışılan dosya boş.")
		}
		if (files[0].type != "application/json") {
			throwAddFileValidation("Yüklenen dosya tipi 'JSON' formatında olmalı")
		}
		var fileReader = new FileReader();
		fileReader.onload = function (e) {
			var result = JSON.parse(e.target.result);
			var formatted = JSON.stringify(result, null, 2);
			table.loadData(restoreData(JSON.parse(formatted)));
			successAddFileValidation();
			console.log("Dosya yükleme başarılı")

		}
		fileReader.readAsText(files[0]);
	}
	catch (error) {
		throwAddFileValidation(error);
	}

})

$('.deletePeriod').click(function () {
	try {
		let tableOptions = document.getElementById("periodDropDown").options;
		let historyPeriod = tableOptions[tableOptions.selectedIndex].innerText;
		if (confirm(historyPeriod + " dönemi silinmek üzere. Onaylıyor musunuz?")) {
			PocketRealtime.deleteValue({
				path: historyPeriod,
				done: (response) => {
					alert(historyPeriod + " dönemi silindi");
				},
				fail: (error) => {
					throw new Error(error);
				}
			})
		}
	} catch (error) {
		throw new Error(error);
	}
})

$('.btn-close').click(function (arg) {
	console.log("kapatıldı")
})

$('.statistics').click(function () {
	calculateStatistics()
})

$('.funds').click(function () {
	PocketRealtime.getFunds({
		done: (response) => {
			fetch('https://finans.truncgil.com/today.json')
				.then(response => response.json())
				.then(data => {
					dropdownData = data;
					lastFundsCallbackTime = fundsLastCallbackTime(data["Update_Date"]);
					document.getElementById("lastFundsEndexCallbackTimeDiv").innerHTML = "Endexlerin Son Güncellenme Tarihi"+"<br>"+'<p style="text-decoration:underline">' + lastFundsCallbackTime + '</p>';
					fundsData = response;
					fundsData.forEach(item => {
						if (data[item.currencyType] && data[item.currencyType].Alış) {
							item.endex = data[item.currencyType].Alış;
						}
					});
					calculateFunds(response);
				})
				.catch(error => {
					throw new Error("Birikim verileri getirilirken hata oluştu. Ayrıntısı: \n",error);
				});

		},
		fail: (error) => {
			throw new Error(error).stack;
		}
	})
})

$('.btn-reCalculate').click(function () {
	let fudsTbl = fundsTable.getData();
	isClickReCalculate = true;
	senderFunds = [];
	for (let i = 0; i < fudsTbl.length; i++) {
		let currencyType = fudsTbl[i][0];
		let amount = fudsTbl[i][1];
		let endex = fudsTbl[i][2];
		let forTl = fudsTbl[i][3]
		let rowData = {
			"currencyType": currencyType,
			"amount": amount,
			"endex": endex,
			"forTl": currencyType != "TL" ? (parseFloat(endex.replace(/\./g, 'TEMP').replace(/,/g, '.').replace(/TEMP/g, ',')) * parseFloat(amount).toFixed(2)) : parseFloat(amount) * parseFloat(endex)
		}
		senderFunds.push(rowData);
	}
	calculateFunds(senderFunds);
})


$(".btn-saveFunds").click(function () {
	PocketRealtime.setFunds({
		params: senderFunds,
		done: (response) => {
			console.log("Kaydetme Sonucu: " + response);
		},
		fail: (error) => {
			throw new Error(error).stack;
		}
	})
});

$('.installments').click(function () {
	PocketRealtime.getInstallments({
		done: (response) => {
			renderInstallmentsTable(response);
		},
		fail: (error) => {
			throw new Error(error).stack;
		}
	})
})

$('.btn-addFundType').click(function () {
	let dropdown = document.getElementById("dropdownFunds");
	dropdown.innerHTML = ''; // önceki değerleri temizle
	let keysHeader = Object.keys(dropdownData);
	for (let key in keysHeader) {
		// Alınan endex değerlerinin son güncellenmiş tarihi
		lastFundsCallbackTime = dropdownData[keysHeader[key]];
		if (keysHeader[key] != "Update_Date") {
			let option = document.createElement("a");
			option.href = "#";
			option.className = "dropdown-item";
			option.innerText = keysHeader[key];
			option.addEventListener("click", function(event) {
				event.preventDefault();  // Sayfanın yeniden yüklenmesini engelle
				let selectedFundsDropdownKey = event.target.innerText;
				console.log(dropdownData[selectedFundsDropdownKey]);  // Seçilen anahtarı konsola yaz

				// Tablo için insert datası oluturuyoruz.
				let endexValue = dropdownData[selectedFundsDropdownKey].Alış;
				let insertTableData = {
					amount:0,
					currencyType:selectedFundsDropdownKey,
					endex:dropdownData[selectedFundsDropdownKey].Alış,
					forTl: parseFloat(0) * parseFloat(endexValue)
				};
				fundsData.push(insertTableData);
				fundsTable.loadData(fundsData);
			});
			dropdown.appendChild(option);
		}

	}
})
$('#a.dropdown-item').click(function (arg) {
	console.log("selected",arg)
})

