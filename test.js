function getInstallments(params) {
     let data = {
          "-Nf3e-E40_UFGXaDzTRv": {
               "currentMonth": 9,
               "installmentAmount": 566.95,
               "item": "Vivense Sarı Koltuk",
               "lastPaidMonth": 12,
               "status": "0",
               "totalMonths": 9
          },
          "-Nf3ehO97dqF2cDRUNSQ": {
               "currentMonth": 3,
               "installmentAmount": 949.7,
               "item": "Vivense Kiler Dolap",
               "lastPaidMonth": 12,
               "status": "0",
               "totalMonths": 3
          }
     }
     params.done(data);
}
document.addEventListener("DOMContentLoaded", function () {
     getInstallments({
          "status": "0",
          done: function (installments) {
               displayPaidInstallments(installments);
          },
          fail: function (error) {
               console.error(error);
          }
     });
});

function displayPaidInstallments(installments) {
     const paidInstallmentsTableBody = document.getElementById("paidInstallmentsTableBody");

     for (const key in installments) {
          const installment = installments[key];

          if (installment.status === "0") {
               const row = document.createElement("tr");

               const itemNameCell = document.createElement("td");
               itemNameCell.textContent = installment.item;
               row.appendChild(itemNameCell);

               const installmentAmountCell = document.createElement("td");
               installmentAmountCell.textContent = installment.installmentAmount;
               row.appendChild(installmentAmountCell);

               const lastPaidMonthCell = document.createElement("td");
               lastPaidMonthCell.textContent = installment.lastPaidMonth;
               row.appendChild(lastPaidMonthCell);

               const totalMonthsCell = document.createElement("td");
               totalMonthsCell.textContent = installment.totalMonths;
               row.appendChild(totalMonthsCell);

               const totalPaid = document.createElement("td");
               totalPaid.textContent = parseInt(installment.totalMonths) * parseInt(installment.installmentAmount);
               row.appendChild(totalPaid);

               paidInstallmentsTableBody.appendChild(row);
          }
     }
}
