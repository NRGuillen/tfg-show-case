import TelegramBot from 'node-telegram-bot-api'
import pool from './database'

const token = process.env.TELEGRAM_BOT_TOKEN

if (!token) {
  console.warn('TELEGRAM_BOT_TOKEN no configurado: bot de Telegram desactivado.')
} else {
  // Arranca sin polling para registrar handlers y luego iniciar de forma controlada.
  const bot = new TelegramBot(token, { polling: false })

  interface EstadoUsuario {
    paso: 'inicio' | 'viendo_peluquerias' | 'viendo_servicios' | 'viendo_personal' | 'esperando_fecha' | 'confirmando'
    id_peluqueria?: number
    nombre_peluqueria?: string
    id_servicio?: number
    nombre_servicio?: string
    precio_servicio?: number
    id_personal?: number
    nombre_personal?: string
    fecha_hora?: string
  }

  const estados: Record<number, EstadoUsuario> = {}

  const opcionesMenu = {
    reply_markup: {
      keyboard: [[{ text: '📅 Reservar cita' }], [{ text: '📋 Mis citas' }], [{ text: '❓ Ayuda' }]],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  }

  bot.onText(/\/start(.*)/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
    const chatId = msg.chat.id
    const parametro = match?.[1]?.trim()

    if (parametro) {
      try {
        const [rows]: any = await pool.execute(
          `SELECT id_usuario, nombre FROM usuario
           WHERE telegram_token = ? AND telegram_token_exp > NOW()`,
          [parametro]
        )

        if (rows.length === 0) {
          await bot.sendMessage(
            chatId,
            'El enlace ha expirado o no es valido. Vuelve a generarlo desde tu perfil en la web.',
            opcionesMenu
          )
        } else {
          const usuario = rows[0]
          const [vinculosPrevios]: any = await pool.execute(
            'SELECT id_usuario FROM usuario WHERE telegram_id = ? AND id_usuario <> ?',
            [chatId, usuario.id_usuario]
          )
          const idUsuarioPrevio = vinculosPrevios?.[0]?.id_usuario ? Number(vinculosPrevios[0].id_usuario) : null

          if (idUsuarioPrevio) {
            await pool.execute('UPDATE reservas_peluqueria SET id_usuario = ? WHERE id_usuario = ?', [
              usuario.id_usuario,
              idUsuarioPrevio,
            ])
            await pool.execute('UPDATE usuario SET telegram_id = NULL WHERE id_usuario = ?', [idUsuarioPrevio])
          }

          await pool.execute(
            `UPDATE usuario SET telegram_id = ?, telegram_token = NULL, telegram_token_exp = NULL
             WHERE id_usuario = ?`,
            [chatId, usuario.id_usuario]
          )
          await bot.sendMessage(chatId, `Cuenta vinculada! Hola ${usuario.nombre}, ya puedes reservar citas.`, opcionesMenu)
        }
      } catch (error) {
        console.error('Error vinculando cuenta:', error)
      }
    }

    estados[chatId] = { paso: 'inicio' }

    await bot.sendMessage(
      chatId,
      'Hola! Soy el asistente de reservas de la peluqueria.\n\nUsa el menu de abajo para navegar.',
      opcionesMenu
    )
  })

  bot.on('message', async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id
    const texto = msg.text

    if (!texto || texto.startsWith('/')) return

    const estado = estados[chatId]

    if (texto === '📅 Reservar cita') {
      try {
        const [usuario]: any = await pool.execute('SELECT id_usuario FROM usuario WHERE telegram_id = ?', [chatId])

        if (usuario.length === 0) {
          return bot.sendMessage(
            chatId,
            'No tienes cuenta vinculada. Entra en tu perfil de la web y pulsa Vincular Telegram.',
            opcionesMenu
          )
        }

        const [peluquerias]: any = await pool.execute('SELECT id_peluqueria, nombre_empresa, genero FROM peluqueria')

        if (peluquerias.length === 0) {
          return bot.sendMessage(chatId, 'No hay peluquerias disponibles.', opcionesMenu)
        }

        estados[chatId] = { paso: 'viendo_peluquerias' }

        const botones = peluquerias.map((p: any) => [
          {
            text: `💈 ${p.nombre_empresa} (${p.genero})`,
            callback_data: `peluqueria_${p.id_peluqueria}`,
          },
        ])

        await bot.sendMessage(chatId, 'Selecciona una peluqueria:', {
          reply_markup: { inline_keyboard: botones },
        })
      } catch (error) {
        console.error('Error:', error)
        bot.sendMessage(chatId, 'Error al cargar las peluquerias.', opcionesMenu)
      }
      return
    }

    if (texto === '📋 Mis citas') {
      try {
        const [usuario]: any = await pool.execute('SELECT id_usuario FROM usuario WHERE telegram_id = ?', [chatId])

        if (usuario.length === 0) {
          return bot.sendMessage(
            chatId,
            'No tienes cuenta vinculada. Entra en tu perfil de la web y pulsa Vincular Telegram.',
            opcionesMenu
          )
        }

        const [reservas]: any = await pool.execute(
          `SELECT r.fecha_reserva, r.estado, r.notas,
                  s.nombre_servicio, s.precio,
                  p.nombre_empresa,
                  u.nombre AS nombre_personal
           FROM reservas_peluqueria r
           JOIN servicios s ON r.id_servicio = s.id_servicio
           JOIN peluqueria p ON r.id_peluqueria = p.id_peluqueria
           LEFT JOIN personal pe ON r.id_personal_asignado = pe.id_personal
           LEFT JOIN usuario u ON pe.id_usuario = u.id_usuario
           WHERE r.id_usuario = ?
           ORDER BY r.fecha_reserva DESC
           LIMIT 5`,
          [usuario[0].id_usuario]
        )

        if (reservas.length === 0) {
          return bot.sendMessage(chatId, 'No tienes reservas todavia.', opcionesMenu)
        }

        const textoReservas = reservas
          .map((r: any) => {
            const fecha = new Date(r.fecha_reserva)
            const dia = String(fecha.getDate()).padStart(2, '0')
            const mes = String(fecha.getMonth() + 1).padStart(2, '0')
            const anio = fecha.getFullYear()
            const hora = String(fecha.getHours()).padStart(2, '0')
            const minutos = String(fecha.getMinutes()).padStart(2, '0')

            return (
              `💈 ${r.nombre_empresa}\n` +
              `✂️ ${r.nombre_servicio} - ${r.precio}€\n` +
              `👤 Personal: ${r.nombre_personal || 'Por asignar'}\n` +
              `📅 ${dia}/${mes}/${anio} a las ${hora}:${minutos}\n` +
              `Estado: ${r.estado}` +
              (r.notas ? `\nNotas: ${r.notas}` : '')
            )
          })
          .join('\n\n')

        await bot.sendMessage(chatId, `Tus ultimas reservas:\n\n${textoReservas}`, opcionesMenu)
      } catch (error) {
        console.error('Error:', error)
        bot.sendMessage(chatId, 'Error al cargar tus reservas.', opcionesMenu)
      }
      return
    }

    if (texto === '❓ Ayuda') {
      await bot.sendMessage(
        chatId,
        'Comandos disponibles:\n\n' +
          '📅 Reservar cita - Elige peluqueria, servicio, personal y fecha\n' +
          '📋 Mis citas - Ve tus ultimas 5 reservas\n\n' +
          'Para vincular tu cuenta entra en tu perfil de la web y pulsa Vincular Telegram.',
        opcionesMenu
      )
      return
    }

    if (estado?.paso === 'esperando_fecha') {
      if (typeof estado.id_peluqueria !== 'number' || Number.isNaN(Number(estado.id_peluqueria))) {
        estados[chatId] = { paso: 'inicio' }
        return bot.sendMessage(chatId, 'Ha ocurrido un error con la peluqueria seleccionada. Vuelve a empezar.', opcionesMenu)
      }
      const idPeluqueria = Number(estado.id_peluqueria)

      const formatoFecha = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/
      if (!formatoFecha.test(texto)) {
        return bot.sendMessage(chatId, 'Formato incorrecto. Escribe la fecha asi:\nDD/MM/AAAA HH:MM\n\nEjemplo: 25/06/2025 10:30')
      }

      const [fechaTexto, horaTexto] = texto.split(' ')
      const [dia, mes, anio] = fechaTexto.split('/').map((parte: string) => Number(parte))
      const [hora, minuto] = horaTexto.split(':').map((parte: string) => Number(parte))

      const fechaReserva = new Date(anio, mes - 1, dia, hora, minuto, 0, 0)
      const ahora = new Date()

      if (Number.isNaN(fechaReserva.getTime())) {
        return bot.sendMessage(chatId, 'Fecha no valida. Escribe la fecha asi:\nDD/MM/AAAA HH:MM\n\nEjemplo: 25/06/2025 10:30')
      }

      if (fechaReserva.getTime() <= ahora.getTime()) {
        return bot.sendMessage(chatId, 'No puedes reservar en una fecha pasada (o anterior a la hora actual). Elige otra fecha y hora.')
      }

      const fechaMySQL = `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')} ${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00`

      try {
        const tienePersonal = typeof estado.id_personal === 'number' && !Number.isNaN(Number(estado.id_personal))
        const [existente]: any = await pool.execute(
          `
            SELECT COUNT(*) AS total
            FROM reservas_peluqueria
            WHERE id_peluqueria = ?
              AND fecha_reserva = ?
              ${tienePersonal ? 'AND id_personal_asignado = ?' : ''}
          `,
          tienePersonal ? [idPeluqueria, fechaMySQL, Number(estado.id_personal)] : [idPeluqueria, fechaMySQL]
        )

        const total = Number(existente?.[0]?.total ?? 0)
        if (total > 0) {
          return bot.sendMessage(chatId, 'Esa fecha y hora ya esta reservada. Elige otra distinta.')
        }
      } catch (error) {
        console.error('Error comprobando disponibilidad:', error)
        return bot.sendMessage(chatId, 'No he podido comprobar la disponibilidad ahora mismo. Intentalo de nuevo en unos segundos.')
      }

      estados[chatId] = { ...estado, fecha_hora: texto, paso: 'confirmando' }

      await bot.sendMessage(
        chatId,
        `Resumen de tu reserva:\n\n` +
          `💈 ${estado.nombre_peluqueria}\n` +
          `✂️ ${estado.nombre_servicio}\n` +
          `👤 ${estado.nombre_personal}\n` +
          `💰 ${estado.precio_servicio}€\n` +
          `📅 ${texto}\n\n` +
          'Confirmas la reserva?',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Confirmar', callback_data: 'confirmar_cita' },
                { text: '❌ Cancelar', callback_data: 'cancelar_cita' },
              ],
            ],
          },
        }
      )
    }
  })

  bot.on('callback_query', async (query: TelegramBot.CallbackQuery) => {
    const message = query.message
    const data = query.data
    if (!message || !data) return

    const chatId = message.chat.id
    await bot.answerCallbackQuery(query.id)

    if (data.startsWith('peluqueria_')) {
      const id_peluqueria = parseInt(data.split('_')[1], 10)

      try {
        const [peluqueria]: any = await pool.execute('SELECT nombre_empresa FROM peluqueria WHERE id_peluqueria = ?', [id_peluqueria])
        const [servicios]: any = await pool.execute('SELECT id_servicio, nombre_servicio, precio FROM servicios WHERE id_peluqueria = ? and CAST(activo AS UNSIGNED) = 1', [
          id_peluqueria,
        ])

        estados[chatId] = {
          paso: 'viendo_servicios',
          id_peluqueria,
          nombre_peluqueria: peluqueria[0].nombre_empresa,
        }

        if (servicios.length === 0) {
          return bot.sendMessage(chatId, 'Esta peluqueria no tiene servicios disponibles.', opcionesMenu)
        }

        const botones = servicios.map((s: any) => [
          {
            text: `✂️ ${s.nombre_servicio} - ${s.precio}€`,
            callback_data: `servicio_${s.id_servicio}_${s.precio}`,
          },
        ])
        botones.push([{ text: '⬅️ Volver', callback_data: 'volver_peluquerias' }])

        await bot.sendMessage(chatId, `💈 ${peluqueria[0].nombre_empresa}\n\nSelecciona un servicio:`, {
          reply_markup: { inline_keyboard: botones },
        })
      } catch (error) {
        console.error('Error:', error)
      }
    } else if (data.startsWith('servicio_')) {
      const partes = data.split('_')
      const id_servicio = parseInt(partes[1], 10)
      const precio = parseFloat(partes[2])

      const [servicio]: any = await pool.execute('SELECT nombre_servicio FROM servicios WHERE id_servicio = ? and CAST(activo AS UNSIGNED) = 1', [id_servicio])

      const estado = estados[chatId]
      if (typeof estado?.id_peluqueria !== 'number' || Number.isNaN(Number(estado.id_peluqueria))) {
        estados[chatId] = { paso: 'inicio' }  
        return bot.sendMessage(chatId, 'Ha ocurrido un error con la peluqueria seleccionada. Vuelve a empezar.', opcionesMenu)
      }
      const idPeluqueria = Number(estado.id_peluqueria)

      estados[chatId] = {
        ...estado,
        paso: 'viendo_personal',
        id_servicio,
        nombre_servicio: servicio[0].nombre_servicio,
        precio_servicio: precio,
      }

      const [personal]: any = await pool.execute(
        `SELECT pe.id_personal, u.nombre, u.apellido_1, pe.tipo_personal
         FROM personal pe
         JOIN usuario u ON pe.id_usuario = u.id_usuario
         WHERE pe.id_peluqueria = ? AND pe.activo = 1`,
        [idPeluqueria]
      )

      if (personal.length === 0) {
        estados[chatId] = { ...estados[chatId], paso: 'esperando_fecha', id_personal: undefined, nombre_personal: 'Sin asignar' }
        return bot.sendMessage(
          chatId,
          'No hay personal disponible, se asignara automaticamente.\n\nEscribe la fecha y hora:\nDD/MM/AAAA HH:MM\n\nEjemplo: 25/06/2025 10:30'
        )
      }

      const botones = personal.map((p: any) => [
        {
          text: `👤 ${p.nombre} ${p.apellido_1} (${p.tipo_personal})`,
          callback_data: `personal_${p.id_personal}_${p.nombre} ${p.apellido_1}`,
        },
      ])
      botones.push([{ text: '⬅️ Volver', callback_data: `peluqueria_${idPeluqueria}` }])

      await bot.sendMessage(chatId, 'Selecciona el profesional:', { reply_markup: { inline_keyboard: botones } })
    } else if (data.startsWith('personal_')) {
      const sinPrefijo = data.replace('personal_', '')
      const guionIdx = sinPrefijo.indexOf('_')
      const id_personal = parseInt(sinPrefijo.substring(0, guionIdx), 10)
      const nombre_personal = sinPrefijo.substring(guionIdx + 1)

      estados[chatId] = {
        ...estados[chatId],
        paso: 'esperando_fecha',
        id_personal,
        nombre_personal,
      }

      await bot.sendMessage(chatId, `👤 Profesional: ${nombre_personal}\n\nEscribe la fecha y hora:\nDD/MM/AAAA HH:MM\n\nEjemplo: 25/06/2025 10:30`)
    } else if (data === 'confirmar_cita') {
      const estado = estados[chatId]
      if (!estado?.fecha_hora) return

      try {
        const [usuario]: any = await pool.execute('SELECT id_usuario FROM usuario WHERE telegram_id = ?', [chatId])
        const [fechaTexto, horaTexto] = estado.fecha_hora.split(' ')
        const [dia, mes, anio] = fechaTexto.split('/')
        const fechaMySQL = `${anio}-${mes}-${dia} ${horaTexto}:00`

        await pool.execute(
          `INSERT INTO reservas_peluqueria (id_peluqueria, id_usuario, fecha_reserva, id_servicio, id_personal_asignado, estado)
           VALUES (?, ?, ?, ?, ?, 'CONFIRMADA')`,
          [estado.id_peluqueria, usuario[0].id_usuario, fechaMySQL, estado.id_servicio, estado.id_personal || null]
        )

        await bot.sendMessage(
          chatId,
          `Reserva confirmada!\n\n` +
            `💈 ${estado.nombre_peluqueria}\n` +
            `✂️ ${estado.nombre_servicio} - ${estado.precio_servicio}€\n` +
            `👤 ${estado.nombre_personal}\n` +
            `📅 ${estado.fecha_hora}\n\nTe esperamos!`,
          opcionesMenu
        )

        estados[chatId] = { paso: 'inicio' }
      } catch (error) {
        console.error('Error guardando reserva:', error)
        bot.sendMessage(chatId, 'Error al guardar la reserva. Intentalo de nuevo.')
      }
    } else if (data === 'cancelar_cita') {
      estados[chatId] = { paso: 'inicio' }
      bot.sendMessage(chatId, 'Reserva cancelada.', opcionesMenu)
    } else if (data === 'volver_peluquerias') {
      const [peluquerias]: any = await pool.execute('SELECT id_peluqueria, nombre_empresa, genero FROM peluqueria')
      const botones = peluquerias.map((p: any) => [
        {
          text: `💈 ${p.nombre_empresa} (${p.genero})`,
          callback_data: `peluqueria_${p.id_peluqueria}`,
        },
      ])
      await bot.sendMessage(chatId, 'Selecciona una peluqueria:', { reply_markup: { inline_keyboard: botones } })
    }
  })

  let conflictAlreadyHandled = false

  bot.on('polling_error', async (err: unknown) => {
    const raw = typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err)
    const isConflict = raw.includes('409') || raw.includes('Conflict')

    if (isConflict) {
      if (conflictAlreadyHandled) return
      conflictAlreadyHandled = true

      console.error(
        'Telegram 409 Conflict: otra instancia esta usando este TELEGRAM_BOT_TOKEN. ' +
          'Deteniendo polling para evitar errores infinitos.'
      )

      try {
        await bot.stopPolling()
      } catch {
        // Ignoramos errores al detener; el objetivo es cortar el bucle de logs.
      }
      return
    }

    console.error('Telegram polling_error:', err)
  })

  void (async () => {
    try {
      await bot.deleteWebHook()
      await bot.startPolling()
      console.log('Bot @Altioram_bot arrancado y escuchando...')
    } catch (err) {
      console.error('No se pudo iniciar el bot de Telegram:', err)
    }
  })()
}
