export type StrapiResponse<T> = {
  data: T;
};
export type StrapiBaseType<T> = {
  id: number;
  attributes: T & {
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
};

type ImageFields = {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: null;
  size: number;
  width: number;
  height: number;
};

export type StrapiImage = StrapiBaseType<
  {
    alternativeText: string | null;
    caption: string | null;
    formats?: {
      large: ImageFields;
      medium: ImageFields;
      small: ImageFields;
      thumbnail: ImageFields;
    };
    previewUrl: string | null;
    provider: string;
    provider_metadata: string;
  } & ImageFields
>;

export type ItemCategory = StrapiBaseType<{
  orderItemLimit: number;
  maximumItemLimit: number;
  name: string;
  itemTypes: StrapiResponse<ItemType[]>;
  currentQuantity: number;
  overflowItem: StrapiResponse<ItemType | null>;
}>;

export type ItemType = StrapiBaseType<{
  price: number;
  availableFrom: string;
  availableTo: string;
  itemCategory: StrapiResponse<ItemCategory>;
  upgradeTarget: StrapiResponse<ItemType | null>;
  slug: string;
}>;

export type Item = StrapiBaseType<{
  itemType: StrapiResponse<ItemType>;
  order: StrapiResponse<Order>;
  giftCard: StrapiResponse<GiftCard | null>;
}>;

export type Translation = StrapiBaseType<{
  translations: {
    key: string;
    value: string;
  }[];
}>;

export type GiftCard = StrapiBaseType<{
  code: string;
}>;

export type CallbackPageFields = StrapiBaseType<{
  onSuccess: string;
  onCancel: string;
  onError: string;
}>;

export type Field = {
  id: number;
  label: string;
  type: "text" | "checkbox" | "email" | "number";
  required: boolean;
  fieldName: string;
};

export type Group = StrapiBaseType<{
  name: string;
}>;

export type ContactForm = StrapiBaseType<{
  contactForm: Field[];
  itemTypes: StrapiResponse<ItemType[]>;
}>;

export type Order = StrapiBaseType<{
  status: "new" | "ok" | "fail" | "pending" | "admin-new";
  transactionId?: string;
  createdAt: string;
  items: StrapiResponse<Item[]>;
  customer: StrapiResponse<Customer>;
  uid: string;
}>;

export type Customer = StrapiBaseType<{
  firstName: string;
  lastName: string;
  email: string;
  uid: string;
  locale: string;
  [key: string]: string | number | boolean;
}>;

type PaymentMethodGroup = "mobile" | "bank" | "creditcard" | "credit";

type PaytrailFormField = {
  name: string;
  value: string;
};
export type Provider = {
  id: string;
  name: string;
  icon: string;
  svg: string;
  url: string;
  group: PaymentMethodGroup;
  parameters: PaytrailFormField[];
};

export type SkipPaymentParams = {
  status: string;
  params: Record<string, string>;
};

export type PaytrailPaymentResponse = {
  transactionId: string;
  href: string;
  terms: string;
  groups: PaymentMethodGroup[]; // Adjusted based on the new definition
  reference: string;
  providers: Provider[];
};

export type PaymentApiResponse = SkipPaymentParams | PaytrailPaymentResponse;
