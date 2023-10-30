import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import url from 'url';
import html2md from 'html-to-md'
const userDataDir = "public/browser-data";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());

const excludedUrls = ["privacy", "datenschutz", "policy", "impressum", "imprint"];
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 50,
    separators: ["##", "\n\n"]
});

export async function extractDataFromWebsite(baseUrl: string, maxDepth: number = 1) {
    const docList: any[] = [];
    let websiteContent = "";
    let links: string[] = [];
    const visitedUrls = new Set<string>();
    let browser;

    async function extractDataFromUrl(urlString: string) {
        try {
            const currentUrl = new URL(urlString);

            if (currentUrl.hostname !== url.parse(baseUrl).hostname) {
                return;
            }

            console.log("Visiting: " + urlString);

            browser = await puppeteer.launch({
                headless: "new",
                userDataDir,
                args: ['--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--single-process',
                    '--no-zygote',
                    '--disable-gpu']
            });
            const page = await browser.newPage();
            page.setViewport({ width: 1280, height: 1500 });
            await page.goto(urlString);
            await page.waitForSelector("body");
            await page.waitForTimeout(1000);

            websiteContent = await page.evaluate(() => {
                const body = document.querySelector("body");
                const bodyContent = body?.innerHTML ?? "";
                const parser = new DOMParser();
                const parsedBody = parser.parseFromString(bodyContent, "text/html");

                const navs = parsedBody.querySelectorAll("div[role='navigation']");
                navs.forEach((s) => s.parentNode.removeChild(s));

                const ulElements = parsedBody.querySelectorAll('ul:has(a)');
                ulElements.forEach((ul) => ul.parentNode.removeChild(ul));

                const prePaths = parsedBody.querySelectorAll('pre:has(a)');
                prePaths.forEach((pref) => pref.parentNode.removeChild(pref));

                const modifiedHTML = parsedBody.documentElement.innerHTML;

                return modifiedHTML;
            });

            const foundLinks = await page.$$eval("a[href]", (elements: any[]) =>
            elements.map((element) => element.href)
            );
            
            await browser.close();
            const visitedUrls = new Set();

            links = foundLinks.filter((link) => {
                const linkUrl = new URL(link);
                const meetsCriteria =
                    (link.startsWith("http://") || link.startsWith("https://") || link.startsWith("www")) &&
                    linkUrl.toString().includes(baseUrl) &&
                    !excludedUrls.some((excluded) => linkUrl.pathname.toLowerCase().includes(excluded)) &&
                    baseUrl != link

                if (meetsCriteria) {
                    if (!visitedUrls.has(link)) {
                        visitedUrls.add(link);
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            });
        } catch (e) {
            if (browser) {
                await browser.close();
            }
            console.error(e);
            return;
        }
        const formattedContent = html2md(websiteContent, {
            ignoreTags: ['style', 'head', '!doctype', 'form', 'svg', 'noscript', 'script', 'meta', 'button', 'header'],
            skipTags: ['div', 'html', 'body', 'nav', 'section', 'footer', 'main', 'aside', 'article'],
            emptyTags: [],
            aliasTags: {
                'figure': 'p',
                'dl': 'p',
                'dd': 'p',
                'dt': 'p',
                'figcaption': 'p'
            },
            renderCustomTags: true
        }, true)

        // kick useless content that is to short
        if (formattedContent.length > 300) {
            let docs = await textSplitter.createDocuments([formattedContent]);

            const docsWithMeta = docs.map((d) => ({
                ...d, metadata: {
                    source_type: 'Website',
                    website_url: urlString,
                    ...d.metadata
                }
            }));
            docList.push(...docsWithMeta);
        } else {
            console.log("Website content too short: ", websiteContent.length);
            maxDepth++; // increase max depth cause we skipped
        }

        console.log("Links found: ", links);

        for (const link of links) {
            if (!visitedUrls.has(link)) {

                if (visitedUrls.size >= maxDepth) {
                    return;
                }

                visitedUrls.add(link);
                try {
                    await extractDataFromUrl(link);
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }

    visitedUrls.add(baseUrl);
    await extractDataFromUrl(baseUrl);

    return { docs: docList };
}
