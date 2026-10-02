FROM node:24-alpine

WORKDIR /app

# Copiamos los archivos de configuración de librerías
COPY package*.json ./

# Aquí es donde Docker instalará Tailwind, React Router y todo lo que pusiste
RUN npm install

COPY . .

# EXTREMADAMENTE IMPORTANTE PARA VITE:
# Exponemos el puerto 5173
EXPOSE 5173

# El "-- --host" es vital para que Vite sea visible fuera de Docker
CMD ["npm", "run", "dev", "--", "--host"]