// Health check da sessão Google do chrome-cdp (roda DENTRO do container
// meeting-bot, que já tem playwright-core): abre accounts.google.com no
// Chrome persistente e verifica se a conta do bot segue logada.
// Exit 0 = logada · 1 = deslogada (tela de signin) · 2 = infra fora (CDP
// inacessível etc.). Consumido por scripts/check-google-session.sh no host.
const { chromium } = require('playwright-core');

const CDP_URL = process.env.GOOGLE_CHROME_CDP_URL || 'http://chrome-cdp:9223';

(async () => {
  let browser;
  try {
    browser = await chromium.connectOverCDP(CDP_URL);
  } catch (e) {
    console.error(`INFRA: não conectou no CDP ${CDP_URL}: ${e.message}`);
    process.exit(2);
  }
  const page = await browser.contexts()[0].newPage();
  try {
    await page.goto('https://accounts.google.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    // ponytail: 3s fixos pros redirects de auth assentarem — suficiente na
    // prática; trocar por waitForURL se algum dia der flake.
    await page.waitForTimeout(3000);
    const url = page.url();
    if (/\/signin|ServiceLogin|InteractiveLogin/i.test(url)) {
      console.error(`DESLOGADA: sessão Google caiu (${url.slice(0, 120)})`);
      process.exit(1);
    }
    console.log(`OK: sessão logada (${url.slice(0, 120)})`);
    process.exit(0);
  } catch (e) {
    console.error(`INFRA: erro navegando: ${e.message}`);
    process.exit(2);
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
})();
