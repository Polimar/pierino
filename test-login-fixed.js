const puppeteer = require('puppeteer');

async function testLogin() {
  let browser;
  try {
    console.log('🚀 Avvio browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    // Imposta viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Ascolta errori console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('🐛 Console Error:', msg.text());
      }
    });
    
    console.log('🌐 Navigazione verso il sito...');
    await page.goto('https://vps-3dee2600.vps.ovh.net', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    console.log('📸 Screenshot della pagina iniziale...');
    await page.screenshot({ path: 'homepage.png' });
    
    // Verifica se siamo nella pagina di login
    const loginForm = await page.$('form');
    if (!loginForm) {
      console.error('❌ Form di login non trovato');
      return;
    }
    
    console.log('✅ Form di login trovato');
    
    // Verifica che i campi esistano
    const emailField = await page.$('input[type="email"], input[name="email"]');
    const passwordField = await page.$('input[type="password"], input[name="password"]');
    
    if (!emailField || !passwordField) {
      console.error('❌ Campi email o password non trovati');
      const allInputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({ type: input.type, name: input.name, placeholder: input.placeholder }))
      );
      console.log('📋 Tutti gli input trovati:', allInputs);
      return;
    }
    
    // Compila il form di login
    console.log('📝 Compilazione credenziali...');
    await page.type('input[type="email"], input[name="email"]', 'admin@geometra.com');
    await page.type('input[type="password"], input[name="password"]', 'password123');
    
    console.log('📸 Screenshot prima del login...');
    await page.screenshot({ path: 'before-login.png' });
    
    // Trova il pulsante di submit
    const submitButton = await page.$('button[type="submit"]') || await page.$('button');
    if (!submitButton) {
      console.error('❌ Pulsante di submit non trovato');
      return;
    }
    
    // Clicca sul pulsante di login
    console.log('🔐 Tentativo di login...');
    await submitButton.click();
    
    // Aspetta un po' per vedere cosa succede
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('📍 URL corrente:', currentUrl);
    
    console.log('📸 Screenshot dopo tentativo login...');
    await page.screenshot({ path: 'after-login.png' });
    
    // Verifica se siamo nella dashboard
    if (currentUrl.includes('/dashboard')) {
      console.log('🎉 LOGIN RIUSCITO! Siamo nella dashboard');
    } else {
      console.log('❌ Login fallito, ancora nella pagina di login');
      
      // Controlla se ci sono errori
      try {
        const errorElements = await page.$$('[class*="error"], [class*="alert"], [role="alert"]');
        for (const element of errorElements) {
          const text = await element.evaluate(el => el.textContent);
          if (text && text.trim()) {
            console.log('🚨 Messaggio di errore:', text.trim());
          }
        }
      } catch (e) {
        console.log('📋 Nessun messaggio di errore visibile trovato');
      }
    }
    
    // Mostra gli errori console
    if (consoleErrors.length > 0) {
      console.log('🐛 Errori console JavaScript trovati:', consoleErrors.length);
    }
    
  } catch (error) {
    console.error('💥 Errore durante il test:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testLogin();
