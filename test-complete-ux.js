const puppeteer = require('puppeteer');

(async () => {
  console.log('🧪 TEST UX COMPLETA END-TO-END...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1200, height: 800 }
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
    await page.screenshot({ path: 'ux-test-1-clients-page.png', fullPage: true });

    console.log('🔍 3. Verifico caricamento clienti...');
    const clientsLoaded = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return !bodyText.includes('Caricamento clienti...');
    });

    const hasClientsTable = await page.$('table') !== null;
    const hasEmptyState = await page.evaluate(() => {
      return document.body.textContent.includes('Nessun cliente') ||
             document.body.textContent.includes('Inizia aggiungendo');
    });

    console.log('📊 STATO CLIENTI:');
    console.log('Caricamento completato:', clientsLoaded ? '✅' : '❌');
    console.log('Ha tabella:', hasClientsTable ? '✅' : '❌');
    console.log('Stato vuoto:', hasEmptyState ? '✅' : '❌');

    if (!clientsLoaded) {
      console.log('❌ I clienti non si caricano correttamente');
      await browser.close();
      return;
    }

    console.log('🔍 4. Cerco pulsante "Nuovo Cliente"...');
    const buttons = await page.$$('button');
    const buttonTexts = await Promise.all(buttons.map(btn => page.evaluate(el => el.textContent, btn)));
    const newClientIndex = buttonTexts.findIndex(text => text?.includes('Nuovo Cliente'));
    const newClientButton = newClientIndex !== -1 ? buttons[newClientIndex] : null;

    if (!newClientButton) {
      console.log('❌ Pulsante "Nuovo Cliente" non trovato');
      await browser.close();
      return;
    }

    console.log('✅ Trovato pulsante "Nuovo Cliente"');
    await newClientButton.click();
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Screenshot dopo click
    await page.screenshot({ path: 'ux-test-2-modal-open.png', fullPage: true });

    console.log('🔍 5. Verifico modal aperto...');
    const modal = await page.$('[role="dialog"]') || await page.$('.modal');
    const hasModalContent = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Modalità') ||
             bodyText.includes('Manuale') ||
             bodyText.includes('Vocale');
    });

    console.log('Modal presente:', !!modal ? '✅' : '❌');
    console.log('Contenuto modalità:', hasModalContent ? '✅' : '❌');

    if (!modal) {
      console.log('❌ Modal non si apre');
      await browser.close();
      return;
    }

    console.log('🎯 6. Seleziono modalità Manuale...');

    // Il modal ha 3 figli - cerco i pulsanti nelle card delle modalità
    const modalContent = await page.$('[role="dialog"]');
    if (modalContent) {
      // Cerco tutti i pulsanti dentro il modal
      const modalButtons = await modalContent.$$('button');
      const modalButtonTexts = await Promise.all(modalButtons.map(btn => page.evaluate(el => el.textContent, btn)));

      console.log('📋 PULSANTI NEL MODAL:');
      modalButtonTexts.forEach((text, i) => {
        if (text && text.trim()) {
          console.log(`  ${i}: "${text.trim()}"`);
        }
      });

      // Cerco il pulsante Manuale
      let manualButton = null;
      let manualIndex = -1;

      // Prova 1: cerca "Manuale"
      manualIndex = modalButtonTexts.findIndex(text => text?.includes('Manuale'));
      if (manualIndex !== -1) {
        manualButton = modalButtons[manualIndex];
        console.log('✅ Trovato "Manuale" all\'indice', manualIndex);
      }

      // Prova 2: cerca "Inserimento Manuale"
      if (!manualButton) {
        manualIndex = modalButtonTexts.findIndex(text => text?.includes('Inserimento Manuale'));
        if (manualIndex !== -1) {
          manualButton = modalButtons[manualIndex];
          console.log('✅ Trovato "Inserimento Manuale" all\'indice', manualIndex);
        }
      }

      // Prova 3: cerca "Compila" o "form"
      if (!manualButton) {
        manualIndex = modalButtonTexts.findIndex(text =>
          text?.includes('Compila') ||
          text?.includes('form') ||
          text?.includes('PenTool')
        );
        if (manualIndex !== -1) {
          manualButton = modalButtons[manualIndex];
          console.log('✅ Trovato pulsante form all\'indice', manualIndex);
        }
      }

      // Se non trovato, prendo il primo pulsante del modal (probabilmente Manuale)
      if (!manualButton && modalButtons.length > 0) {
        manualButton = modalButtons[0];
        console.log('✅ Uso primo pulsante del modal');
      }

      if (!manualButton) {
        console.log('❌ Pulsante Manuale non trovato nel modal');
        await browser.close();
        return;
      }

      console.log('✅ Trovato pulsante Manuale, clicco...');
      await manualButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('❌ Modal non trovato');
      await browser.close();
      return;
    }

    // Screenshot form manuale
    await page.screenshot({ path: 'ux-test-3-manual-form.png', fullPage: true });

    console.log('🔍 7. Verifico form aperto...');
    const formInputs = await page.$$('input[type="text"], input[type="email"], input[type="tel"]');
    const formVisible = formInputs.length > 0;

    console.log('Form visibile:', formVisible ? '✅' : '❌');
    console.log('Numero input form:', formInputs.length);

    if (!formVisible) {
      console.log('❌ Form manuale non si apre');
      await browser.close();
      return;
    }

    console.log('📝 8. Compilo il form...');
    const inputs = await page.$$('input[type="text"], input[type="email"], input[type="tel"]');

    // Riempio i primi input che trovo
    if (inputs.length >= 2) {
      await inputs[0].type('Mario');
      await inputs[1].type('Rossi');
      console.log('✅ Inserito nome e cognome');

      if (inputs.length >= 3) {
        await inputs[2].type('mario@example.com');
        console.log('✅ Inserita email');
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🔍 9. Cerco pulsante "Salva"...');
    const saveButtons = await page.$$('button');
    const saveButtonTexts = await Promise.all(saveButtons.map(btn => page.evaluate(el => el.textContent, btn)));

    console.log('📋 PULSANTI NEL FORM:');
    saveButtonTexts.forEach((text, i) => {
      if (text && text.trim()) {
        console.log(`  ${i}: "${text.trim()}"`);
      }
    });

    // Cerco il pulsante Salva in vari modi
    let saveButton = null;
    let saveIndex = -1;

    // Prova 1: cerca "Salva"
    saveIndex = saveButtonTexts.findIndex(text => text?.includes('Salva'));
    if (saveIndex !== -1) {
      saveButton = saveButtons[saveIndex];
      console.log('✅ Trovato "Salva" all\'indice', saveIndex);
    }

    // Prova 2: cerca "Salva Cliente"
    if (!saveButton) {
      saveIndex = saveButtonTexts.findIndex(text => text?.includes('Salva Cliente'));
      if (saveIndex !== -1) {
        saveButton = saveButtons[saveIndex];
        console.log('✅ Trovato "Salva Cliente" all\'indice', saveIndex);
      }
    }

    // Prova 3: cerca pulsanti con classe bg-blue
    if (!saveButton) {
      const blueButtons = await page.$$('button[class*="blue"], button[class*="bg-blue"]');
      if (blueButtons.length > 0) {
        saveButton = blueButtons[blueButtons.length - 1]; // ultimo pulsante blu
        console.log('✅ Trovato pulsante blu (probabilmente Salva)');
      }
    }

    // Prova 4: cerca il pulsante più a destra (di solito è Salva/Annulla)
    if (!saveButton) {
      const buttonsWithPosition = await page.$$eval('button', buttons => {
        return buttons.map((btn, index) => ({
          index,
          text: btn.textContent?.trim() || '',
          rect: btn.getBoundingClientRect()
        })).sort((a, b) => b.rect.right - a.rect.right); // ordina da destra a sinistra
      });

      if (buttonsWithPosition.length > 0) {
        const rightmostButton = buttonsWithPosition[0];
        saveButton = saveButtons[rightmostButton.index];
        console.log('✅ Trovato pulsante più a destra:', `"${rightmostButton.text}"`);
      }
    }

    if (!saveButton) {
      console.log('❌ Pulsante Salva non trovato');
      await browser.close();
      return;
    }

    console.log('✅ Trovato pulsante Salva, clicco...');
    await saveButton.click();
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Screenshot dopo salvataggio
    await page.screenshot({ path: 'ux-test-4-after-save.png', fullPage: true });

    console.log('🔍 10. Verifico risultato...');
    const successMessage = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('success') ||
             bodyText.includes('creato') ||
             bodyText.includes('salvato');
    });

    const hasNewClient = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Mario') && bodyText.includes('Rossi');
    });

    console.log('Messaggio successo:', successMessage ? '✅' : '❌');
    console.log('Cliente creato:', hasNewClient ? '✅' : '❌');

    if (errors.length > 0) {
      console.log('\n❌ ERRORI BROWSER:');
      errors.forEach((error, i) => console.log(`  ${i+1}. ${error}`));
    }

    console.log('\n📊 RISULTATO FINALE:');
    if (successMessage && hasNewClient) {
      console.log('🎉 UX COMPLETA FUNZIONANTE!');
    } else {
      console.log('❌ UX HA PROBLEMI');
    }

  } catch (error) {
    console.error('💥 TEST FALLITO:', error.message);
    await page.screenshot({ path: 'ux-test-error.png' });
  } finally {
    await browser.close();
    console.log('\n🔍 TEST UX COMPLETATO');
  }
})();
