export async function sendTelegramNotification(token: string, chatId: string, lead: any) {
    if (!token || !chatId) return;

    const message = `
🔔 *Lead Nou - SwissCars.md*

👤 *Nume:* ${lead.name}
📱 *Telefon:* \`${lead.phone}\`
📧 *Email:* ${lead.email || 'N/A'}
🚗 *Mașină:* ${lead.car_name || 'Inquiry General'}

💬 *Mesaj:*
${lead.message || '_Fără mesaj_'}

---
📅 _Data: ${new Date().toLocaleString('ro-RO')}_
  `.trim();

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
            }),
        });

        if (!response.ok) {
            console.error('Telegram notification error:', await response.text());
        }
    } catch (error) {
        console.error('Telegram fetch error:', error);
    }
}

export async function sendEmailNotification(to: string, lead: any) {
    // This requires the RESEND_API_KEY to be set in environment variables
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !to) return;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'SwissCars Notifications <notifications@swisscars.md>',
                to: [to],
                subject: `Lead Nou: ${lead.name} - ${lead.car_name || 'Contact'}`,
                html: `
                    <h2>Lead Nou SwissCars.md</h2>
                    <p><strong>Nume:</strong> ${lead.name}</p>
                    <p><strong>Telefon:</strong> <a href="tel:${lead.phone}">${lead.phone}</a></p>
                    <p><strong>Email:</strong> ${lead.email || 'N/A'}</p>
                    <p><strong>Mașină:</strong> ${lead.car_name || 'N/A'}</p>
                    <hr />
                    <p><strong>Mesaj:</strong></p>
                    <p>${lead.message || 'N/A'}</p>
                    <hr />
                    <p><small>Trimis la: ${new Date().toLocaleString('ro-RO')}</small></p>
                `,
            }),
        });

        if (!response.ok) {
            console.error('Resend email error:', await response.text());
        }
    } catch (error) {
        console.error('Resend fetch error:', error);
    }
}
