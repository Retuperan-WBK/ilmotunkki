import { fetcher } from "@/utils/clientHelper";
import useSWR from "swr";



export const useTranslation = (locale: string) => {
  const { data, error } = useSWR<Record<string, string>>(`/api/translation/${locale}`, fetcher);
  return {
    translation: data || {},
    error: error
  }
}