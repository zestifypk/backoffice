// PostEx orderStatusId → label. Shared by the orders page (dropdown) and API docs.
export const POSTEX_ORDER_STATUSES = [
  { id: 0, label: 'All' },
  { id: 1, label: 'Unbooked' },
  { id: 2, label: 'Booked' },
  { id: 3, label: 'PostEx WareHouse' },
  { id: 4, label: 'Out For Delivery' },
  { id: 5, label: 'Delivered' },
  { id: 6, label: 'Returned' },
  { id: 7, label: 'Un-Assigned By Me' },
  { id: 8, label: 'Expired' },
  { id: 9, label: 'Delivery Under Review' },
  { id: 15, label: 'Picked By PostEx' },
  { id: 16, label: 'Out For Return' },
  { id: 17, label: 'Attempted' },
  { id: 18, label: 'En-Route to PostEx warehouse' },
] as const;
