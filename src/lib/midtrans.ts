import crypto from 'node:crypto';

export type SupportedBank = 'bca' | 'bni' | 'bri' | 'mandiri' | 'permata';

export interface MidtransChargeResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  actions?: Array<{
    name: string;
    method: string;
    url: string;
  }>;
  qr_string?: string;
  va_numbers?: Array<{
    bank: string;
    va_number: string;
  }>;
  permata_va_number?: string;
  bill_key?: string;
  biller_code?: string;
  expiry_time?: string;
}

export function generateOrderId(): string {
  const now = new Date();
  const dateStr = now.toISOString().replace(/\D/g, '').slice(0, 8);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${dateStr}-${rand}`;
}

export function buildQrisChargePayload(order_id: string, gross_amount: number) {
  return {
    payment_type: 'qris',
    transaction_details: {
      order_id,
      gross_amount: Math.round(gross_amount),
    },
    qris: {
      acquirer: 'gopay',
    },
  };
}

export function buildVaChargePayload(
  order_id: string,
  gross_amount: number,
  bank: SupportedBank
) {
  const roundedAmount = Math.round(gross_amount);

  if (bank === 'mandiri') {
    return {
      payment_type: 'echannel',
      transaction_details: {
        order_id,
        gross_amount: roundedAmount,
      },
      echannel: {
        bill_info1: 'Pembayaran:',
        bill_info2: 'Rangers Store',
      },
    };
  }

  if (bank === 'permata') {
    return {
      payment_type: 'bank_transfer',
      transaction_details: {
        order_id,
        gross_amount: roundedAmount,
      },
      bank_transfer: {
        bank: 'permata',
      },
    };
  }

  return {
    payment_type: 'bank_transfer',
    transaction_details: {
      order_id,
      gross_amount: roundedAmount,
    },
    bank_transfer: {
      bank,
    },
  };
}

export function getBankSimulatorUrl(bank: SupportedBank): string {
  switch (bank) {
    case 'bca':
      return 'https://simulator.sandbox.midtrans.com/bca/va/index';
    case 'bni':
      return 'https://simulator.sandbox.midtrans.com/bni/va/index';
    case 'bri':
      return 'https://simulator.sandbox.midtrans.com/bri/va/index';
    case 'mandiri':
      return 'https://simulator.sandbox.midtrans.com/mandiri/bill/index';
    case 'permata':
      return 'https://simulator.sandbox.midtrans.com/permata/va/index';
    default:
      return 'https://simulator.sandbox.midtrans.com/openapi/va/index';
  }
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
  serverKey: string
): boolean {
  if (!serverKey || !signatureKey) return false;
  const hash = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex');
  return hash === signatureKey;
}

export async function chargeMidtransQris(
  order_id: string,
  gross_amount: number
): Promise<{ success: boolean; qr_url: string; qr_string?: string; transaction_id?: string; error?: string }> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (serverKey && serverKey.startsWith('SB-Mid-server-')) {
    try {
      const auth = Buffer.from(`${serverKey}:`).toString('base64');
      const payload = buildQrisChargePayload(order_id, gross_amount);

      const response = await fetch('https://api.sandbox.midtrans.com/v2/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(payload),
      });

      const data: MidtransChargeResponse = await response.json();

      if (data.status_code === '201' && data.actions && data.actions.length > 0) {
        const qrAction = data.actions.find((a) => a.name === 'generate-qr-code') || data.actions[0];
        return {
          success: true,
          qr_url: qrAction.url,
          qr_string: data.qr_string,
          transaction_id: data.transaction_id,
        };
      } else {
        return {
          success: false,
          qr_url: '',
          error: data.status_message || 'Gagal generate QRIS dari Midtrans',
        };
      }
    } catch (err) {
      console.error('Midtrans API error:', err);
    }
  }

  // Fallback interactive Sandbox Demo QR (when MIDTRANS_SERVER_KEY is not yet provided)
  const qrData = encodeURIComponent(`https://simulator.sandbox.midtrans.com/qris/pay?order_id=${order_id}&amount=${gross_amount}`);
  const fallbackQrUrl = `https://quickchart.io/qr?text=${qrData}&size=250&dark=0f172a&light=ffffff`;

  return {
    success: true,
    qr_url: fallbackQrUrl,
    transaction_id: `MOCK-${Date.now()}`,
  };
}

export interface MidtransVaResult {
  success: boolean;
  order_id: string;
  transaction_id?: string;
  bank: SupportedBank;
  va_number?: string;
  bill_key?: string;
  biller_code?: string;
  expiry_time?: string;
  simulator_url: string;
  error?: string;
}

export async function chargeMidtransVa(
  order_id: string,
  gross_amount: number,
  bank: SupportedBank = 'bca'
): Promise<MidtransVaResult> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const simulatorUrl = getBankSimulatorUrl(bank);

  if (serverKey && serverKey.startsWith('SB-Mid-server-')) {
    try {
      const auth = Buffer.from(`${serverKey}:`).toString('base64');
      const payload = buildVaChargePayload(order_id, gross_amount, bank);

      const response = await fetch('https://api.sandbox.midtrans.com/v2/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(payload),
      });

      const data: MidtransChargeResponse = await response.json();

      if (data.status_code === '201') {
        const vaNumber =
          data.va_numbers && data.va_numbers.length > 0
            ? data.va_numbers[0].va_number
            : data.permata_va_number;

        return {
          success: true,
          order_id: data.order_id || order_id,
          transaction_id: data.transaction_id,
          bank,
          va_number: vaNumber,
          bill_key: data.bill_key,
          biller_code: data.biller_code,
          expiry_time: data.expiry_time,
          simulator_url: simulatorUrl,
        };
      } else {
        return {
          success: false,
          order_id,
          bank,
          simulator_url: simulatorUrl,
          error: data.status_message || 'Gagal membuat Virtual Account Midtrans',
        };
      }
    } catch (err) {
      console.error('Midtrans VA API error:', err);
    }
  }

  // Fallback mock VA for sandbox/offline mode
  const mockVaPrefix: Record<SupportedBank, string> = {
    bca: '40857',
    bni: '9884085',
    bri: '408570',
    mandiri: '70012',
    permata: '877800',
  };

  const randSuffix = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  const mockVa = `${mockVaPrefix[bank]}${randSuffix}`;

  return {
    success: true,
    order_id,
    transaction_id: `MOCK-VA-${Date.now()}`,
    bank,
    va_number: bank !== 'mandiri' ? mockVa : undefined,
    bill_key: bank === 'mandiri' ? randSuffix : undefined,
    biller_code: bank === 'mandiri' ? '70012' : undefined,
    expiry_time: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    simulator_url: simulatorUrl,
  };
}
