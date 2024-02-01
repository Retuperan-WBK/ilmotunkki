import crypto from "crypto";
import { fetchAPI } from "../lib/api";
import { mappedItems, transformTranslations } from "./helpers";
import {
  Order,
  PaytrailPaymentResponse,
  SkipPaymentParams,
  Translation,
} from "./models";

type PaymentBodyItem = {
  unitPrice: number;
  units: number;
  vatPercentage: number;
  productCode: string;
};

type CallbackUrl = {
  success: string;
  cancel: string;
};

type PaymentBodyAddress = {
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
};

type PaymentBodyCustomer = {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

type PaymentBody = {
  stamp: string;
  reference: string;
  amount: number;
  currency: string;
  language: string;
  orderId?: string;
  items: PaymentBodyItem[];
  customer: PaymentBodyCustomer;
  deliveryAddress?: PaymentBodyAddress;
  redirectUrls: CallbackUrl;
  callbackUrls?: CallbackUrl;
};

const PAYTRAIL_ENDPOINT = "https://services.paytrail.com";
const URL = process.env.URL || "localhost:7800";
const MERCHANT_ID = process.env.MERCHANT_ID || "";
const SECRET_KEY = process.env.SECRET_KEY || "";
const CALLBACK_URL = process.env.CALLBACK_URL || "";

const getRandomString = (length: number = 16) =>
  crypto.randomBytes(length).toString("base64");

const calculateHmac = (
  params: Record<string, string | number>,
  body: object | undefined = undefined,
) => {
  const payload = Object.keys(params)
    .sort()
    .map((key) => [key, params[key]].join(":"))
    .concat(body ? JSON.stringify(body) : "")
    .join("\n");
  return crypto.createHmac("sha256", SECRET_KEY).update(payload).digest("hex");
};

const generatePaymentBody = (
  order: Order,
  translation: Record<string, string>,
) => {
  const locale = order.attributes.customer.data.attributes.locale;
  const callbackUrl = `${URL}/${locale}/callback`;
  const mappedCart = mappedItems(order.attributes.items.data, translation);
  const items: PaymentBodyItem[] = mappedCart
    .map((item) => {
      return {
        unitPrice: item.price * 100,
        units: item.quantity,
        vatPercentage: 0,
        productCode: item.name,
      };
    })
    .sort((a, b) => a.productCode.localeCompare(b.productCode));
  const body: PaymentBody = {
    stamp: `${order.id}${getRandomString(8)}`,
    reference: String(order.id),
    amount: items.reduce((a, b) => a + b.units * b.unitPrice, 0),
    currency: "EUR",
    language: locale.toLocaleUpperCase(),
    items,
    customer: {
      firstName: order.attributes.customer.data.attributes.firstName,
      lastName: order.attributes.customer.data.attributes.lastName,
      email: order.attributes.customer.data.attributes.email,
    },
    redirectUrls: {
      success: callbackUrl,
      cancel: callbackUrl,
    },
  };
  if (CALLBACK_URL) {
    body.callbackUrls = {
      success: CALLBACK_URL,
      cancel: CALLBACK_URL,
    };
  }
  return body;
};

const createSkipPayment = async (order: Order) => {
  const params: Record<string, string> = {
    "checkout-reference": String(order.id),
    "checkout-account": MERCHANT_ID,
    "checkout-algorithm": "sha256",
    "checkout-amount": "0",
    "checkout-status": "ok",
    "checkout-transaction-id": `skip-${Array.from(Array(20), () =>
      Math.floor(Math.random() * 36).toString(36),
    ).join("")}`,
  };
  const signature = calculateHmac(params);
  params.signature = signature;
  return { status: "skip", params } as SkipPaymentParams;
};

const createPayment = async (order: Order) => {
  const translation = await fetchAPI<Translation>(
    "/translation",
    {},
    {
      locale: order.attributes.customer.data.attributes.locale,
      populate: ["translations"],
    },
  );
  const body = generatePaymentBody(order, transformTranslations(translation));
  const headers = {
    "checkout-account": MERCHANT_ID,
    "checkout-algorithm": "sha256",
    "checkout-method": "POST",
    "checkout-nonce": getRandomString(),
    "checkout-timestamp": new Date().toISOString(),
  };
  const response = await fetch(`${PAYTRAIL_ENDPOINT}/payments`, {
    method: "POST",
    headers: {
      ...headers,
      "content-type": "application/json; charset=utf-8",
      signature: calculateHmac(headers, body),
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as PaytrailPaymentResponse;
  return data;
};

const verifyPayment = (data: Record<string, string | number>) => {
  try {
    const headers = data;
    const signature = headers["signature"];
    delete headers.signature;
    return calculateHmac(headers) === signature;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const paytrailService = {
  createPayment,
  createSkipPayment,
  calculateHmac,
  verifyPayment,
};

export default paytrailService;
