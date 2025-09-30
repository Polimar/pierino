const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 DEBUG FRONTEND DETTAGLIATO...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Cattura tutti gli errori e log del browser
  const errors = [];
  const logs = [];

  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    console.log('🖥️  BROWSER CONSOLE:', text);
  });

  page.on('pageerror', (err) => {
    errors.push(err.message);
    console.error('❌ BROWSER ERROR:', err.message);
  });

  page.on('requestfailed', (request) => {
    console.error('🔴 REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.error('🔴 RESPONSE ERROR:', response.status(), response.url());
    }
  });

  try {
    console.log('🌐 Navigazione a login...');
    await page.goto('https://vps-3dee2600.vps.ovh.net/login', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Screenshot login
    await page.screenshot({ path: 'debug-login.png' });

    console.log('🔐 Login...');
    await page.type('input[type="email"]', 'admin@geometra.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Attesa redirect
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('📋 Navigazione a clients...');
    await page.goto('https://vps-3dee2600.vps.ovh.net/clients', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Attesa caricamento
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Screenshot pagina clienti
    await page.screenshot({ path: 'debug-clients.png', fullPage: true });

    // Analisi contenuto
    const pageContent = await page.content();
    const hasErrorText = pageContent.includes('Errore') || pageContent.includes('Error') || pageContent.includes('failed');
    const hasClientContent = pageContent.includes('Clienti') || pageContent.includes('Lista Clienti');
    const hasTable = await page.$('table') !== null;
    const buttons = await page.$$('button');
    const buttonTexts = await Promise.all(buttons.map(button => page.evaluate(el => el.textContent, button)));

    console.log('\n📊 ANALISI DETTAGLIATA:');
    console.log('URL:', page.url());
    console.log('Ha errori nel testo:', hasErrorText ? '❌' : '✅');
    console.log('Ha contenuto clienti:', hasClientContent ? '✅' : '❌');
    console.log('Ha tabella:', hasTable ? '✅' : '❌');
    console.log('Numero bottoni:', buttons.length);
    console.log('Testi bottoni:', buttonTexts);

    if (logs.length > 0) {
      console.log('\n🖥️  CONSOLE LOGS:');
      logs.forEach((log, i) => console.log(`  ${i+1}. ${log}`));
    }

    if (errors.length > 0) {
      console.log('\n❌ ERRORI BROWSER:');
      errors.forEach((error, i) => console.log(`  ${i+1}. ${error}`));
    }

    console.log('\n📄 SNIPPET CONTENUTO:');
    console.log(pageContent.substring(0, 500));

  } catch (error) {
    console.error('💥 TEST FALLITO:', error.message);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    await browser.close();
    console.log('\n🔍 DEBUG COMPLETATO');
  }
})();



