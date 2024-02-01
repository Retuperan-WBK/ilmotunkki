import { mappedItems } from "../utils/helpers";

import { Item } from "../utils/models";

type Props = {
  items: Item[];
  locale: string;
  children?: React.ReactNode;
  translation: Record<string, string>;
};

const Order = ({ items: cartItems, children, translation }: Props) => {
  const items = mappedItems(cartItems, translation);
  const cartTotal = items.reduce(
    (acc, item) => item.quantity * item.price + acc,
    0,
  );
  return (
    <div className="text-secondary-900 dark:text-secondary-100">
      <div className="flex-[4] p-1 pl-2 font-bold border-b-2 border-b-secondary-300">
        {translation.products}
      </div>
      {items.map((item) => {
        if (!item.quantity) return null;
        return (
          <div
            className="flex border-b-2 border-b-secondary-300 py-3 px-2 gap-2 items-center"
            key={item.id}
          >
            <div className="flex-1">
              <p className="text-lg">{item.name}</p>
              <p>{item.quantity} kpl</p>
            </div>
            <p className="flex-1 text-lg">{item.quantity * item.price} €</p>
          </div>
        );
      })}

      {children && (
        <div className="flex border-b-2 border-b-secondary-300 py-3 px-2">
          {children}
        </div>
      )}
      <div className="flex pt-4">
        <div className="flex-[4]">
          <b>{translation.total}</b>
        </div>
        <div className="flex-1">
          <b>{cartTotal} €</b>
        </div>
      </div>
    </div>
  );
};

export default Order;
