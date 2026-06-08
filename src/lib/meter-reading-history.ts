export type MeterReadingRecordType =
  | 'INITIAL_BASELINE'
  | 'REGULAR_READING'
  | 'CHECKOUT_FINAL'

export interface MeterReadingHistoryRecord {
  id: string
  meterId: string
  meterType: 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'
  previousReading: number | null
  currentReading: number
  usage: number
  unitPrice: number
  amount: number
  readingDate: string
  period?: string
  status: 'PENDING' | 'CONFIRMED' | 'BILLED' | 'CANCELLED'
  operator?: string
  remarks?: string
  recordType?: MeterReadingRecordType | string | null
  isBilled: boolean
  createdAt: string
  updatedAt: string
  meter?: {
    displayName: string
    meterNumber?: string
    room?: {
      roomNumber: string
      building?: {
        name: string
      }
    }
  }
  contract?: {
    renter?: {
      name: string
    }
  }
}

export interface MeterReadingHistoryFilters {
  search: string
  meterType: string
  status: string
  dateRange: string
  operator: string
  recordType: 'all' | MeterReadingRecordType
}

export const DEFAULT_METER_READING_HISTORY_FILTERS: MeterReadingHistoryFilters = {
  search: '',
  meterType: 'all',
  status: 'all',
  dateRange: 'all',
  operator: '',
  recordType: 'all',
}
