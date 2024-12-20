"use client";

import { ChangeEvent, useState, useEffect } from 'react';
import { StrapiError } from '../lib/api';
import { useTranslation } from "@/context/useTranslation";
import { Order } from '@/utils/models';

type Props = {
  locale: string;
  order?: Order;
}
const GroupCode = ({locale, order}: Props) => {
  const { translation } = useTranslation(locale);
  const [ groupCodeError, setGroupCodeError ] = useState('');
  const [ groupCodeSuccess, setGroupCodeSuccess ] = useState('');
  const [ groupCode, setGroupCode ] = useState('');
  const [ confirmedGroupCode, setConfirmedGroupCode ] = useState(order?.attributes.group.data?.attributes.name);
  const [ groupMode, setGroupMode ] = useState<"old" | "new" | undefined>(undefined);

  useEffect(() => {
    groupCodeSuccess && setTimeout(() => setGroupCodeSuccess(''), 5000);
  }, [groupCodeSuccess]);

  useEffect(() => {
    groupCodeError && setTimeout(() => setGroupCodeError(''), 5000);
  }, [groupCodeError]);

  useEffect(() => {
    setConfirmedGroupCode(order?.attributes.group.data?.attributes.name);
  }, [order?.attributes.group.data?.attributes.name]);

  const handleFetchResponse = async (response: Response) => {
    if (!response.ok) {
      const errorData = await response.json();
      const error: StrapiError = {
        status: response.status,
        name: errorData.error || 'Error',
        message: errorData.error || 'An error occurred',
        details: errorData.details || {},
      };
      throw error;
    }
    return response.json();
  };

  const createGroupCode = async () => {
    if(!order) return;

    try {
      const res = await fetch(`/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({code: groupCode, orderUid: order.attributes.uid}),
        cache: 'no-store'
      })
      await handleFetchResponse(res);
      setGroupCodeError('');
      setGroupCodeSuccess('Ryhmäkoodi luotu onnistuneesti');
      setConfirmedGroupCode(groupCode);
    } catch(e) {
      const error = e as StrapiError;
      const { message } = error;
      if (error.status === 429) 
        return setGroupCodeError('Liian monta yritystä peräkkäin. Odota hetki');
      if (message === 'DUPLICATE') {
        return setGroupCodeError('Tämä koodi on jo olemassa, valitse toinen koodi');
      }
      setGroupCodeError('Tapahtui tuntematon virhe');
    }
  }

  const submitGroupCode = async () => {
    if(!order) return;

    try {
      const res = await fetch(`/api/groups`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({code: groupCode, orderUid: order.attributes.uid}),
        cache: 'no-store'
      })
      await handleFetchResponse(res);
      setGroupCodeError('');
      setGroupCodeSuccess('Ryhmäkoodi lisätty onnistuneesti');
      setConfirmedGroupCode(groupCode);
    } catch(e) {
      const error = e as StrapiError;
      const {message} = error;
      console.log(error);
      if (error.status === 429) 
        return setGroupCodeError('Liian monta yritystä peräkkäin. Odota hetki');
      if (message === 'NOMATCH') {
        return setGroupCodeError('Tätä ryhmäkoodia ei löytynyt');
      }
      setGroupCodeError('Tapahtui tuntematon virhe');
    }
  }

  const removeGroupCode = async () => {
    if(!order) return;

    try {
      const res = await fetch(`/api/groups?code=${confirmedGroupCode}&orderUid=${order.attributes.uid}`, {
        method: 'DELETE',
        cache: 'no-store'
      })
      await handleFetchResponse(res);
      setGroupCodeError('');
      setGroupCodeSuccess('Ryhmäkoodi poistettiin tilauksesta');
      setConfirmedGroupCode(undefined);
    } catch(e) {
      const error = e as StrapiError;
      const {message} = error;
      console.log(error);
      if (error.status === 429) 
        return setGroupCodeError('Liian monta yritystä peräkkäin. Odota hetki');
      if (message === 'NOMATCH') {
        return setGroupCodeError('Tätä ryhmäkoodia ei löytynyt');
      }
      setGroupCodeError('Tapahtui tuntematon virhe');
    }
  }

  const handleGroupCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setGroupCode(e.target.value.toUpperCase());
  }

  return(
    <div className='w-full'>
      <h3 className='text-lg text-white'>{translation.groupcode_header}</h3>
      <p className='text-secondary-500 dark:text-secondary-300 text-sm'>{translation.groupcode_desc}</p>
      <div className='mt-8 flex gap-2 w-full flex-col'>
        {confirmedGroupCode === undefined ? (
        <>
        <div className='mt-2 flex justify-between items-center md:flex-row flex-col-reverse'>
          <p className='text-white md:pt-0 pt-2'>
            {translation.groupcode_no_current}
          </p>
          <div className="flex gap-2 mt-2 text-sm sm:text-base">
            <button type='button' className={`btn ${groupMode === "old" ? "bg-primary" : "!bg-secondary-500"}`} onClick={() => setGroupMode((mode) => mode === "old" ? undefined : "old")}>{translation.add_groupcode_button}</button>
            <button type='button' className={`btn ${groupMode === "new" ? "bg-primary" : "!bg-secondary-500"}`} onClick={() => setGroupMode((mode) => mode === "new" ? undefined : "new")}>{translation.create_groupcode_button}</button>
          </div>
        </div>
        {groupMode === "old" ? (
            <div className='mt-2 flex gap-2 w-full'>
              <input
                className='tx-input !w-4/5 !text-white'
                type="text"
                value={groupCode}
                onChange={handleGroupCodeChange}
                placeholder={translation.code}
              />
              <button
                className='btn'
                type='button'
                disabled={false || groupCode.length === 0}
                onClick={() => submitGroupCode()}>
                {translation.add}
              </button>
            </div>
          ) : (
            groupMode === "new" &&
            <div className='mt-2 flex gap-2 w-full'>
              <input
                className='tx-input !w-4/5 !text-white'
                type="text"
                value={groupCode}
                onChange={handleGroupCodeChange}
                placeholder={translation.code}
              />
              <button
                className='btn'
                type='button'
                disabled={false || groupCode.length === 0}
                onClick={() => createGroupCode()}>
                {translation.create}
              </button>
            </div>)
          }</>) : (
            <div className='mt-2 justify-between items-center flex'>
              <p className='text-white'>
                {translation.current_groupcode} {confirmedGroupCode}
              </p>
              <button
                className='btn mt-2 !bg-secondary-500'
                type='button'
                onClick={() => removeGroupCode()}>
                {translation.remove_groupcode_button}
              </button>
            </div>
          )
        }
      </div>
      <p className='text-danger-400'>{groupCodeError}</p>
      <p className='text-success-400'>{groupCodeSuccess}</p>
    </div>
  )
}

export default GroupCode;