const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 DEBUG MODAL DETTAGLIATO...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1200, height: 800 }
  });
  const page = await browser.newPage();

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

    console.log('🔍 3. Cerco e clicco "Nuovo Cliente"...');
    const buttons = await page.$$('button');
    const buttonTexts = await Promise.all(buttons.map(btn => page.evaluate(el => el.textContent, btn)));
    const newClientIndex = buttonTexts.findIndex(text => text?.includes('Nuovo Cliente'));
    const newClientButton = newClientIndex !== -1 ? buttons[newClientIndex] : null;

    if (newClientButton) {
      console.log('✅ Trovato pulsante "Nuovo Cliente"');
      await newClientButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('🔍 4. Analizzo contenuto modal...');
      const pageContent = await page.content();
      console.log('Contenuto pagina dopo click:');
      console.log(pageContent.substring(0, 1000));

      // Lista tutti i button nel modal
      const allButtons = await page.$$('button');
      const allButtonTexts = await Promise.all(allButtons.map(btn => page.evaluate(el => el.textContent, btn)));

      console.log('\n📋 TUTTI I PULSANTI NELLA PAGINA:');
      allButtonTexts.forEach((text, i) => {
        if (text && text.trim()) {
          console.log(`  ${i}: "${text.trim()}"`);
        }
      });

      // Cerco elementi con classe modal o dialog
      const modalElements = await page.$$('[role="dialog"], .modal, [class*="modal"], [class*="dialog"]');
      console.log(`\n🎭 Elementi modal trovati: ${modalElements.length}`);

      // Cerco testi specifici
      const hasManualText = await page.evaluate(() => {
        return document.body.textContent.includes('Inserimento Manuale') ||
               document.body.textContent.includes('Modalità');
      });

      const hasVoiceText = await page.evaluate(() => {
        return document.body.textContent.includes('Vocale') ||
               document.body.textContent.includes('voce');
      });

      const hasAIText = await page.evaluate(() => {
        return document.body.textContent.includes('Intelligenza') ||
               document.body.textContent.includes('Artificiale');
      });

      console.log('📊 CONTENUTO MODAL:');
      console.log('Testo "Modalità":', hasManualText ? '✅' : '❌');
      console.log('Testo "Vocale":', hasVoiceText ? '✅' : '❌');
      console.log('Testo "AI":', hasAIText ? '✅' : '❌');

      // Screenshot del modal
      await page.screenshot({ path: 'debug-modal-content.png', fullPage: true });

    } else {
      console.log('❌ Pulsante "Nuovo Cliente" non trovato');
    }

  } catch (error) {
    console.error('💥 TEST FALLITO:', error.message);
    await page.screenshot({ path: 'debug-modal-error.png' });
  } finally {
    await browser.close();
    console.log('\n🔍 DEBUG MODAL COMPLETATO');
  }
})();



