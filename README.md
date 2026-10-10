# 📐 Calculo App - Asistente de Sólidos de Revolución con IA

> **Curso:** Cálculo II  
> **Nivel:** Pregrado en Ingeniería en Sistemas  
> **Motor de IA:** Google Gemini (Google AI Studio / Google Cloud)  
> **Entorno de Despliegue:** Azure Virtual Machine (Ubuntu Server + PM2)

---

## 🎯 Objetivo del Proyecto

Diseñar y desarrollar una aplicación web interactiva que permite a estudiantes y docentes calcular **áreas bajo la curva** y **volúmenes de sólidos de revolución**, mostrando el procedimiento didáctico paso a paso estructurado por el modelo de IA **Gemini** y generando representaciones gráficas interactivas en **2D** y **3D (WebGL)** de las funciones analizadas.

---

## 🛠️ Arquitectura del Sistema

El sistema conecta tres capas principales en una arquitectura full-stack optimizada:

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERFAZ DE USUARIO                      │
│   • Entrada de f(x) y g(x) con teclado matemático rápido     │
│   • Selección de límites [a, b]                             │
│   • Eje de giro: Eje X, Eje Y, recta y = c, recta x = k      │
│   • Selector de método: Discos, Arandelas, Capas (Shells)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
┌──────────────────────────────▼──────────────────────────────┐
│             BACKEND & MOTOR DE IA (Node.js Express)         │
│   • Validación matemática y evaluación simbólica            │
│   • Cuadratura de Simpson para contrastar volúmenes exactos │
│   • Prompt estructurado a Gemini (Continuidad y Teorema)    │
│   • Retorno de JSON estricto con fórmulas en LaTeX          │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│               MÓDULO VISUAL / RENDERIZADO                   │
│   • 2D (Plotly.js): Curvas, área sombreada y línea de eje   │
│   • 3D (Plotly WebGL): Malla paramétrica de revolución 360° │
│   • Control deslizante de ángulo de barrido (0° a 360°)     │
│   • Renderizado de fórmulas matemáticas con KaTeX           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Requisitos Funcionales Implementados

### 1. Módulo de Cálculo e Integración (Gemini AI + Math.js)
* **Área bajo la curva:** Cálculo de $\int_a^b |f(x) - g(x)| \, dx$ con evaluación del Teorema Fundamental del Cálculo y resultado en unidades cuadradas ($u^2$).
* **Sólidos de Revolución:**
  * **Método de Discos:** Secciones transversales circulares sin cavidad ($V = \pi \int_a^b [R(x)]^2 dx$).
  * **Método de Arandelas:** Sólidos con perforación interior ($V = \pi \int_a^b [R(x)^2 - r(x)^2] dx$).
  * **Método de Capas Cilíndricas (Cascarones):** Elemento diferencial cilíndrico concéntrico ($V = 2\pi \int_a^b p(x) h(x) dx$).
  * **Ejes Arbitrarios:** Giro alrededor de rectas horizontales ($y = c$) o verticales ($x = k$).
  * **Explicación didáctica:** Continuidad en $[a, b]$, antiderivada simbólica, evaluación $F(b) - F(a)$ y resultado analítico exacto en términos de $\pi$ más aproximación decimal con unidades cúbicas ($u^3$).

### 2. Módulo de Aplicaciones Prácticas (Casos Reales)
Catálogo interactivo con carga en un clic:
* **Diseño industrial y manufactura:** Botella ergonómica con perfil senoidal, bujes huecos torneados de acero.
* **Obras civiles y arquitectura:** Cúpula semiesférica de concreto ($5\text{ m}$ de radio), tanque de agua paraboloide elevado, canal hidráulico de desagüe.
* **Física y mediciones:** Depósito de combustible ojival para cohetes aerodinámicos.

### 3. Visualización Gráfica Interactiva
* **Gráfica 2D:** Muestra las funciones $f(x)$ y $g(x)$, las rectas límite $x = a$ y $x = b$, el área sombreada de integración y el eje de giro destacado con indicador de rotación.
* **Gráfica 3D:** Superficie paramétrica tridimensional generada por rotación de $360^\circ$ alrededor del eje seleccionado. Incluye:
  * Deslizador interactivo de ángulo de rotación ($15^\circ$ a $360^\circ$) para visualizar el corte transversal y la generación del sólido.
  * Alternador de malla (wireframe) y selector de paletas de color (Viridis, Plasma, Electric, Turbo).
  * Control de opacidad para inspeccionar cavidades internas en sólidos tipo arandela.

### 4. Tutor Virtual IA
Chat contextual donde los estudiantes pueden consultar dudas específicas del problema cargado (por qué se eligió el método, qué sucedería si cambia el eje de rotación, o clarificación de los pasos).

---

## 💻 Ejecución Local

### Prerrequisitos
* Node.js v18+ (recomendado v20 o v22)
* Clave de API de [Google AI Studio](https://aistudio.google.com/) (opcional; el sistema incluye fallback matemático si no se proporciona)

### Instalación
```bash
# Clonar o situarse en la carpeta del proyecto
cd calculo2_calculadoragrafica

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tu GEMINI_API_KEY
```

### Ejecución en Modo Desarrollo
```bash
# Terminal 1: Servidor API Backend
npm run dev:server

# Terminal 2: Cliente Vite con recarga rápida (HMR)
npm run dev
```
Abre en tu navegador: `http://localhost:5173`

### Ejecución de Pruebas Matemáticas
```bash
npm test
```

---

## ☁️ Guía de Despliegue en Azure Virtual Machine (Ubuntu con PM2)

Ya que cuentas con una máquina virtual con Ubuntu y PM2, sigue estos pasos para desplegar la aplicación:

### Paso 1: Conectarse a la Máquina Virtual por SSH
```bash
ssh usuario@<IP_PUBLICA_AZURE>
```

### Paso 2: Subir o Clonar el Proyecto en la VM
```bash
# Ejemplo clonando o copiando al directorio deseado:
cd /var/www/
git clone <URL_DE_TU_REPOSITORIO> calculo-app
cd calculo-app
```

### Paso 3: Configurar el archivo `.env`
```bash
cp .env.example .env
nano .env
```
Define:
```env
PORT=3000
NODE_ENV=production
GEMINI_API_KEY=tu_clave_de_gemini_aqui
GEMINI_MODEL=gemini-2.5-flash
```

### Paso 4: Desplegar y Compilar con el Script Automatizado
El proyecto incluye un script `deploy.sh` que instala dependencias, compila el cliente React en la carpeta `dist` e inicia o recarga el proceso en PM2:
```bash
chmod +x deploy.sh
./deploy.sh
```

O manualmente con PM2:
```bash
npm install
npm run build
pm2 start ecosystem.config.cjs --env production
pm2 save
```

### Paso 5: Configurar Nginx para Subcarpeta en tu Dominio (ej. `mfelipe.tech/calculo2`)

Si tu dominio principal (`https://mfelipe.tech/`) ya está ocupado por otra aplicación y usas un archivo como `/etc/nginx/sites-available/mfelipe`, no necesitas crear un nuevo archivo de sitio. Simplemente añade un bloque `location` dentro de tu configuración existente:

1. Abre tu archivo de configuración de Nginx:
```bash
sudo nano /etc/nginx/sites-available/mfelipe
```

2. Dentro del bloque `server { ... }` que atiende tu dominio `mfelipe.tech` (en el bloque HTTPS / puerto 443), añade:
```nginx
    # Calculo App - Sólidos de Revolución con IA
    location /calculo2 {
        proxy_pass http://127.0.0.1:3000; # O el puerto configurado en tu .env si el 3000 está ocupado
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }
```

3. Verifica la sintaxis y recarga Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

¡Listo! La aplicación estará disponible en:
👉 `https://mfelipe.tech/calculo2`

### Comandos Útiles de PM2 para Mantenimiento
```bash
pm2 status calculo-app       # Ver estado y consumo de memoria
pm2 logs calculo-app         # Ver registros en tiempo real
pm2 reload calculo-app       # Recargar sin tiempo de inactividad
pm2 restart calculo-app      # Reiniciar servicio
```

---

## 👥 Créditos y Licencia
Desarrollado como proyecto para el curso de **Cálculo II**, Pregrado en Ingeniería en Sistemas.  
Licencia MIT.
