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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verifica il titolo della pagina
    const title = await page.title();
    console.log('📄 Titolo pagina:', title);
    
    // Verifica se siamo nella pagina di login
    const loginForm = await page.$('form');
    if (!loginForm) {
      console.error('❌ Form di login non trovato');
      console.log('🔍 Cerco elementi comuni di login...');
      
      const loginElements = await page.$$eval('*', elements => {
        return elements.filter(el => {
          const text = el.textContent?.toLowerCase() || '';
          const id = el.id?.toLowerCase() || '';
          const className = el.className?.toLowerCase() || '';
          return text.includes('login') || text.includes('accedi') || id.includes('login') || className.includes('login');
        }).map(el => ({
          tag: el.tagName,
          text: el.textContent?.substring(0, 100),
          id: el.id,
          className: el.className
        }));
      });
      
      console.log('🔍 Elementi relativi al login:', loginElements);
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
    const navigationPromise = page.waitForNavigation({ timeout: 10000 }).catch(() => null);
    await submitButton.click();
    await navigationPromise;
    
    // Aspetta un po' per vedere cosa succede
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log('📍 URL corrente:', currentUrl);
    
    console.log('📸 Screenshot dopo tentativo login...');
    await page.screenshot({ path: 'after-login.png', fullPage: true });
    
    // Verifica se siamo nella dashboard
    if (currentUrl.includes('/dashboard')) {
      console.log('🎉 LOGIN RIUSCITO! Siamo nella dashboard');
      
      // Verifica elementi dashboard
      try {
        const dashboardTitle = await page.$eval('h1', el => el.textContent);
        console.log('📊 Titolo dashboard:', dashboardTitle);
      } catch (e) {
        console.log('📊 Titolo dashboard non trovato');
      }
      
    } else {
      console.log('❌ Login fallito, ancora nella pagina di login');
      
      // Controlla se ci sono errori
      try {
        const bodyText = await page.$eval('body', el => el.innerText);
        if (bodyText.toLowerCase().includes('error') || bodyText.toLowerCase().includes('errore')) {
          const relevantText = bodyText.split('\n').filter(line => 
            line.toLowerCase().includes('error') || line.toLowerCase().includes('errore')
          );
          console.log('🚨 Possibili errori trovati:', relevantText);
        }
      } catch (e) {
        console.log('📋 Nessun messaggio di errore trovato');
      }
    }
    
    // Test API diretta
    console.log('🔧 Test API diretta...');
    try {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@geometra.com', password: 'password123' })
        });
        return {
          status: res.status,
          ok: res.ok,
          data: await res.json().catch(() => ({ error: 'Invalid JSON' }))
        };
      });
      console.log('🔧 Risposta API:', response);
    } catch (e) {
      console.log('🔧 Errore test API:', e.message);
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
