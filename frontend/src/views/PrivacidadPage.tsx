import { useNavigate } from 'react-router-dom'

export default function PrivacidadPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <main className="mx-auto flex max-w-4xl flex-col gap-6 p-7 pb-24 md:px-8">
        <h1 className="text-3xl font-bold">Privacidad</h1>
        <p className="rounded-2xl border-[1.5px] border-[#727272] bg-white p-6 text-gray-700">
          1. Responsable del tratamiento. El responsable del tratamiento de los datos personales recabados a través de ALTIORAM es el equipo desarrollador del proyecto, identificado en el momento del registro de la aplicación. Para cualquier consulta relacionada con el tratamiento de tus datos puedes contactar a través de los canales habilitados en la plataforma.{'\n\n'}
          2. Datos que recogemos. ALTIORAM recaba los siguientes datos según el perfil del usuario: nombre completo, dirección de correo electrónico, número de teléfono y ubicación aproximada para todos los perfiles; DNI, CIF y nombre del negocio en el caso de usuarios Empresario; historial de citas, servicios contratados y productos adquiridos para usuarios Cliente; e identificador de cuenta de Telegram cuando el usuario vincule voluntariamente su perfil con el bot oficial.{'\n\n'}
          3. Finalidad del tratamiento. Los datos recabados se utilizan para las siguientes finalidades: gestión del registro y autenticación en la plataforma; gestión y seguimiento de reservas de citas; envío de notificaciones y recordatorios por correo electrónico y Telegram; procesamiento de compras y control de inventario; elaboración de estadísticas e informes de negocio para usuarios Empresario y Empleado; y mejora continua del servicio mediante análisis agregado y anónimo de uso.{'\n\n'}
          4. Base jurídica. El tratamiento de tus datos se fundamenta en la ejecución del contrato de prestación de servicio aceptado al registrarte en ALTIORAM, en el consentimiento explícito otorgado para comunicaciones opcionales como notificaciones por Telegram, y en el interés legítimo de ALTIORAM para el mantenimiento de la seguridad y la mejora del servicio.{'\n\n'}
          5. Conservación de los datos. Los datos se conservarán mientras la cuenta permanezca activa. Una vez solicitada la baja, los datos serán eliminados en un plazo máximo de treinta días, salvo aquellos que deban conservarse por obligación legal o para la resolución de reclamaciones pendientes. El historial de transacciones se conservará durante el período mínimo exigido por la normativa fiscal vigente.{'\n\n'}
          6. Comunicación de datos a terceros. ALTIORAM no cede ni vende datos personales a terceros con fines comerciales. Los datos podrán ser accedidos por los siguientes proveedores de servicios en calidad de encargados del tratamiento: Cloudinary para el almacenamiento de imágenes, proveedores de servicio SMTP para el envío de correos, y Telegram para la gestión del bot de notificaciones y reservas. Todos ellos operan bajo sus propias políticas de privacidad y con las garantías adecuadas conforme al RGPD.{'\n\n'}
          7. Transferencias internacionales. Algunos de los proveedores mencionados pueden estar ubicados fuera del Espacio Económico Europeo. En tales casos, ALTIORAM garantiza que dichas transferencias se realizan bajo las salvaguardas apropiadas, como cláusulas contractuales tipo aprobadas por la Comisión Europea o la existencia de una decisión de adecuación.{'\n\n'}
          8. Derechos del usuario. En cualquier momento puedes ejercer los siguientes derechos sobre tus datos personales: acceso, para conocer qué datos tratamos sobre ti; rectificación, para corregir datos inexactos o incompletos; supresión, para solicitar la eliminación de tus datos cuando ya no sean necesarios; portabilidad, para recibir tus datos en un formato estructurado y de uso común; oposición, para oponerte al tratamiento en determinadas circunstancias; y limitación del tratamiento, para solicitar la suspensión del tratamiento en los casos previstos por la ley. Para ejercer cualquiera de estos derechos, contacta a través de los canales habilitados en la plataforma. Tienes también derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).{'\n\n'}
          9. Seguridad de los datos. ALTIORAM aplica medidas técnicas y organizativas adecuadas para proteger tus datos frente a accesos no autorizados, pérdida o destrucción accidental. Entre ellas se incluyen el cifrado de contraseñas mediante bcrypt, la comunicación cifrada a través de HTTPS/TLS, la autenticación basada en tokens JWT con caducidad, y el control de acceso por rol que restringe la información visible a cada perfil de usuario.{'\n\n'}
          10. Cookies y almacenamiento local. ALTIORAM puede hacer uso de almacenamiento local del navegador para mantener la sesión activa del usuario. No se utilizan cookies de rastreo ni de publicidad. El usuario puede limpiar estos datos en cualquier momento desde la configuración de su navegador.{'\n\n'}
          11. Menores de edad. ALTIORAM no está dirigida a menores de catorce años. Si tienes constancia de que un menor ha facilitado datos personales sin consentimiento parental, contacta con nosotros para proceder a su eliminación.{'\n\n'}
          12. Cambios en la política de privacidad. ALTIORAM podrá actualizar esta política para adaptarla a cambios normativos o funcionales de la plataforma. Los cambios relevantes serán notificados mediante correo electrónico o aviso visible en la aplicación con una antelación mínima de quince días.
        </p>
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border-[1.5px] border-[#111111] px-8 py-2.5 text-sm font-bold"
          >
            Volver
          </button>
        </div>
      </main>
    </div>
  )
}
