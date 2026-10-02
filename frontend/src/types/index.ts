export type Producto = {
    id: number;               // De tabla productos
    nombre: string;           // De tabla productos
    descripcion: string;      // De tabla productos
    imagen_url: string;       // De tabla productos
    sku_universal?: string;   // De tabla productos, pero opcional en la vista
    precio: number;           // De tabla tienda_negocio 
    stock_actual: number;     // De tabla tienda_negocio 
    venta_publico: number;    // De tabla tienda_negocio
    
}
// Creamos el tipo para el carrito extendiendo el original
export type CartItem = Producto & {
    quantity: number;
    id_peluqueria: number;
};

//type para el insert de productos
export type CreateProductDTO = {
    nombre: string;
    descripcion: string;
    imagen_url: string;
    sku_universal: string;
    precio_local: number;
    stock_actual: number;
    stock_minimo: number;
}