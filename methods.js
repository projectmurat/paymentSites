let table;
let fundsTable;
let selectedData;
let fundsData;
let historyFundsTable;
let selectedUserActivityItem;
let senderFunds = [];
let allProducts = [];
let markets = [];
let productInfo = {};
let sumFundsAmount;
const months_tr = ["Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran", "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"];
const months_tr_short = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const INSERT_SUCCESS = "Kayit işlemi başarili";
const INSERT_FAILED = "Kayit Başarisiz"
const DELETE_SUCCESS = "Silme İşlemi başarili";
const DELETE_FAILED = "Silme İşlemi Başarisiz";
let dropdownData;
let isClickReCalculate = false;
let lastFundsCallbackTime;
let myChart;
let selectedUserActivityLimit = 10;
let familyIncomeObject;
let familyIncomeAmount = 0;
let globalTotalMontlyInstallmentAmount;
let familyOutObject;



document.getElementById("marketDropdown").addEventListener("change", updateProductDropdown);

function restoreData(tableData) {
	let sumColumnAmount = 0;
	tableData.forEach(data => {
		sumColumnAmount += parseFloat(data.amount == "" ? 0 : data.amount);
	})
	tableData = tableData.filter(i => i.name != "TOPLAM");
	tableData.reverse().push({ name: "TOPLAM", amount: sumColumnAmount, date: "" });
	return tableData
}

function getAttribute(source, key, defaultValue) {
	let snapshot = source;

	function recursion(recursiveKey) {
		for (const element of recursiveKey) {
			if (isObject(snapshot[element])) {
				snapshot = snapshot[element];
			}
			else if (!isUndefined(snapshot[key])) return snapshot[key];
			else return defaultValue;
		}
		return snapshot;
	}
	return recursion(key.split('.'));
}

function putKeyInsideObject(object) {
	// Mevcut objenin anahtarını al
	const existingKey = Object.keys(object)[0];

	// Mevcut objenin içine anahtarını ekleyin
	object[existingKey]["key"] = existingKey;

	return object;
}

function startTable(data, callback) {
	if (data == null) {
		console.info("Silme işlemi için tablo tetiklendi ve es geçildi.");
		throw new Error("jumped.")
	}
	data.sort((a, b) => convertDate(b.date).getTime() - convertDate(a.date).getTime());
	let container = document.querySelector(".handsontable-container");
	table = new Handsontable(container, {
		data: restoreData(data.reverse()),
		width: "100%",
		height: "350px",
		rowHeaders: true,
		stretchH: "all",
		rowHeights: 40,
		className: 'htCenter htMiddle my-custom-header',  // Buraya eklenen sınıfı kullanarak özelleştireceğiz
		colHeaders: function (col) {
			switch (col) {
				case 0:
					return '<b>Harcama Detayı</b>';
				case 1:
					return '<b>Harcama Tutarı</b>';
				case 2:
					return '<b>Tarih</b>';
			}
		},
		fixedRowsBottom: 1,
		contextMenu: true,
		modifyColWidth: function (width, col) {
			if (width > 200) return 250;
		},
		columns: [
			{
				data: "name",
				editor: "text"
			},
			{
				data: "amount",
				type: "numeric",
				numericFormat: { pattern: "$0,0.00", culture: "tr-TR" },
				editor: "text"
			},
			{
				data: "date",
				type: "date",
				dateFormat: "DD/MM/YYYY",
				correctFormat: true,
				defaultDate: new Date().toDateString()
			}
		]
	});

	$('#hot-display-license-info').remove();
	callback(table);
}

function init(callback) {
	getLoggedUserInfo((dummy) => {
		const countriesDropDown = document.getElementById("periodDropDown");
		PocketRealtime.getPaymentDates({
			done: (paymentDates) => {
				countriesDropDown.innerHTML = "";
				if (!isNull(paymentDates)) {
					selectedData = paymentDates;
					let countriesData = {};
					let keys = Object.values(paymentDates).map(i => i.date);
					keys = keys.sort(compareDates);
					for (const element of keys) {
						let key = "".concat(element)
						let temp = {}
						temp[key] = ""
						Object.assign(countriesData, temp);
					}
					for (let key in countriesData) {
						let option = document.createElement("option");
						option.setAttribute("value", keys[key]);

						let optionText = document.createTextNode(key);
						option.appendChild(optionText);

						for (let key in paymentDates) {
							if (paymentDates.hasOwnProperty(key)) {
								paymentDates[key]["id"] = key;
							}
						}

						option.className = Object.values(paymentDates).filter(i => i.date == option.innerText)[0].id;

						countriesDropDown.appendChild(option);
						countriesDropDown.selectedIndex = 0;
					}
					let tableOptions = document.getElementById("periodDropDown").options;
					let path = tableOptions[tableOptions.selectedIndex].innerText;
					PocketRealtime.getValue({
						path: "/" + path,
						done: (response) => {
							selectedData = response;
							callback(response)
						},
						fail: (error) => {
							alert("Başlangıç ajax hatası meydana geldi.");
						}
					})
				}
				else {
					callback([])
				}
			},
			fail: (error) => {
				alert.alert("Periyot tarihleri alınırken hata alındı.")
			}
		})
	})
}

function download(content, fileName, contentType) {
	try {
		const a = document.createElement("a");
		const file = new Blob([content], { type: contentType });
		a.href = URL.createObjectURL(file);
		a.download = fileName;
		a.click();
	}
	catch (error) {
		alert("DownloadError - İndirme işlemi sırasında hata ile karşılaşıldı.")
	}

}

function onDownload(downloadName) {
	download(JSON.stringify(fireData), downloadName + ".json", "text/plain");
}

function backupValidation(callback) {
	callback(true);
	/*
	firebase.auth().signInWithEmailAndPassword("imuratony@gmail.com", prompt("$root:"))
		.then((userCredential) => {
			callback(true);
		})
		.catch((error) => {
			callback(false);
		});
	*/
}

function calculateStatistics(callback) {
	PocketRealtime.getStatistics({
		done: (response) => {
			let keys = Object.keys(response);
			let sumPayments = 0;
			let statisticsData = [];
			for (const element of keys) {
				let sumPaymentsObject = {};
				response[element].forEach(items => {
					sumPayments += parseFloat(items.amount == "" ? 0 : items.amount)
				})
				sumPaymentsObject = {}
				sumPaymentsObject["period"] = element;
				sumPaymentsObject["amount"] = sumPayments;
				statisticsData.push(sumPaymentsObject);
				sumPayments = 0;
			}
			statisticsData = statisticsData.sort(comparePeriodDates);
			setTimeout(() => {
				statisticTableCallback(statisticsData, () => {
					document.getElementById("popup-info-period-msg-count").innerHTML = "Toplam Dönem: " + statisticsData.length.toString() + " Ay";
					document.getElementById("popup-info-period-msg-amount").innerHTML = "Toplam Harcama: " + new Intl.NumberFormat('en-US').format(statisticsData.map(i => i.amount).reduce((acc, current) => acc + current, 0)) + " ₺";
				})
			}, 1);
		},
		fail: (error) => {

		}
	})
}

function statisticTableCallback(data, callback) {
	let container = document.querySelector(".handsontable-container-statistics");
	let statisticsTable = new Handsontable(container, {
		data: data,
		width: "100%",
		height: "300px",
		rowHeaders: true,
		stretchH: "all",
		rowHeights: 40,
		colHeaders: ["Dönem", "Toplam Ödenen"],
		contextMenu: true,
		modifyColWidth: function (width, col) {
			if (width > 250) return 250
		},
		columns: [
			{ data: "period" },
			{
				data: "amount",
				type: "numeric",
				numericFormat: { pattern: "$0,0.00", culture: "tr-TR" },
			}
		],
	});
	$('#hot-display-license-info').remove();
	callback(statisticsTable)
}

function fundsTableCallback(data, callback) {
	let container = document.querySelector(".handsontable-container-funds");
	data = data.length == 1 ? data[0] : data
	fundsTable = new Handsontable(container, {
		data: data,
		width: "100%",
		height: "200px",
		rowHeaders: true,
		stretchH: "all",
		rowHeights: 40,
		colHeaders: ["Döviz Türü", "Miktar", "Kur Endexi", "TL Karşılığı"],
		contextMenu: true,
		modifyColWidth: function (width, col) {
			if (width > 250) return 250;
		},
		columns: [
			{ data: "currencyType", className: "htCenter", readOnly: true },
			{
				data: "amount",
				type: "numeric",
				numericFormat: { pattern: "$0,0.00", culture: "tr-TR" },
				className: "htCenter"
			},
			{
				data: "endex",
				type: "numeric",
				numericFormat: { pattern: "$0,0.00", culture: "tr-TR" },
				className: "htCenter"
			},
			{
				data: "forTl",
				type: "numeric",
				numericFormat: { pattern: "$0,0.00", culture: "tr-TR" },
				className: "htCenter"
			}
		],
		className: "htCenter" // Hücre içeriklerini ortala
	});

	$('#hot-display-license-info').remove();
	callback(fundsTable)
}
function fundsHistoryTableCallback(data, callback) {
	let container = document.querySelector(".handsontable-container-fundsHistory");
	historyFundsTable = new Handsontable(container, {
		data: data,
		width: "100%",
		height: "400px",
		rowHeaders: true,
		stretchH: "all",
		rowHeights: 40,
		colHeaders: ["Tarih", "Tutar"],
		contextMenu: false,
		modifyColWidth: function (width, col) {
			if (width > 200) return 200;
		},
		columns: [
			{
				data: "insertDate",
				type: "date",
				dateFormat: "DD/MM/YYYY",
				correctFormat: true,
				defaultDate: new Date().toDateString(),
				readOnly: true // Tarih sütununu read-only yap
			},
			{
				data: "sunFunds",
				type: "numeric",
				numericFormat: { pattern: "$0,0.00", culture: "tr-TR" },
				className: "htCenter",
				renderer: function (instance, td, row, col, prop, value, cellProperties) {
					// $ işaretini hücre içeriğine ekleyerek görüntüle
					Handsontable.renderers.TextRenderer.apply(this, arguments);
					td.innerHTML = "$" + value;
				},
				readOnly: true
			},
		],
		className: "htCenter" // Hücre içeriklerini ortala
	});


	$('#hot-display-license-info').remove();
	callback(historyFundsTable)
}

function calculateFunds(params) {
	let fundsTableData = [];
	if (params.length != 0) {

		params.forEach(item => {
			if (item.currencyType != "TL") {
				let endexValue = parseFloat(item.endex.replace('.', '').replace(',', '.'));
				item.forTl = parseFloat(item.amount) * endexValue;
			}

		});
		fundsTableData.push(Object.values(params));
		if (isClickReCalculate) {
			fundsTable.loadData(fundsTableData[0]);
			let sumFunds = fundsTableData[0].map(i => i.forTl).reduce((acc, currentValue) => acc + currentValue, 0);
			sumFundsAmount = formatCurrency(sumFunds);
			document.getElementById("sumFundsInfo").innerHTML = 'Toplam Birikim Tutarı: ' + '<b>' + formatCurrency(sumFunds) + ' ₺' + '</b>';
			isClickReCalculate = false;
		}
		else {
			setTimeout(() => {
				fundsTableCallback(fundsTableData, () => {

					let sumFunds = fundsTableData[0].map(i => i.forTl).reduce((acc, currentValue) => acc + currentValue, 0);
					sumFundsAmount = formatCurrency(sumFunds);
					document.getElementById("sumFundsInfo").innerHTML = 'Toplam Birikim Tutarı: ' + '<b>' + formatCurrency(sumFunds) + ' ₺' + '</b>';

					let historyData = {
						"fundsList": fundsTableData,
						"sunFunds": sumFundsAmount,
						"insertDate": new Date().toLocaleDateString('tr-TR', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + new Date().toLocaleTimeString('tr-TR')
					}
					PocketRealtime.insertFundsHistory({
						params: historyData,
						done: (response) => {
							console.log(response);
						},
						fail: (error) => {
							throw new Error("Fon Tarihçe kaydemte işleminde hata meydana geldi.");
						}
					})

				})
			}, 1);
		}
	}
	else {
		fundsTableCallback(fundsTableData, () => {
			if (fundsTableData.length != 0) {
				let sumFunds = fundsTableData[0].map(i => i.forTl).reduce((acc, currentValue) => acc + currentValue, 0);
				sumFundsAmount = formatCurrency(sumFunds);
				document.getElementById("sumFundsInfo").innerHTML = 'Toplam Birikim Tutarı: ' + '<b>' + formatCurrency(sumFunds) + ' ₺' + '</b>';

				let historyData = {
					"fundsList": fundsTableData,
					"sunFunds": sumFundsAmount,
					"insertDate": new Date().toLocaleDateString('tr-TR', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + new Date().toLocaleTimeString('tr-TR')
				}
				PocketRealtime.insertFundsHistory({
					params: historyData,
					done: (response) => {
						console.log(response);
					},
					fail: (error) => {
						throw new Error("Fon Tarihçe kaydemte işleminde hata meydana geldi.");
					}
				})
			}
			else {
				document.getElementById("sumFundsInfo").innerHTML = 'Toplam Birikim Tutarı: ' + '<b>' + 0 + ' ₺' + '</b>';
			}
		})
	}
}
function fundsLastCallbackTime(dateStr) {
	const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
	const days = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

	// Veriyi Date objesi olarak oluştur.
	const date = new Date(dateStr);

	// Tarihi istediğiniz formata dönüştür.
	const day = days[date.getDay()];
	const month = months[date.getMonth()];
	const year = date.getFullYear();
	const dayOfMonth = date.getDate();
	const hour = String(date.getHours()).padStart(2, '0');
	const minute = String(date.getMinutes()).padStart(2, '0');
	const second = String(date.getSeconds()).padStart(2, '0');

	return `${dayOfMonth} ${month} ${year} ${day} ${hour}:${minute}:${second}`;
}

function readURL(params) {
	if (document.getElementById('file').files[0].type == "application/json") {
		document.getElementById('importFile').removeAttribute("hidden")
	}
	else {
		document.getElementById('importFile').setAttribute("hidden", true);
	}
}

function setButtonReadOnly(value) {
	let buttons = document.querySelectorAll('button');
	for (const element of buttons) {
		element.disabled = value;
	}

}

function convertDate(str) {
	const months = {
		"Oca": 0,
		"Şub": 1,
		"Mar": 2,
		"Nis": 3,
		"May": 4,
		"Haz": 5,
		"Tem": 6,
		"Ağu": 7,
		"Eyl": 8,
		"Eki": 9,
		"Kas": 10,
		"Ara": 11
	};

	const parts = str.split(' ');
	const day = parseInt(parts[0], 10);
	const month = months[parts[1]];
	const year = parseInt(parts[2], 10);
	const timeParts = parts[4].split(':');
	const hour = parseInt(timeParts[0], 10);
	const minute = parseInt(timeParts[1], 10);
	const second = parseInt(timeParts[2], 10);

	return new Date(year, month, day, hour, minute, second);
}

function compareDates(a, b) {
	const [monthA, yearA] = a.split('-');
	const [monthB, yearB] = b.split('-');

	if (yearA === yearB) {
		return months_tr.indexOf(monthB) - months_tr.indexOf(monthA); // Aynı yıl içinde aylara göre sırala
	}
	return parseInt(yearB) - parseInt(yearA); // Farklı yıllarsa yıllara göre sırala
}

function comparePeriodDates(a, b) {
	const [monthA, yearA] = a.period.split('-');
	const [monthB, yearB] = b.period.split('-');

	if (yearA === yearB) {
		return months_tr.indexOf(monthB) - months_tr.indexOf(monthA); // Aynı yıl içinde aylara göre sırala
	}
	return parseInt(yearB) - parseInt(yearA); // Farklı yıllarsa yıllara göre sırala
}

function renderInstallmentsTable(installmentData) {
	const tbody = document.getElementById('taksitler');
	document.querySelector(".btn-installments").disabled = false;
	document.getElementById("deleteButton").style.display = "none";
	tbody.innerHTML = '';
	const monthsInTurkish = [
		"Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
		"Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
	];

	// Toplam kalan tutar hesabı için değişken
	let totalRemaining = 0;

	let rowColorCounter = 0;
	let totalMontlyInstallmentAmount = 0;
	// JSON verisini dolaşıp tabloya ekliyoruz
	for (let key in installmentData) {

		const data = installmentData[key];
		const remainingAmount = (data.totalMonths - data.currentMonth) * data.installmentAmount;
		totalRemaining += remainingAmount;
		totalMontlyInstallmentAmount += data.installmentAmount;

		// Yeni satır oluşturma
		const row = tbody.insertRow();
		row.style.backgroundColor = rowColorCounter % 2 == 0 ? "#dedcdc" : "white";
		rowColorCounter++;
		row.style.fontSize = "smaller";


		const checkboxCell = row.insertCell(0);
		const checkboxInput = document.createElement('input');
		checkboxInput.type = 'checkbox';
		checkboxInput.className = 'installmentCheckbox';
		checkboxInput.dataset.key = key; // Seçilen satırın anahtarını saklayın
		checkboxCell.appendChild(checkboxInput);

		// Sütunlar
		row.insertCell(1).innerText = data.item;

		// İlerleme çubuğunu ekleme
		const progressCell = row.insertCell(2);
		const progressContainer = document.createElement('div');
		progressContainer.classList.add('progress-bar-container');

		const progressBarFill = document.createElement('div');
		progressBarFill.classList.add('progress-fill');

		const progressLabel = document.createElement('span');
		progressLabel.classList.add('progress-bar-label');
		progressLabel.style.fontWeight = "bolder";
		progressLabel.innerText = `${data.currentMonth} / ${data.totalMonths}`;

		const progressPercentage = (data.currentMonth / data.totalMonths) * 100;
		progressBarFill.style.width = `${progressPercentage}%`;

		progressContainer.appendChild(progressBarFill);
		progressContainer.appendChild(progressLabel);
		progressCell.appendChild(progressContainer);

		row.insertCell(3).innerText = `${formatCurrency(data.installmentAmount.toFixed(2))}₺`;
		row.insertCell(4).innerText = `${formatCurrency(remainingAmount.toFixed(2))}₺`;


		// Ödeme butonunu oluşturma
		const currentYear = new Date().getFullYear();
		const currentMonthIndex = new Date().getMonth(); // Ay 0'dan başladığı için ekstra +1'e gerek yok

		// Ödeme butonunu oluşturma
		const paymentButton = document.createElement('button');
		paymentButton.classList.add('payment-button');
		paymentButton.innerText = `Ödendi olarak İşaretle`;
		paymentButton.dataset.key = key; // Tıklama olayında hangi taksitin güncellendiğini belirlemek için

		let adjustedLastPaidMonth = (data.lastPaidMonth % 12 === 0) ? 12 : data.lastPaidMonth % 12;

		if ((adjustedLastPaidMonth >= currentMonthIndex + 1 || data.lastPaidYear < currentYear)) { // Ay 0'dan başladığı için +1 eklememiz gerekiyor
			paymentButton.disabled = true;
			paymentButton.innerText = `${monthsInTurkish[currentMonthIndex]}-${currentYear} Ödendi`;
		}

		// Taksit ekle eventi
		paymentButton.addEventListener('click', function () {
			const itemKey = this.dataset.key;
			installmentData[itemKey].lastPaidMonth++;
			installmentData[itemKey].currentMonth++;
			installmentData[itemKey].lastPaidYear = currentYear;
			const selectedInstallment = { ...installmentData[itemKey] };
			this.innerText = `${monthsInTurkish[currentMonthIndex]}-${currentYear} Ödendi`;
			this.disabled = true;
			tbody.innerHTML = '';
			if (selectedInstallment.totalMonths == selectedInstallment.currentMonth) {
				selectedInstallment["status"] = "0";
			}
			PocketRealtime.updateInstallments({
				params: selectedInstallment,
				where: { "key": itemKey },
				done: (response) => {
					if (response) {
						renderInstallmentsTable(installmentData);
					}
				},
				fail: (error) => {
					throw new Error(error);
				}
			})
		});
		const paymentCell = row.insertCell(5);
		paymentCell.appendChild(paymentButton);

		const checkboxes = document.querySelectorAll('.installmentCheckbox');
		checkboxes.forEach(cb => {
			cb.addEventListener('change', function () {
				checkboxes.forEach(innerCb => {
					if (innerCb !== this) {
						innerCb.disabled = this.checked;
					}
				});

				const deleteButton = document.getElementById('deleteButton');
				if (this.checked) {
					deleteButton.style.display = 'inline-block';
					document.querySelector(".btn-installments").disabled = true
				} else {
					deleteButton.style.display = 'none';
					document.querySelector(".btn-installments").disabled = false;
				}

				deleteButton.onclick = () => {
					const selectedKey = this.dataset.key;
					console.log(`Silinmek istenen veri anahtarı: ${selectedKey}`);
					PocketRealtime.deleteInstallments({
						where: { "key": selectedKey },
						done: (response) => {
							if (response) {
								alert("Taksit silindi.");
							}
						},
						fail: (error) => {
							throw new Error(error);
						}
					})
					// Gerçek silme işlemi için burada kod ekleyebilirsiniz
				};
			});
		});
	}

	// Toplam kalan tutarı güncelleme
	document.getElementById('toplamKalan').innerText = `${formatCurrency(totalRemaining.toFixed(2))} ₺`;
	// Toplam aylık tutarı güncelleme
	document.getElementById('toplamAylık').innerText = `${formatCurrency(totalMontlyInstallmentAmount.toFixed(2))} ₺`;

	globalTotalMontlyInstallmentAmount = totalMontlyInstallmentAmount;

	document.getElementById('eldeKalanMiktar').innerText = `${formatCurrency(totalMontlyInstallmentAmount.toFixed(2))} ₺`;

}

function collectaNewInstallmentData() {
	const itemName = document.getElementById("itemName").value;
	const installmentAmount = document.getElementById("installmentAmount").valueAsNumber;
	const currentInstallment = document.getElementById("currentInstallment").valueAsNumber;
	const lastPaidMonth = document.getElementById("lastPaidMonth").value;
	const totalInstallment = document.getElementById("totalInstallment").value;

	// Alanların dolu olup olmadığını kontrol ediyoruz
	if (!itemName ||
		isNaN(installmentAmount) ||
		isNaN(currentInstallment) ||
		!lastPaidMonth ||
		!totalInstallment) {
		alert("Lütfen tüm alanları doldurun!");
		return;  // Eğer herhangi bir alan boşsa fonksiyonu burada sonlandırıyoruz
	}
	const currentDate = new Date();
	const currentYear = currentDate.getFullYear();
	const currentMonthIndex = currentDate.getMonth();
	const currentMonthName = months_tr[currentMonthIndex];

	// TODO: taksidi ekleme tarihi ay ismi ve yıl değeri eklendi. Bunların db'de de eklenmesi lazım.
	const jsonData = {
		item: itemName,
		installmentAmount: installmentAmount,
		currentMonth: currentInstallment,
		lastPaidMonth: parseInt(lastPaidMonth),
		totalMonths: parseInt(totalInstallment),
		status: "1",
		insertMonth: currentMonthName,
		insertYear: currentYear

	};

	PocketRealtime.pushInstallments({
		params: jsonData,
		done: (response) => {
			if (response) {
				alert("Taksit Eklendi");
			}
		},
		fail: (error) => {
			alert("Taksit eklenirken hata oluştu.");
			throw new Error(error);
		}
	})
	console.log(jsonData); // Bu satırda JSON verisini konsolda görebilirsiniz.
}

function formatCurrency(value) {
	return new Intl.NumberFormat('tr-TR', {
		style: 'decimal',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(value);
}

function hesapla() {
	const anaPara = parseFloat(document.getElementById('anaPara').value);
	const birikim = parseFloat(document.getElementById('birikim').value);
	const faizOrani = parseFloat(document.getElementById('faizOrani').value) / 100;
	const toplamAy = parseInt(document.getElementById('toplamAy').value)

	if (anaPara && faizOrani && toplamAy) {
		const stopajOrani = 0.05;
		let tablo = '<thead><tr><th>Ay</th><th>Net Ana Para (₺)</th><th>Brüt Faiz Tutarı (₺)</th><th>Birikim (₺)</th><th>Stopaj (₺)</th><th>Net Faiz Getirisi (₺)</th></tr></thead><tbody>';
		let mevcutAnaPara = anaPara;

		for (let i = 1; i <= toplamAy; i++) {
			if (birikim) {
				mevcutAnaPara += birikim;
			}
			const brutFaizTutari = (mevcutAnaPara * faizOrani) / 12;
			const stopajTutari = brutFaizTutari * stopajOrani;
			const netFaiz = brutFaizTutari - stopajTutari;

			mevcutAnaPara += netFaiz;

			tablo += `<tr>
		<td>${i}. Ay</td>
		<td>${formatCurrency(mevcutAnaPara.toFixed(2))} ₺</td>
		<td>${formatCurrency(brutFaizTutari.toFixed(2))} ₺</td>
		<td>${formatCurrency(birikim.toFixed(2))} ₺</td>
		<td class="negative">-${formatCurrency(stopajTutari.toFixed(2))} ₺</td>
		<td class="positive">${formatCurrency(netFaiz.toFixed(2))} ₺</td>
	  </tr>`;
		}

		tablo += '</tbody>';
		document.getElementById('sonucTablosu').innerHTML = tablo;
	}

}

function addProduct() {
	const productInput = document.getElementById("productInput");
	const productValue = productInput.value.trim();

	if (productValue && !allProducts.includes(productValue)) {
		allProducts.push(productValue);

		// Ürünü dropdown'a ekleyelim
		const productDropdown = document.getElementById("productDropdown");
		const option = document.createElement("option");
		option.value = productValue;
		option.innerText = productValue;
		productDropdown.appendChild(option);

		// Ürünü eklenen ürünler listesine ekleyelim
		const addedProductsList = document.getElementById("addedProductsList");
		const listItem = document.createElement("li");
		listItem.className = "list-group-item";
		listItem.innerText = productValue;
		listItem.style.padding = "0";
		listItem.style.border = "0";
		listItem.style.display = "list-item";
		addedProductsList.appendChild(listItem);

		// Input değerini sıfırlayalım
		productInput.value = "";
	} else {
		alert("Bu ürün zaten eklenmiş ya da geçerli bir ürün ismi girilmedi!");
	}
}

function addMarket() {
	let market = document.getElementById("marketInput").value;
	if (market && !markets.includes(market)) {
		markets.push(market);
		updateMarketDropdown();
		document.getElementById("marketInput").value = ''
	}
}

function updateMarketDropdown() {
	let marketDropdown = document.getElementById("marketDropdown");
	marketDropdown.innerHTML = markets.map(market => `<option value="${market}">${market}</option>`).join("");
}

function updateProductDropdown() {
	let market = document.getElementById("marketDropdown").value;
	let productDropdown = document.getElementById("productDropdown");
	let availableProducts = allProducts.filter(product => {
		return !(productInfo[market]?.[product]);
	});
	productDropdown.innerHTML = availableProducts.map(product => `<option value="${product}">${product}</option>`).join("");
}

function addPriceAndGram() {
	let market = document.getElementById("marketDropdown").value;
	let product = document.getElementById("productDropdown").value;
	let gram = document.getElementById("gramInput").value;
	let price = document.getElementById("priceInput").value;

	if (!productInfo[market]) {
		productInfo[market] = {};
	}
	productInfo[market][product] = { gram, price };

	updateProductDropdown();
}

function compareProducts() {
	let comparisonResults = document.getElementById("comparisonResults");
	let results = {};

	allProducts.forEach(product => {
		let bestMarket = "";
		let bestPricePerGram = Infinity;

		for (let market in productInfo) {
			if (productInfo[market][product]) {
				let price = parseFloat(productInfo[market][product].price);
				let gram = parseFloat(productInfo[market][product].gram);
				let pricePerGram = price / gram;

				if (pricePerGram < bestPricePerGram) {
					bestPricePerGram = pricePerGram;
					bestMarket = market;
				}
			}
		}

		if (!results[bestMarket]) {
			results[bestMarket] = [];
		}
		results[bestMarket].push({
			product: product,
			price: productInfo[bestMarket][product].price,
			gram: productInfo[bestMarket][product].gram
		});
	});

	let displayResults = "";
	for (let market in results) {
		displayResults += `
    <div class="card my-3">
        <div class="card-header">
            <h5 data-market="${market}" onclick="toggleMarketDetails('${market}')" style="cursor:pointer;">${market}</h5>
        </div>
        <div id="details-${market}" style="display:none;" class="card-body">`;

		results[market].forEach(item => {
			displayResults += `<p>${item.product} - ${item.price} TL - ${item.gram} gr</p>`;
		});

		displayResults += `</div></div>`;
	}

	comparisonResults.innerHTML = displayResults;
}

function toggleMarketDetails(market) {
	let detailsDiv = document.getElementById(`details-${market}`);
	if (detailsDiv.style.display === "none") {
		detailsDiv.style.display = "block";
	} else {
		detailsDiv.style.display = "none";
	}
}

function getLoggedUserInfo(callback) {
	try {
		fetch('https://freeipapi.com/api/json')
			.then(response => response.json())
			.then(data => {
				let localInfo = {
					loginDate: new Date().toLocaleDateString('tr-TR', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + new Date().toLocaleTimeString('tr-TR')
				}
				Object.assign(data, localInfo);
				PocketRealtime.saveUserLoggedActivity({
					params: data,
					done: (responseSaveActivity) => {
						console.log("Kullanıcı aktivitesi kaydedildi.");
						callback()
					},
					fail: (error) => {
						console.log("Kullanıcı aktivitesi keydedilirken hata alındı.");
						callback()
					}
				})
			})
			.catch(error => {
				console.log(error);
				callback()
			});
	} catch (error) {
		console.log("Kullanıcı network bilgisi alınırken hata oluştu.");
		callback()
	}
}

function renderUserActivityModal(data) {
	// İzin verilen sütunlar
	const isAllowedColumns = ["cityName", "continent", "ipAddress", "loginDate"];

	const userData = document.getElementById('userData');
	userData.innerHTML = '';
	data.sort((a, b) => convertDate(b.loginDate).getTime() - convertDate(a.loginDate).getTime());
	Object.values(data).forEach(item => {
		const row = document.createElement('tr');

		// İşlem sütunu ve buton oluşturma
		const actionCell = document.createElement('td');
		const actionButton = document.createElement('button');
		actionButton.id = 'detailButton'; // Buton için özel ID
		actionButton.textContent = 'Detay';
		actionButton.setAttribute("data-target", "#userActivityDetailModal");
		actionButton.setAttribute('data-toggle', 'modal');
		actionButton.addEventListener('click', () => {
			selectedUserActivityItem = item;
			renderUserActivityDetailModal();
			console.log(item); // Veriyi konsola yazdırma
		});
		actionCell.appendChild(actionButton);
		row.appendChild(actionCell);

		// İzin verilen sütunları tabloya ekleme
		isAllowedColumns.forEach(column => {
			if (item.hasOwnProperty(column)) {
				const cell = document.createElement('td');
				cell.textContent = item[column];
				row.appendChild(cell);
			}
		});

		userData.appendChild(row);
	});
	document.getElementById('userActivitySpan').innerText = "Son " + selectedUserActivityLimit + " kayıt listelenmektedir.";
}
function renderUserActivityDetailModal() {

	document.getElementById('city').textContent = selectedUserActivityItem.cityName;
	document.getElementById('continent').textContent = selectedUserActivityItem.continent;
	document.getElementById('country').textContent = selectedUserActivityItem.countryName;
	document.getElementById('ip').textContent = selectedUserActivityItem.ipAddress;
	document.getElementById('loginDate').textContent = selectedUserActivityItem.loginDate;
	document.getElementById('isProxy').textContent = selectedUserActivityItem.isProxy ? "Var" : "Yok";
	document.getElementById('zipCode').textContent = selectedUserActivityItem.zipCode;

	const latitude = selectedUserActivityItem.latitude;
	const longitude = selectedUserActivityItem.longitude;
	const mapLink = document.getElementById('mapLink');
	mapLink.href = `https://www.google.com/maps?q=${latitude},${longitude}`;
}

function waitMe(shown) {
	if (shown) {
		document.getElementById("loader-overlay").style.display = "flex"
	}
	else {
		document.getElementById("loader-overlay").style.display = "none"
	}
}

function displayPaidInstallments(installments) {
	document.getElementById("paidInstallmentsTableBody").innerHTML = "";
	const paidInstallmentsTableBody = document.getElementById("paidInstallmentsTableBody");
	let totalInstallmentAmount = 0;
	for (const key in installments) {
		const installment = installments[key];

		if (installment.status === "0") {
			const row = document.createElement("tr");

			const itemNameCell = document.createElement("td");
			itemNameCell.textContent = installment.item;
			row.appendChild(itemNameCell);

			const installmentAmountCell = document.createElement("td");
			installmentAmountCell.textContent = formatCurrency(parseFloat(installment.installmentAmount));
			row.appendChild(installmentAmountCell);

			const month = installment.insertMonth || '-';
			const year = installment.insertYear || '-';
			const result = (month == "-" && year == "-") ? month + " / " + year : month + "-" + year
			const addPaidMonthCell = document.createElement("td");
			addPaidMonthCell.textContent = result;
			row.appendChild(addPaidMonthCell);

			const lastPaidMonthCell = document.createElement("td");
			let calculateMonth = installment.lastPaidMonth % 12 == 0 ? 12 : installment.lastPaidMonth % 12
			lastPaidMonthCell.textContent = months_tr[calculateMonth - 1] + "-" + installment.lastPaidYear;
			row.appendChild(lastPaidMonthCell);

			const totalMonthsCell = document.createElement("td");
			totalMonthsCell.textContent = installment.totalMonths;
			row.appendChild(totalMonthsCell);

			let installmentSumPaid = parseInt(installment.totalMonths) * parseInt(installment.installmentAmount);
			totalInstallmentAmount += installmentSumPaid;
			const totalPaid = document.createElement("td");
			totalPaid.textContent = formatCurrency(installmentSumPaid);
			row.appendChild(totalPaid);



			paidInstallmentsTableBody.appendChild(row);
		}
	}
	document.getElementById("toplamOdenmisTutar").innerText = formatCurrency(totalInstallmentAmount) + " ₺";
}

function setIncome(income) {
	let mySalary = income.mySalary
	let myMealAllowance = income.myMealAllowance
	let spouseSalary = income.spouseSalary
	let spouseMealAllowance = income.spouseMealAllowance

	document.getElementById("mySalary").value = mySalary
	document.getElementById("myMealAllowance").value = myMealAllowance
	document.getElementById("spouseSalary").value = spouseSalary
	document.getElementById("spouseMealAllowance").value = spouseMealAllowance

	const totalIncome = mySalary + myMealAllowance + spouseSalary + spouseMealAllowance;

	document.getElementById("totalIncome").textContent = formatCurrency(totalIncome) + " ₺";
}

function calculateAndSaveTotalIncome() {

	const mySalary = parseFloat(document.getElementById("mySalary").value) || 0;
	const myMealAllowance = parseFloat(document.getElementById("myMealAllowance").value) || 0;
	const spouseSalary = parseFloat(document.getElementById("spouseSalary").value) || 0;
	const spouseMealAllowance = parseFloat(document.getElementById("spouseMealAllowance").value) || 0;

	if (familyIncomeObject.mySalary != mySalary ||
		familyIncomeObject.myMealAllowance != myMealAllowance ||
		familyIncomeObject.spouseSalary != spouseSalary ||
		familyIncomeObject.spouseMealAllowance != spouseMealAllowance) {
		const totalIncome = mySalary + myMealAllowance + spouseSalary + spouseMealAllowance;

		let updateIncome = {
			"mySalary": mySalary,
			"myMealAllowance": myMealAllowance,
			"spouseSalary": spouseSalary,
			"spouseMealAllowance": spouseMealAllowance,
			"updateDate": new Date().toLocaleDateString('tr-TR', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + new Date().toLocaleTimeString('tr-TR'),
			"status": "1"
		}
		updateIncomeRegister(familyIncomeObject.key, (responseUpdate) => {
			if (responseUpdate) {
				PocketRealtime.insertFamilyIncome({
					params: updateIncome,
					done: (response) => {
						if (response) {
							alert("Gelir güncelleme işlemi yapıldı.");
						}
					},
					fail: (error) => {
						console.error(error);
					}
				})
			}
		});
	}
	else {
		alert("Değişiklik algılanamadı.");
	}

}

function updateIncomeRegister(uniqueKey, callback) {
	const ref = firebase.database().ref("AileGeliri/" + uniqueKey);

	ref.update({
		status: "0"
	})
		.then(() => {
			console.log("Gelir pasife çekildi.");
			callback(true);
		})
		.catch((error) => {
			throw new Error("Gelir pasife çekilirken hata oluştu.\nGelirKey: " + uniqueKey, error);
		});
}

function setFamilyIncomeInformationForInstallmentModal() {
	const totalIncome = familyIncomeObject.mySalary + familyIncomeObject.myMealAllowance + familyIncomeObject.spouseSalary + familyIncomeObject.spouseMealAllowance;
	let familyOutAmount = familyOutObject.reduce((total, item) => total + (parseInt(item.amount) || 0), 0);
	familyIncomeAmount = totalIncome;

	document.getElementById('toplamAileGelir').innerText = `${formatCurrency(totalIncome.toFixed(2))} ₺`;
	let remaining = totalIncome - globalTotalMontlyInstallmentAmount - familyOutAmount;
	document.getElementById('eldeKalanMiktar').innerText = `${formatCurrency(remaining.toFixed(2))} ₺`;
}

function setFamilyMoneyOutInformationForInstallmentModal(outMoneyObject) {
	let sumOutAmount = document.getElementById("rutinGider");
	let totalAmountContainer = document.querySelector(".total-amount-container-expense");

	// Toplam tutarı hesapla
	const totalAmount = outMoneyObject.reduce((total, item) => total + (parseInt(item.amount) || 0), 0);

	// Toplam tutarı içeriğe yazdır
	sumOutAmount.innerText = totalAmount + " ₺";

	// Fiyat aralıklarına göre arka plan rengini ayarla (koyu tonlar)
	if (totalAmount < 1000) {
		totalAmountContainer.style.backgroundColor = "#4CAF50"; // Koyu yeşil (düşük tutar)
	} else if (totalAmount < 5000) {
		totalAmountContainer.style.backgroundColor = "#FFA500"; // Turuncu (orta tutar)
	} else if (totalAmount < 10000) {
		totalAmountContainer.style.backgroundColor = "#FF4500"; // Koyu turuncu (yüksek tutar)
	} else {
		totalAmountContainer.style.backgroundColor = "#B22222"; // Koyu kırmızı (çok yüksek tutar)
	}
}




function setRoutineMoneyOut(routineInfo) {
	let sumFamilyMoneyOut = 0;
	let outMoneyForm = document.getElementById("outMoneyForm");
	outMoneyForm.innerHTML = "";
	for (const element of routineInfo) {
		let labelRoutineName = document.createElement("label");
		let uniqueFor = "routineName " + element.id;
		labelRoutineName.setAttribute("for", uniqueFor);
		labelRoutineName.innerText = element.routineName;

		let inputRoutineAmount = document.createElement("input");
		inputRoutineAmount.type = "number";
		inputRoutineAmount.id = uniqueFor;
		inputRoutineAmount.value = parseInt(element.amount);
		inputRoutineAmount.step = "0.01";
		inputRoutineAmount.placeholder = "0";

		sumFamilyMoneyOut += parseInt(element.amount);

		outMoneyForm.appendChild(labelRoutineName);
		outMoneyForm.appendChild(inputRoutineAmount);

	}

	document.getElementById("totalMoneyOut").innerText = sumFamilyMoneyOut + " ₺";

	let outMoneyUpdateSaveButton = document.createElement("button");

	outMoneyUpdateSaveButton.type = "button";
	outMoneyUpdateSaveButton.id = "familyRoutinMoneyOutSaveButton";

	outMoneyUpdateSaveButton.addEventListener('click', function () {
		const form = document.getElementById('outMoneyForm');
		const inputs = form.querySelectorAll('input');

		const data = {};

		inputs.forEach(input => {
			const label = form.querySelector(`label[for="${input.id}"]`);
			if (label) {
				data[input.id.split(' ')[1]] = {
					routineName: label.textContent.trim(),
					amount: input.value.trim(),
					id: input.id.split(' ')[1]
				};
			}
		});
		const difference = findDifference(Object.values(data), familyOutObject);

		let approve = confirm('Güncelleme işlemini yapmak istiyor musunuz?');

		if (approve) {
			difference.forEach(item => {
				const { routineName, amount, id } = item;
				firebase.database().ref(`RutinGider/${id}`).update({
					routineName,
					amount
				}, (error) => {
					if (error) {
						console.error("Güncelleme sırasında hata oluştu:", error);
					} else {
						console.log("Veri başarıyla güncellendi:", id);
					}
				});
			});
		}
		console.log(difference);
		//calculateAndSaveFamilyRoutinMoneyOut(element);
	});
	outMoneyUpdateSaveButton.innerText = "Toplam Rutin Gider Hesapla/Kaydet";

	outMoneyForm.appendChild(outMoneyUpdateSaveButton);
}

function calculateAndSaveFamilyRoutinMoneyOut(arg) {
	console.log(arg);
}

function findDifference(data1, data2) {
	const difference = [];

	// data1'deki öğeleri kontrol et
	data1.forEach(item1 => {
		// data2'de aynı id'ye sahip öğe var mı kontrol et
		const item2 = data2.find(item => item.id === item1.id);

		// eğer data2'de yoksa fark olarak ekle
		if (item1.amount != item2.amount) {
			difference.push(item1);
		}
	});

	return difference;
}

function getDate() {
	return new Date().toLocaleDateString('tr-TR', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + new Date().toLocaleTimeString('tr-TR');
}

function getPeriodTemplate() {
	let mandatoryElement = ["Elektrik Faturası", "Su Faturası", "Doğalgaz Faturası", "İnternet Faturası", "Murat Cep", "Seher Cep", "Apartman Aidat"];
	let templateElementList = [];
	mandatoryElement.forEach(element => {
		let template = {
			name: element,
			amount: 0,
			date: getDate()
		};
		templateElementList.push(template);
	});
	return templateElementList;

}


let uniqueTransactions = [];
let uniqueTotalAmount = 0;
let uniqueItemSummary = {};

function addUniqueTransaction() {
	const date = document.getElementById('uniqueDate').value;
	const item = document.getElementById('uniqueItem').value;
	const quantity = parseFloat(document.getElementById('uniqueQuantity').value);
	const price = parseFloat(document.getElementById('uniquePrice').value);

	// Boş veya geçersiz alan kontrolü
	if (date == "" || isNaN(quantity) || isNaN(price) || item == "") {
		alert("Bilgiler boş bırakılamaz.");
		throw new Error("Bilgiler boş bırakılamaz");
	}

	// Veri ekleme işlemi
	PocketRealtime.insertFundStatistic({
		params: { date, item, quantity, price },
		done: (response) => {
			console.log(response);

			// Ekleme başarılı olursa formu temizle
			document.getElementById('uniqueDate').value = '';
			document.getElementById('uniqueItem').value = '';
			document.getElementById('uniqueQuantity').value = '';
			document.getElementById('uniquePrice').value = '';
		},
		fail: (error) => {
			console.error(error);
		}
	});
}


// Diğer fonksiyonlar aynı kalır
function updateUniqueTable() {
	const tableBody = document.getElementById('uniqueTransactionTable');
	tableBody.innerHTML = '';

	uniqueTransactions.forEach((transaction) => {
		const row = document.createElement('tr');
		row.innerHTML = `
			<td>${transaction.date}</td>
			<td>${transaction.item}</td>
			<td>${transaction.quantity}</td>
			<td>${transaction.price} TL</td>
			<td>${transaction.total} TL</td>
			<td><button onclick="deleteTransaction('${transaction.key}')">Sil</button></td>
		`;
		tableBody.appendChild(row);
	});
}

function updateUniqueStatistics() {
	document.getElementById('uniqueTotalAmount').innerText = uniqueTotalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

	const itemStatsDiv = document.getElementById('uniqueItemStatistics');
	itemStatsDiv.innerHTML = '';

	Object.keys(uniqueItemSummary).forEach(item => {
		const stat = document.createElement('p');
		stat.innerHTML = `<strong>${item}:</strong> ${uniqueItemSummary[item]} adet`;
		itemStatsDiv.appendChild(stat);
	});
}

function updateUniqueRecordCount() {
	document.getElementById('uniqueTotalRecords').innerText = uniqueTransactions.length;
}
function deleteTransaction(key) {
	// Firebase'den kaydı sil
	PocketRealtime.deleteFundStatistic({
		path: key,
		done: function () {
			// Silme başarılı olunca local veri yapısını güncelle
			alert("Silme başarılı");
		},
		fail: function (error) {
			console.error(error);
		}
	});
}