"use client";

// TODO most likely totally reduntant component and can be done with server components
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Props = {
  translation: Record<string, string>;
}
const GoBack = ({translation}: Props) => {
  const router = useRouter();
  const goBack = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    router.back();
  }
  return <Link onClick={goBack} className='underline text-primary-900 dark:text-primary-100' href="">
    {translation.back}
  </Link>
}

export default GoBack