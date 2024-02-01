import { ContactForm, Field, Item, Translation, Order } from "./models";
import { fetchAPI } from "@/lib/api";
import { serverFetchAPI } from "@/lib/serverApi";
import paytrailService from "@/utils/paytrail";

type AggrecatedItem = {
  id: number;
  price: number;
  quantity: number;
  name: string;
};

export const mappedItems = (
  items: Item[],
  translation: Record<string, string>,
) =>
  items.reduce((acc, item) => {
    const hasGiftCard = item.attributes.giftCard.data ? true : false;
    const itemTypeId = item.attributes.itemType.data.id;
    const existingItem = acc.find(
      (existingItem) => itemTypeId === existingItem.id,
    );
    if (!existingItem) {
      const newItem = hasGiftCard
        ? {
            id: itemTypeId + 1000,
            price: 0,
            quantity: 1,
            name: `${
              translation[item.attributes.itemType.data.attributes.slug]
            }-0`,
          }
        : {
            id: itemTypeId,
            price: item.attributes.itemType.data.attributes.price,
            quantity: 1,
            name: translation[item.attributes.itemType.data.attributes.slug],
          };
      return [...acc, newItem];
    }
    existingItem.quantity += 1;
    return acc;
  }, [] as AggrecatedItem[]);

export const transformTranslations = (t: Translation): Record<string, string> =>
  t.attributes.translations.reduce(
    (acc, row) => {
      const { key, value } = row;
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

export const getContactForm = (
  forms: ContactForm[],
  items: Item[],
): Field[] => {
  const fields: Field[] = forms.reduce((acc, form) => {
    const include = form.attributes.itemTypes.data.some((itemType) => {
      return items.some(
        (item) => item.attributes.itemType.data.id === itemType.id,
      );
    });
    if (!include) return acc;
    const newFields = form.attributes.contactForm.filter(
      (field) =>
        !acc.some(
          (existingField) => existingField.fieldName === field.fieldName,
        ),
    );
    return [...acc, ...newFields];
  }, [] as Field[]);

  return fields;
};

export const updateOrderState = async (
  orderId: number,
  status: string,
  transactionId?: string,
) => {
  return serverFetchAPI<Order>(`/orders/${orderId}`, {
    method: "PUT",
    body: JSON.stringify({
      data: {
        status,
        transactionId,
      },
    }),
  });
};

export const createPayment = async (orderId: number) => {
  try {
    const order = await serverFetchAPI<Order>(
      `/orders/${orderId}`,
      {},
      {
        populate: [
          "customer",
          "items",
          "items.itemType",
          "items.itemType.itemCategory",
          "items.giftCard",
        ],
      },
    );
    if (!order) throw new Error("No Order");
    const translation = await fetchAPI<Translation>(
      "/translation",
      {},
      {
        locale: order.attributes.customer.data.attributes.locale,
        populate: ["translations"],
      },
    );
    const mappedCart = mappedItems(
      order.attributes.items.data,
      transformTranslations(translation),
    );
    const total = mappedCart.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    await updateOrderState(order.id, "pending");
    if (total === 0) return paytrailService.createSkipPayment(order);
    return paytrailService.createPayment(order);
  } catch (error) {
    console.error("Error in creating payment", error);
    return undefined;
  }
};
