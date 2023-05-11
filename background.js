chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && /^http/.test(tab.url)) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: highlightKeys,
        });
    }
});

async function highlightKeys() {
    //const apiKey = await fetch(chrome.runtime.getURL('apiKey.txt')).then(response => response.text());

    const apiKey = 'que2gaih3Quie5lae5ei'; // default api key with limited access
    
    async function fetchSocialSentiment(ticker) {
        const url = `https://api.bam.money/social_sentiment/${ticker}?api_key=${apiKey}`;
        const response = await fetch(url);

        if (response.status === 200) {
            const data = await response.json();
            return data;
        } else {
            console.error(`Error fetching data: ${response.status}`);
            return null;
        }
    }

    async function generateRegex(csvUrl) {
        const response = await fetch(csvUrl);
        const csvText = await response.text();
        const rows = csvText.split('\n');
        const tickerKeys = [];
        const companyKeys = [];

        rows.forEach((row) => {
            const [ticker, company] = row.split(',');
            if (ticker && ticker.length > 0) {
                tickerKeys.push(ticker.trim());
            }
            if (company && company.length > 0) {
                companyKeys.push(company.trim());
            }
        });

        const tickerRegexString = tickerKeys.join('|');
        const companyRegexString = companyKeys.join('|');
        const keyRegexString = tickerRegexString + '|' + companyRegexString;
        const tickerRegex = new RegExp(`(?:^|\\s)(${tickerRegexString})(?=$|\\s|[.,!?;:])`, 'g');
        //const companyRegex = new RegExp(`(?:^|\\s)(${companyRegexString})(?=$|\\s|[.,!?;:])`, 'g');
        const keyRegex = new RegExp(`(?:^|\\s)(${keyRegexString})(?=$|\\s|[.,!?;:])`, 'g');

        return {
            tickerKeys,
            companyKeys,
            keyRegex
        };
    }

    async function createModal(event, ticker, dataList) {

        event.stopPropagation();

        const company = tickerCompanyMap.get(ticker);
        const url = "https://bam.money/marketplace?query=" + ticker;

        const container = document.createElement('div');
        container.className = 'container';
        container.style.position = 'absolute';
        container.style.top = `${event.pageY}px`;
        container.style.left = `${event.pageX}px`;
        container.innerHTML = `
        <div class="overlay"></div>
        <div class="popup">
          <button class="close-btn">&times;</button>
          <div class="header">
            <span class="company-name">${company}</span>
            <span class="company-code">(${ticker})</span>
          </div>
          <div class="content">
          <div class="column">
          <span class="column-title bullish">Bullish</span>
          <a href="${dataList[3]}" target="_blank">
            <span class="index-value bullish">${dataList[0]}</span>
          </a>
        </div>
        <div class="column">
          <span class="column-title avg">Avg</span>
          <a href="${dataList[4]}" target="_blank">
            <span class="index-value avg">${dataList[1]}</span>
          </a>
        </div>
        <div class="column">
          <span class="column-title bearish">Bearish</span>
          <a href="${dataList[5]}" target="_blank">
            <span class="index-value bearish">${dataList[2]}</span>
          </a>
        </div>
          </div>
          <a href=${url} target="_blank" class="brand-link">
            <span class="brand">BAM.money</span>
          </a>
        </div>
      `;
        document.body.appendChild(container);

        // Close when the close button is clicked
        const closeButton = container.querySelector('.close-btn');
        closeButton.addEventListener('click', () => {
            document.body.removeChild(container);
        });

        // Close after 2 seconds
        container.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (document.body.contains(container)) {
                    document.body.removeChild(container);
                }
            }, 2000);
        });

        // Close when click outside the box
        document.addEventListener('click', function closeOnClickOutside(e) {
            if (!container.contains(e.target) && document.body.contains(container)) {
                document.body.removeChild(container);
                // Remove the listener to prevent multiple instances
                document.removeEventListener('click', closeOnClickOutside);
            }
        });
    }

    function parseJson(jsonData) {
        const bullish = parseFloat(jsonData.high_article.score.toFixed(2));
        const bearish = parseFloat(jsonData.low_article.score.toFixed(2));
        const avg = parseFloat(jsonData.avg_article.score.toFixed(2));
        const bullishLink = jsonData.high_article.link;
        const bearishLink = jsonData.low_article.link;
        const avgLink = jsonData.avg_article.link;

        return {
            bullish,
            avg,
            bearish,
            bullishLink,
            avgLink,
            bearishLink,
        };
    }

    async function walk(node) {
        if (node.nodeType === 3) {
            const matches = Array.from(node.nodeValue.matchAll(keyRegex));

            if (matches.length > 0) {
                let lastIndex = 0;
                const parentNode = node.parentNode;
                const fragment = document.createDocumentFragment();

                for (const match of matches) {
                    const leadingSpace = match[0].match(/^\s+/) || '';
                    const trailingSpace = match[0].match(/\s+$/) || '';
                    let key = match[0].trim();

                    let ticker = key.toUpperCase();
                    if (!tickerCompanyMap.has(key.toUpperCase())) {
                        ticker = companyTickerMap.get(key);
                    }

                    const beforeText = node.nodeValue.slice(lastIndex, match.index + leadingSpace.length);
                    lastIndex = match.index + match[0].length - trailingSpace.length;

                    fragment.appendChild(document.createTextNode(beforeText));
                    const highlighted = document.createElement('span');

                    let data = null;
                    // fetch data from cache if exists
                    if (cachedInfo.has(ticker)) {
                        data = cachedInfo.get(ticker);
                    }
                    // fetch data from server if not exists
                    else {
                        data = await fetchSocialSentiment(ticker);
                        cachedInfo.set(ticker, data);
                    }

                    const {
                        bullish,
                        bearish,
                        avg,
                        bullishLink,
                        bearishLink,
                        avgLink,
                    } = parseJson(data);
                    const dataList = [bullish, avg, bearish, bullishLink, avgLink, bearishLink];

                    // color will be different; bullish -> bearish: #ddefcb, #e8f5dd, #feecec, #fed9da
                    if (avg >= 0.2) {
                        highlighted.style.backgroundColor = '#ddefcb';
                    }
                    else if (avg >= 0) {
                        highlighted.style.backgroundColor = '#e8f5dd';
                    }
                    else if (avg >= -0.2) {
                        highlighted.style.backgroundColor = '#feecec';
                    }
                    else {
                        highlighted.style.backgroundColor = '#fed9da';
                    }
                    highlighted.textContent = key;
                    highlighted.style.cursor = 'pointer';
                    highlighted.addEventListener('click', async function (event) {
                        await createModal(event, ticker, dataList);
                    });
                    fragment.appendChild(highlighted);
                }

                const afterText = node.nodeValue.slice(lastIndex);
                fragment.appendChild(document.createTextNode(afterText));
                parentNode.replaceChild(fragment, node);
            }
        }

        let child = node.firstChild;
        while (child) {
            walk(child);
            child = child.nextSibling;
        }
    }

    const csvUrl = chrome.runtime.getURL('stockdata.csv');
    const { tickerKeys, companyKeys, keyRegex } = await generateRegex(csvUrl);

    let tickerCompanyMap = new Map();
    let companyTickerMap = new Map();
    tickerKeys.forEach((ticker, index) => {
        tickerCompanyMap.set(ticker, companyKeys[index]);
    })
    companyKeys.forEach((company, index) => {
        companyTickerMap.set(company, tickerKeys[index]);
    })

    let cachedInfo = new Map();

    // Add the CSS for the modal
    const style = document.createElement('style');
    style.textContent = `
    .container .overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 4px;
        z-index: 9998;
        }
    
        .popup {
        font-family: Calibri, sans-serif;
        width: 180px;
        height: 65px;
        background-color: rgba(255, 255, 255, 0.9);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        overflow: hidden;
        position: absolute;
        margin: 0;
        padding: 0;
        z-index: 9999; 
        }
        
        .header {
            padding: 4px 8px;
            font-size: 10px;
        }
        
        .company-name {
            color: #636363;
            font-size: 11.5px;
            font-weight: bold;
        }
        
        .company-code{
            color: #636363;
            font-size: 11.5px;
        }
        
        .content {
            display: flex;
            justify-content: space-around;
            padding: 2px;
            margin-top: 0px;
        }
        
        .column {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-right: -20px;
        }
        
        .column:last-child {
            margin-right: 0;
        }
        
        .column-title {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 0px;
            margin-top: -2px;
        }
        
        .bullish {
            color: #90be60;
        }
        
        .avg {
            color: #277da1;
        }
        
        .bearish {
            color: #f94144;
        }
        
        .index-value {
            font-size: 11px;
        }
        
        .close-btn {
            position: absolute;
            top: -1px;
            right: 5px;
            font-size: 12px;
            font-weight: bold;
            border: none;
            background-color: transparent;
            color: #838383;
            cursor: pointer;
        }
        
        .close-btn:hover {
            color: #000000;
        }
        
        .brand {
            position: absolute;
            bottom: 0px;
            right: 2px;
            font-size: 8.5px;
            color: #838383;
        }
        
        .brand:hover {
            color:  rgba(83,136,241);
        }
    `;
    document.head.appendChild(style);

    walk(document.body);
}
