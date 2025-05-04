// Objeto global para traducciones
let translations = {};
let currentLanguage = 'en';

// Cargar archivo de traducciones y aplicarlas
async function loadLanguage(lang) {
  try {
    if (!translations[lang]) {
      // Cargar traducciones bajo demanda
      const response = await fetch(`translations/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load language ${lang}`);
      translations[lang] = await response.json();
    }
    
    // Aplica las traducciones al contenido
    applyTranslations(translations[lang]);
    
    // Actualiza la URL con el parámetro de idioma
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
    
    // Actualiza el atributo lang del HTML
    document.documentElement.lang = lang === 'es' ? 'es' : 'en-GB';
    
    // Guarda la preferencia del usuario
    localStorage.setItem('preferredLanguage', lang);
    
    // Actualiza los botones de idioma
    document.querySelectorAll('.language-toggle').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // Actualiza el idioma actual
    currentLanguage = lang;
    
    // Reinicia Typed.js si está presente
    if (window.typedInstance) {
      window.typedInstance.destroy();
      initTyped();
    }
  } catch (error) {
    console.error('Error loading language:', error);
  }
}

// Aplicar traducciones al DOM
function applyTranslations(langData) {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const value = getNestedValue(langData, key);
    
    if (value) {
      // Si tiene innerHTML complejo (con etiquetas), lo respetamos
      if (element.innerHTML.includes('<')) {
        // Preservar etiquetas internas reemplazando solo texto
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = element.innerHTML;
        
        // Intentamos reemplazar el texto manteniendo las etiquetas
        const textNodes = [...tempDiv.childNodes].filter(node => 
          node.nodeType === Node.TEXT_NODE || 
          (node.nodeType === Node.ELEMENT_NODE && !node.innerHTML.includes('<'))
        );
        
        if (textNodes.length > 0) {
          textNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
              node.textContent = value;
            } else {
              node.innerHTML = value;
            }
          });
        } else {
          element.innerHTML = value;
        }
      } else {
        // Si es texto simple, simplemente lo reemplazamos
        element.innerHTML = value;
      }
    }
  });
  
  // Manejar atributos placeholder para elementos input
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const value = getNestedValue(langData, key);
    if (value) element.placeholder = value;
  });
}

// Obtener valor anidado de un objeto usando notación de punto
function getNestedValue(obj, path) {
  return path.split('.').reduce((prev, curr) => 
    prev && prev[curr] !== undefined ? prev[curr] : undefined, obj);
}

// Función para inicializar Typed.js según el idioma
function initTyped() {
  const element = document.getElementById('typed');
  if (!element || typeof Typed === 'undefined') return;
  
  const strings = currentLanguage === 'es' 
    ? ['Diseño Web y Soluciones Digitales Que Generan Resultados.']
    : ['Web Design & Digital Solutions That Drive Results.'];
  
  window.typedInstance = new Typed('#typed', {
    strings: strings,
    typeSpeed: 60,
    backSpeed: 30,
    showCursor: true,
    cursorChar: '|'
  });
}

// Inicializar componentes cuando se cargue el documento
document.addEventListener('DOMContentLoaded', async () => {
  // Detectar idioma de la URL o usar el guardado
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get('lang');
  const savedLang = localStorage.getItem('preferredLanguage');
  const browserLang = navigator.language.split('-')[0];
  
  // Prioridad: URL > localStorage > navegador (si es español) > inglés
  let detectedLang = urlLang || savedLang;
  
  // Si no hay idioma establecido, detectar del navegador (solo si es español)
  if (!detectedLang && browserLang === 'es') {
    detectedLang = 'es';
  }
  
  // Cargar el idioma predeterminado o el detectado
  const languageToUse = ['en', 'es'].includes(detectedLang) ? detectedLang : 'en';
  await loadLanguage(languageToUse);
  
  // Configurar listeners de idioma
  document.querySelectorAll('.language-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const lang = button.dataset.lang;
      if (lang !== currentLanguage) {
        loadLanguage(lang);
      }
    });
  });
});
