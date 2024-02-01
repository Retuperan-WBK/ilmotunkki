"use client";

import { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import Link from "next/link";
import { useTranslation } from "@/context/useTranslation";

type Props = {
  locale: string;
};
const Element = ({ locale }: Props) => {
  const { translation } = useTranslation(locale);
  const { items } = useContext(AppContext);
  return (
    <>
      {items.length > 0 && (
        <div className="h-10">
          <Link className="btn" href={`${locale}/contact`} passHref>
            {translation.next}
          </Link>
        </div>
      )}
    </>
  );
};

export default Element;
