import {
  getDashboardContractAlertsData,
  getDashboardLeavingTenantsData,
  getDashboardStatsData,
  getDashboardUpcomingContractsData,
  getDashboardVacantRoomsData,
} from '@/lib/dashboard-formal-host'

// phase14-06 compat bridge:
// keep the old page-closure helper surface for rollback/reference only while
// delegating its data source to the unified dashboard formal host.
export async function getDashboardStatsPageClosureData() {
  return getDashboardStatsData()
}

export async function getDashboardVacantRoomsPageClosureData() {
  return getDashboardVacantRoomsData()
}

export async function getDashboardLeavingTenantsPageClosureData() {
  return getDashboardLeavingTenantsData()
}

export async function getDashboardUpcomingContractsPageClosureData() {
  return getDashboardUpcomingContractsData()
}

export async function getDashboardContractAlertsPageClosureData() {
  return getDashboardContractAlertsData()
}
