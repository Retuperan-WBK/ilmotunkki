export default {
  routes: [
    {
     method: 'POST',
     path: '/group/createNew',
     handler: 'group.createNew',
    },
    {
      method: 'PUT',
      path: '/group/addToOrder',
      handler: 'group.addToOrder',
    },
    {
      method: 'DELETE',
      path: '/group/removeFromOrder',
      handler: 'group.removeFromOrder',
    }
  ],
};
