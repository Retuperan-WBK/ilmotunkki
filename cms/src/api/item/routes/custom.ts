export default {
  routes: [
    {
      method: 'POST',
      path: '/items/:id/assign-seat',
      handler: 'item.assignSeat',
    },
    {
      method: 'DELETE',
      path: '/items/:id/remove-seat',
      handler: 'item.removeSeat',
    },
    {
      method: 'POST',
      path: '/items/:id/change-seat',
      handler: 'item.changeSeat',
    },
  ],
};
