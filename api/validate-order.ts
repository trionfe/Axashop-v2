import axios from "axios";

// Utilisation de types génériques pour éviter la dépendance @vercel/node qui bloque le build
export default async function handler(req: any, res: any) {
  const { action, orderId, email, name } = req.query;

  if (!action || !orderId || !email) {
    return res.status(400).send('Paramètres manquants');
  }

  const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";

  if (action === "accept") {
    // Mettre à jour la base de données locale
    try {
      const { updateOrderStatus } = await import("../server/db");
      await updateOrderStatus(orderId, "completed");
    } catch (dbError) {
      console.error("Erreur mise à jour DB:", dbError);
    }

    // Envoyer un message de confirmation sur Discord
    const confirmationMessage = {
      embeds: [{
        title: "✅ Commande Acceptée",
        description: `La commande **${orderId}** a été validée et acceptée par l'administrateur.`,
        color: 0x22c55e, // Vert
        fields: [
          { name: "Client", value: `${name || "N/A"}\n${email}`, inline: true },
          { name: "Statut", value: "✅ Validée", inline: true }
        ],
        footer: { text: "Axa Shop - Système de Validation" },
        timestamp: new Date().toISOString()
      }]
    };

    try {
      await axios.post(DISCORD_WEBHOOK_URL, confirmationMessage);
    } catch (e: any) {
      console.error("Erreur Discord webhook:", e.response?.data || e.message);
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Commande Acceptée</title>
        <style>
          body { font-family: Arial, sans-serif; background: #030711; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .container { text-align: center; max-width: 500px; padding: 40px; background: rgba(255,255,255,0.05); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); }
          h1 { color: #22c55e; margin-bottom: 20px; }
          p { color: #94a3b8; line-height: 1.6; }
          .order-id { color: white; font-weight: bold; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Commande Acceptée</h1>
          <p>La commande <span class="order-id">${orderId}</span> a été validée avec succès.</p>
          <p>Le client <strong>${email}</strong> recevra ses produits prochainement.</p>
        </div>
      </body>
      </html>
    `);
  } else if (action === "reject") {
    // Mettre à jour la base de données locale
    try {
      const { updateOrderStatus } = await import("../server/db");
      await updateOrderStatus(orderId, "rejected");
    } catch (dbError) {
      console.error("Erreur mise à jour DB:", dbError);
    }

    // Envoyer une notification de rejet sur Discord
    const rejectionMessage = {
      embeds: [{
        title: "❌ Commande Refusée",
        description: `La commande **${orderId}** a été refusée par l'administrateur.`,
        color: 0xef4444, // Rouge
        fields: [
          { name: "Client", value: `${name || "N/A"}\n${email}`, inline: true },
          { name: "Statut", value: "❌ Refusée", inline: true }
        ],
        footer: { text: "Axa Shop - Système de Validation" },
        timestamp: new Date().toISOString()
      }]
    };

    try {
      await axios.post(DISCORD_WEBHOOK_URL, rejectionMessage);
    } catch (e: any) {
      console.error("Erreur Discord webhook:", e.response?.data || e.message);
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Commande Refusée</title>
        <style>
          body { font-family: Arial, sans-serif; background: #030711; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .container { text-align: center; max-width: 500px; padding: 40px; background: rgba(255,255,255,0.05); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); }
          h1 { color: #ef4444; margin-bottom: 20px; }
          p { color: #94a3b8; line-height: 1.6; }
          .order-id { color: white; font-weight: bold; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Commande Refusée</h1>
          <p>La commande <span class="order-id">${orderId}</span> a été refusée.</p>
          <p>Le client <strong>${email}</strong> sera notifié du refus.</p>
        </div>
      </body>
      </html>
    `);
  }

  return res.status(400).send("Action invalide");
}
