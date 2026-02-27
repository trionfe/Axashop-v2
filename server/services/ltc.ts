import axios from 'axios';
import * as db from '../db';

const LTC_ADDRESS = process.env.LITECOIN_ADDRESS || 'LdM8wifnAMZwtMAjsq8caxrtXjYRfrf2nV';
const BLOCKCYPHER_TOKEN = process.env.BLOCKCYPHER_TOKEN || ''; // Optionnel mais recommandé pour plus de requêtes/heure

console.log(`[LTC] Service initialisé. Adresse surveillée : ${LTC_ADDRESS}`);

/**
 * Vérifie les transactions récentes sur l'adresse LTC
 * Utilise l'API gratuite de BlockCypher
 */
export async function checkLtcPayments() {
  if (!LTC_ADDRESS || LTC_ADDRESS.includes("VOTRE-ADRESSE")) {
    console.log("[LTC] Adresse non configurée, saut de la vérification.");
    return;
  }

  try {
    console.log(`[LTC] Vérification des paiements pour ${LTC_ADDRESS}...`);
    
    // Récupérer les transactions de l'adresse
    const url = `https://api.blockcypher.com/v1/ltc/main/addrs/${LTC_ADDRESS}/full?limit=50${BLOCKCYPHER_TOKEN ? `&token=${BLOCKCYPHER_TOKEN}` : ''}`;
    const response = await axios.get(url);
    const txs = response.data.txs || [];

    // Récupérer les commandes en attente (LTC)
    const allOrders = await db.getAllOrders();
    const pendingLtcOrders = allOrders.filter((o: any) => o.status === 'pending' && o.method === 'ltc');

    for (const order of pendingLtcOrders) {
      // Le montant attendu est stocké dans order.total (ex: "0.001234 LTC")
      const expectedAmountLtc = parseFloat(order.total.split(' ')[0]);
      
      // Chercher une transaction correspondante
      // On cherche une transaction reçue après la création de la commande
      const orderTime = new Date(order.createdAt).getTime();
      
      const matchingTx = txs.find((tx: any) => {
        const txTime = new Date(tx.received).getTime();
        if (txTime < orderTime - 60000) return false; // Ignorer les transactions avant la commande (-1min marge)

        // Vérifier si l'un des outputs correspond à notre adresse et au montant
        return tx.outputs.some((out: any) => {
          const isOurAddr = out.addresses && out.addresses.includes(LTC_ADDRESS);
          const amountSatoshi = out.value;
          const amountLtc = amountSatoshi / 100000000;
          
          // Marge d'erreur minime pour les arrondis
          return isOurAddr && Math.abs(amountLtc - expectedAmountLtc) < 0.000001;
        });
      });

      if (matchingTx) {
        console.log(`[LTC] Paiement trouvé pour la commande ${order.id} ! TX: ${matchingTx.hash}`);
        
        // Valider la commande
        await db.updateOrderStatus(order.id, 'completed', {
          text: "Paiement LTC vérifié automatiquement sur la blockchain."
        });

        // Notifier via Discord (optionnel, mais bien pour le suivi)
        const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
        if (DISCORD_WEBHOOK_URL) {
          await axios.post(DISCORD_WEBHOOK_URL, {
            embeds: [{
              title: "✅ Paiement LTC Automatique",
              description: `La commande **${order.id}** a été validée automatiquement.`,
              color: 0x34d399,
              fields: [
                { name: "Montant", value: order.total, inline: true },
                { name: "Transaction", value: `[Voir sur l'explorateur](https://live.blockcypher.com/ltc/tx/${matchingTx.hash}/)`, inline: false }
              ],
              timestamp: new Date().toISOString()
            }]
          });
        }
      }
    }
  } catch (error: any) {
    console.error("[LTC] Erreur lors de la vérification:", error.response?.data || error.message);
  }
}
