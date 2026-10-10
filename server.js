import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  calculateNumericalReference,
  generate2DPlotData,
  generate3DRevolutionMesh
} from './services/mathService.js';
import {
  explainWithGemini,
  askTutorQuestion
} from './services/geminiService.js';
import { REAL_WORLD_PRESETS } from './data/presets.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const BASE_PATH = process.env.BASE_PATH || '/calculo2';

const apiRouter = express.Router();

// Health Check (ideal para PM2 y balanceadores)
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'tu_api_key_aqui')
  });
});

// Catálogo de Casos Prácticos
apiRouter.get('/presets', (req, res) => {
  res.json({
    success: true,
    presets: REAL_WORLD_PRESETS
  });
});

// Endpoint Principal de Cálculo e IA
apiRouter.post('/calculate', async (req, res) => {
  try {
    const {
      fStr = 'x^2',
      gStr = '0',
      a = 0,
      b = 2,
      axisType = 'horizontal', // 'horizontal' | 'vertical'
      axisVal = 0,
      method = 'auto', // 'auto' | 'discos' | 'arandelas' | 'capas'
      mode = 'solid', // 'solid' | 'area'
      maxAngleDeg = 360
    } = req.body;

    const numA = parseFloat(a);
    const numB = parseFloat(b);
    const numAxisVal = parseFloat(axisVal);
    const numAngle = parseFloat(maxAngleDeg) || 360;

    if (isNaN(numA) || isNaN(numB)) {
      return res.status(400).json({
        success: false,
        error: 'Los límites a y b deben ser valores numéricos válidos.'
      });
    }

    if (numA === numB) {
      return res.status(400).json({
        success: false,
        error: 'Los límites a y b deben ser diferentes para definir un intervalo no nulo.'
      });
    }

    // 1. Cálculo numérico de referencia
    const numRef = calculateNumericalReference({
      fStr,
      gStr,
      a: numA,
      b: numB,
      axisType,
      axisVal: numAxisVal,
      method,
      mode
    });

    // 2. Datos para gráfico 2D
    const plot2D = generate2DPlotData({
      fStr,
      gStr,
      a: numA,
      b: numB,
      axisType,
      axisVal: numAxisVal,
      mode
    });

    // 3. Malla paramétrica 3D (para sólidos)
    let mesh3D = null;
    if (mode === 'solid') {
      mesh3D = generate3DRevolutionMesh({
        fStr,
        gStr,
        a: numA,
        b: numB,
        axisType,
        axisVal: numAxisVal,
        maxAngleDeg: numAngle
      });
    }

    // 4. Resolución pedagógica explicativa con Gemini
    const explanation = await explainWithGemini({
      fStr,
      gStr,
      a: numA,
      b: numB,
      axisType,
      axisVal: numAxisVal,
      method,
      mode,
      numRef
    });

    res.json({
      success: true,
      numRef,
      plot2D,
      mesh3D,
      explanation
    });
  } catch (error) {
    console.error('Error en /api/calculate:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno al procesar el cálculo'
    });
  }
});

// Endpoint para el Tutor IA
apiRouter.post('/tutor', async (req, res) => {
  try {
    const { question, context = {} } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Debe ingresar una pregunta válida.'
      });
    }

    const tutorResult = await askTutorQuestion({ question, context });
    res.json({
      success: true,
      ...tutorResult
    });
  } catch (error) {
    console.error('Error en /api/tutor:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al consultar al tutor virtual'
    });
  }
});

// Montar router en la raíz y bajo la subcarpeta (ej. /calculo2/api)
app.use('/api', apiRouter);
app.use(`${BASE_PATH}/api`, apiRouter);

// Servir frontend en producción (dist) tanto en raíz como en subcarpeta
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.use(BASE_PATH, express.static(distPath));

app.get(['*', `${BASE_PATH}*`], (req, res, next) => {
  if (req.path.includes('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'), err => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Calculo App</title></head>
        <body style="font-family:sans-serif; text-align:center; padding:50px;">
          <h2>Calculo App Backend activo en puerto ${PORT}</h2>
          <p>El cliente frontend se encuentra en modo desarrollo o pendiente de compilación (npm run build).</p>
        </body>
        </html>
      `);
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Calculo App Server corriendo en http://localhost:${PORT}`);
});
