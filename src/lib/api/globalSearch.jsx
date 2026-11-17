import { storageInventory, storageNetworks, storageSwitches, storageVLANs, storageRooms } from '../storage';

/**
 * Omnisearch across all IT infrastructure
 */
export function searchAllInfrastructure(query) {
  if (!query || query.trim().length === 0) {
    return {
      inventory: [],
      networks: [],
      switches: [],
      vlans: [],
      rooms: [],
      total: 0
    };
  }

  const q = query.trim().toLowerCase();

  // Search Inventory
  const allInventory = storageInventory.getAll();
  const inventory = allInventory.filter(item =>
    item.assetName?.toLowerCase().includes(q) ||
    item.assetTag?.toLowerCase().includes(q) ||
    item.serialNumber?.toLowerCase().includes(q) ||
    item.brand?.toLowerCase().includes(q) ||
    item.model?.toLowerCase().includes(q) ||
    item.assignedTo?.toLowerCase().includes(q) ||
    item.ipAddress?.toLowerCase().includes(q)
  ).slice(0, 6);

  // Search Networks & IPs
  const allNetworks = storageNetworks.getAll();
  const networks = allNetworks.filter(item =>
    item.ipAddress?.toLowerCase().includes(q) ||
    item.deviceName?.toLowerCase().includes(q) ||
    item.macAddress?.toLowerCase().includes(q) ||
    item.user?.toLowerCase().includes(q) ||
    item.switchPort?.toLowerCase().includes(q)
  ).slice(0, 6);

  // Search Switches
  const allSwitches = storageSwitches.getAll();
  const switches = allSwitches.filter(item =>
    item.name?.toLowerCase().includes(q) ||
    item.brand?.toLowerCase().includes(q) ||
    item.model?.toLowerCase().includes(q) ||
    item.managementIp?.toLowerCase().includes(q) ||
    item.serialNumber?.toLowerCase().includes(q)
  ).slice(0, 5);

  // Search VLANs
  const allVLANs = storageVLANs.getAll();
  const vlans = allVLANs.filter(item =>
    item.name?.toLowerCase().includes(q) ||
    String(item.vlanId).includes(q) ||
    item.subnet?.toLowerCase().includes(q) ||
    item.purpose?.toLowerCase().includes(q)
  ).slice(0, 5);

  // Search Rooms
  const allRooms = storageRooms.getAll();
  const rooms = allRooms.filter(item =>
    item.name?.toLowerCase().includes(q) ||
    item.number?.toLowerCase().includes(q) ||
    item.department?.toLowerCase().includes(q) ||
    item.floor?.toLowerCase().includes(q)
  ).slice(0, 5);

  const total = inventory.length + networks.length + switches.length + vlans.length + rooms.length;

  return {
    inventory,
    networks,
    switches,
    vlans,
    rooms,
    total
  };
}
