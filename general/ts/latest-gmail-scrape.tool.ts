import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());

const gmailUrl = "https://mail.google.com";
const userDataDir = "./public/browser-data";
const emailsTableSelector = 'table[role="grid"] tr';

async function openLoginGmailPage() {
    console.log("Please login to your gmail account");

    const browser = await puppeteer.launch({
        headless: false,
        userDataDir
    });
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 1500 });
    await page.goto("https://accounts.google.com/ServiceLogin?hl=en-GB&continue=" + gmailUrl);
    await page.waitForSelector(emailsTableSelector, { timeout: 80000 });

    const result = await scrapeMails(page);
    await browser.close();

    return result;
}
async function scrapeMails(page) {
    const elements = await page.$$(emailsTableSelector);
    const mails: any[] = [];

    for (const row of elements) {
        const handle = await row.evaluateHandle((row) => {
            row.click();
        });

        const emailContentSelector = 'div[role="listitem"]';
        await page.waitForSelector(emailContentSelector);

        const contentItems = await page.$$(emailContentSelector);
        const latestPostElement = contentItems[contentItems.length - 1];
        const titleElement = await row.$('td:nth-child(6)');
        const datetimeElement = await row.$('td:nth-child(9)');

        if (titleElement && datetimeElement) {
            const title = await (await titleElement.getProperty('textContent')).jsonValue();
            const datetime = await (await datetimeElement.getProperty('textContent')).jsonValue();
            const content = await (await latestPostElement.getProperty('textContent')).jsonValue();

            mails.push({
                title: title.trim(),
                datetime: datetime.trim(),
                content: content.replace(/[\t\n]/g, "").trim()
            });
        }

        await handle.dispose();
        await page.goBack();
    }

    return mails;
}

export async function getUnreadMails() {
    const browser = await puppeteer.launch({
        headless: true,
        userDataDir
    });
    const page = await browser.newPage();
    await page.goto(gmailUrl);

    try {
        await page.waitForSelector(emailsTableSelector, { timeout: 10000 });
    } catch (e) {
        await browser.close();
        return openLoginGmailPage();
    }

    const result = await scrapeMails(page);
    return result;
}