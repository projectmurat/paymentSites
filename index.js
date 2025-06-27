const dropdown = document.getElementById('userActivityDropdown');

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
		startTable(initData, (responseTable) => {
			$('#hot-display-license-info').remove();
		})
	})
});

setTimeout(() => {
	if (table) {
		table.addHook("afterOnCellMouseDown", function () {
			//after table render..
		});
	}

}, 1000);

dropdown.addEventListener('change', function () {
	const selectedValue = dropdown.value;
	selectedUserActivityLimit = parseInt(selectedValue);
	PocketRealtime.getserLoggedActivity({
		params: { lastRecordCount: parseInt(selectedValue) },
		done: (response) => {
			for (let key in response) {
				if (response.hasOwnProperty(key)) {
					response[key]["id"] = key;
				}
			}
			renderUserActivityModal(response);
		},
		fail: (error) => {
			throw new Error(error).stack;
		}
	})
	// Burada seçilen değeri kullanarak yapmak istediğiniz işlemleri gerçekleştirebilirsiniz.
});

$('#periodDropDown').change(event => {
	$("#grid-table").html("");
	$('#hot-display-license-info').remove();
	let tableOptions = document.getElementById("periodDropDown").options;
	let changePeriod = tableOptions[tableOptions.selectedIndex].innerText;
	PocketRealtime.getValue({
		path: "/" + changePeriod,
		done: (response) => {
			startTable(response, () => { });
		},
		fail: (error) => {
			alert("Başlangıç ajax hatası meydana geldi.");
		}
	})

})

$('.btn-add').click(function () {

	try {
		let detail = document.getElementsByClassName("form-control").name.value;
		let amount = document.getElementsByClassName("form-control").amount.value;
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
		selectedData.push(pushData);

		PocketRealtime.setValue({
			path: historyPeriod,
			params: selectedData,
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
			params: getPeriodTemplate(),
			done: (response) => {
				let insertData = {
					date: period
				};
				PocketRealtime.insertPaymentDate({
					params: insertData,
					done: (response) => {
						successAddPeriodValidation();
					},
					fail: (error) => {
						throwAddPeriodValidation(error);
					}
				})
			},
			fail: (error) => {
				throwAddPeriodValidation(error);
			}
		});
	} catch (error) {
		throwAddPeriodValidation(error);
	}
})

$('#save').click(function () {
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

$('#faturaStatistics').click(function () {
	PocketRealtime.getStatistics({
		done: (response) => {
			const categories = ["Doğalgaz Faturası", "Elektrik Faturası", "Su Faturası", "İnternet Faturası", "Apartman Aidat"];
			const yearSums = {};
			const monthlyData = {}; // Ay bazlı veri için eklendi
			let data = response

			Object.entries(data).forEach(([key, payments]) => {
				const [month, year] = key.split('-');
				if (!yearSums[year]) {
					yearSums[year] = {};
					categories.forEach(c => yearSums[year][c] = 0);
				}
				if (!monthlyData[year]) monthlyData[year] = {};
				if (!monthlyData[year][month]) {
					monthlyData[year][month] = {};
					categories.forEach(c => monthlyData[year][month][c] = 0);
				}

				payments.forEach(p => {
					if (categories.includes(p.name)) {
						const amount = parseFloat(p.amount);
						yearSums[year][p.name] += amount;
						monthlyData[year][month][p.name] += amount;
					}
				});
			});

			const years = Object.keys(yearSums).sort();
			const yearSelect = document.getElementById('yearSelect');

			// Eğer zaten seçenekler eklenmişse tekrar ekleme
			if (yearSelect.options.length === 1) {
				years.forEach(y => {
					const opt = document.createElement('option');
					opt.value = y;
					opt.textContent = y;
					yearSelect.appendChild(opt);
				});
			}

			function renderChart(selectedYear = '') {
				const labels = selectedYear ? Object.keys(monthlyData[selectedYear]).sort() : years;
				const chartData = categories.map(cat => ({
					label: cat,
					data: labels.map(label => selectedYear ? (monthlyData[selectedYear][label]?.[cat] || 0) : yearSums[label][cat]),
					backgroundColor: getColor(cat)
				}));

				const ctx = document.getElementById('expenseChart').getContext('2d');
				if (window.expenseChartInstance) window.expenseChartInstance.destroy();
				window.expenseChartInstance = new Chart(ctx, {
					type: 'bar',
					data: {
						labels: labels,
						datasets: chartData
					},
					options: {
						responsive: true,
						plugins: {
							legend: { position: 'bottom' },
							title: {
								display: true,
								text: selectedYear ? `${selectedYear} Aylık Fatura Dağılımı` : 'Yıllık Fatura Dağılımı'
							}
						}
					}
				});

				// Özet
				const summary = document.getElementById('expenseSummary');
				summary.innerHTML = selectedYear
					? (() => {
						const total = categories.map(c => Object.values(monthlyData[selectedYear]).map(m => m[c]).reduce((a, b) => a + b, 0)).reduce((a, b) => a + b, 0);
						return `<strong>${selectedYear}:</strong> ${total.toLocaleString('tr-TR')} ₺ toplam fatura harcaması`;
					})()
					: years.map(year => {
						const sum = categories.map(c => yearSums[year][c]).reduce((a, b) => a + b, 0);
						return `<strong>${year}:</strong> ${sum.toLocaleString('tr-TR')} ₺ toplam fatura harcaması`;
					}).join('<br>');
			}

			// İlk çizim
			renderChart();

			// Yıl değişince grafiği filtrele
			yearSelect.addEventListener('change', e => {
				renderChart(e.target.value);
			});
		},
		fail: (error) => {

		}
	})

	function getColor(name) {
		return {
			"Doğalgaz Faturası": "#e74c3c",
			"Elektrik Faturası": "#f39c12",
			"Su Faturası": "#3498db",
			"İnternet Faturası": "#2ecc71"
		}[name] || '#999';
	}
})

$('#backup').click(function () {
	backupValidation((validate) => {
		if (validate) {
			alert("Backup özelliği devredışı bırakıldı.");
			/*
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
			*/
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
		let deletedId = tableOptions[tableOptions.selectedIndex].className;
		if (confirm(historyPeriod + " dönemi silinmek üzere. Onaylıyor musunuz?")) {
			PocketRealtime.deleteValue({
				path: historyPeriod,
				done: (response) => {
					PocketRealtime.deletePaymentDates({
						path: deletedId,
						done: (responseDeletePaymentDates) => {
							console.log(responseDeletePaymentDates);
						},
						fail: (error) => {
							throw new Error("error");
						}
					})
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

$('#statistics').click(function () {
	calculateStatistics()
})

$('#funds').click(function () {
	PocketRealtime.getFunds({
		done: (response) => {

			fetch('https://finans.truncgil.com/today.json')
				.then(response => response.json())
				.then(data => {
					dropdownData = data;
					lastFundsCallbackTime = fundsLastCallbackTime(data["Update_Date"]);
					document.getElementById("lastFundsEndexCallbackTimeDiv").innerHTML = "Endexlerin Son Güncellenme Tarihi" + "<br>" + '<p style="text-decoration:underline">' + lastFundsCallbackTime + '</p>';
					if (response != null) {
						fundsData = response;
						fundsData.forEach(item => {
							if (data[item.currencyType] && data[item.currencyType].Alış) {
								item.endex = data[item.currencyType].Alış;
							}
						});
						calculateFunds(response);
					}
					else {
						calculateFunds([]);
					}

				})
				.catch(error => {
					throw new Error("Birikim verileri getirilirken hata oluştu. Ayrıntısı: \n", error);
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

$('#installments').click(function () {
	PocketRealtime.getInstallments({
		done: (response) => {
			renderInstallmentsTable(response);
			PocketRealtime.getFamilyIncome({
				done: (response) => {
					PocketRealtime.getFamilyRoutinMoneyOut({
						done: function (routinMoneyOutInfo) {


							if (routinMoneyOutInfo != null) {
								let uniqueKeyList = Object.keys(routinMoneyOutInfo);
								for (const element of uniqueKeyList) {
									Object.assign(routinMoneyOutInfo[element], { "id": element });
								}
								familyOutObject = Object.values(routinMoneyOutInfo);
								setFamilyMoneyOutInformationForInstallmentModal(Object.values(routinMoneyOutInfo));
							}

							if (response != null) {
								let incomeInformation = putKeyInsideObject(response);
								familyIncomeObject = Object.values(incomeInformation)[0];
								setFamilyIncomeInformationForInstallmentModal();
							}
						},
						fail: function (error) {
							console.error(error);
						}
					})
				},
				fail: (error) => {
					console.error(error);
				}
			})
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
			option.addEventListener("click", function (event) {
				event.preventDefault();  // Sayfanın yeniden yüklenmesini engelle
				let selectedFundsDropdownKey = event.target.innerText;
				console.log(dropdownData[selectedFundsDropdownKey]);  // Seçilen anahtarı konsola yaz

				// Tablo için insert datası oluturuyoruz.
				let endexValue = dropdownData[selectedFundsDropdownKey].Alış;
				let insertTableData = {
					amount: 0,
					currencyType: selectedFundsDropdownKey,
					endex: dropdownData[selectedFundsDropdownKey].Alış,
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
	console.log("selected", arg)
})

$('.btn-openFundsSnapshots').click(function (args) {
	PocketRealtime.getFundsHistory({
		done: (response) => {
			let allResponse = Object.values(response);
			const filteredData = allResponse.reduce((acc, curr) => {
				const foundIndex = acc.findIndex(
					(item) =>
						item.sunFunds === curr.sunFunds &&
						new Date(item.insertDate).toDateString() ===
						new Date(curr.insertDate).toDateString()
				);

				if (foundIndex === -1) {
					acc.push(curr);
				} else {
					const foundDate = new Date(acc[foundIndex].insertDate);
					const currentDate = new Date(curr.insertDate);

					if (currentDate > foundDate) {
						acc[foundIndex] = curr;
					}
				}

				return acc;
			}, []);
			//tarihleri en güncel olan en üstte olacak şekilde düzenlendi

			let previousValue;
			const tableBody = document.getElementById('tableBody');
			let tableList = [];
			var currentDate = new Date();

			// Son 7 gün önceki zamanı al
			var sevenDaysAgo = new Date();
			var CONST_DAY_AGO = 7;
			sevenDaysAgo.setDate(currentDate.getDate() - CONST_DAY_AGO);

			// Son 15 gün içinde olanları filtrele
			var filteredDataWithinLastFifteenDays = filteredData.filter(function (item) {

				var dateString = item.insertDate;

				// Tarih metnini boşluk karakterine göre bölelim
				var parts = dateString.split(' ');

				// Tarih parçasını Türkçe olarak çevirelim
				var turkishMonthIndex = months_tr_short.indexOf(parts[1]);
				var month = turkishMonthIndex + 1; // JavaScript ay indeksleri 0'dan başlar, bu yüzden 1 ekleyin

				// Tarih bilgilerini alalım
				var day = parseInt(parts[0]);
				var year = parseInt(parts[2]);
				var time = parts[4];

				// Saat bilgilerini alalım
				var timeParts = time.split(':');
				var hour = parseInt(timeParts[0]);
				var minute = parseInt(timeParts[1]);
				var second = parseInt(timeParts[2]);

				// Date nesnesini oluşturalım
				var date = new Date(year, month - 1, day, hour, minute, second);
				// Her bir öğenin "insertDate" alanını Date nesnesine çevir
				var insertDate = new Date(date);

				// Eğer insertDate, son 15 gün içindeyse true döndür ve bu öğeyi filtrele
				return insertDate >= sevenDaysAgo && insertDate <= currentDate;
			});



			filteredDataWithinLastFifteenDays.forEach(item => {
				const row = document.createElement('tr');

				const dateCell = document.createElement('td');
				dateCell.textContent = item.insertDate;
				row.appendChild(dateCell);

				const fundsCell = document.createElement('td');
				fundsCell.textContent = item.sunFunds;
				row.appendChild(fundsCell);
				let jsFormattedNumber = parseFloat(item.sunFunds.replace(/\./g, '').replace(',', '.'));
				if (previousValue !== undefined) {

					// Türkçe formatlı sayıyı JavaScript formatına dönüştürme
					jsFormattedNumber = parseFloat(item.sunFunds.replace(/\./g, '').replace(',', '.'));
					const currentValue = parseFloat(jsFormattedNumber);
					const previousNumericValue = parseFloat(previousValue);

					if (currentValue > previousNumericValue) {
						row.children[1].innerHTML = row.children[1].innerHTML + " +" + Math.abs(parseFloat(previousNumericValue - currentValue).toFixed(2))
						row.classList.add('change-up');
					} else if (currentValue < previousNumericValue) {
						row.children[1].innerHTML = row.children[1].innerHTML + " -" + parseFloat(previousNumericValue - currentValue).toFixed(2)
						row.classList.add('change-down');
					}
				}
				row.__item = item; // Her satıra item'ı bağla

				row.addEventListener('click', () => {
					const existingTooltip = document.querySelector('.center-tooltip');
					if (existingTooltip) existingTooltip.remove();

					const tooltip = document.createElement('div');
					tooltip.className = 'center-tooltip';

					const closeBtn = document.createElement('span');
					closeBtn.className = 'center-tooltip-close';
					closeBtn.innerHTML = '&times;';
					closeBtn.addEventListener('click', () => tooltip.remove());
					tooltip.appendChild(closeBtn);

					const fundsDetail = item.fundsList?.[0] || [];

					let tableHtml = `
						<div class="tooltip-header"><strong>🗓️ ${item.insertDate}</strong></div>
						<table class="tooltip-table">
							<thead>
								<tr>
									<th>Tür</th>
									<th>Adet</th>
									<th>Endeks</th>
									<th>TL</th>
								</tr>
							</thead>
							<tbody>
					`;

					const fundsMap = Object.fromEntries(fundsDetail.map(f => [f.currencyType, parseFloat(f.forTl)]));

					// Önceki satırı al
					const currentRow = row;
					const allRows = Array.from(currentRow.parentElement.children);
					const currentIndex = allRows.indexOf(currentRow);
					const previousRow = allRows[currentIndex + 1]; // DOM'da üstten alta
					const previousItem = previousRow?.__item;
					const prevFundsDetail = previousItem?.fundsList?.[0] || [];
					const prevFundMap = Object.fromEntries(prevFundsDetail.map(f => [f.currencyType, parseFloat(f.forTl)]));

					fundsDetail.filter(f => f.currencyType !== "TL").forEach(fund => {
						const formattedEndex = typeof fund.endex === "string" ? fund.endex : fund.endex.toLocaleString('tr-TR');
						const formattedForTl = parseFloat(fund.forTl).toLocaleString('tr-TR');

						// Farkı hesapla
						let diff = 0;
						if (previousItem) {
							diff = parseFloat(fund.forTl) - (prevFundMap[fund.currencyType] || 0);
						}

						// Renk belirle
						let bgColor = '';
						if (diff > 0) {
							bgColor = 'background-color: #b0ff7ca8;'; // artış - yeşil
						} else if (diff < 0) {
							bgColor = 'background-color: #ff7c7ca8;'; // azalış - kırmızı
						}

						tableHtml += `
							<tr style="${bgColor}">
								<td>${fund.currencyType}</td>
								<td>${fund.amount}</td>
								<td>${formattedEndex}</td>
								<td>${formattedForTl} ₺</td>
							</tr>
						`;
					});

					tableHtml += `
							</tbody>
						</table>
						<div class="tooltip-total"><strong>Toplam:</strong> ${item.sunFunds.toLocaleString('tr-TR')} ₺</div>
					`;

					// Kur bazlı değişim ekle
					if (previousItem) {
						let diffTable = `
							<div class="tooltip-diff-section">
								<div class="tooltip-header"><strong>Kur Bazlı Değişim:</strong></div>
								<table class="tooltip-table">
									<thead>
										<tr>
											<th>Tür</th>
											<th>Fark</th>
										</tr>
									</thead>
									<tbody>
						`;
						let sumHistoryChangeAmount = 0;
						let totalDiff = 0;

						Object.keys(fundsMap).forEach(currency => {
							const curr = fundsMap[currency] || 0;
							const prev = prevFundMap[currency] || 0;
							const diff = curr - prev;

							if (diff !== 0) {
								const arrow = diff > 0 ? '▲' : '▼';
								const color = diff > 0 ? '#00ff00' : '#ff0000';
								const formattedDiff = Math.abs(diff).toLocaleString('tr-TR', { minimumFractionDigits: 2 });

								// İlgili miktarı bul
								const fund = fundsDetail.find(f => f.currencyType === currency);
								const amount = parseFloat(fund?.amount || 1);
								const unitDiff = (Math.abs(diff) / amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 });

								diffTable += `
									<tr>
										<td>${currency}</td>
										<td style="color: ${color};">${arrow} ${formattedDiff} ₺ <span style="font-size: 10px; font-weight: bolder;font-style: italic; color: #f9f9f9;">(${unitDiff} ₺ / adet)</span></td>
									</tr>
								`;

								// Toplam farkı biriktir
								totalDiff += diff;
							}
						});

						const totalDiffArrow = totalDiff > 0 ? '▲' : (totalDiff < 0 ? '▼' : '');
						const totalDiffColor = totalDiff > 0 ? '#00ff00' : (totalDiff < 0 ? '#ff0000' : '#aaa');
						const formattedTotalDiff = Math.abs(totalDiff).toLocaleString('tr-TR', { minimumFractionDigits: 2 });

						diffTable += `
								</tbody>
							</table>
							<div style="margin-top: 6px; font-size: 12px; color: ${totalDiffColor};">
								<strong>Toplam Net Fark:</strong> ${totalDiffArrow} ${formattedTotalDiff} ₺
							</div>
						</div>
						`;


						tableHtml += diffTable;
					}

					tooltip.insertAdjacentHTML('beforeend', tableHtml);
					document.body.appendChild(tooltip);
				});




				previousValue = jsFormattedNumber;
				tableList.push(row);
			});
			for (const element of tableList.reverse()) {
				tableBody.appendChild(element);
			}
			// Grafik oluşturma
			let dates = filteredDataWithinLastFifteenDays.map(item => item.insertDate);
			function kisaTarih(tarih) {
				let parts = tarih.split(' ');
				return parts[0] + " " + parts[1] + " " + parts[4];
			}
			document.getElementById("lastFundsHistoryCallbackTimeDiv").innerHTML = "Tarihçe verileri son " + CONST_DAY_AGO + " günlük kaydı göstermektedir.";
			document.getElementById('snapshotSpan').innerText = 'Snapshot Veri Sayısı: ' + tableList.length;
			dates = dates.map(tarih => kisaTarih(tarih));

			const sunFunds = filteredDataWithinLastFifteenDays.map(item => parseFloat(item.sunFunds.replace(/\./g, '').replace(',', '.')));

			if (myChart) {
				myChart.destroy();
			}
			const ctx = document.getElementById('myChart').getContext('2d');
			myChart = new Chart(ctx, {
				type: 'line',
				data: {
					labels: dates,
					datasets: [{
						label: 'Birikim Değişimi',
						data: sunFunds,
						backgroundColor: 'rgba(54, 162, 235, 0.2)',
						borderColor: 'rgba(54, 162, 235, 1)',
						borderWidth: 1
					}]
				},
				options: {
					animation: {
						duration: 2000, // Animasyon süresi (ms cinsinden)
						easing: 'easeInOutQuart' // Animasyon tipi
					},
					scales: {
						y: {
							ticks: {
								beginAtZero: false // Y ekseninin sıfırdan başlamaması
							}
						}
					}
				}
			});
		},
		fail: (error) => {
			throw new Error("Birikim fonu tarihçe bilgisi alınırken hata ile karşılaşıldı");
		}
	})
})

$('#userActivity').click(function () {
	PocketRealtime.getserLoggedActivity({
		params: { lastRecordCount: selectedUserActivityLimit },
		done: (response) => {
			for (let key in response) {
				if (response.hasOwnProperty(key)) {
					response[key]["id"] = key;
				}
			}
			renderUserActivityModal(response);
		},
		fail: (error) => {
			throw new Error(error).stack;
		}
	})
})

$('.installmentsHistory').click(function () {
	PocketRealtime.getInstallments({
		"status": "0",
		done: function (installments) {
			displayPaidInstallments(installments);
		},
		fail: function (error) {
			console.error(error);
		}
	})
})

$('#familyIncomeButton').click(function () {
	PocketRealtime.getFamilyIncome({
		"status": "1",
		done: function (installments) {
			if (installments != null) {
				setIncome(Object.values(putKeyInsideObject(installments))[0]);
			}

		},
		fail: function (error) {
			console.error(error);
		}
	})
})

$('#familyRoutinMoneyOutButton').click(function () {
	PocketRealtime.getFamilyRoutinMoneyOut({
		done: function (routinMoneyOutInfo) {
			if (routinMoneyOutInfo != null) {
				let uniqueKeyList = Object.keys(routinMoneyOutInfo);
				for (const element of uniqueKeyList) {
					Object.assign(routinMoneyOutInfo[element], { "id": element });
				}
				setRoutineMoneyOut(Object.values(routinMoneyOutInfo));
			}
		},
		fail: function (error) {
			console.error(error);
		}
	})
})

$('.familyRoutinMoneyOutSaveButton').click(function () {
	let form = document.getElementById("outMoneyForm");
	console.log(form)
})

$('#mevduatHesaplaButon').click(function () {
	hesapla();
})

$('.btn-openFundsStatistics').click(function () {
	PocketRealtime.getFundStatistic({
		done: function (fundStatisticInfo) {
			const tableBody = document.getElementById('uniqueTransactionTable');
			tableBody.innerHTML = '';

			uniqueTransactions = [];
			uniqueTotalAmount = 0;
			uniqueItemSummary = {};

			Object.keys(fundStatisticInfo).forEach(key => {
				const transaction = fundStatisticInfo[key];
				const { date, item, quantity, price } = transaction;
				const total = (quantity * price).toFixed(2);

				uniqueTransactions.push({ key, date, item, quantity, price, total });

				uniqueTotalAmount += parseFloat(total);

				if (uniqueItemSummary[item]) {
					uniqueItemSummary[item] += quantity;
				} else {
					uniqueItemSummary[item] = quantity;
				}

				const row = document.createElement('tr');
				row.innerHTML = `
					<td>${date}</td>
					<td>${item}</td>
					<td>${quantity}</td>
					<td>${parseFloat(price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</td>
					<td>${parseFloat(total).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</td>
					<td><button onclick="deleteTransaction('${key}')">Sil</button></td>
				`;
				tableBody.appendChild(row);
			});

			updateUniqueStatistics();
			updateUniqueRecordCount();
		},
		fail: function (error) {
			console.error(error);
		}
	});
});