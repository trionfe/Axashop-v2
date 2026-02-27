import { notifyOwner } from "../_core/notification";

/**
 * Email notification service
 * Sends notifications to the owner for important events
 */

export async function notifyNewOrder(
  orderId: number,
  customerEmail: string,
  productName: string,
  amount: number
) {
  try {
    await notifyOwner({
      title: "New Order Received",
      content: `
Order #${orderId}
Customer: ${customerEmail}
Product: ${productName}
Amount: €${amount.toFixed(2)}

Please process this order and deliver the digital product to the customer.
      `.trim(),
    });
    console.log("[Email] New order notification sent to owner");
  } catch (error) {
    console.error("[Email] Failed to send new order notification:", error);
  }
}

export async function notifyNewUser(
  userId: number,
  userName: string,
  userEmail: string
) {
  try {
    await notifyOwner({
      title: "New User Registration",
      content: `
New user registered:
ID: ${userId}
Name: ${userName}
Email: ${userEmail}

Welcome them and ensure their account is properly set up.
      `.trim(),
    });
    console.log("[Email] New user notification sent to owner");
  } catch (error) {
    console.error("[Email] Failed to send new user notification:", error);
  }
}

export async function notifyPaymentFailed(
  orderId: number,
  customerEmail: string,
  productName: string,
  reason: string
) {
  try {
    await notifyOwner({
      title: "Payment Failed",
      content: `
Order #${orderId} payment failed
Customer: ${customerEmail}
Product: ${productName}
Reason: ${reason}

Please contact the customer to resolve the payment issue.
      `.trim(),
    });
    console.log("[Email] Payment failed notification sent to owner");
  } catch (error) {
    console.error("[Email] Failed to send payment failed notification:", error);
  }
}

export async function notifySystemAlert(title: string, message: string) {
  try {
    await notifyOwner({
      title: `System Alert: ${title}`,
      content: message,
    });
    console.log("[Email] System alert notification sent to owner");
  } catch (error) {
    console.error("[Email] Failed to send system alert notification:", error);
  }
}
