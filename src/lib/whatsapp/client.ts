const GRAPH_VERSION = 'v21.0';

export type WhatsAppConfig = {
  accessToken: string;
  phoneNumberId: string;
};

function getConfig(): WhatsAppConfig | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) return null;
  return { accessToken, phoneNumberId };
}

export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg) {
    console.warn('WhatsApp not configured — skipping outbound message');
    return false;
  }
  // Meta expects digits only, including country code; strip +/spaces
  const recipient = to.replace(/\D/g, '');
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${cfg.phoneNumberId}/messages`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: { preview_url: false, body: text.slice(0, 4096) },
      }),
    });
    if (!resp.ok) {
      const errBody = await resp.text();
      console.error('WhatsApp send failed:', resp.status, errBody);
      return false;
    }
    return true;
  } catch (e: any) {
    console.error('WhatsApp send threw:', e?.message ?? e);
    return false;
  }
}
