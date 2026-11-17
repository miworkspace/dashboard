import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  Network,
  Radio,
  GitBranch,
  Cable,
  MapPin,
  Wrench,
  AlertTriangle,
  ArrowRight,
  Plus,
  Clock,
  ExternalLink,
  ShieldAlert,
  Server
} from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../ui/Table';
import { CopyButton } from '../ui/CopyButton';
import { inventoryApi } from '../../lib/api/inventory';
import { networksApi } from '../../lib/api/networks';
import { vlansApi } from '../../lib/api/vlans';
import { switchesApi } from '../../lib/api/switches';
import { roomsApi } from '../../lib/api/rooms';
import { activityApi } from '../../lib/api/activity';
import { subscribeStorage } from '../../lib/storage';
import { useRouter } from '../../lib/routerContext';

export function DashboardHome() {
  const { navigate } = useRouter();
  const [stats, setStats] = useState({
    totalInventory: 0,
    activeDevices: 0,
    networkDevices: 0,
    availableIps: 0,
    vlansCount: 0,
    switchesCount: 0,
    roomsCount: 0,
    maintenanceCount: 0
  });

  const [recentInventory, setRecentInventory] = useState([]);
  const [networkSummary, setNetworkSummary] = useState({
    total: 0,
    active: 0,
    available: 0,
    conflicts: 0,
    unassigned: 0
  });
  const [conflictsList, setConflictsList] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [inv, nets, vlans, switches, rooms, acts, conflicts] = await Promise.all([
        inventoryApi.getInventory(),
        networksApi.getNetworks(),
        vlansApi.getVLANs(),
        switchesApi.getSwitches(),
        roomsApi.getRooms(),
        activityApi.getActivities(),
        networksApi.detectConflicts()
      ]);

      const activeDevs = inv.filter(i => i.status === 'In Use' || i.status === 'Assigned').length;
      const maintDevs = inv.filter(i => i.status === 'Maintenance').length;
      const availIps = nets.filter(n => n.status === 'Available').length;
      const activeIps = nets.filter(n => n.status === 'Active').length;
      const unassignedIps = nets.filter(n => !n.user || n.user === 'None' || n.status === 'Available').length;

      setStats({
        totalInventory: inv.length,
        activeDevices: activeDevs,
        networkDevices: nets.length,
        availableIps: availIps,
        vlansCount: vlans.length,
        switchesCount: switches.length,
        roomsCount: rooms.length,
        maintenanceCount: maintDevs
      });

      setRecentInventory(inv.slice(0, 5));
      setNetworkSummary({
        total: nets.length,
        active: activeIps,
        available: availIps,
        conflicts: conflicts.length,
        unassigned: unassignedIps
      });
      setConflictsList(conflicts);
      setActivities(acts.slice(0, 6));
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeStorage(loadData);
    return unsub;
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Welcome / Organization Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-700">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500/30">
              দৈনিক আমার দেশ · Daily Amar Desh
            </span>
            <span className="text-xs text-slate-400">NOC Infrastructure Portal</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white">
            IT Management System
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Centralized monitoring of newsroom editorial workstations, 10GbE multimedia video suites, printing press automation, Cisco switches, and IP subnet mappings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/dashboard/networks')}
            icon={Network}
          >
            IP Lookup Tool
          </Button>
          <Button
            variant="brand"
            size="sm"
            onClick={() => navigate('/dashboard/inventory/new')}
            icon={Plus}
          >
            Register Asset
          </Button>
        </div>
      </div>

      {/* IP Conflict Warning Banner (if any conflict detected) */}
      {conflictsList.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                IP Conflict Alert Detected ({conflictsList.length})
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                {conflictsList.map(c => c.ipAddress).join(', ')} is assigned to multiple active devices.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => navigate('/dashboard/networks')}
          >
            Resolve Conflicts
          </Button>
        </div>
      )}

      {/* 8 Top Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Package}
          label="Total Inventory"
          value={stats.totalInventory}
          helper="Tracked IT assets"
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          onClick={() => navigate('/dashboard/inventory')}
        />
        <StatCard
          icon={CheckCircle2}
          label="Active Devices"
          value={stats.activeDevices}
          helper="Assigned & in use"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          onClick={() => navigate('/dashboard/inventory')}
        />
        <StatCard
          icon={Network}
          label="Network Devices"
          value={stats.networkDevices}
          helper="Mapped IP endpoints"
          iconColor="text-cyan-600"
          iconBg="bg-cyan-50"
          onClick={() => navigate('/dashboard/networks')}
        />
        <StatCard
          icon={Radio}
          label="Available IPs"
          value={stats.availableIps}
          helper="Ready for assignment"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          onClick={() => navigate('/dashboard/networks')}
        />
        <StatCard
          icon={GitBranch}
          label="VLANs"
          value={stats.vlansCount}
          helper="Segregated subnets"
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          onClick={() => navigate('/dashboard/vlans')}
        />
        <StatCard
          icon={Cable}
          label="Switches"
          value={stats.switchesCount}
          helper="Distribution & Access"
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          onClick={() => navigate('/dashboard/switches')}
        />
        <StatCard
          icon={MapPin}
          label="Rooms & Sites"
          value={stats.roomsCount}
          helper="Physical locations"
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          onClick={() => navigate('/dashboard/rooms')}
        />
        <StatCard
          icon={Wrench}
          label="Under Maintenance"
          value={stats.maintenanceCount}
          helper={stats.maintenanceCount > 0 ? 'Requires attention' : 'All systems normal'}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
          trend={stats.maintenanceCount > 0 ? 'Pending' : '0 issues'}
          trendPositive={stats.maintenanceCount === 0}
          onClick={() => navigate('/dashboard/inventory')}
        />
      </div>

      {/* Main Content Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Recent Inventory & Network Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Inventory Table */}
          <Card>
            <CardHeader
              title="Recent Inventory Assets"
              description="Recently acquired, serviced, or assigned IT equipment"
              action={
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => navigate('/dashboard/inventory')}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  View All ({stats.totalInventory})
                </Button>
              }
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow hover={false}>
                    <TableHeaderCell>Asset Name</TableHeaderCell>
                    <TableHeaderCell>Category</TableHeaderCell>
                    <TableHeaderCell>Serial Number</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Location</TableHeaderCell>
                    <TableHeaderCell className="text-right">Action</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentInventory.map((item) => (
                    <TableRow
                      key={item.id}
                      onClick={() => navigate(`/dashboard/inventory/${item.id}`)}
                    >
                      <TableCell>
                        <div className="min-w-[160px]">
                          <span className="font-semibold text-slate-900 block truncate hover:text-rose-600">
                            {item.assetName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {item.assetTag}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-600 whitespace-nowrap">
                          {item.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-mono text-xs text-slate-700 whitespace-nowrap">
                          <span>{item.serialNumber}</span>
                          <CopyButton text={item.serialNumber} label="Serial" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-600 block truncate max-w-[140px]">
                          {item.roomName}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/inventory/${item.id}`);
                          }}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Network Overview Summary Block */}
          <Card>
            <CardHeader
              title="Network & Subnet Overview"
              description="IP allocations, DHCP capacity, and subnet health"
              action={
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => navigate('/dashboard/networks')}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Manage Networks
                </Button>
              }
            />
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Total IP Records</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                    {networkSummary.total}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-700 font-medium">Active IPs</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-800 mt-1 tabular-nums">
                    {networkSummary.active}
                  </p>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-700 font-medium">Available IPs</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-blue-800 mt-1 tabular-nums">
                    {networkSummary.available}
                  </p>
                </div>
                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                  <p className="text-xs text-rose-700 font-medium">Conflicting IPs</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-rose-800 mt-1 tabular-nums">
                    {networkSummary.conflicts}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                  <p className="text-xs text-slate-500 font-medium">Unassigned IPs</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-slate-800 mt-1 tabular-nums">
                    {networkSummary.unassigned}
                  </p>
                </div>
              </div>

              {/* Instant IP Search Jump Bar */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <span className="font-medium">
                  Need to find which workstation is using an IP?
                </span>
                <button
                  onClick={() => navigate('/dashboard/networks')}
                  className="text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Fast IP Lookup Tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Recent Activities Feed & Quick Shortcuts */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <Card>
            <CardHeader title="Quick Actions" description="Fast operations for IT engineers" />
            <CardContent className="space-y-2">
              <button
                onClick={() => navigate('/dashboard/inventory/new')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-rose-600">
                      Add Inventory Asset
                    </p>
                    <p className="text-[11px] text-slate-500">PC, laptop, server, or printer</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
              </button>

              <button
                onClick={() => navigate('/dashboard/networks')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <Network className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-rose-600">
                      Search IP Address
                    </p>
                    <p className="text-[11px] text-slate-500">Instant device & switch port lookup</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
              </button>

              <button
                onClick={() => navigate('/dashboard/switches')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                    <Cable className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-rose-600">
                      View Switch Port Maps
                    </p>
                    <p className="text-[11px] text-slate-500">24/48 port matrix diagrams</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
              </button>
            </CardContent>
          </Card>

          {/* Recent Activities Feed */}
          <Card>
            <CardHeader
              title="Recent Activities"
              description="Real-time audit log from IT team"
              action={
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => navigate('/dashboard/activity')}
                >
                  All Logs
                </Button>
              }
            />
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {activities.map((act) => (
                  <div key={act.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-900">
                          {act.user}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">
                          {act.action.toLowerCase()}
                        </span>
                        <p className="text-xs font-medium text-slate-800 mt-0.5 truncate">
                          {act.record}
                        </p>
                        {act.details && (
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {act.details}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap shrink-0">
                        {act.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
