import axios from 'axios';
import * as db from '../db';

/**
 * Service de vérification PayPal via IPN (Instant Payment Notification)
 * C'est la méthode gratuite la plus fiable pour les comptes personnels/business.
 */

export async function verifyPaypalIPN(params: any) {
  try {
    console.log("[PayPal IPN] Réception d'une notification...");

    // 1. Valider la notification auprès de PayPal
    // On doit renvoyer tous les paramètres reçus avec "cmd=_notify-validate"
    const verificationParams = new URLSearchParams(params);
    verificationParams.set('cmd', '_notify-validate');

    const paypalUrl = params.test_ipn === '1' 
      ? 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr'
      : 'https://ipnpb.paypal.com/cgi-bin/webscr';

    const verifyRes = await axios.post(paypalUrl, verificationParams.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (verifyRes.data !== 'VERIFIED') {
      console.error("[PayPal IPN] Échec de la vérification (INVALID)");
      return false;
    }

    // 2. Extraire les infos utiles
    const {
      payment_status,
      receiver_email,
      mc_gross,
      mc_currency,
      custom, // On utilise souvent 'custom' pour passer l'ID de commande
      txn_id
    } = params;

    // 3. Vérifications de sécurité
    if (payment_status !== 'Completed') {
      console.log(`[PayPal IPN] Paiement non complété: ${payment_status}`);
      return false;
    }

    // Vérifier que l'email du receveur est bien le nôtre
    const MY_PAYPAL_EMAIL = process.env.PAYPAL_EMAIL || "gerarbarbier17@gmail.com";
    if (receiver_email.toLowerCase() !== MY_PAYPAL_EMAIL.toLowerCase()) {
      console.error(`[PayPal IPN] Email receveur incorrect: ${receiver_email}`);
      return false;
    }

    // 4. Trouver la commande correspondante
    // On cherche par l'ID passé dans 'custom' ou en cherchant une commande en attente avec ce montant
    let order = null;
    if (custom) {
      const allOrders = await db.getAllOrders();
      order = allOrders.find((o: any) => o.id === custom || o.orderId === custom);
    }

    if (!order) {
      // Recherche alternative par montant et email si 'custom' est vide
      const allOrders = await db.getAllOrders();
      order = allOrders.find((o: any) => 
        o.status === 'pending' && 
        o.method === 'paypal' &&
        parseFloat(o.total.replace('€', '').replace('$', '')) === parseFloat(mc_gross)
      );
    }

    if (order) {
      console.log(`[PayPal IPN] Commande ${order.id} validée via PayPal ! TXN: ${txn_id}`);
      
      await db.updateOrderStatus(order.id, 'completed', {
        text: `Paiement PayPal vérifié automatiquement. Transaction ID: ${txn_id}`
      });

      // Notifier Discord
      const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
      if (DISCORD_WEBHOOK_URL) {
        await axios.post(DISCORD_WEBHOOK_URL, {
          embeds: [{
            title: "✅ Paiement PayPal Automatique",
            description: `La commande **${order.id}** a été validée automatiquement.`,
            color: 0x0070ba,
            fields: [
              { name: "Montant", value: `${mc_gross} ${mc_currency}`, inline: true },
              { name: "Transaction ID", value: txn_id, inline: true }
            ],
            timestamp: new Date().toISOString()
          }]
        });
      }
      return true;
    } else {
      console.error("[PayPal IPN] Aucune commande correspondante trouvée pour ce paiement.");
      return false;
    }
  } catch (error: any) {
    console.error("[PayPal IPN] Erreur critique:", error.message);
    return false;
  }
}
