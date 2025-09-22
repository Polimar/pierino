const puppeteer = require('puppeteer');

async function testLogin() {
  let browser;
  try {
    console.log('🚀 Avvio browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--allow-running-insecure-content',
        '--disable-web-security'
      ]
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
    await page.screenshot({ path: 'homepage.png', fullPage: true });
    
    // Aspetta che la pagina si carichi completamente
    await page.waitForTimeout(2000);
    
    // Verifica il titolo della pagina
    const title = await page.title();
    console.log('📄 Titolo pagina:', title);
    
    // Verifica se siamo nella pagina di login
    const loginForm = await page.$('form');
    if (!loginForm) {
      console.error('❌ Form di login non trovato');
      console.log('🔍 Contenuto della pagina:');
      const bodyContent = await page.$eval('body', el => el.innerText.substring(0, 500));
      console.log(bodyContent);
      return;
    }
    
    console.log('✅ Form di login trovato');
    
    // Verifica che i campi esistano
    const emailField = await page.$('input[type="email"], input[name="email"]');
    const passwordField = await page.$('input[type="password"], input[name="password"]');
    
    if (!emailField || !passwordField) {
      console.error('❌ Campi email o password non trovati');
      const allInputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({ 
          type: input.type, 
          name: input.name, 
          placeholder: input.placeholder,
          id: input.id 
        }))
      );
      console.log('📋 Tutti gli input trovati:', allInputs);
      return;
    }
    
    // Compila il form di login
    console.log('📝 Compilazione credenziali...');
    await page.type('input[type="email"], input[name="email"]', 'admin@geometra.com');
    await page.type('input[type="password"], input[name="password"]', 'password123');
    
    console.log('📸 Screenshot prima del login...');
    await page.screenshot({ path: 'before-login.png', fullPage: true });
    
    // Trova il pulsante di submit
    const submitButton = await page.$('button[type="submit"]') || await page.$('button');
    if (!submitButton) {
      console.error('❌ Pulsante di submit non trovato');
      const allButtons = await page.$$eval('button', buttons => 
        buttons.map(btn => ({ 
          text: btn.textContent.trim(), 
          type: btn.type,
          className: btn.className 
        }))
      );
      console.log('🔘 Tutti i pulsanti trovati:', allButtons);
      return;
    }
    
    // Clicca sul pulsante di login
    console.log('🔐 Tentativo di login...');
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/auth/login'), { timeout: 10000 }).catch(() => null),
      submitButton.click()
    ]);
    
    // Aspetta un po' per vedere cosa succede
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('📍 URL corrente:', currentUrl);
    
    console.log('📸 Screenshot dopo tentativo login...');
    await page.screenshot({ path: 'after-login.png', fullPage: true });
    
    // Verifica se siamo nella dashboard
    if (currentUrl.includes('/dashboard')) {
      console.log('🎉 LOGIN RIUSCITO! Siamo nella dashboard');
      
      // Verifica elementi dashboard
      const dashboardTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Non trovato');
      console.log('📊 Titolo dashboard:', dashboardTitle);
      
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
      consoleErrors.forEach(error => console.log('  -', error));
    } else {
      console.log('✅ Nessun errore console JavaScript');
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
