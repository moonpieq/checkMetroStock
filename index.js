const express = require('express');
const { chromium } = require('playwright');

const app = express();
const port = process.env.PORT || 8080;

// Use environment variable for webhook URL, with a default value
const webhookUrl = process.env.WEBHOOK_URL || "https://api.day.app/default-key/";

const producUrl = "https://www.metrobyt-mobile.com/cell-phone/apple-iphone-12";
const producUrl2 = "https://www.metrobyt-mobile.com/cell-phone/apple-iphone-13";

const makeGetRequest = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP request failed with status ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    throw error;
  }
};

const checkStock = async () => {
  let browser;
  try {
    browser = await chromium.launch();
    const urls = [producUrl, producUrl2];
    const results = await Promise.all(urls.map(async (url) => {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });

      const isButtonActive = await page.evaluate(() => {
        const button = document.querySelector('button[data-testid="add-to-cart-button"]');
        if (button) {
          return !button.disabled && !button.classList.contains('mat-button-disabled');
        }
        return false;
      });

      console.log(`Button status for ${url}: ${isButtonActive ? 'Active' : 'Inactive or not found'}`);
      await page.close();
      return { url, isButtonActive };
    }));

    const inStockItems = results.filter(result => result.isButtonActive);

    if (inStockItems.length > 0) {
      const message = inStockItems.map(item => `iPhone in stock at ${item.url}`).join(', ');
      await makeGetRequest(webhookUrl + encodeURIComponent(message));
      console.log('Sent message to Bark:', message);
      return { message: 'Stock check complete. Items found in stock.' };
    } else {
      console.log('No items in stock');
      return { message: 'Stock check complete. No items in stock.' };
    }
  } catch (error) {
    console.error('Error in checkStock:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

app.get('/', (req, res) => {
  res.send('Stock checker is running. Use /check-stock to perform a stock check.');
});

app.get('/check-stock', async (req, res) => {
  try {
    const result = await checkStock();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Stock checker listening at http://localhost:${port}`);
});