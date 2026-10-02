import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// 1. Verificación del Certificado SSL (Muy importante para Docker)
const sslCertPath = path.join(process.cwd(), process.env.SSL_CA || 'isrgrootx1.pem');

console.log('-------------------------------------------');
console.log('🔍 Verificando conexión a Base de Datos...');
console.log(`📂 Buscando certificado en: ${sslCertPath}`);

if (fs.existsSync(sslCertPath)) {
    console.log('✅ Certificado SSL encontrado correctamente.');
} else {
    console.error('❌ ERROR: No se encuentra el archivo .pem en la raíz.');
    console.error('Asegúrate de que el archivo isrgrootx1.pem esté junto al package.json');
}

// 2. Configuración del Pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 4000,
  
  ssl: {
    // Leemos el contenido del archivo usando la ruta verificada arriba
    ca: fs.readFileSync(sslCertPath),
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  },
  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// 3. Prueba rápida de conexión al arrancar
pool.getConnection()
    .then(conn => {
        console.log('🚀 Conexión establecida con TiDB Cloud (Cluster0)');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Error crítico de conexión a TiDB:');
        console.error(err.message);
    });

console.log('-------------------------------------------');

export default pool;