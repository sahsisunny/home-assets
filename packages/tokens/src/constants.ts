export const ASSET_CATEGORIES = [
  { id: 'appliances', name: 'Appliances', icon: 'Refrigerator' },
  { id: 'electronics', name: 'Electronics', icon: 'Tv' },
  { id: 'furniture', name: 'Furniture', icon: 'Armchair' },
  { id: 'vehicles', name: 'Vehicles', icon: 'Car' },
  { id: 'equipment', name: 'Home Equipment', icon: 'Wrench' },
  { id: 'other', name: 'Other', icon: 'Package' },
] as const;

export const ASSET_LOCATIONS = [
  'Living Room',
  'Master Bedroom',
  'Bedroom 2',
  'Kitchen',
  'Utility Room',
  'Balcony',
  'Garage',
  'Office',
  'Storage',
  'Other',
] as const;

export const DOCUMENT_TYPES = [
  { id: 'invoice', label: 'Invoice / Receipt' },
  { id: 'warranty', label: 'Warranty Card' },
  { id: 'manual', label: 'User Manual' },
  { id: 'insurance', label: 'Insurance Policy' },
  { id: 'service', label: 'Service Record' },
  { id: 'box_image', label: 'Box / Serial Photo' },
  { id: 'other', label: 'Other' },
] as const;

export const HOUSEHOLD_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const;
