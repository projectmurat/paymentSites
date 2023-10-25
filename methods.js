const degisken = "1";

let table;
let fundsTable;
let fireData;
let fundsData;
let senderFunds = [];
let allProducts = [];
let markets = [];
let productInfo = {};
const months_tr = ["Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran", "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"];
const INSERT_SUCCESS = "Kayit işlemi başarili";
const INSERT_FAILED = "Kayit Başarisiz"
const DELETE_SUCCESS = "Silme İşlemi başarili";
const DELETE_FAILED = "Silme İşlemi Başarisiz";
let dropdownData;
var isClickReCalculate = false;


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

function startTable(data, callback) {
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
	const countriesDropDown = document.getElementById("periodDropDown");
	PocketRealtime.getValue({
		path: "root",
		done: (response) => {
			countriesDropDown.innerHTML = "";
			if (!isNull(response)) {
				fireData = response;
				let countriesData = {};
				let keys = Object.keys(response);
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

					countriesDropDown.appendChild(option);
					countriesDropDown.selectedIndex = 0;
				}
				callback(response)
			}
			else {
				callback([])
			}
		},
		fail: (error) => {
			alert("Başlangıç ajax hatası meydana geldi.");
		}
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
	firebase.auth().signInWithEmailAndPassword("imuratony@gmail.com", prompt("$root:"))
		.then((userCredential) => {
			callback(true);
		})
		.catch((error) => {
			callback(false);
		});
}

function calculateStatistics(callback) {
	let keys = Object.keys(fireData);
	let sumPayments = 0;
	let statisticsData = [];
	for (const element of keys) {
		let sumPaymentsObject = {};
		fireData[element].forEach(items => {
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

function calculateFunds(params) {
	let fundsTableData = [];
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
		document.getElementById("sumFundsInfo").innerHTML = 'Toplam Birikim Tutarı: ' + '<b>' + formatCurrency(sumFunds) + ' ₺' + '</b>';
		isClickReCalculate = false;
	}
	else {
		setTimeout(() => {
			fundsTableCallback(fundsTableData, () => {
				let sumFunds = fundsTableData[0].map(i => i.forTl).reduce((acc, currentValue) => acc + currentValue, 0);
				document.getElementById("sumFundsInfo").innerHTML = 'Toplam Birikim Tutarı: ' + '<b>' + formatCurrency(sumFunds) + ' ₺' + '</b>';
			})
		}, 1);
	}

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

		if (data.lastPaidMonth >= currentMonthIndex + 1) { // Ay 0'dan başladığı için +1 eklememiz gerekiyor
			paymentButton.disabled = true;
			paymentButton.innerText = `${monthsInTurkish[currentMonthIndex]}-${currentYear} Ödendi`;
		}

		// Taksit ekle eventi
		paymentButton.addEventListener('click', function () {
			const itemKey = this.dataset.key;
			installmentData[itemKey].lastPaidMonth++;
			installmentData[itemKey].currentMonth++;
			const selectedInstallment = { ...installmentData[itemKey] };
			this.innerText = `${monthsInTurkish[currentMonthIndex]}-${currentYear} Ödendi`;
			this.disabled = true;
			tbody.innerHTML = '';
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

	const jsonData = {
		item: itemName,
		installmentAmount: installmentAmount,
		currentMonth: currentInstallment,
		lastPaidMonth: parseInt(lastPaidMonth),
		totalMonths: parseInt(totalInstallment)
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
	const faizOrani = parseFloat(document.getElementById('faizOrani').value) / 100;
	const toplamAy = parseInt(document.getElementById('toplamAy').value);
	const stopajOrani = 0.05;

	let tablo = '<thead><tr><th>Ay</th><th>Net Ana Para (₺)</th><th>Brüt Faiz Tutarı (₺)</th><th>Stopaj (₺)</th><th>Net Faiz Getirisi (₺)</th></tr></thead><tbody>';
	let mevcutAnaPara = anaPara;

	for (let i = 1; i <= toplamAy; i++) {
		const brutFaizTutari = (mevcutAnaPara * faizOrani) / 12;
		const stopajTutari = brutFaizTutari * stopajOrani;
		const netFaiz = brutFaizTutari - stopajTutari;

		mevcutAnaPara += netFaiz;

		tablo += `<tr>
		<td>${i}. Ay</td>
		<td>${formatCurrency(mevcutAnaPara.toFixed(2))} ₺</td>
		<td>${formatCurrency(brutFaizTutari.toFixed(2))} ₺</td>
		<td class="negative">-${formatCurrency(stopajTutari.toFixed(2))} ₺</td>
		<td class="positive">${formatCurrency(netFaiz.toFixed(2))} ₺</td>
	  </tr>`;
	}

	tablo += '</tbody>';
	document.getElementById('sonucTablosu').innerHTML = tablo;
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