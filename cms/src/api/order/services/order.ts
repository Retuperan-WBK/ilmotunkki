/**
 * order service.
 */

import { factories } from '@strapi/strapi';
import { createAdminOrder } from '../../../utils/admin-order';

export default factories.createCoreService('api::order.order', ({ strapi }) => ({
  createAdmin(data: unknown) {
    return createAdminOrder(strapi, data);
  },
}));
