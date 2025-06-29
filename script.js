document.getElementById('add-income').addEventListener('click', () => {
    const incomeEntries = document.getElementById('income-entries');
    
    // Create a new income entry row
    const newIncomeEntry = document.createElement('div');
    newIncomeEntry.classList.add('income-entry');
    newIncomeEntry.innerHTML = `
        <input type="number" step="0.01" class="income-amount" placeholder="Enter Income" required>
        <select class="income-currency" required>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="RUB">RUB</option>
        </select>
        <input type="date" class="income-date" required>
        <button type="button" class="remove-income">—</button>
    `;
    incomeEntries.appendChild(newIncomeEntry);

    // Add event listener to the remove button
    newIncomeEntry.querySelector('.remove-income').addEventListener('click', () => {
        incomeEntries.removeChild(newIncomeEntry);
    });
});

document.getElementById('converter-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentDate = new Date();
    const minDate = new Date('2016-01-01');

    const incomeEntries = document.querySelectorAll('.income-entry');
    const yearlyIncomeGEL = parseFloat(document.getElementById('yearly-income').value) || 0;
    let totalConvertedAmount = 0;

    for (const entry of incomeEntries) {
        const incomeCurrency = entry.querySelector('.income-currency').value.toUpperCase();
        const income = parseFloat(entry.querySelector('.income-amount').value);
        const incomeDate = new Date(entry.querySelector('.income-date').value);

        if (incomeDate > currentDate || incomeDate < minDate) {
            alert(`Date must be between ${minDate.toISOString().split('T')[0]} and today's date.`);
            return;
        }

        if (!income || !incomeCurrency) {
            alert("Please fill all fields correctly.");
            return;
        }

        try {
            const formattedDate = formatDate(incomeDate);
            const response = await fetch(`https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?currencies=${incomeCurrency}&date=${formattedDate}`);

            if (!response.ok) {
                throw new Error('Failed to fetch exchange rate');
            }

            const data = await response.json();
            const exchangeRate = data[0]?.currencies[0]?.rate;
            const quantity = data[0]?.currencies[0]?.quantity;

            if (!exchangeRate || !quantity) {
                throw new Error('Currency not found');
            }

            const convertedAmount = income / quantity * exchangeRate;
            totalConvertedAmount += convertedAmount;

        } catch (error) {
            console.error('Error fetching currency data:', error);
            alert('Error fetching currency data. Please check your inputs or try again later.');
            return;
        }
    }

    const totalYearlyIncome = yearlyIncomeGEL + totalConvertedAmount;

    document.getElementById('converted-amount').textContent = totalConvertedAmount.toFixed(2);
    document.getElementById('total-yearly-income').textContent = totalYearlyIncome.toFixed(2);
});

// Add copy to clipboard functionality
document.getElementById('converted-amount').addEventListener('click', (event) => {
    copyToClipboard(event);
});

document.getElementById('total-yearly-income').addEventListener('click', (event) => {
    copyToClipboard(event);
});

function formatDate(inputDate) {
    const date = new Date(inputDate);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function copyToClipboard(event) {
    navigator.clipboard.writeText(event.target.textContent).then(() => {
        const convertedAmountMsgEl = document.getElementById('converted-amount-msg');
        const totalYearlyIncomeMsgEl = document.getElementById('total-yearly-income-msg');
        const msgEl = event.target.id === 'converted-amount' ? convertedAmountMsgEl : totalYearlyIncomeMsgEl;
    
        // Show "Copied" message for 2 seconds
        msgEl.classList.add('show');
        setTimeout(() => {
            msgEl.classList.remove('show');
        }, 2000);

    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}
