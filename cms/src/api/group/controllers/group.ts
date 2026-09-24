// src/api/group/controllers/group-custom.js

import { factories } from '@strapi/strapi';

// Group codes may only contain numbers and letters from the Finnish/Swedish alphabet.
const GROUP_CODE_PATTERN = /^[A-ZÅÄÖ0-9]+$/;

const normalizeGroupCode = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!GROUP_CODE_PATTERN.test(normalized)) return null;
  return normalized;
};

export default factories.createCoreController('api::group.group', ({ strapi }) => ({
  async createNew(ctx) {
    const code = normalizeGroupCode(ctx.request.body?.code);
    const { orderUid } = ctx.request.body;

    if (!code) {
      return ctx.badRequest('INVALID');
    }

    // Check if the group code already exists
    const existingGroup = await strapi.db.query('api::group.group').findOne({ where: { name: code } });
    if (existingGroup) {
      return ctx.badRequest('DUPLICATE');
    }

    // Find the order by uid
    const order = await strapi.db.query('api::order.order').findOne({ where: { uid: orderUid } });
    if (!order) {
      return ctx.badRequest('Order not found');
    }

    // Create a new group with the provided code and order ID
    const newGroup = await strapi.db.query('api::group.group').create({
      data: {
        name: code,
        orders: [order.id],
      },
    });

    ctx.send(newGroup);
  },

  async addToOrder(ctx) {
    const code = normalizeGroupCode(ctx.request.body?.code);
    const { orderUid } = ctx.request.body;

    if (!code) {
      return ctx.badRequest('INVALID');
    }

    // Find the group by code
    const group = await strapi.db.query('api::group.group').findOne({
      where: { name: code },
      populate: { orders: true },
    });
    if (!group) {
      return ctx.badRequest('NOMATCH');
    }

    // Find the order by uid
    const order = await strapi.db.query('api::order.order').findOne({ where: { uid: orderUid } });
    if (!order) {
      return ctx.badRequest('Order not found');
    }

    // Add the order ID to the group's orders
    const updatedGroup = await strapi.db.query('api::group.group').update({
      where: { id: group.id },
      data: {
        orders: [...group.orders.map(order => order.id), order.id],
      },
    });

    ctx.send(updatedGroup);
  },

  async removeFromOrder(ctx) {
    const { code, orderUid } = ctx.query; // Read from query parameters

    // Find the group by code
    const group = await strapi.db.query('api::group.group').findOne({
      where: { name: code },
      populate: { orders: true },
    });
    if (!group) {
      return ctx.badRequest('NOMATCH');
    }

    // Find the order by uid
    const order = await strapi.db.query('api::order.order').findOne({ where: { uid: orderUid } });
    if (!order) {
      return ctx.badRequest('Order not found');
    }

    // Remove the order ID from the group's orders
    const updatedGroup = await strapi.db.query('api::group.group').update({
      where: { id: group.id },
      data: {
        orders: group.orders.map(order => order.id).filter(id => id !== order.id),
      },
    });

    ctx.send(updatedGroup);
  }
}));