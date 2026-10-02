import { useNavigate } from 'react-router-dom'

export default function TerminosCondicionesPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <main className="mx-auto flex max-w-4xl flex-col gap-6 p-7 pb-24 md:px-8">
        <h1 className="text-3xl font-bold">Términos y condiciones</h1>
        <p className="rounded-2xl border-[1.5px] border-[#727272] bg-white p-6 text-gray-700">
          1. Aceptación del servicio. El acceso y uso de ALTIORAM implica la aceptación plena de los presentes términos. Si no estás de acuerdo con alguno de ellos, debes abstenerte de utilizar la plataforma. ALTIORAM se reserva el derecho de modificar estos términos en cualquier momento, notificando los cambios mediante correo electrónico o aviso visible en la aplicación.
          2. Descripción del servicio. ALTIORAM es una plataforma digital de gestión para negocios de peluquería que permite a los usuarios registrar cuentas, reservar citas, adquirir productos, seguir negocios y recibir notificaciones mediante correo electrónico y el bot oficial de Telegram. El servicio distingue cuatro perfiles de usuario —Administrador, Empresario, Empleado y Cliente—, cada uno con funcionalidades y responsabilidades diferenciadas.
          3. Registro y veracidad de datos. Para acceder a la plataforma es obligatorio registrarse proporcionando información veraz, completa y actualizada. Los usuarios Empresario deberán facilitar nombre completo del titular o representante, DNI, CIF de la empresa y nombre del negocio. ALTIORAM podrá suspender o eliminar cuentas en las que se detecten datos falsos o incorrectos.
          4. Responsabilidad del usuario. Cada usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las acciones realizadas bajo su cuenta. Queda prohibido el uso de la plataforma para fines ilícitos, fraudulentos o contrarios a la buena fe, así como cualquier acción que interfiera con el correcto funcionamiento del sistema o perjudique a terceros.
          5. Reservas y política de ausencias. El incumplimiento reiterado de reservas confirmadas —definido como tres ausencias sin cancelación previa— conllevará el bloqueo automático de la capacidad de reservar durante un período de treinta días naturales. Para restablecer el acceso anticipadamente, el usuario podrá abonar una compensación de 5 €, de la cual 3 € corresponderán al negocio afectado y 2 € a ALTIORAM en concepto de gestión.
          6. Compras y pagos. Las transacciones realizadas a través del módulo de compra son simuladas en el entorno de demostración de la plataforma. En caso de activación de pagos reales, se aplicarán las condiciones específicas del proveedor de pagos integrado. ALTIORAM no almacena datos de tarjetas bancarias.
          7. Contenido publicado por usuarios. Los usuarios que publiquen fotografías u otro contenido en la plataforma declaran ser titulares de los derechos necesarios o contar con las autorizaciones pertinentes. ALTIORAM no se hace responsable del contenido generado por usuarios, aunque se reserva el derecho de retirar cualquier publicación que infrinja derechos de terceros, sea contraria a la legalidad vigente o resulte inapropiada para la comunidad.
          8. Protección de datos personales. El tratamiento de los datos personales se realiza conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales. Los datos recabados se utilizan exclusivamente para la prestación del servicio, la gestión de reservas, el envío de comunicaciones relacionadas con la cuenta y la elaboración de estadísticas anónimas de uso. El usuario puede ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición contactando con el equipo a través de los canales habilitados en la plataforma.
          9. Integraciones de terceros. ALTIORAM se integra con servicios externos como Cloudinary para el almacenamiento de imágenes, Nodemailer para el envío de correos y la API de Telegram para notificaciones y reservas por chat. El uso de estas funcionalidades está sujeto también a las condiciones de uso de cada proveedor, sobre cuyo funcionamiento ALTIORAM no asume responsabilidad directa.
          10. Disponibilidad y mantenimiento. ALTIORAM no garantiza la disponibilidad ininterrumpida del servicio y podrá realizar interrupciones programadas por razones de mantenimiento, actualizaciones o mejoras, procurando comunicarlo con antelación razonable. Tampoco responde de los daños derivados de fallos en la conexión a internet, en la base de datos o en servicios de terceros ajenos a su control directo.
          11. Limitación de responsabilidad. En la medida máxima permitida por la ley aplicable, ALTIORAM no será responsable de daños indirectos, pérdida de negocio, lucro cesante ni cualquier otro perjuicio derivado del uso o la imposibilidad de uso de la plataforma.
          12. Legislación aplicable. Los presentes términos se rigen por la legislación española. Para la resolución de cualquier controversia derivada de su interpretación o aplicación, las partes se someten a los juzgados y tribunales competentes según la normativa vigente.
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
