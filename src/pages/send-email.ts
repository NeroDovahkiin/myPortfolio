import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend('re_6taPpr2J_BDZLucZqwQ3DTQiyFQxYvJ22');

export const POST: APIRoute = async ({ request }) => {

  const resp = await request.json();
  const { name, email, message } = resp;
  console.log(name, email, message)


  const { data, error } = await resend.emails.send({
    from: 'fguzzodev.com <onboarding@resend.dev>',
    to: ['federixo_fgm@hotmail.com'],
    subject: 'Nevo mensaje desde fguzzodev.com',
    html: '<strong>'+name+'</strong>, <strong>'+email+'</strong>, <strong>'+message+'</strong>',
  });

  if (error) {
    console.error({ error });
  }

  console.log({ data });




  return new Response(JSON.stringify({
    message: "¡se envió correctamente!"
  })
  )
}

