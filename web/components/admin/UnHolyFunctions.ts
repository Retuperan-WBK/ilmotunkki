import { AdminGroup, Order, Section } from "@/utils/models";


interface UpdatedItemType {
  id: number;
  price: number;
  availableFrom: string | null;
  availableTo: string | null;
  slug: string;
  topSeperator: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UpdatedGroup {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdatedOrder {
  id: number;
  status: 'new' | 'ok' | 'fail' | 'pending' | 'admin-new'; // Assuming possible order statuses
  transactionId: string | null;
  uid: string;
  createdAt: string;
  updatedAt: string;
  kutsuvieras: boolean | null;
  tickets_sent: boolean | null;
  group: UpdatedGroup | null;
}

interface UpdatedSection {
  id: number;
  Name: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdatedSeat {
  id: number;
  Row: string;
  Number: string;
  x_cord: number;
  y_cord: number;
  special: string | null;
  createdAt: string;
  updatedAt: string;
  section: UpdatedSection;
}

export interface UpdatedItem {
  id: number;
  createdAt: string;
  updatedAt: string;
  itemType: UpdatedItemType;
  order: UpdatedOrder;
  seat: UpdatedSeat;
}


export const handleAddTicketToSeat_State = (
  orders: Order[], 
  groups: AdminGroup[], 
  sections: Section[], 
  updatedItem: UpdatedItem
) => {

  // 1️⃣ Update Orders: orders -> items -> item
  const updatedOrders = orders.map(order => ({
    ...order,
    attributes: {
      ...order.attributes,
      items: {
        data: order.attributes.items.data.map(item => 
          item.id === updatedItem.id 
            ? { 
                ...item, 
                attributes: { 
                  itemType: {
                    data: {
                      id: updatedItem.itemType.id,
                      attributes: {
                        ...updatedItem.itemType
                      }
                    }
                  },
                  seat: { 
                    data: {
                      id: updatedItem.seat.id,
                      attributes: {
                        ...updatedItem.seat,
                        section: {
                          data: {
                            id: updatedItem.seat.section.id,
                            attributes: {
                              ...updatedItem.seat.section
                            }
                          }, 
                        },
                      }
                    }
                  },
                } 
              } 
            : item
        )
      }
    }
  }));

  // 2️⃣ Update Groups: groups -> orders -> items -> item
  const updatedGroups = groups.map(group => ({
    ...group,
    attributes: {
      ...group.attributes,
      orders: {
        data: group.attributes.orders.data.map(order => ({
          ...order,
          attributes: {
            ...order.attributes,
            items: {
              data: order.attributes.items.data.map(item => 
                item.id === updatedItem.id 
                  ? { 
                    ...item, 
                    attributes: { 
                      itemType: {
                        data: {
                          id: updatedItem.itemType.id,
                          attributes: {
                            ...updatedItem.itemType
                          }
                        }
                      },
                      seat: { 
                        data: {
                          id: updatedItem.seat.id,
                          attributes: {
                            ...updatedItem.seat,
                            section: {
                              data: {
                                id: updatedItem.seat.section.id,
                                attributes: {
                                  ...updatedItem.seat.section
                                }
                              }, 
                            },
                          }
                        }
                      },
                    } 
                  }
                  : item
              )
            }
          }
        }))
      }
    }
  }));

  // 3️⃣ Update Sections: sections -> seats -> item in the seat where the item has now been added
  const updatedSections = sections.map(section => ({
    ...section,
    attributes: {
      ...section.attributes,
      seats: {
        data: section.attributes.seats.data.map(seat => 
          seat.id === updatedItem.seat.id 
            ? { 
                ...seat, 
                attributes: { 
                  ...seat.attributes, 
                  item: { 
                    data: {
                      id: updatedItem.id,
                      attributes: {
                        itemType: {
                          data: {
                            id: updatedItem.itemType.id,
                            attributes: {
                              ...updatedItem.itemType
                            }
                          }
                        },
                        order: {
                          data: {
                            id: updatedItem.order.id,
                            attributes: {
                              ...updatedItem.order,
                              group: {
                                data: updatedItem.order.group ? {
                                  id: updatedItem.order.group.id,
                                  attributes: {
                                    ...updatedItem.order.group
                                  }
                                } : null
                              }
                            }
                          }
                        },
                      }
                    } 
                  } 
                } 
              } 
            : seat
        )
      }
    }
  }));

  return {
    updatedOrders,
    updatedGroups,
    updatedSections
  };
};

export const handleRemoveTicketFromSeat_State = (
  orders: Order[], 
  groups: AdminGroup[], 
  sections: Section[], 
  updatedItem: UpdatedItem
) => {

  // 1️⃣ Update Orders: orders -> items -> item
  const updatedOrders = orders.map(order => ({
    ...order,
    attributes: {
      ...order.attributes,
      items: {
        data: order.attributes.items.data.map(item => 
          item.id === updatedItem.id 
            ? { 
                ...item, 
                attributes: { 
                  ...item.attributes, 
                  seat: { data: null } // Remove seat from the item
                } 
              } 
            : item
        )
      }
    }
  }));

  // 2️⃣ Update Groups: groups -> orders -> items -> item
  const updatedGroups = groups.map(group => ({
    ...group,
    attributes: {
      ...group.attributes,
      orders: {
        data: group.attributes.orders.data.map(order => ({
          ...order,
          attributes: {
            ...order.attributes,
            items: {
              data: order.attributes.items.data.map(item => 
                item.id === updatedItem.id 
                  ? { 
                      ...item, 
                      attributes: { 
                        ...item.attributes, 
                        seat: { data: null } // Remove seat from the item
                      } 
                    } 
                  : item
              )
            }
          }
        }))
      }
    }
  }));

  // 3️⃣ Update Sections: sections -> seats -> item
  const updatedSections = sections.map(section => ({
    ...section,
    attributes: {
      ...section.attributes,
      seats: {
        data: section.attributes.seats.data.map(seat => 
          seat.attributes.item?.data?.id === updatedItem.id 
            ? { 
                ...seat, 
                attributes: { 
                  ...seat.attributes, 
                  item: { data: null } // Remove the item from the seat
                } 
              } 
            : seat
        )
      }
    }
  }));

  return {
    updatedOrders,
    updatedGroups,
    updatedSections
  };
};

export const handleChangeTicketSeat_State = (
  orders: Order[], 
  groups: AdminGroup[], 
  sections: Section[], 
  updatedItem: UpdatedItem
) => {

  // 1️⃣ Update Orders: orders -> items -> item
  const updatedOrders = orders.map(order => ({
    ...order,
    attributes: {
      ...order.attributes,
      items: {
        data: order.attributes.items.data.map(item => 
          item.id === updatedItem.id 
            ? { 
                ...item, 
                attributes: { 
                  itemType: {
                    data: {
                      id: updatedItem.itemType.id,
                      attributes: {
                        ...updatedItem.itemType
                      }
                    }
                  },
                  seat: { 
                    data: {
                      id: updatedItem.seat.id,
                      attributes: {
                        ...updatedItem.seat,
                        section: {
                          data: {
                            id: updatedItem.seat.section.id,
                            attributes: {
                              ...updatedItem.seat.section
                            }
                          }, 
                        },
                      }
                    }
                  },
                } 
              } 
            : item
        )
      }
    }
  }));

  // 2️⃣ Update Groups: groups -> orders -> items -> item
  const updatedGroups = groups.map(group => ({
    ...group,
    attributes: {
      ...group.attributes,
      orders: {
        data: group.attributes.orders.data.map(order => ({
          ...order,
          attributes: {
            ...order.attributes,
            items: {
              data: order.attributes.items.data.map(item => 
                item.id === updatedItem.id 
                  ? { 
                    ...item, 
                    attributes: { 
                      itemType: {
                        data: {
                          id: updatedItem.itemType.id,
                          attributes: {
                            ...updatedItem.itemType
                          }
                        }
                      },
                      seat: { 
                        data: {
                          id: updatedItem.seat.id,
                          attributes: {
                            ...updatedItem.seat,
                            section: {
                              data: {
                                id: updatedItem.seat.section.id,
                                attributes: {
                                  ...updatedItem.seat.section
                                }
                              }, 
                            },
                          }
                        }
                      },
                    } 
                  }
                  : item
              )
            }
          }
        }))
      }
    }
  }));

  // 3️⃣ Update Sections: sections -> seats -> item 
  const updatedSections = sections.map(section => ({
    ...section,
    attributes: {
      ...section.attributes,
      seats: {
        data: section.attributes.seats.data.map(seat => {
          // Remove the item from the old seat
          if (seat.attributes.item?.data?.id === updatedItem.id) {
            return { 
              ...seat, 
              attributes: { 
                ...seat.attributes, 
                item: { data: null } // Clear the item from the old seat
              } 
            }
          }

          // Add the item to the new seat
          if (seat.id === updatedItem.seat.id) {
            return { 
              ...seat, 
              attributes: { 
                ...seat.attributes, 
                item: { 
                  data: {
                    id: updatedItem.id,
                    attributes: {
                      itemType: {
                        data: {
                          id: updatedItem.itemType.id,
                          attributes: {
                            ...updatedItem.itemType
                          }
                        }
                      },
                      order: {
                        data: {
                          id: updatedItem.order.id,
                          attributes: {
                            ...updatedItem.order,
                            group: {
                              data: updatedItem.order.group ? {
                                id: updatedItem.order.group.id,
                                attributes: {
                                  ...updatedItem.order.group
                                }
                              } : null
                            }
                          }
                        }
                      },
                    }
                  } 
                } 
              } 
            }
          }

          // No changes for other seats
          return seat;
        })
      }
    }
  }));

  return {
    updatedOrders,
    updatedGroups,
    updatedSections
  };
};

export const handleSetOrderTicketsSent_State = (
  orders: Order[],
  groups: AdminGroup[],
  sections: Section[],
  orderId: number,
) => {
  
  // 1️⃣ Update Orders: orders -> order
  const updatedOrders = orders.map(order => 
    order.id === orderId 
      ? { 
          ...order, 
          attributes: { 
            ...order.attributes, 
            tickets_sent: true 
          } 
        } 
      : order
  );

  // 2️⃣ Update Groups: groups -> orders -> order
  const updatedGroups = groups.map(group => ({
    ...group,
    attributes: {
      ...group.attributes,
      orders: {
        data: group.attributes.orders.data.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                attributes: { 
                  ...order.attributes, 
                  tickets_sent: true 
                } 
              } 
            : order
        )
      }
    }
  }));

  // 3️⃣ Update Sections: sections -> seats -> item -> order
  const updatedSections = sections.map(section => ({
    ...section,
    attributes: {
      ...section.attributes,
      seats: {
        data: section.attributes.seats.data.map(seat => 
          seat.attributes.item?.data?.attributes.order.data.id === orderId 
            ? { 
                ...seat, 
                attributes: { 
                  ...seat.attributes, 
                  item: { 
                    data: {
                      id: seat.attributes.item.data.id,
                      attributes: {
                        ...seat.attributes.item.data.attributes,
                        order: {
                          data: {
                            id: orderId,
                            attributes: {
                              ...seat.attributes.item.data.attributes.order.data.attributes,
                              tickets_sent: true
                            }
                          }
                        }
                      }
                    } 
                  } 
                } 
              } 
            : seat
        )
      }
    }
  }));

  return {
    updatedOrders,
    updatedGroups,
    updatedSections
  };
}