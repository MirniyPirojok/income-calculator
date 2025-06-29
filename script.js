// === Add income entry ===
document.getElementById('add-income').addEventListener('click', () => {
    const incomeEntries = document.getElementById('income-entries');
    
    // Create a new income entry row
    const newIncomeEntry = document.createElement('div');
    newIncomeEntry.classList.add('income-entry');
    newIncomeEntry.innerHTML = `
    <input type="number" step="0.01" class="income-amount" required data-i18n-placeholder="enterIncome">
    <select class="income-currency" required>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="RUB">RUB</option>
    </select>
    <input type="date" class="income-date" required>
    <button type="button" class="remove-income">—</button>
    `;
    incomeEntries.appendChild(newIncomeEntry);

    // Apply translations to new placeholders
    newIncomeEntry.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        const placeholder = translations[currentLang][key];
        if (placeholder) el.placeholder = placeholder;
    });

    // Add event listener to the remove button
    newIncomeEntry.querySelector('.remove-income').addEventListener('click', () => {
        incomeEntries.removeChild(newIncomeEntry);
    });
});

// === Submit form ===
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

// === Copy to clipboard ===
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

// === Switch language ===
// Track current language globally
let currentLang = localStorage.getItem("lang") || "en";

function setLanguage(lang) {
    currentLang = lang;

    //translate  text
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        const html = translations[lang][key];
        if (html) el.innerHTML = html;
    });

    //translate placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        const placeholder = translations[lang][key];
        if (placeholder) el.placeholder = placeholder;
    });

    //translate titles
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
        const key = el.getAttribute("data-i18n-title");
        const title = translations[lang][key];
        if (title) el.title = title;
    });

    localStorage.setItem("lang", lang);
}

// Load preferred language
document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("lang") || "en";
  setLanguage(savedLang);
});

// Translations
const translations = {
  en: {
    description: `
        Income Calculator is a web app that converts income to GEL (Georgian Lari) based on a specific date and calculates total yearly income in GEL
        using rates from the National Bank of Georgia's API.
        View the source code on <a href="https://github.com/MirniyPirojok/currency-converter">GitHub</a>
    `,
    addIncome: `+Add Income`,
    calculate: `Calculate`,
    converted: `Income in GEL:`,
    total: `Total Yearly Income in GEL:`,
    feedback: `💬 Have ideas or feedback?`,
    contact: `
        Message me on <a href="https://t.me/CJlABA_6o6y" target="_blank">Telegram</a> 
        or email at <a href="mailto:mirniypirojok@gmail.com">mirniypirojok@gmail.com</a>
    `,
    enterIncome: `Enter Income`,
    enterYearlyIncome: `Enter Yearly Income in GEL`,
    enterYearlyIncomeTitle: `Cumulative income since the start of the calendar year`
  },

  ru: {
    description: `
        Калькулятор доходов — это веб-приложение, которое конвертирует доход в грузинские лари (GEL) по указанной дате и рассчитывает общий доход за год в лари, 
        используя курсы Национального банка Грузии.
        Исходный код доступен на <a href="https://github.com/MirniyPirojok/currency-converter">GitHub</a>
    `,
    addIncome: `+Добавить доход`,
    calculate: `Рассчитать`,
    converted: `Доход в лари:`,
    total: `Общий доход за год в лари:`,
    feedback: `💬 Есть идеи или замечания?`,
    contact: `
        Напишите в <a href="https://t.me/CJlABA_6o6y" target="_blank">Telegram</a> 
        или на <a href="mailto:mirniypirojok@gmail.com">mirniypirojok@gmail.com</a>
    `,
    enterIncome: `Введите доход`,
    enterYearlyIncome: `Введите годовой доход в лари`,
    enterYearlyIncomeTitle: `Суммарный доход нарастающим итогом c начала календарного года`
  }
};
