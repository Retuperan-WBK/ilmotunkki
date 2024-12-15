import type { Strapi } from "@strapi/strapi";

const cleanExpiredOrders = async () => {
  const timedLife30 = new Date();
  const timedLife60 = new Date();
  const timedLife120 = new Date();
  //const timedLife4days = new Date();
  timedLife30.setMinutes(timedLife30.getMinutes() - 30);
  timedLife60.setMinutes(timedLife60.getMinutes() - 60);
  timedLife120.setMinutes(timedLife120.getMinutes() - 120);
  //timedLife4days.setDate(timedLife4days.getDate() - 4);
  const [newOrders, pendingOrders, expiredOrders] = await Promise.all([
    strapi.query('api::order.order').deleteMany({
      where: {
        status: 'new',
        createdAt: {
          $lt: timedLife30
        }
      }
    }),
    strapi.query('api::order.order').updateMany({
      where: {
        $or: [
          {
            status: 'new'
          },
          {
            status: 'fail'
          },
          {
            status: 'pending'
          },
        ],
        updatedAt: {
          $lt: timedLife60
        }
      },
      data: {
        status: 'expired'
      }
    }),
    strapi.query('api::order.order').deleteMany({
      where: {
        status: 'expired',
        updatedAt: {
          $lt: timedLife120,
        }
      }
    })
  ]);
  return [newOrders, pendingOrders, expiredOrders];
}

const cleanOrphanItems = async () => {
  const orphanItems = await strapi.query('api::item.item').findMany({
    where: {
      order: null,
    },
  });
  if(orphanItems.length === 0) return {count: 0};
  const itemResult = await strapi.query('api::item.item').deleteMany({
    where: {
      id: {
        $in: orphanItems.map((item: {id: number}) => item.id)
      }
    }
  });
  return itemResult;
};

const cleanOrphanCustomers = async () => {
  const orphanCustomers = await strapi.query('api::customer.customer').findMany({
    where: {
      orders: {
        id: {
          $null: true
        }
      },
    }
  });
  if(orphanCustomers.length === 0) return {count: 0};
  const customerResult = await strapi.query('api::customer.customer').deleteMany({
    where: {
      id: {
        $in: orphanCustomers.map((item: {id: number}) => item.id)
      }
    }
  });
  return customerResult;
}
export default {
  '*/1 * * * *': async({ strapi}: {strapi: Strapi}) => {
    const [newOrders, pendingOrders, expiredOrders] = await cleanExpiredOrders();
    const [customerResult, itemResult] = await Promise.all([
      cleanOrphanCustomers(),
      cleanOrphanItems(),
    ]);
    if(newOrders.count > 0) {
      strapi.log.info(`[CRON] Removed ${newOrders.count} new orders`);
    }
    if(pendingOrders.count > 0) {
      strapi.log.info(`[CRON] Expired ${pendingOrders.count} pending orders`);
    }
    if(expiredOrders.count > 0) {
      strapi.log.info(`[CRON] Removed ${expiredOrders.count} expired orders`);
    }
  },
}