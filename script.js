let allProducts = [];
let markets = [];
let productInfo = {};

function addProduct() {
    let product = document.getElementById("productInput").value;
    if (product && !allProducts.includes(product)) {
        allProducts.push(product);
        updateProductDropdown();
    }
}

function addMarket() {
    let market = document.getElementById("marketInput").value;
    if (market && !markets.includes(market)) {
        markets.push(market);
        updateMarketDropdown();
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
        return !(productInfo[market] && productInfo[market][product]);
    });
    productDropdown.innerHTML = availableProducts.map(product => `<option value="${product}">${product}</option>`).join("");
}

document.getElementById("marketDropdown").addEventListener("change", updateProductDropdown);

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
// ... diğer fonksiyonlar ...

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


