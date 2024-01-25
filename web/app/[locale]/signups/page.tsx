import { fetchAPI } from "@/lib/api";
import GoBack from "@/components/GoBack";
import { ItemCategory, StrapiBaseType } from "@/utils/models";
import { getTranslation } from "@/utils/translationHelper";
export const dynamic = 'force-dynamic';

type Field = StrapiBaseType<{
  id: number;
  index: number;
  name: string;
  group: string;
  status: string;
}>


const getData = async () => {
  const [
    content,
    categories,
  ] = await Promise.all([
    fetchAPI<Field[]>('/orders/signups', { cache: 'no-store' }),
    fetchAPI<ItemCategory[]>('/item-categories', { cache: 'no-store' }, {
      populate: [
        'overflowItem',
        'itemTypes',
        'itemTypes.upgradeTarget',
        'itemTypes.upgradeTarget.itemCategory'
      ],
    }),
  ]);
  return {
    content,
    categories,
  }
}

type Props = {
  params: {
    locale: string
  }
}

const SignupsPage = async ({ params: { locale } }: Props) => {
  const data = await getData();
  const translation = await getTranslation(locale);
  const itemCategories = data.categories;
  const signups = data.content;
  return (
    <div className="container max-w-3xl bg-secondary-50 dark:bg-secondary-800 mx-auto rounded shadow-md p-3 sm:p-8 text-secondary-800 dark:text-secondary-100">
      <div className="flex gap-5 mb-6">
        {itemCategories?.map(category => <div key={category.id}>
          {translation[category.attributes.name]}: {category.attributes.currentQuantity}/{category.attributes.maximumItemLimit}
        </div>)}
      </div>
      <div className="flex border-b-4 border-b-secondary-200 dark:border-b-secondary-700 py-2 justify-around text-xl ">
        <div className='flex-[0.5]'>
          #
        </div>
        <div className='flex-1'>
          {translation.name}
        </div>
        <div className='flex-1'>
          {translation.group}
        </div>
      </div>
      {signups?.map(field =>
        <div
          key={field.id}
          data-verified={field.attributes.status !== 'ok'}
          className="flex border-b-2 border-b-secondary-200 dark:border-b-secondary-700 py-4 justify-around verified data-[verified=true]:opacity-8">
          <div className='flex-[0.5]'>
            {field.attributes.index}
          </div>
          <div className='flex-1'>
            <div>{field.attributes.name}</div>
            {field.attributes.status !== 'ok' &&
              <div className='text-primary-700 dark:text-primary-200'>
                {translation.unverified}
              </div>
            }
          </div>
          <div className='flex-1'>
            {field.attributes.group}
          </div>
        </div>)}
      <div className='mt-4'>
        <GoBack translation={translation} />
      </div>
    </div>
  )
}

export default SignupsPage;