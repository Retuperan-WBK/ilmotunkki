/**
 *  item controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::item.item',({strapi}) => ({
  async delete(ctx) {
    const { orderUid } = ctx.request.query;
    const order = await strapi.query('api::order.order').findOne({
      where: {
        uid: orderUid,
      }
    });
    if(!order) {
      return ctx.notFound('No order');
    }
    if(order.status === 'ok') {
      return ctx.badRequest('Order already done');
    }
    return await super.delete(ctx);
  },
  async create(ctx) {
    let {data: {itemType}} = ctx.request.body;
    const  {data: {order: orderUid}} = ctx.request.body;
    const [order, category] = await Promise.all([
      strapi.query('api::order.order').findOne({
        where: {
          uid: orderUid,
        }
      }),
      strapi.query('api::item-category.item-category').findOne({
        where: {
          itemTypes: {
            id: itemType
          }
        },
        populate: {
          overflowItem: true,
        },
      }),
    ]);
    if(!order) {
      return ctx.notFound('No order');
    }
    if(order.status === 'ok') {
      return ctx.badRequest('Order already done');
    }
    if(order.status === 'pending') {
      return ctx.badRequest('Order is pending');
    }
    if(order.status === 'expired') {
      return ctx.badRequest('Order is expired');
    }
    const orderId = order.id;
    const [totalCategoryItemCount,orderCategoryItemCount] = await Promise.all([
      strapi.query('api::item.item').count({
        where: {
          itemType: {
            itemCategory: {
              id: category.id
            }
          }
        },
      }),
      strapi.query('api::item.item').count({
        where: {
          order: {
            id: orderId
          },
          itemType: {
            itemCategory: {
              id: category.id
            }
          }
        }
      })
    ])
    if(totalCategoryItemCount + 1 > category.maximumItemLimit) {
      if(!category.overflowItem) {
        return ctx.badRequest('Items have run out');
      }
      itemType = category.overflowItem.id;
    }
    if(orderCategoryItemCount + 1 > category.orderItemLimit) {
      return this.transformResponse({});
    }
    const result = await strapi.query('api::item.item').create({
      data: {
        itemType,
        order: orderId,
      },
      populate: {
        itemType: {
          populate: {
            itemCategory: true,
          }
        }
      }
    });
    return this.transformResponse(result);
  },
  async find(ctx) {
    const { orderUid } = ctx.request.query;
    const entities = await strapi.query('api::item.item').findMany({
      where: {
        order: {
          uid: orderUid,
        },
      },
      populate: {
        itemType: {
          populate: {
            itemCategory: true,
          }
        },
        giftCard: true,
      }
    });
    return this.transformResponse(entities);
  },
  async findOne(ctx) {
    const { orderUid } = ctx.request.query;
    const {id} = ctx.request.params;
    const entity = await strapi.query('api::item.item').findOne({
      where: {
        order: {
          uid: orderUid
        },
        id,
      },
      populate: {
        itemType: true,
      }
    });
    if(!entity) {
      return ctx.notFound('Not found');
    }
    return this.transformResponse(entity);
  },
  async assignSeat(ctx) {
    const { id } = ctx.params; // Item ID
    const { seat } = ctx.request.body; // Seat ID from the request

    if (!seat) {
      return ctx.badRequest('Seat ID is required');
    }

    try {
      const updatedItem = await strapi.entityService.update('api::item.item', id, {
        data: {
          seat: seat, // Assuming "seat" is the relation field in your item
        },
      });

      return ctx.send(updatedItem);
    } catch (error) {
      ctx.throw(500, 'Error assigning seat');
    }
  },

  // **Remove Seat from Item**
  async removeSeat(ctx) {
    const { id } = ctx.params; // Item ID

    try {
      const updatedItem = await strapi.entityService.update('api::item.item', id, {
        data: {
          seat: null, // Remove the relationship
        },
      });

      return ctx.send(updatedItem);
    } catch (error) {
      ctx.throw(500, 'Error removing seat from item');
    }
  },

  // **Change Item Seat**
  async changeSeat(ctx) {
    const { id } = ctx.params; // Item ID
    const { seat } = ctx.request.body; // Seat ID from the request

    if (!seat) {
      return ctx.badRequest('Seat ID is required');
    }

    try {
      const updatedItem = await strapi.entityService.update('api::item.item', id, {
        data: {
          seat: seat, // Update the relationship
        },
      });

      return ctx.send(updatedItem);
    } catch (error) {
      ctx.throw(500, 'Error changing seat for item');
    }
  }
}));
