import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import pool from './database'; // Importamos el pool que configuramos antes
import productRoutes from './routes/productRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import userJRoutes from './routes/userJRoutes';
import photoCardRoutes from './routes/photoCardRoutes';
import checkOutRoutes from './routes/checkOutRoutes';
import telegramRoutes from './routes/telegramRoutes';
import './Bot';

const app = express();

// 1. CONFIGURACIÓN DE MIDDLEWARES
// Permite que tu Frontend (Vite) haga peticiones a este Backend
app.use(cors()); 
// Permite que el servidor entienda cuando le envías datos en formato JSON (ej. un formulario)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/productos', productRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/userJ', userJRoutes);
app.use('/api/fotos', photoCardRoutes);
app.use('/api/checkout', checkOutRoutes);
app.use('/api/telegram', telegramRoutes);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// El puerto: usa el de las variables de entorno o el 3000 por defecto
const PORT = process.env.PORT || 3000;


// 2. RUTAS (ENDPOINTS)

// Ruta de bienvenida (para probar en el navegador: http://localhost:3000)
app.get('/', (req: Request, res: Response) => {
  res.send('💈 API de la Peluquería funcionando correctamente');
});

// Ruta para probar la salud de la base de datos
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS check_db');
    res.json({ status: 'OK', database: 'Conectada', data: rows });
  } catch (error: any) {
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

const serverPort = Number(PORT);

app.listen(serverPort, '0.0.0.0', () => {
  console.log('-------------------------------------------');
  console.log(`🚀 NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`🚀 Escuchando en: http://0.0.0.0:${serverPort}`);
  console.log(`🌍 Prueba en tu navegador: http://localhost:3000`);
  console.log('-------------------------------------------');
});