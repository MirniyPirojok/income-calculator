// === CONSTANTS ===
const CONFIG = {
    MIN_DATE: '2016-01-01',
    API_URL: 'https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/',
    CURRENCIES: ['USD', 'EUR', 'RUB'],
    EMAIL: 'mirniypirojok@gmail.com',
    TELEGRAM_URL: 'https://t.me/CJlABA_6o6y',
    SUPPORT_URL: 'https://coff.ee/mirniypirojok',
    GITHUB_URL: 'https://github.com/MirniyPirojok/income-calculator'
};

const SELECTORS = {
    ADD_INCOME: '#add-income',
    INCOME_ENTRIES: '#income-entries',
    CONVERTER_FORM: '#converter-form',
    YEARLY_INCOME: '#yearly-income',
    CONVERTED_AMOUNT: '#converted-amount',
    TOTAL_YEARLY_INCOME: '#total-yearly-income',
    CONVERTED_AMOUNT_MSG: '#converted-amount-msg',
    TOTAL_YEARLY_INCOME_MSG: '#total-yearly-income-msg'
};

// === TRANSLATIONS ===
// Combine translations from separate files
const translations = {
    en: translationsEN,
    ru: translationsRU
};

// === APP OBJECT ===
const App = {
    currentLang: localStorage.getItem("lang") || "en",
    
    init() {
        this.processTranslations();
        this.setupEventListeners();
        this.loadLanguage();
    },
    
    setupEventListeners() {
        // Add income entry
        document.querySelector(SELECTORS.ADD_INCOME).addEventListener('click', () => {
            this.addIncomeEntry();
        });
        
        // Form submission
        document.querySelector(SELECTORS.CONVERTER_FORM).addEventListener('submit', (event) => {
            this.handleFormSubmit(event);
        });
        
        // Copy to clipboard
        document.querySelector(SELECTORS.CONVERTED_AMOUNT).addEventListener('click', (event) => {
            this.copyToClipboard(event);
        });
        
        document.querySelector(SELECTORS.TOTAL_YEARLY_INCOME).addEventListener('click', (event) => {
            this.copyToClipboard(event);
        });
    }
};

// Add method to App object
App.addIncomeEntry = function() {
    const incomeEntries = document.querySelector(SELECTORS.INCOME_ENTRIES);
    
    // Create currency options
    const currencyOptions = CONFIG.CURRENCIES.map(currency => 
        `<option value="${currency}">${currency}</option>`
    ).join('');
    
    // Create a new income entry row
    const newIncomeEntry = document.createElement('div');
    newIncomeEntry.classList.add('income-entry');
    newIncomeEntry.innerHTML = `
        <input type="number" step="0.01" class="income-amount" required data-i18n-placeholder="enterIncome">
        <select class="income-currency" required>
            ${currencyOptions}
        </select>
        <input type="date" class="income-date" required>
        <button type="button" class="remove-income">—</button>
    `;
    incomeEntries.appendChild(newIncomeEntry);

    // Apply translations to new placeholders
    this.applyTranslationsToElement(newIncomeEntry);

    // Add event listener to the remove button
    newIncomeEntry.querySelector('.remove-income').addEventListener('click', () => {
        incomeEntries.removeChild(newIncomeEntry);
    });
};

App.applyTranslationsToElement = function(element) {
    element.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        const placeholder = translations[this.currentLang][key];
        if (placeholder) el.placeholder = placeholder;
    });
};

App.handleFormSubmit = async function(event) {
    event.preventDefault();

    this.trackAnalytics('calculate_click');
    
    const incomeEntries = document.querySelectorAll('.income-entry');
    const yearlyIncomeGEL = parseFloat(document.querySelector(SELECTORS.YEARLY_INCOME).value) || 0;
    let totalConvertedAmount = 0;

    for (const entry of incomeEntries) {
        const entryData = this.getEntryData(entry);
        
        if (!this.validateEntry(entryData)) {
            return;
        }

        try {
            const convertedAmount = await this.convertCurrency(entryData);
            totalConvertedAmount += convertedAmount;
        } catch (error) {
            console.error('Error converting currency:', error);
            alert('Error fetching currency data. Please check your inputs or try again later.');
            return;
        }
    }

    this.displayResults(totalConvertedAmount, yearlyIncomeGEL);
};

App.getEntryData = function(entry) {
    return {
        currency: entry.querySelector('.income-currency').value.toUpperCase(),
        amount: parseFloat(entry.querySelector('.income-amount').value),
        date: new Date(entry.querySelector('.income-date').value)
    };
};

App.validateEntry = function(entryData) {
    const currentDate = new Date();
    const minDate = new Date(CONFIG.MIN_DATE);
    
    if (entryData.date > currentDate || entryData.date < minDate) {
        alert(`Date must be between ${CONFIG.MIN_DATE} and today's date.`);
        return false;
    }

    if (!entryData.amount || !entryData.currency) {
        alert("Please fill all fields correctly.");
        return false;
    }
    
    return true;
};

App.convertCurrency = async function(entryData) {
    const formattedDate = this.formatDate(entryData.date);
    const response = await fetch(`${CONFIG.API_URL}?currencies=${entryData.currency}&date=${formattedDate}`);

    if (!response.ok) {
        throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();
    const exchangeRate = data[0]?.currencies[0]?.rate;
    const quantity = data[0]?.currencies[0]?.quantity;

    if (!exchangeRate || !quantity) {
        throw new Error('Currency not found');
    }

    return entryData.amount / quantity * exchangeRate;
};

App.displayResults = function(totalConvertedAmount, yearlyIncomeGEL) {
    const totalYearlyIncome = yearlyIncomeGEL + totalConvertedAmount;

    document.querySelector(SELECTORS.CONVERTED_AMOUNT).textContent = totalConvertedAmount.toFixed(2);
    document.querySelector(SELECTORS.TOTAL_YEARLY_INCOME).textContent = totalYearlyIncome.toFixed(2);
};

App.trackAnalytics = function(eventName, label = '') {
    if (typeof gtag !== 'undefined') {
        const eventData = {
            event_category: eventName === 'language_change' ? 'language' : 'engagement'
        };
        
        if (label) {
            eventData.event_label = label;
        } else if (eventName === 'calculate_click') {
            eventData.event_label = 'Calculate Button';
        }
        
        gtag('event', eventName, eventData);
    }
};

App.formatDate = function(inputDate) {
    const date = new Date(inputDate);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

App.copyToClipboard = function(event) {
    navigator.clipboard.writeText(event.target.textContent).then(() => {
        const convertedAmountMsgEl = document.querySelector(SELECTORS.CONVERTED_AMOUNT_MSG);
        const totalYearlyIncomeMsgEl = document.querySelector(SELECTORS.TOTAL_YEARLY_INCOME_MSG);
        const msgEl = event.target.id === 'converted-amount' ? convertedAmountMsgEl : totalYearlyIncomeMsgEl;
    
        // Show "Copied" message for 2 seconds
        msgEl.classList.add('show');
        setTimeout(() => {
            msgEl.classList.remove('show');
        }, 2000);

    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
};

App.setLanguage = function(lang) {
    this.currentLang = lang;

    // Translate text
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        const html = translations[lang][key];
        if (html) el.innerHTML = html;
    });

    // Translate placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        const placeholder = translations[lang][key];
        if (placeholder) el.placeholder = placeholder;
    });

    // Translate titles
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
        const key = el.getAttribute("data-i18n-title");
        const title = translations[lang][key];
        if (title) el.title = title;
    });

    // Setup email links after translation
    this.setupEmailLinks();

    localStorage.setItem("lang", lang);

    this.trackAnalytics('language_change', lang);
};

App.setupEmailLinks = function() {
    const self = this;
    document.querySelectorAll('.email-link').forEach(el => {
        el.addEventListener('click', (event) => {
            self.copyEmail(event);
        });
    });
};

App.loadLanguage = function() {
    const savedLang = localStorage.getItem("lang") || "en";
    this.setLanguage(savedLang);
};

// Process template variables in translations
App.processTranslations = function() {
    for (const lang in translations) {
        for (const key in translations[lang]) {
            translations[lang][key] = translations[lang][key]
                .replace(/\{\{GITHUB_URL\}\}/g, CONFIG.GITHUB_URL)
                .replace(/\{\{TELEGRAM_URL\}\}/g, CONFIG.TELEGRAM_URL)
                .replace(/\{\{SUPPORT_URL\}\}/g, CONFIG.SUPPORT_URL);
        }
    }
};

App.copyEmail = function(event) {
    event.preventDefault();
    event.stopPropagation();
    
    navigator.clipboard.writeText(CONFIG.EMAIL).then(() => {
        // Create temporary notification
        const notification = document.createElement('span');
        notification.textContent = 'Email copied!';
        notification.className = 'email-notification';
        
        // Position notification near the clicked element
        const rect = event.target.getBoundingClientRect();
        notification.style.position = 'fixed';
        notification.style.left = rect.left + 'px';
        notification.style.top = (rect.top - 30) + 'px';
        
        document.body.appendChild(notification);
        
        // Remove notification after 2 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy email: ', err);
        // Fallback - show email in alert
        alert('Email: ' + CONFIG.EMAIL);
    });
};

// === GLOBAL FUNCTIONS FOR BACKWARD COMPATIBILITY ===
function setLanguage(lang) {
    App.setLanguage(lang);
}

// === INITIALIZE APP ===
App.init();
