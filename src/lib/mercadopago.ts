import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

export function getMercadoPagoClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return null;
  }
  return new MercadoPagoConfig({
    accessToken,
    options: { timeout: 10000 },
  });
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

export interface CreatePreferenceParams {
  orderNumber: string;
  eventName: string;
  items: Array<{
    id: string;
    title: string;
    description?: string;
    quantity: number;
    unit_price: number;
  }>;
  buyer: {
    name: string;
    lastName: string;
    email: string;
    phone?: string;
    dni: string;
  };
  origin: string;
}

export async function createMercadoPagoPreference(params: CreatePreferenceParams) {
  const client = getMercadoPagoClient();
  if (!client) {
    throw new Error("MERCADOPAGO_NOT_CONFIGURED");
  }

  const preference = new Preference(client);

  // Expiración en 30 minutos
  const expirationDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const response = await preference.create({
    body: {
      items: params.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description || `Entrada para ${params.eventName}`,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: "ARS",
      })),
      payer: {
        name: params.buyer.name,
        surname: params.buyer.lastName,
        email: params.buyer.email,
        phone: params.buyer.phone
          ? {
              number: params.buyer.phone,
            }
          : undefined,
        identification: {
          type: "DNI",
          number: params.buyer.dni,
        },
      },
      external_reference: params.orderNumber,
      back_urls: {
        success: `${params.origin}/checkout/mp-return?orderNumber=${params.orderNumber}&status=success`,
        failure: `${params.origin}/checkout/mp-return?orderNumber=${params.orderNumber}&status=failure`,
        pending: `${params.origin}/checkout/mp-return?orderNumber=${params.orderNumber}&status=pending`,
      },
      auto_return: "approved",
      notification_url: `${params.origin}/api/mercadopago/webhook`,
      expires: true,
      expiration_date_to: expirationDate,
      statement_descriptor: "PANDA ACCESS",
    },
  });

  return {
    id: response.id,
    initPoint: response.init_point,
    sandboxInitPoint: response.sandbox_init_point,
  };
}

export async function getPaymentInfo(paymentId: string | number) {
  const client = getMercadoPagoClient();
  if (!client) {
    throw new Error("MERCADOPAGO_NOT_CONFIGURED");
  }

  const payment = new Payment(client);
  const data = await payment.get({ id: paymentId });
  return data;
}
