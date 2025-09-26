import { prisma } from './prisma'
import { ErrorLogger, ErrorType, ErrorSeverity } from './error-logger'

/**
 * 数据修复工具
 * 用于检测和修复数据不一致问题
 */
export class DataRepairUtils {
  private logger: ErrorLogger

  constructor() {
    this.logger = ErrorLogger.getInstance()
  }

  /**
   * 修复房间-合同状态不一致问题
   */
  async repairRoomContractInconsistency(): Promise<{
    repairedRooms: number
    errors: string[]
  }> {
    const errors: string[] = []
    let repairedRooms = 0

    try {
      this.logger.logInfo('开始修复房间-合同状态不一致问题', { 
        module: 'data-repair-utils',
        function: 'repairRoomContractInconsistency'
      })

      // 查找状态为OCCUPIED但无活跃合同的房间
      const inconsistentRooms = await prisma.room.findMany({
        where: {
          status: 'OCCUPIED'
        },
        include: {
          contracts: {
            where: { status: 'ACTIVE' }
          }
        }
      })

      for (const room of inconsistentRooms) {
        const activeContracts = room.contracts.filter(c => c.status === 'ACTIVE')
        
        if (activeContracts.length === 0) {
          // 房间状态为OCCUPIED但无活跃合同，修复为VACANT
          await prisma.room.update({
            where: { id: room.id },
            data: {
              status: 'VACANT',
              currentRenter: null
            }
          })

          repairedRooms++
          this.logger.logInfo(`修复房间状态不一致`, {
            module: 'data-repair-utils',
            roomId: room.id,
            roomNumber: room.roomNumber,
            oldStatus: 'OCCUPIED',
            newStatus: 'VACANT'
          })
        }
      }

      // 查找状态为VACANT但有活跃合同的房间
      const vacantRoomsWithContracts = await prisma.room.findMany({
        where: {
          status: 'VACANT'
        },
        include: {
          contracts: {
            where: { status: 'ACTIVE' }
          }
        }
      })

      for (const room of vacantRoomsWithContracts) {
        const activeContracts = room.contracts.filter(c => c.status === 'ACTIVE')
        
        if (activeContracts.length > 0) {
          // 房间状态为VACANT但有活跃合同，修复为OCCUPIED
          const activeContract = activeContracts[0]
          await prisma.room.update({
            where: { id: room.id },
            data: {
              status: 'OCCUPIED',
              currentRenter: activeContract.renterId
            }
          })

          repairedRooms++
          this.logger.logInfo(`修复房间状态不一致`, {
            module: 'data-repair-utils',
            roomId: room.id,
            roomNumber: room.roomNumber,
            oldStatus: 'VACANT',
            newStatus: 'OCCUPIED',
            contractId: activeContract.id
          })
        }
      }

      this.logger.logInfo('房间-合同状态修复完成', {
        module: 'data-repair-utils',
        repairedRooms,
        errors: errors.length
      })

      return { repairedRooms, errors }

    } catch (error) {
      const errorMessage = `房间-合同状态修复失败: ${(error as Error).message}`
      errors.push(errorMessage)
      
      await this.logger.logError(
        ErrorType.DATA_CONSISTENCY,
        ErrorSeverity.HIGH,
        errorMessage,
        { module: 'data-repair-utils' },
        error as Error
      )

      return { repairedRooms, errors }
    }
  }

  /**
   * 修复孤立账单问题
   */
  async repairOrphanBills(): Promise<{
    repairedBills: number
    errors: string[]
  }> {
    const errors: string[] = []
    let repairedBills = 0

    try {
      this.logger.logInfo('开始修复孤立账单问题', { 
        module: 'data-repair-utils',
        function: 'repairOrphanBills'
      })

      // 查找没有关联合同的账单
      const orphanBills = await prisma.bill.findMany({
        where: {
          contractId: {
            not: {
              in: await prisma.contract.findMany({
                select: { id: true }
              }).then(contracts => contracts.map(c => c.id))
            }
          }
        }
      })

      for (const bill of orphanBills) {
        // 尝试通过账单号或其他信息找到对应的合同
        // 如果无法修复，标记为需要手动处理
        this.logger.logInfo(`发现孤立账单`, {
          module: 'data-repair-utils',
          billId: bill.id,
          billNumber: bill.billNumber,
          contractId: bill.contractId
        })
        
        // 这里可以添加更复杂的修复逻辑
        // 暂时只记录，不自动删除
      }

      return { repairedBills, errors }

    } catch (error) {
      const errorMessage = `孤立账单修复失败: ${(error as Error).message}`
      errors.push(errorMessage)
      
      await this.logger.logError(
        ErrorType.DATA_CONSISTENCY,
        ErrorSeverity.MEDIUM,
        errorMessage,
        { module: 'data-repair-utils' },
        error as Error
      )

      return { repairedBills, errors }
    }
  }

  /**
   * 修复抄表记录状态不一致问题
   */
  async repairMeterReadingInconsistency(): Promise<{
    repairedReadings: number
    errors: string[]
  }> {
    const errors: string[] = []
    let repairedReadings = 0

    try {
      this.logger.logInfo('开始修复抄表记录状态不一致问题', { 
        module: 'data-repair-utils',
        function: 'repairMeterReadingInconsistency'
      })

      // 查找状态为CONFIRMED但未生成账单的抄表记录
      const unbilledReadings = await prisma.meterReading.findMany({
        where: {
          status: 'CONFIRMED',
          isBilled: false
        },
        include: {
          bills: true
        }
      })

      for (const reading of unbilledReadings) {
        if (reading.bills.length > 0) {
          // 有关联账单但isBilled为false，修复状态
          await prisma.meterReading.update({
            where: { id: reading.id },
            data: {
              isBilled: true,
              status: 'BILLED'
            }
          })

          repairedReadings++
          this.logger.logInfo(`修复抄表记录状态`, {
            module: 'data-repair-utils',
            readingId: reading.id,
            oldStatus: reading.status,
            newStatus: 'BILLED',
            billCount: reading.bills.length
          })
        }
      }

      return { repairedReadings, errors }

    } catch (error) {
      const errorMessage = `抄表记录状态修复失败: ${(error as Error).message}`
      errors.push(errorMessage)
      
      await this.logger.logError(
        ErrorType.DATA_CONSISTENCY,
        ErrorSeverity.MEDIUM,
        errorMessage,
        { module: 'data-repair-utils' },
        error as Error
      )

      return { repairedReadings, errors }
    }
  }

  /**
   * 执行全面数据修复
   */
  async repairAllInconsistencies(): Promise<{
    totalRepaired: number
    details: {
      rooms: number
      bills: number
      readings: number
    }
    errors: string[]
  }> {
    const allErrors: string[] = []

    // 修复房间-合同状态不一致
    const roomResult = await this.repairRoomContractInconsistency()
    allErrors.push(...roomResult.errors)

    // 修复孤立账单
    const billResult = await this.repairOrphanBills()
    allErrors.push(...billResult.errors)

    // 修复抄表记录状态不一致
    const readingResult = await this.repairMeterReadingInconsistency()
    allErrors.push(...readingResult.errors)

    const totalRepaired = roomResult.repairedRooms + billResult.repairedBills + readingResult.repairedReadings

    this.logger.logInfo('全面数据修复完成', {
      module: 'data-repair-utils',
      totalRepaired,
      details: {
        rooms: roomResult.repairedRooms,
        bills: billResult.repairedBills,
        readings: readingResult.repairedReadings
      },
      errorCount: allErrors.length
    })

    return {
      totalRepaired,
      details: {
        rooms: roomResult.repairedRooms,
        bills: billResult.repairedBills,
        readings: readingResult.repairedReadings
      },
      errors: allErrors
    }
  }
}

// 导出单例实例
export const dataRepairUtils = new DataRepairUtils()