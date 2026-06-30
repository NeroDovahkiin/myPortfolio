import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {

  const resp = await request.json();
  const { mail, email, message } = resp;

  const { data, error } = await resend.emails.send({
    from: 'fguzzodev.com <onboarding@resend.dev>',
    to: ['federixo_fgm@hotmail.com'],
    reply_to: mail,
    subject: 'Nuevo mensaje desde fguzzodev.com',
    html: '<strong>Mail: </strong>'+mail+'<br><strong>Teléfono: </strong>'+email+'<br><strong>Mensaje: </strong>'+message+'',
  });

  if (error) {
    console.error({ error });
  }
  return new Response(JSON.stringify({
    message: "¡se envió correctamente!"
  })
  )
}

