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
    
    // Compila il form di login
    console.log('📝 Compilazione credenziali...');
    await page.type('input[type="email"], input[name="email"]', 'admin@geometra.com');
    await page.type('input[type="password"], input[name="password"]', 'password123');
    
    console.log('📸 Screenshot prima del login...');
    await page.screenshot({ path: 'before-login.png' });
    
    // Clicca sul pulsante di login
    console.log('🔐 Tentativo di login...');
    await page.click('button[type="submit"], button:contains("Accedi")');
    
    // Aspetta la navigazione o il risultato
    try {
      await page.waitForNavigation({ timeout: 10000 });
      console.log('✅ Navigazione completata dopo login');
    } catch (e) {
      console.log('⏰ Timeout navigazione, controllo URL corrente...');
    }
    
    const currentUrl = page.url();
    console.log('📍 URL corrente:', currentUrl);
    
    console.log('📸 Screenshot dopo tentativo login...');
    await page.screenshot({ path: 'after-login.png' });
    
    // Verifica se siamo nella dashboard
    if (currentUrl.includes('/dashboard')) {
      console.log('🎉 LOGIN RIUSCITO! Siamo nella dashboard');
      
      // Test delle statistiche dashboard
      try {
        await page.waitForSelector('[data-testid="dashboard-stats"], .grid', { timeout: 5000 });
        console.log('📊 Statistiche dashboard caricate');
      } catch (e) {
        console.log('⚠️ Statistiche dashboard non trovate');
      }
      
    } else {
      console.log('❌ Login fallito, ancora nella pagina di login');
      
      // Controlla se ci sono errori
      const errorMsg = await page.$eval('.error, .alert-error, [role="alert"]', el => el.textContent).catch(() => null);
      if (errorMsg) {
        console.log('🚨 Messaggio di errore:', errorMsg);
      }
    }
    
    // Controlla errori console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    if (consoleErrors.length > 0) {
      console.log('🐛 Errori console JavaScript:');
      consoleErrors.forEach(error => console.log('  -', error));
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
