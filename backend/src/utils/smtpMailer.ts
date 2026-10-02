import nodemailer from 'nodemailer'

type MailerConfig = {
  host: string
  port: number
  secure: boolean
  user?: string
  pass?: string
  from: string
}

const getMailerConfig = (): MailerConfig => {
  const host = process.env.SMTP_HOST ?? ''
  const port = Number(process.env.SMTP_PORT ?? '587')
  const secure = String(process.env.SMTP_SECURE ?? '').toLowerCase() === 'true'
  const user = process.env.SMTP_USER || undefined
  const pass = process.env.SMTP_PASS || undefined
  const from = process.env.SMTP_FROM ?? ''

  if (!host || !from) {
    throw new Error('SMTP no configurado: falta SMTP_HOST o SMTP_FROM')
  }

  return { host, port, secure, user, pass, from }
}



export async function sendMail(params: { to: string; subject: string; text: string; html?: string; attachments?: any[]; }) {
  const config = getMailerConfig()
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user && config.pass ? { user: config.user, pass: config.pass } : undefined,
  })

  await transporter.sendMail({
    from: config.from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
    attachments: params.attachments,
  })
}
