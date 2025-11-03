import { InventoryItem } from "../types/inventory";

export const mockInventoryData: InventoryItem[] = [
  { id: 1, title: 'Laptop Dell XPS 15', status: 'Available', type: 'Laptop', quantity: 5, requiteFrom: 'IT Department' },
  { id: 2, title: 'Monitor LG 27"', status: 'In Use', type: 'Monitor', quantity: 12, requiteFrom: 'Development Team' },
  { id: 3, title: 'Keyboard Mechanical', status: 'Available', type: 'Peripheral', quantity: 8, requiteFrom: 'HR Department' },
  { id: 4, title: 'Mouse Wireless', status: 'Maintenance', type: 'Peripheral', quantity: 3, requiteFrom: 'IT Department' },
  { id: 5, title: 'MacBook Pro M2', status: 'In Use', type: 'Laptop', quantity: 7, requiteFrom: 'Design Team' },
  { id: 6, title: 'MacBook Pro M3', status: 'In Use', type: 'Laptop', quantity: 8, requiteFrom: 'Design Team' },
  { id: 7, title: 'MacBook Pro M4', status: 'In Use', type: 'Laptop', quantity: 3, requiteFrom: 'Design Team' },
  { id: 8, title: 'MacBook Air', status: 'In Use', type: 'Laptop', quantity: 1, requiteFrom: 'Design Team' },
  { id: 9, title: 'MacBook Air M1', status: 'In Use', type: 'Laptop', quantity: 5, requiteFrom: 'Design Team' },
];