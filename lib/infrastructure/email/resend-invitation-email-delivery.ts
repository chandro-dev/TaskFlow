import type {
  InvitationEmailDelivery,
  InvitationEmailPayload,
} from "@/lib/domain/invitation-email-delivery";

function resolveAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export class ResendInvitationEmailDelivery implements InvitationEmailDelivery {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(payload: InvitationEmailPayload) {
    const inviteUrl = `${resolveAppUrl()}/invitations/${payload.invitation.token}`;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [payload.invitation.email],
        subject: `Invitacion a ${payload.projectName} en Taskflow`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#122033">
            <h2>Invitacion a ${payload.projectName}</h2>
            <p>${payload.inviterName} te ha invitado a colaborar en Taskflow.</p>
            ${
              payload.invitation.message
                ? `<p><strong>Mensaje:</strong> ${payload.invitation.message}</p>`
                : ""
            }
            <p>
              <a href="${inviteUrl}" style="display:inline-block;padding:12px 18px;background:#234879;color:#fff;border-radius:10px;text-decoration:none">
                Abrir invitacion
              </a>
            </p>
            <p>Si el boton no funciona, usa este enlace:</p>
            <p><a href="${inviteUrl}">${inviteUrl}</a></p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const payloadText = await response.text().catch(() => "");
      throw new Error(
        `No fue posible enviar el correo de invitacion: ${payloadText || response.statusText}`,
      );
    }
  }
}
