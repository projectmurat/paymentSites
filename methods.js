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
let isBillPopupClicked = false;

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
	if (table) {
		table.destroy();
	}
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
				case 3: return ''; // Kategori başlığı (gizli)
				case 4: return ''; // AltKategori başlığı (gizli)
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
			},
			{ data: "categoryNo" },
			{ data: "subCategoryNo" }
		],
		hiddenColumns: {
			columns: [3, 4], // 3: kategori, 4: altKategori
			indicators: false // sağda gizli kolon işareti çıkmasın
		}
	});

	$('#hot-display-license-info').remove();
	callback(table);
}

function init(callback) {
	getLoggedUserInfo((dummy) => {

		const countriesDropDown = document.getElementById("periodDropDown");
		const countriesSubDropDown = document.getElementById("subPeriodDropDown");

		PocketRealtime.getPaymentDates({
			done: (paymentDates) => {
				countriesDropDown.innerHTML = "";
				countriesSubDropDown.innerHTML = "";

				if (!isNull(paymentDates)) {
					selectedData = paymentDates;

					// Date formatı: "Ocak-2024"
					// Ay ve yılı ayır
					const parsedDates = Object.entries(paymentDates).map(([id, item]) => {
						const [month, year] = item.date.split("-");
						return {
							id,
							date: item.date,
							month,
							year
						};
					});

					// Tüm yılları çıkar
					const uniqueYears = [...new Set(parsedDates.map(item => item.year))].sort((a, b) => b - a);


					// Yılları dropdown'a ekle
					uniqueYears.forEach(year => {
						const option = document.createElement("option");
						option.value = year;
						option.textContent = year;
						countriesDropDown.appendChild(option);
					});

					// 🔄 Alt dropdown'ı güncelleyen fonksiyon
					const updateSubPeriods = (selectedYear) => {
						countriesSubDropDown.innerHTML = "";

						const filteredMonths = parsedDates
							.filter(item => item.year === selectedYear)
							.sort((a, b) => compareDates(a.date, b.date)); // Burada compareDates aynı kalsın

						filteredMonths.forEach(item => {
							const option = document.createElement("option");
							option.value = item.date;
							option.textContent = item.month;
							option.className = item.id;
							countriesSubDropDown.appendChild(option);
						});
					};

					// İlk yıl için alt dropdown'ı başlat
					const firstYear = uniqueYears[0];
					countriesDropDown.value = firstYear;
					updateSubPeriods(firstYear);

					// Yıl değiştiğinde ayları güncelle
					countriesDropDown.addEventListener("change", (e) => {
						const selectedYear = e.target.value;
						updateSubPeriods(selectedYear);
					});

					// İlk seçili path'e göre veri çek
					let selectedYear = countriesDropDown.value;
					let selectedMonth = countriesSubDropDown.options[countriesSubDropDown.selectedIndex]?.textContent;
					let selectedFullDate = `${selectedMonth}-${selectedYear}`;

					let tableOptions = document.getElementById("periodDropDown").options;
					let path = selectedFullDate;

					PocketRealtime.getValue({
						path: "/" + path,
						done: (response) => {
							selectedData = response;
							callback(response);
						},
						fail: (error) => {
							alert("Başlangıç ajax hatası meydana geldi.");
						}
					});
				} else {
					callback([]);
				}
			},
			fail: (error) => {
				alert("Periyot tarihleri alınırken hata alındı.");
			}
		});

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
		fetch('https://free.freeipapi.com/api/json')
			.then(response => response.json())
			.then(data => {
				let localInfo = {
					loginDate: new Date().toLocaleDateString('tr-TR', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + new Date().toLocaleTimeString('tr-TR'),
					timestamp: Date.now()
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
	data.sort((a, b) => b.timestamp - a.timestamp);

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


function notesModalOnOpen(responseNoteList) {
	const notesModal = $('#notesModal');
	const addNoteButton = $('#addNoteButton');
	const clearNoteButton = $('#clearNoteButton');
	const noteTitleInput = $('#noteTitleInput');
	const noteContentInput = $('#noteContentInput');
	const notesList = $('#notesList');
	const noNotesMessage = $('#noNotesMessage');

	let currentlyEditingNoteId = null; // Hangi notun düzenlendiğini takip etmek için (Firebase ID)

	$('#toggleNoteCardBtn').off('click').on('click', function () {
		const noteCard = $('.newNoteAddCard');
		const icon = $('#noteEyeIcon');
		const isHidden = noteCard.is(':hidden');

		if (isHidden) {
			noteCard.slideDown('fast');
			icon.removeClass('fa-eye-slash').addClass('fa-eye');
			$(this).html('<i class="fas fa-eye"></i>');
		} else {
			noteCard.slideUp('fast');
			icon.removeClass('fa-eye').addClass('fa-eye-slash');
			$(this).html('<i class="fas fa-eye-slash"></i>');
		}
	});




	// Notları Firebase'den yükle ve DOM'a ekle
	function loadNotes() {
		PocketRealtime.getNotes({
			done: (notes) => {
				notesList.empty(); // Mevcut listeyi temizle

				if (notes.length === 0) {
					noNotesMessage.show(); // Not yok mesajını göster
				} else {
					noNotesMessage.hide(); // Not yok mesajını gizle
					// En yeni notlar üste gelsin diye sıralayıp DOM'a ekliyoruz
					notes.sort((a, b) => new Date(b.created) - new Date(a.created));
					notes.forEach(note => {
						addNoteToDOM(note); // Notu DOM'a ekle
					});
				}
			},
			fail: (error) => {
				console.error("Notlar yüklenirken hata oluştu:", error);
				alert("Notlar yüklenirken bir sorun oluştu.");
				noNotesMessage.show(); // Hata durumunda da mesajı göster
			}
		});
	}

	// Notu DOM'a ekleme fonksiyonu (Firebase ID'yi kullanacak şekilde güncellendi)
	function addNoteToDOM(note) {
		// note.firebaseId Firebase'den gelen otomatik anahtar
		// note.id ise sizin Date.now() ile verdiğiniz ID
		const noteElement = `
		<div class="note-item" data-firebase-id="${note.firebaseId}" data-id="${note.id}">
			<div class="note-header">
				<h5 class="note-title">${note.title}</h5>
				<div class="note-dates">
					<small class="note-timestamp note-created">
					<i class="far fa-calendar-alt mr-1"></i> Oluşturuldu:
					<span>${note.created}</span>
					</small>
					${note.updated ? `
					<small class="note-timestamp note-updated ml-3">
					<i class="fas fa-pencil-alt mr-1"></i> Güncellendi:
					<span>${note.updated}</span>
					</small>
					` : ''}
				</div>
			</div>
			<p class="note-content">${note.content}</p>
			<div class="note-actions">
				<button type="button" class="btn btn-sm btn-info edit-note mr-2">
					<i class="fas fa-edit mr-1"></i> Düzenle
				</button>
				<button type="button" class="btn btn-sm btn-danger delete-note">
					<i class="fas fa-trash-alt mr-1"></i> Sil
				</button>
			</div>
		</div>
		`;
		notesList.prepend(noteElement); // En yeni notu en üste ekle
	}

	// Not Ekle/Güncelle Butonunun Asıl Logic'i
	addNoteButton.off('click').on('click', function () {
		const title = noteTitleInput.val().trim();
		const content = noteContentInput.val().trim();

		if (title === '' || content === '') {
			alert('Başlık ve içerik boş olamaz!');
			return;
		}

		if (currentlyEditingNoteId) {
			// Düzenleme modundayız
			const updatedNoteData = {
				title: title,
				content: content,
				updated: fundsLastCallbackTime(new Date().toISOString()) // Güncelleme zamanını yenile
			};

			PocketRealtime.updateNotes({
				params: {
					firebaseId: currentlyEditingNoteId,
					data: updatedNoteData
				},
				done: () => {
					console.log("Not başarıyla güncellendi.");
					currentlyEditingNoteId = null; // Düzenleme modundan çık
					resetNoteForm(); // Formu ve butonları sıfırla
					loadNotes(); // Notları yeniden yükle
				},
				fail: (error) => {
					console.error("Not güncellenirken hata oluştu:", error);
					alert("Not güncellenirken bir sorun oluştu.");
				}
			});

		} else {
			// Yeni not ekleme modundayız
			const newNote = {
				id: Date.now(), // Kendi benzersiz ID'niz
				title: title,
				content: content,
				created: fundsLastCallbackTime(new Date().toISOString()),
				updated: fundsLastCallbackTime(new Date().toISOString())
			};

			PocketRealtime.addNotes({
				params: newNote, // Tek bir not objesi gönder
				done: () => {
					console.log("Not başarıyla eklendi.");
					resetNoteForm(); // Formu ve butonları sıfırla
					loadNotes(); // Notları yeniden yükle
				},
				fail: (error) => {
					console.error("Not eklenirken hata oluştu:", error);
					alert("Not eklenirken bir sorun oluştu.");
				}
			});
		}
	});

	// Temizle Butonu Olayı
	clearNoteButton.on('click', function () {
		resetNoteForm(); // Formu ve butonları sıfırlayan yardımcı fonksiyonu çağır
	});

	// Not Silme Olayı (Event Delegation)
	notesList.on('click', '.delete-note', function () {
		if (!confirm('Bu notu silmek istediğinize emin misiniz?')) {
			return;
		}

		const noteElement = $(this).closest('.note-item');
		const firebaseIdToDelete = noteElement.data('firebase-id'); // Firebase ID'sini al

		PocketRealtime.deleteNotes({
			params: {
				firebaseId: firebaseIdToDelete
			},
			done: () => {
				console.log("Not başarıyla silindi.");
				noteElement.remove(); // DOM'dan kaldır
				if (notesList.children('.note-item').length === 0) { // Hiç not kalmazsa mesajı göster
					noNotesMessage.show();
				}
			},
			fail: (error) => {
				console.error("Not silinirken hata oluştu:", error);
				alert("Not silinirken bir sorun oluştu.");
			}
		});
	});

	// Not Düzenleme Olayı (Event Delegation)
	notesList.on('click', '.edit-note', function () {
		const noteElement = $(this).closest('.note-item');
		currentlyEditingNoteId = noteElement.data('firebase-id'); // Düzenlenecek notun Firebase ID'sini sakla

		const currentTitle = noteElement.find('.note-title').text();
		const currentContent = noteElement.find('.note-content').text();

		noteTitleInput.val(currentTitle);
		noteContentInput.val(currentContent);

		// Buton metnini ve ikonunu değiştir
		addNoteButton.html('<i class="fas fa-save mr-1"></i> Notu Güncelle').removeClass('btn-primary').addClass('btn-success');
		clearNoteButton.removeClass('btn-danger').addClass('btn-secondary'); // Temizle butonunu daha pasif bir renge çevir
	});

	// Yardımcı fonksiyon: Formu ve butonları sıfırla
	function resetNoteForm() {
		currentlyEditingNoteId = null;
		noteTitleInput.val('');
		noteContentInput.val('');
		addNoteButton.html('<i class="fas fa-plus-circle mr-1"></i> Not Ekle').removeClass('btn-success').addClass('btn-primary');
		clearNoteButton.removeClass('btn-secondary').addClass('btn-danger'); // Temizle butonunu kırmızıya geri döndür
	}

	// Modal açıldığında notları Firebase'den yükle
	notesModal.on('show.bs.modal', function () {
		loadNotes();
	});

	// Modal kapatıldığında düzenleme modunu sıfırla ve butonları eski haline getir
	notesModal.on('hidden.bs.modal', function () {
		resetNoteForm(); // Formu ve butonları sıfırla
	});

	loadNotes(responseNoteList);

	// İlk yüklemede de notları çekebilirsiniz, ancak modal açılışında çekmek daha yaygındır.
	// loadNotes();
}

function triggerNotification() {
	// Değişken tanımlamaları
	let currentlyEditingNotificationId = null;
	let allNotificationsCache = [];
	// Oturum boyunca gizlenecek bildirim ID'leri. Sayfa yenilenince sıfırlanır.
	// Kalıcı olmasını isterseniz `localStorage` kullanmalısınız.
	let hiddenApproachingNotifications = [];

	const notificationsModal = $('#notificationsModal');
	const openNotificationsModalButton = $('#openNotificationsModal');
	const addNotificationButton = $('#addNotificationButton');
	const clearNotificationFormButton = $('#clearNotificationFormButton');
	const notificationTitleInput = $('#notificationTitleInput');
	const notificationContentInput = $('#notificationContentInput');
	const notificationDateTimeInput = $('#notificationDateTimeInput');
	const notificationsList = $('#notificationsList');
	const noNotificationsMessage = $('#noNotificationsMessage');
	const notificationCount = $('#notificationCount');

	// Yaklaşan bildirim alert elementini ilk başta al (veya daha sonra oluşturulacaksa referans tutmak için)
	let approachingAlert = $('#approachingNotificationAlert');

	// --- Yardımcı Fonksiyonlar ---

	// Zaman formatlama fonksiyonu (dışarıda tanımlı olduğunu varsayıyorum)
	// Eğer fundsLastCallbackTime fonksiyonunuz tanımlı değilse, aşağıdaki gibi basit bir versiyon kullanabilirsiniz:

	$('#toggleNotificationCardBtn').on('click', function () {
		const notificationCard = $('.newNotificationAddCard');
		const icon = $('#notificationEyeIcon');
		const isHidden = notificationCard.is(':hidden');

		if (isHidden) {
			notificationCard.slideDown('fast');
			icon.removeClass('fa-eye-slash').addClass('fa-eye');
			$(this).html('<i class="fas fa-eye"></i>');
		} else {
			notificationCard.slideUp('fast');
			icon.removeClass('fa-eye').addClass('fa-eye-slash');
			$(this).html('<i class="fas fa-eye-slash"></i>');
		}
	});

	function fundsLastCallbackTime(isoString) {
		const date = new Date(isoString);
		const options = {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		};
		return date.toLocaleString('tr-TR', options);
	}

	// ISO formatını input type="datetime-local" için dönüştürme fonksiyonu
	function toDateTimeLocal(isoString) {
		const date = new Date(isoString);
		// Zaman dilimi farkını düzeltmek için (eğer input yerel saati bekliyorsa)
		date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
		return date.toISOString().slice(0, 16);
	}

	// Bildirimleri DOM'a ekleme fonksiyonu
	function addNotificationToDOM(notification) {
		const scheduledFormatted = fundsLastCallbackTime(notification.scheduledTime);
		const createdFormatted = fundsLastCallbackTime(notification.createdAt);
		const ignoredFormatted = notification.ignoredUntil ? fundsLastCallbackTime(notification.ignoredUntil) : null;

		const notificationElement = `
		<div class="notification-item ${notification.isTriggered ? 'notification-triggered' : ''}" data-firebase-id="${notification.firebaseId}" data-id="${notification.id || ''}">
			<div class="notification-header">
				<div>
					<h5 class="notification-title mb-1">${notification.title}</h5>
					<small class="notification-scheduled-time text-muted d-block" data-iso-time="${notification.scheduledTime}">
						<i class="far fa-calendar-check mr-1"></i> Zaman: ${scheduledFormatted}
					</small>
				</div>
				${notification.isTriggered ? `
					<span class="badge badge-success ml-md-3 mt-2 mt-md-0"><i class="fas fa-check-circle mr-1"></i> Tetiklendi</span>
				` : ''}
			</div>

			<p class="notification-content mb-3">${notification.content}</p>

			<div class="notification-actions d-flex flex-column flex-md-row justify-content-between align-items-md-center">
				<small class="text-muted mb-2 mb-md-0">
					<i class="far fa-clock mr-1"></i> Oluşturuldu: ${createdFormatted}
				</small>

				${!notification.isTriggered ? `
					<div class="d-flex flex-row flex-wrap align-items-center gap-2 mb-2">
						<button type="button" class="btn btn-xs btn-outline-info edit-notification custom-btn-sm">
							<i class="fas fa-edit me-1"></i> Düzenle
						</button>
						<button type="button" class="btn btn-xs btn-outline-danger delete-notification custom-btn-sm">
							<i class="fas fa-trash-alt me-1"></i> Sil
						</button>
					</div>

					<!-- Yoksay Alanı -->
					<div class="form-inline d-flex flex-wrap mt-2 mt-md-0 ml-md-3">
						<select class="form-control form-control-sm mr-2 ignore-duration-select">
						<option value="1">1 gün</option>
						<option value="3">3 gün</option>
						<option value="7">7 gün</option>
						<option value="30">30 gün</option>
						</select>
						<button type="button" class="btn btn-outline-secondary btn-sm ignore-notification-btn">
						Yoksay
						</button>
					</div>
				` : ''}
			</div>

			${ignoredFormatted ? `
			<div class="mt-2">
				<small class="text-muted">
					<i class="fas fa-eye-slash mr-1"></i> Bu bildirim <strong>${ignoredFormatted}</strong> tarihine kadar yoksayılacak.
				</small>
			</div>
			` : ''}
		</div>
		`;

		notificationsList.prepend(notificationElement);
	}

	// Bildirim listesini güncelleme ve DOM'a yansıtma
	function renderNotifications(notifications) {
		notificationsList.empty();
		allNotificationsCache = notifications; // Cache'i güncelle

		const activeOrUpcomingNotifications = notifications.filter(n =>
			!n.isTriggered || new Date(n.scheduledTime) >= new Date(Date.now() - (24 * 60 * 60 * 1000))
		);

		if (activeOrUpcomingNotifications.length === 0) {
			noNotificationsMessage.show();
		} else {
			noNotificationsMessage.hide();
			activeOrUpcomingNotifications.sort((a, b) => {
				const dateA = new Date(a.scheduledTime);
				const dateB = new Date(b.scheduledTime);
				if (a.isTriggered && !b.isTriggered) return 1;
				if (!a.isTriggered && b.isTriggered) return -1;
				return dateA - dateB;
			});
			activeOrUpcomingNotifications.forEach(notification => {
				addNotificationToDOM(notification);
			});
		}
		updateNotificationCount(activeOrUpcomingNotifications.filter(n => !n.isTriggered && new Date(n.scheduledTime) > new Date()).length);
	}

	// ** Ana Bildirim Kontrol ve Tetikleme Mantığı (Client-Side Simulation) **
	function checkAndTriggerNotifications() {
		const now = new Date();
		const tenSecondsAgo = new Date(now.getTime() - (10 * 1000));

		const notificationsToTrigger = allNotificationsCache.filter(n =>
			!n.isTriggered &&
			new Date(n.scheduledTime) <= now &&
			new Date(n.scheduledTime) >= tenSecondsAgo
		);

		if (notificationsToTrigger.length > 0) {
			notificationsToTrigger.forEach(notification => {
				showAppNotification(notification.title, notification.content);
				console.log(`Bildirim Tetiklendi: ${notification.title}`);

				PocketRealtime.updateNotification({
					params: {
						firebaseId: notification.firebaseId,
						data: {
							isTriggered: true,
							triggeredTime: new Date().toISOString()
						}
					},
					done: () => {
						console.log(`Bildirim ${notification.title} Firebase'de tetiklendi olarak işaretlendi.`);
					},
					fail: (error) => {
						console.error(`Bildirim ${notification.title} güncellenirken hata oluştu:`, error);
					}
				});
			});
		}
		// Ana ekrandaki yaklaşan bildirimleri kontrol et ve göster
		checkApproachingNotificationsDisplay(allNotificationsCache);
	}

	// Uygulama içi bildirim gösteren basit bir fonksiyon (Popup/Toast)
	function showAppNotification(title, content) {
		$('body').append(`
            <div class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-delay="5000">
                <div class="toast-header">
                    <strong class="mr-auto">${title}</strong>
                    <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="toast-body">
                    ${content}
                </div>
            </div>
        `);
		$('.toast').toast('show');
	}

	// --- Güncellenmiş Kısım: Yaklaşan Bildirim Uyarısı Gösterimi ---
	// --- Güncellenmiş Kısım: Yaklaşan Bildirim Uyarısı Gösterimi ---
	function checkApproachingNotificationsDisplay(allNotifications) {
		const now = new Date();
		// 15 GÜNLÜK SINIRLAMAYI KALDIRIYORUZ.
		// const futureThreshold = new Date(now.getTime() + (15 * 24 * 60 * 60 * 1000)); // 15 gün sonrası

		const approaching = allNotifications.filter(n => {
			const scheduled = new Date(n.scheduledTime);
			const ignoredUntil = n.ignoredUntil ? new Date(n.ignoredUntil) : null;

			// "Bugün Yoksay" butonu doğru çalışıyor. Bu mantık, yoksayma süresi
			// dolduğunda (örneğin ertesi gün) bildirimin tekrar görünmesini sağlar.
			// Asıl sorun, bildirimin gösterilmesi için 15 günden daha yakın olmasını
			// gerektiren "futureThreshold" kontrolüydü. O satırı kaldırdık.
			return (
				!n.isTriggered &&
				scheduled > now &&
				// scheduled <= futureThreshold && <-- İSTEDİĞİNİZ DAVRANIŞ İÇİN BU SATIRI SİLİN/YORUM SATIRI YAPIN
				(!ignoredUntil || ignoredUntil < now) // Yoksayma süresi dolmuşsa veya hiç yoksayılmamışsa göster
			);
		});

		// `approachingAlert` elemanının DOM'da var olup olmadığını kontrol et ve yoksa oluştur
		if (approachingAlert.length === 0) {
			$('body').append(`
				<div id="approachingNotificationAlert" class="approaching-notification-alert">
					<div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between">
						<div class="text-section">
						<strong class="d-block mb-2">Yaklaşan Bildirim</strong>
						<span id="approachingNotificationTitle" class="d-block mb-1"></span>
						<small id="approachingNotificationTime" class="d-block text-muted"></small>
						</div>
						<div class="mt-3 mt-sm-0 ml-sm-4">
						<button id="ignoreTodayBtn" class="btn btn-sm btn-outline-dark px-4 py-2 font-weight-semibold rounded-pill shadow-sm">
							<i class="fas fa-eye-slash mr-1"></i> Bugün Yoksay
						</button>
						</div>
					</div>
				</div>
			`);

			approachingAlert = $('#approachingNotificationAlert');

			approachingAlert.off('click').on('click', function () {
				const clickedNotificationId = $(this).data('notification-id');
				if (clickedNotificationId) {
					if (!hiddenApproachingNotifications.includes(clickedNotificationId)) {
						hiddenApproachingNotifications.push(clickedNotificationId);
					}
					$(this).fadeOut(() => {
						checkApproachingNotificationsDisplay(allNotificationsCache);
					});
				} else {
					$(this).fadeOut();
				}
			});
		}

		// En yakın tarihli ve gösterilmesi gereken bildirimi bul
		const nearestApproaching = approaching.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))[0];

		if (nearestApproaching) {
			approachingAlert.data('notification-id', nearestApproaching.firebaseId);
			approachingAlert.find('#approachingNotificationTitle').text(nearestApproaching.title);
			approachingAlert.find('#approachingNotificationTime').text(`Zamanı: ${fundsLastCallbackTime(nearestApproaching.scheduledTime)}`);
			approachingAlert.fadeIn();
		} else {
			approachingAlert.fadeOut();
		}
	}

	// --- Diğer Olay İşleyiciler ---

	// Bildirim Ekle/Güncelle Butonunun Logic'i
	addNotificationButton.off('click').on('click', function () {
		const title = notificationTitleInput.val().trim();
		const content = notificationContentInput.val().trim();
		const scheduledDateTime = notificationDateTimeInput.val();

		if (title === '' || content === '' || scheduledDateTime === '') {
			alert('Başlık, içerik ve bildirim zamanı boş olamaz!');
			return;
		}

		const scheduledISO = new Date(scheduledDateTime).toISOString();

		if (currentlyEditingNotificationId) {
			const updatedNotificationData = {
				title: title,
				content: content,
				scheduledTime: scheduledISO,
			};

			PocketRealtime.updateNotification({
				params: {
					firebaseId: currentlyEditingNotificationId,
					data: updatedNotificationData
				},
				done: () => {
					console.log("Bildirim başarıyla güncellendi.");
					resetNotificationForm();
				},
				fail: (error) => {
					console.error("Bildirim güncellenirken hata oluştu:", error);
					alert("Bildirim güncellenirken bir sorun oluştu.");
				}
			});

		} else {
			const newNotification = {
				title: title,
				content: content,
				scheduledTime: scheduledISO,
				isTriggered: false,
				triggeredTime: null,
				createdAt: new Date().toISOString()
			};

			PocketRealtime.addNotification({
				params: newNotification,
				done: () => {
					console.log("Bildirim başarıyla eklendi.");
					resetNotificationForm();
				},
				fail: (error) => {
					console.error("Bildirim eklenirken hata oluştu:", error);
					alert("Bildirim eklenirken bir sorun oluştu.");
				}
			});
		}
	});

	// Temizle Butonu Olayı
	clearNotificationFormButton.on('click', function () {
		resetNotificationForm();
	});

	// Bildirim Silme Olayı (Event Delegation)
	notificationsList.on('click', '.delete-notification', function () {
		if (!confirm('Bu bildirimi silmek istediğinize emin misiniz?')) {
			return;
		}

		const notificationElement = $(this).closest('.notification-item');
		const firebaseIdToDelete = notificationElement.data('firebase-id');

		PocketRealtime.deleteNotification({
			params: {
				firebaseId: firebaseIdToDelete
			},
			done: () => {
				console.log("Bildirim başarıyla silindi.");
			},
			fail: (error) => {
				console.error("Bildirim silinirken hata oluştu:", error);
				alert("Bildirim silinirken bir sorun oluştu.");
			}
		});
	});

	// Bildirim Düzenleme Olayı (Event Delegation)
	notificationsList.on('click', '.edit-notification', function () {
		const notificationElement = $(this).closest('.notification-item');
		currentlyEditingNotificationId = notificationElement.data('firebase-id');

		const currentTitle = notificationElement.find('.notification-title').text();
		const currentContent = notificationElement.find('.notification-content').text();
		const currentScheduledTime = notificationElement.find('.notification-scheduled-time').data('iso-time');

		notificationTitleInput.val(currentTitle);
		notificationContentInput.val(currentContent);
		notificationDateTimeInput.val(toDateTimeLocal(currentScheduledTime));

		addNotificationButton.html('<i class="fas fa-save mr-1"></i> Bildirimi Güncelle').removeClass('btn-primary').addClass('btn-success');
		clearNotificationFormButton.removeClass('btn-danger').addClass('btn-secondary');
	});

	// Yardımcı fonksiyon: Formu ve butonları sıfırla
	function resetNotificationForm() {
		currentlyEditingNotificationId = null;
		notificationTitleInput.val('');
		notificationContentInput.val('');
		notificationDateTimeInput.val('');
		addNotificationButton.html('<i class="fas fa-plus-circle mr-1"></i> Bildirim Ekle').removeClass('btn-success').addClass('btn-primary');
		clearNotificationFormButton.removeClass('btn-secondary').addClass('btn-danger');
	}

	// Bildirim sayacını güncelle
	function updateNotificationCount(count) {
		notificationCount.text(count);
		if (count > 0) {
			notificationCount.show();
		} else {
			notificationCount.hide();
		}
	}

	// --- Başlangıç ve Periyodik Kontroller ---

	// Uygulama başladığında ilk yüklemeyi yap ve Firebase'den dinlemeye başla
	PocketRealtime.getNotifications({
		done: (notifications) => {
			renderNotifications(notifications);
			checkAndTriggerNotifications();
		},
		fail: (error) => {
			console.error("Başlangıç bildirimleri yüklenirken hata:", error);
			noNotificationsMessage.show();
			updateNotificationCount(0);
		}
	});

	// Her 10 saniyede bir bildirimleri kontrol et ve tetikle
	setInterval(checkAndTriggerNotifications, 10 * 1000);

	// Bildirim modalı açıldığında listeyi yükle
	notificationsModal.on('show.bs.modal', function () {
		renderNotifications(allNotificationsCache);
	});

	// Modal kapandığında formu sıfırla
	notificationsModal.on('hidden.bs.modal', function () {
		resetNotificationForm();
		// İsteğe bağlı: Modal kapanınca gizlenen bildirimleri sıfırlayabilirsiniz
		// hiddenApproachingNotifications = [];
		// checkApproachingNotificationsDisplay(allNotificationsCache);
	});

	// İkon butonuna tıklandığında (Modalı açan buton)
	openNotificationsModalButton.on('click', function () {
		// Bu kısım muhtemelen modalı açmalıdır, `hide()` yerine `show()` kullanın.
		// Eğer modal otomatik olarak açılıyorsa veya bu düğmenin farklı bir işlevi varsa bu satırı değiştirmeyin.
		notificationsModal.show();
	});

	$(document).on('click', '#ignoreTodayBtn', function () {
		const notificationId = approachingAlert.data('notification-id');
		if (!notificationId) return;

		const now = new Date();
		const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

		PocketRealtime.updateNotification({
			params: {
				firebaseId: notificationId,
				data: {
					ignoredUntil: endOfToday.toISOString()
				}
			},
			done: () => {
				approachingAlert.fadeOut();
				console.log(`Bildirim ${notificationId} bu gün için yoksayıldı.`);
			},
			fail: (error) => {
				console.error("Yoksayma güncellemesi başarısız:", error);
			}
		});
	});

	function ignoreNotificationForDays(notificationId, dayCount) {
		const now = new Date();
		const ignoredUntil = new Date(now.getTime() + dayCount * 24 * 60 * 60 * 1000);

		PocketRealtime.updateNotification({
			params: {
				firebaseId: notificationId,
				data: {
					ignoredUntil: ignoredUntil.toISOString()
				}
			},
			done: () => {
				console.log(`Bildirim ${notificationId}, ${dayCount} gün yoksayıldı.`);
			},
			fail: (error) => {
				console.error("Günlük yoksayma başarısız:", error);
			}
		});
	}

	notificationsList.on('click', '.ignore-notification-btn', function () {
		const card = $(this).closest('.notification-item');
		const notificationId = card.data('firebase-id');
		const dayCount = parseInt(card.find('.ignore-duration-select').val());

		const now = new Date();
		const ignoredUntil = new Date(now.getTime() + dayCount * 24 * 60 * 60 * 1000);

		PocketRealtime.updateNotification({
			params: {
				firebaseId: notificationId,
				data: {
					ignoredUntil: ignoredUntil.toISOString()
				}
			},
			done: () => {
				console.log(`Bildirim ${notificationId}, ${dayCount} gün yoksayıldı.`);
				card.fadeOut(); // istersen bildirimi gizle
			},
			fail: (error) => {
				console.error("Yoksayma işlemi başarısız:", error);
				alert("Bildirim yoksanamadı!");
			}
		});
	});
	// Eğer kullanıcı çıkış yaparsa dinleyiciyi kapatma örneği (FirebaseAuth ile)
	// firebase.auth().onAuthStateChanged(user => {
	//     if (!user) {
	//         firebase.database().ref("notifications/").off("value"); // Dinleyiciyi kapat
	//     }
	// });
}