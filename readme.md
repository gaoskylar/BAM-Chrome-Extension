# BAM.money's Extension

## Description

BAM.money's Chrome Extension enriches your browsing by integrating financial insights directly into your browser. It silently fetches data from BAM.money's API, highlighting S&P 500 stock tickers and company names on web pages. These keywords are color-coded based on their daily sentiment scores. By clicking or hovering on them, a detailed popup appears, presenting the scores and linking to the latest relevant news articles. This neat, seamless integration keeps you always informed and connected to the latest financial trends.

## Features

- Highlights stock tickers and company names in web pages.
- Displays real-time sentiment scores fetched from the BAM.money API.
- Displays a popup modal with the sentiment scores when a highlighted stock ticker or company name is clicked/hovered upon.
- The modal includes links to the corresponding articles for each sentiment score.
- A limited API key is integrated in the extension by default, and the user can upgrade to the Premium API Access with an alternative key.
- Activation method of the popup modal and the highlighting color scheme can be personalized in `Settings`.

## Installation

1. Download or clone this repository to your local machine.
2. Open the Chrome browser and navigate to `chrome://extensions`.
3. Enable "Developer Mode" by clicking the toggle switch in the top right corner.
4. Click on the "Load unpacked" button and navigate to the directory where you downloaded or cloned this repository.
5. Select the repository folder and click "Open" to install the extension.

## Usage

After installing the extension, navigate to any website. The extension will automatically highlight stock tickers and company names. 

Click or hover (can be modified in settings) on any highlighted stock ticker or company name to view the sentiment scores in a popup modal. Each sentiment score is clickable and will redirect you to the corresponding article.

## Permissions

The extension requires the following permissions:

- `tabs` and `activeTab`: Enables access and modification to the current tab.
- `scripting`: Allows the activation of popup modals in the webpage.
- `storage`: Supports the customization settings.
- `host_permissions`: Grants access to all URLs for comprehensive browsing enhancement.

