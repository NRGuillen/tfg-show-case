# 1. Usamos una imagen de Node.js (versión 20 que es la actual estable)
FROM node:24-alpine

# 2. Creamos la carpeta de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiamos los archivos de "la lista de la compra" (librerías)
# Copiamos package.json y package-lock.json
COPY package*.json ./

# 4. Instalamos las dependencias
RUN npm install

# 5. Copiamos TODO el código del backend a la imagen
# Esto incluye tu carpeta src, el .env (si no está en gitignore) y el isrgrootx1.pem
COPY . .

# 6. Compilamos el código TypeScript a JavaScript real
RUN npm run build

# 7. Exponemos el puerto que usará tu API (por ejemplo el 3000)
EXPOSE 3000

# ... (todo lo anterior igual)
CMD ["npm", "run", "dev"]