const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 TEST RENDERING MODAL...');
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

    console.log('🔍 3. Clicco "Nuovo Cliente"...');
    const buttons = await page.$$('button');
    const buttonTexts = await Promise.all(buttons.map(btn => page.evaluate(el => el.textContent, btn)));
    const newClientIndex = buttonTexts.findIndex(text => text?.includes('Nuovo Cliente'));
    const newClientButton = newClientIndex !== -1 ? buttons[newClientIndex] : null;

    if (newClientButton) {
      await newClientButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('🔍 4. Verifico se il modal è renderizzato...');

      // Controlla se il componente React è montato
      const reactComponents = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const components = [];

        elements.forEach((el, index) => {
          const className = (el.className && typeof el.className === 'string') ? el.className : '';
          const id = el.id || '';

          if (className.includes('modal') ||
              className.includes('dialog') ||
              id.includes('modal') ||
              el.getAttribute('role') === 'dialog') {
            components.push({
              tag: el.tagName,
              class: className,
              id: id,
              role: el.getAttribute('role'),
              text: el.textContent?.substring(0, 100) || ''
            });
          }
        });

        return components;
      });

      console.log('📊 COMPONENTI REACT TROVATI:');
      reactComponents.forEach((comp, i) => {
        console.log(`  ${i+1}. ${comp.tag} - class: ${comp.class} - role: ${comp.role}`);
        console.log(`     Testo: ${comp.text}`);
      });

      // Verifica se ci sono errori nel componente
      const hasErrors = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        let errorCount = 0;

        for (let el of allElements) {
          const className = (el.className && typeof el.className === 'string') ? el.className : '';
          if (className.includes('error') || className.includes('Error')) {
            errorCount++;
          }
        }

        return errorCount > 0;
      });

      console.log('Errori nel componente:', hasErrors ? '❌' : '✅');

      // Screenshot del DOM
      await page.screenshot({ path: 'modal-render-debug.png', fullPage: true });

      // Verifica se il componente ha figli
      const modalHasChildren = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        return modal ? modal.children.length : 0;
      });

      console.log('Modal ha figli:', modalHasChildren);

      if (modalHasChildren === 0) {
        console.log('❌ Modal vuoto - componente non renderizzato');
      } else {
        console.log('✅ Modal ha contenuto');
      }

    } else {
      console.log('❌ Pulsante "Nuovo Cliente" non trovato');
    }

  } catch (error) {
    console.error('💥 TEST FALLITO:', error.message);
    await page.screenshot({ path: 'modal-render-error.png' });
  } finally {
    await browser.close();
    console.log('\n🔍 TEST RENDERING COMPLETATO');
  }
})();
