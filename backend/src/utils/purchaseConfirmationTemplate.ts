interface ProductItem {
    nombre: string;
    precio: number;
}

interface TemplateData {
    nombre: string;
    facturaId: string;
    productos: ProductItem[];
    total: number;
}

export const purchaseConfirmationTemplate = (data: TemplateData) => {
    const { nombre, facturaId, productos, total } = data;

    const subject = `Confirmación de Pedido #${facturaId} - ALTIORAM BUSINESS`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .container { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
            
            /* Cabecera Azul Eléctrico */
            .header { background-color: #1d5af3; padding: 35px 30px; text-align: left; }
            .logo-text { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 0; }
            .logo-light { color: rgba(255, 255, 255, 0.8); font-weight: 400; }
            
            .content { padding: 40px 30px; }
            .title { font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
            .subtitle { font-size: 16px; color: #64748b; margin-bottom: 30px; }
            
            /* Caja de ID de Factura estilo Dashboard */
            .id-badge { background-color: #f0f4ff; padding: 15px; border-radius: 12px; border: 1px solid #dbeafe; margin-bottom: 30px; }
            .id-label { font-size: 11px; color: #1d5af3; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.5px; }
            .id-value { font-size: 20px; font-weight: 800; color: #1d5af3; }

            .product-list { margin-top: 20px; }
            .product-row { display: table; width: 100%; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
            .product-name { display: table-cell; text-align: left; font-size: 15px; color: #334155; }
            .product-price { display: table-cell; text-align: right; font-weight: 700; color: #1f2937; }
            
            /* Bloque de Total */
            .total-section { margin-top: 30px; padding: 25px; background-color: #1d5af3; border-radius: 14px; color: #ffffff; text-align: right; }
            .total-label { font-size: 14px; opacity: 0.9; font-weight: 500; }
            .total-amount { font-size: 28px; font-weight: 800; display: block; margin-top: 4px; }
            
            .footer { padding: 30px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #f1f5f9; }
        </style>
    </head>
    <body style="margin: 0; padding: 40px 20px; background-color: #f1f5f9;">
        <div class="container">
            <!-- Header con el fondo azul que pediste -->
            <div class="header">
                <p class="logo-text">ALTIORAM <span class="logo-light">BUSINESS</span></p>
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-top: 5px;">Confirmación Oficial de Transacción</div>
            </div>
            
            <div class="content">
                <h1 class="title">¡Gracias por tu confianza!</h1>
                <p class="subtitle">Hola <strong>${nombre}</strong>, hemos procesado tu compra correctamente. Aquí tienes el desglose de tu pedido.</p>
                
                <div class="id-badge">
                    <div class="id-label">Referencia del Pedido</div>
                    <div class="id-value">#${facturaId}</div>
                </div>

                <div class="product-list">
                    <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">
                        Productos Adquiridos
                    </div>
                    ${productos.map(p => `
                        <div class="product-row">
                            <span class="product-name">${p.nombre}</span>
                            <span class="product-price">${p.precio.toFixed(2)}€</span>
                        </div>
                    `).join('')}
                </div>

                <div class="total-section">
                    <span class="total-label">Pago Total Realizado</span>
                    <span class="total-amount">${total.toFixed(2)}€</span>
                </div>
            </div>

            <div class="footer">
                <p style="margin: 0;">© 2026 <strong>ALTIORAM BUSINESS</strong></p>
                <p style="margin-top: 8px;">Este correo sirve como comprobante de tu operación en el sistema.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const text = `Confirmación de pedido ALTIORAM BUSINESS. ID: #${facturaId}. Total: ${total}€.`;

    return { subject, html, text };
};