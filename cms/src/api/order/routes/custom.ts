export default {
  routes: [
    {
      method: "GET",
      path: "/orders/findByUid/:uid",
      handler: "order.findByUid",
    },
    {
      method: "GET",
      path: "/orders/findByCustomerUid/:uid",
      handler: "order.findByCustomerUid",
    },
    {
      method: "GET",
      path: "/orders/signups",
      handler: "order.signups",
    },
    {
      method: "POST",
      path: "/orders/sendTickets/:id",
      handler: "order.sendTickets",
    },
    {
      method: "POST",
      path: "/orders/sendTicketsManually/:id",
      handler: "order.sendTicketsManually",
    }
  ],
};