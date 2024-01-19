function calculateTotalIncome() {
     const mySalary = parseFloat(document.getElementById("mySalary").value) || 0;
     const myMealAllowance = parseFloat(document.getElementById("myMealAllowance").value) || 0;
     const spouseSalary = parseFloat(document.getElementById("spouseSalary").value) || 0;
     const spouseMealAllowance = parseFloat(document.getElementById("spouseMealAllowance").value) || 0;

     const totalIncome = mySalary + myMealAllowance + spouseSalary + spouseMealAllowance;

     document.getElementById("totalIncome").textContent = totalIncome.toFixed(2);
 }
