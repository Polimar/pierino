const puppeteer = require('puppeteer');

(async () => {
  console.log('🧪 TEST COMPLETO CREAZIONE CLIENTE...');
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
    console.log('🌐 1. Login...');
    await page.goto('https://vps-3dee2600.vps.ovh.net/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'admin@geometra.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📋 2. Naviga a clienti...');
    await page.goto('https://vps-3dee2600.vps.ovh.net/clients', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Screenshot pagina clienti
    await page.screenshot({ path: 'client-creation-1-clients-page.png', fullPage: true });

    console.log('🔍 3. Cerco pulsante "Nuovo Cliente"...');
    const buttons = await page.$$('button');
    const buttonTexts = await Promise.all(buttons.map(btn => page.evaluate(el => el.textContent, btn)));
    const newClientIndex = buttonTexts.findIndex(text => text?.includes('Nuovo Cliente'));
    const newClientButton = newClientIndex !== -1 ? buttons[newClientIndex] : null;

    if (newClientButton) {
      console.log('✅ Trovato pulsante "Nuovo Cliente"');
      await newClientButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Screenshot dopo click
      await page.screenshot({ path: 'client-creation-2-after-click.png', fullPage: true });

      // Verifica se si apre un modal o dropdown
      const modal = await page.$('[role="dialog"]') || await page.$('.modal') || await page.$('.dropdown');
      const hasModalText = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        return bodyText.includes('Modalità') ||
               bodyText.includes('Manuale') ||
               bodyText.includes('Vocale') ||
               bodyText.includes('Intelligenza Artificiale');
      });

      console.log('📊 RISULTATI:');
      console.log('Modal aperto:', !!modal ? '✅' : '❌');
      console.log('Testo modalità presente:', hasModalText ? '✅' : '❌');

      if (modal) {
        console.log('🎯 Modal trovato! Sistema funzionante');

        // Prova a cliccare su una modalità
        const modalButtons = await page.$$('button');
        const modalButtonTexts = await Promise.all(modalButtons.map(btn => page.evaluate(el => el.textContent, btn)));
        const manualIndex = modalButtonTexts.findIndex(text => text?.includes('Manuale'));
        const manualButton = manualIndex !== -1 ? modalButtons[manualIndex] : null;

        if (manualButton) {
          console.log('🔘 Trovato pulsante Manuale, clicco...');
          await manualButton.click();
          await new Promise(resolve => setTimeout(resolve, 3000));

          await page.screenshot({ path: 'client-creation-3-manual-mode.png', fullPage: true });

          // Verifica se si apre il form
          const form = await page.$('form') || await page.$('input[type="text"]');
          console.log('Form aperto:', !!form ? '✅' : '❌');

          if (form) {
            console.log('🎉 MODALITÀ MANUALE FUNZIONANTE!');
          } else {
            console.log('❌ Form non trovato dopo click Manuale');
          }
        } else {
          console.log('❌ Pulsante Manuale non trovato');
        }
      } else {
        console.log('❌ Nessun modal aperto dopo click "Nuovo Cliente"');
      }
    } else {
      console.log('❌ Pulsante "Nuovo Cliente" non trovato');
    }

    if (errors.length > 0) {
      console.log('\n❌ ERRORI BROWSER:');
      errors.forEach((error, i) => console.log(`  ${i+1}. ${error}`));
    }

    if (logs.length > 0) {
      console.log('\n🖥️  CONSOLE LOGS:');
      logs.slice(0, 10).forEach((log, i) => console.log(`  ${i+1}. ${log}`));
    }

  } catch (error) {
    console.error('💥 TEST FALLITO:', error.message);
    await page.screenshot({ path: 'client-creation-error.png' });
  } finally {
    await browser.close();
    console.log('\n🔍 TEST COMPLETATO');
  }
})();
