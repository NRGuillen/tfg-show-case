export function resetPasswordTemplate(params: { nombre?: string; resetUrl: string }) {
  const nombre = params.nombre?.trim() || 'Hola'
  const resetUrl = params.resetUrl

  const subject = 'Recuperacion de contrasena'

  const text =
    `${nombre},\n\n` +
    `Hemos recibido una solicitud para restablecer tu contrasena.\n` +
    `Abre este enlace para continuar:\n\n` +
    `${resetUrl}\n\n` +
    `Si no has solicitado este cambio, puedes ignorar este correo.\n`

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#0d0d0f;color:#111;">
    <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
        <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
          <div style="font-weight:900;letter-spacing:-0.02em;color:#6d28d9;font-size:20px;">ALTIORAM</div>
        </div>
        <div style="padding:24px;">
          <h1 style="margin:0 0 10px 0;font-size:20px;line-height:1.2;color:#111111;">Restablecer contrasena</h1>
          <p style="margin:0 0 16px 0;color:#374151;line-height:1.5;">
            ${nombre}, hemos recibido una solicitud para restablecer tu contrasena.
          </p>
          <p style="margin:0 0 18px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:#6d28d9;color:#fff;text-decoration:none;padding:12px 16px;border-radius:999px;font-weight:700;">
              Crear nueva contrasena
            </a>
          </p>
          <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">
            Si no solicitaste este cambio, ignora este correo.
          </p>
          <p style="margin:18px 0 0 0;color:#6b7280;font-size:12px;word-break:break-all;">
            Enlace directo: <a href="${resetUrl}" style="color:#6d28d9;text-decoration:none;">${resetUrl}</a>
          </p>
        </div>
      </div>
      <p style="margin:12px 0 0 0;color:#9ca3af;font-size:11px;text-align:center;">
        © ${new Date().getFullYear()} ALTIORAM
      </p>
    </div>
  </body>
</html>`

  return { subject, text, html }
}
