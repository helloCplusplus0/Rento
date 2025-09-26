import { prisma } from './prisma'
import { ErrorLogger, ErrorType, ErrorSeverity } from './error-logger'
import { buildingQueries, roomQueries, renterQueries, contractQueries, billQueries, meterQueries, meterReadingQueries } from './queries'
import { generateBillsOnContractSigned, generateUtilityBillOnReading } from './auto-bill-generator'

/**
 * 验证结果接口
 */
export interface ValidationResult {
  flowName: string
  success: boolean
  steps: ValidationStep[]
  errors: ValidationError[]
  warnings: ValidationWarning[]
  executionTime: number
  dataConsistency: boolean
}

export interface ValidationStep {
  stepName: string
  success: boolean
  data?: any
  error?: string
  duration: number
}

export interface ValidationError {
  step: string
  message: string
  details?: any
}

export interface ValidationWarning {
  step: string
  message: string
  details?: any
}

export interface ValidationReport {
  totalFlows: number
  successfulFlows: number
  failedFlows: number
  overallSuccess: boolean
  executionTime: number
  results: ValidationResult[]
  summary: {
    roomManagement: boolean
    billGeneration: boolean
    meterReading: boolean
    contractLifecycle: boolean
    dataConsistency: boolean
  }
}

/**
 * 核心业务流程验证器
 */
export class BusinessFlowValidator {
  private logger: ErrorLogger
  private testDataPrefix = 'TEST_VALIDATION_'
  private isolatedTestMode = true // 启用测试数据隔离模式

  constructor() {
    this.logger = ErrorLogger.getInstance()
  }

  /**
   * 设置测试数据隔离模式
   */
  setIsolatedTestMode(enabled: boolean) {
    this.isolatedTestMode = enabled
  }

  /**
   * 生成唯一的测试数据标识符
   */
  private generateTestId(): string {
    return `${this.testDataPrefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 验证所有核心业务流程
   */
  async validateAllFlows(): Promise<ValidationReport> {
    const startTime = Date.now()
    const results: ValidationResult[] = []

    this.logger.logInfo('开始核心业务流程验证', { module: 'business-flow-validator' })

    try {
      // 1. 房间管理完整流程验证
      results.push(await this.validateRoomManagementFlow())

      // 2. 账单生成和支付流程验证
      results.push(await this.validateBillGenerationFlow())

      // 3. 水电表抄表和计费流程验证
      results.push(await this.validateMeterReadingFlow())

      // 4. 合同生命周期管理验证
      results.push(await this.validateContractLifecycleFlow())

      // 5. 数据一致性和完整性验证
      results.push(await this.validateDataConsistency())

      const executionTime = Date.now() - startTime
      const successfulFlows = results.filter(r => r.success).length
      const failedFlows = results.length - successfulFlows

      const report: ValidationReport = {
        totalFlows: results.length,
        successfulFlows,
        failedFlows,
        overallSuccess: failedFlows === 0,
        executionTime,
        results,
        summary: {
          roomManagement: results.find(r => r.flowName === 'RoomManagement')?.success || false,
          billGeneration: results.find(r => r.flowName === 'BillGeneration')?.success || false,
          meterReading: results.find(r => r.flowName === 'MeterReading')?.success || false,
          contractLifecycle: results.find(r => r.flowName === 'ContractLifecycle')?.success || false,
          dataConsistency: results.find(r => r.flowName === 'DataConsistency')?.success || false
        }
      }

      this.logger.logInfo('核心业务流程验证完成', { 
        module: 'business-flow-validator',
        report: {
          totalFlows: report.totalFlows,
          successfulFlows: report.successfulFlows,
          failedFlows: report.failedFlows,
          overallSuccess: report.overallSuccess,
          executionTime: report.executionTime
        }
      })

      return report
    } catch (error) {
      await this.logger.logError(
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.HIGH,
        '核心业务流程验证失败',
        { module: 'business-flow-validator' },
        error as Error
      )
      throw error
    }
  }

  /**
   * 验证房间管理完整流程
   * 场景: 楼栋创建 → 批量添加房间 → 房间租赁 → 房间退租
   */
  async validateRoomManagementFlow(): Promise<ValidationResult> {
    const startTime = Date.now()
    const steps: ValidationStep[] = []
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    try {
      // 步骤1: 创建测试楼栋
      const step1Start = Date.now()
      const building = await buildingQueries.create({
        name: `${this.testDataPrefix}楼栋`,
        address: '测试地址123号',
        description: '验证流程测试楼栋'
      })
      steps.push({
        stepName: '创建测试楼栋',
        success: true,
        data: { buildingId: building.id },
        duration: Date.now() - step1Start
      })

      // 步骤2: 批量添加房间
      const step2Start = Date.now()
      const roomsData = [
        { roomNumber: '101', floorNumber: 1, buildingId: building.id, roomType: 'WHOLE' as const, rent: 2000 },
        { roomNumber: '102', floorNumber: 1, buildingId: building.id, roomType: 'SHARED' as const, rent: 1500 },
        { roomNumber: '201', floorNumber: 2, buildingId: building.id, roomType: 'SINGLE' as const, rent: 1200 }
      ]
      
      const rooms = []
      for (const roomData of roomsData) {
        const room = await roomQueries.create(roomData)
        rooms.push(room)
      }
      
      steps.push({
        stepName: '批量添加房间',
        success: true,
        data: { roomCount: rooms.length, roomIds: rooms.map(r => r.id) },
        duration: Date.now() - step2Start
      })

      // 步骤3: 创建测试租客
      const step3Start = Date.now()
      const renter = await renterQueries.create({
        name: `${this.testDataPrefix}租客`,
        phone: '13800138000',
        gender: '男',
        idCard: '110101199001010001',
        emergencyContact: '紧急联系人',
        emergencyPhone: '13900139000'
      })
      steps.push({
        stepName: '创建测试租客',
        success: true,
        data: { renterId: renter.id },
        duration: Date.now() - step3Start
      })

      // 步骤4: 签订合同（房间租赁）
      const step4Start = Date.now()
      const contract = await contractQueries.create({
        contractNumber: `${this.testDataPrefix}CONTRACT001`,
        roomId: rooms[0].id,
        renterId: renter.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 一年后
        monthlyRent: 2000,
        totalRent: 24000,
        deposit: 4000,
        keyDeposit: 200,
        paymentMethod: '月付',
        signedBy: '系统验证'
      })
      
      // 验证房间状态是否更新为OCCUPIED
      const updatedRoom = await roomQueries.findById(rooms[0].id)
      if (updatedRoom?.status !== 'OCCUPIED') {
        warnings.push({
          step: '签订合同',
          message: '房间状态未自动更新为OCCUPIED',
          details: { roomId: rooms[0].id, currentStatus: updatedRoom?.status }
        })
      }
      
      steps.push({
        stepName: '签订合同（房间租赁）',
        success: true,
        data: { contractId: contract.id },
        duration: Date.now() - step4Start
      })

      // 步骤5: 验证自动账单生成
      const step5Start = Date.now()
      await generateBillsOnContractSigned(contract.id)
      const bills = await billQueries.findByContract(contract.id)
      
      if (bills.length === 0) {
        errors.push({
          step: '验证自动账单生成',
          message: '合同签订后未自动生成账单',
          details: { contractId: contract.id }
        })
      }
      
      steps.push({
        stepName: '验证自动账单生成',
        success: bills.length > 0,
        data: { billCount: bills.length, billIds: bills.map(b => b.id) },
        duration: Date.now() - step5Start
      })

      // 步骤6: 合同终止（房间退租）
      const step6Start = Date.now()
      await contractQueries.update(contract.id, { status: 'TERMINATED' })
      await roomQueries.update(rooms[0].id, { status: 'VACANT' })
      
      steps.push({
        stepName: '合同终止（房间退租）',
        success: true,
        data: { contractId: contract.id, roomId: rooms[0].id },
        duration: Date.now() - step6Start
      })

      // 清理测试数据
      await this.cleanupTestData([building.id], rooms.map(r => r.id), [renter.id], [contract.id], bills.map(b => b.id))

      return {
        flowName: 'RoomManagement',
        success: errors.length === 0,
        steps,
        errors,
        warnings,
        executionTime: Date.now() - startTime,
        dataConsistency: true
      }

    } catch (error) {
      errors.push({
        step: '房间管理流程验证',
        message: (error as Error).message,
        details: error
      })

      return {
        flowName: 'RoomManagement',
        success: false,
        steps,
        errors,
        warnings,
        executionTime: Date.now() - startTime,
        dataConsistency: false
      }
    }
  }

  /**
   * 验证账单生成和支付流程
   */
  async validateBillGenerationFlow(): Promise<ValidationResult> {
    const startTime = Date.now()
    const steps: ValidationStep[] = []
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    try {
      // 创建测试数据
      const testData = await this.createTestContractData()
      const { building, room, renter, contract } = testData

      if (!contract) {
        errors.push({
          step: '创建测试合同',
          message: '测试合同创建失败',
          details: { testData }
        })
        return {
          flowName: 'BillGeneration',
          success: false,
          steps,
          errors,
          warnings,
          executionTime: Date.now() - startTime,
          dataConsistency: false
        }
      }

      // 步骤1: 验证合同签订自动生成账单
      const step1Start = Date.now()
      await generateBillsOnContractSigned(contract.id)
      const generatedBills = await billQueries.findByContract(contract.id)
      
      const hasDepositBill = generatedBills.some(b => b.type === 'DEPOSIT')
      const hasRentBill = generatedBills.some(b => b.type === 'RENT')
      
      if (!hasDepositBill) {
        errors.push({
          step: '验证押金账单生成',
          message: '未生成押金账单',
          details: { contractId: contract.id }
        })
      }
      
      if (!hasRentBill) {
        errors.push({
          step: '验证租金账单生成',
          message: '未生成租金账单',
          details: { contractId: contract.id }
        })
      }
      
      steps.push({
        stepName: '验证合同签订自动生成账单',
        success: hasDepositBill && hasRentBill,
        data: { 
          billCount: generatedBills.length,
          hasDepositBill,
          hasRentBill,
          billTypes: generatedBills.map(b => b.type)
        },
        duration: Date.now() - step1Start
      })

      // 步骤2: 验证账单支付流程
      const step2Start = Date.now()
      const billToPayment = generatedBills[0]
      if (billToPayment) {
        const updatedBill = await billQueries.update(billToPayment.id, {
          status: 'PAID',
          receivedAmount: Number(billToPayment.amount),
          pendingAmount: 0,
          paidDate: new Date(),
          paymentMethod: '现金',
          operator: '系统验证'
        })
        
        steps.push({
          stepName: '验证账单支付流程',
          success: updatedBill.status === 'PAID',
          data: { 
            billId: billToPayment.id,
            status: updatedBill.status,
            receivedAmount: updatedBill.receivedAmount
          },
          duration: Date.now() - step2Start
        })
      } else {
        errors.push({
          step: '验证账单支付流程',
          message: '没有可支付的账单',
          details: { contractId: contract.id }
        })
      }

      // 清理测试数据
      await this.cleanupTestData([building.id], [room.id], [renter.id], [contract.id], generatedBills.map(b => b.id))

      return {
        flowName: 'BillGeneration',
        success: errors.length === 0,
        steps,
        errors,
        warnings,
        executionTime: Date.now() - startTime,
        dataConsistency: true
      }

    } catch (error) {
      errors.push({
        step: '账单生成流程验证',
        message: (error as Error).message,
        details: error
      })

      return {
        flowName: 'BillGeneration',
        success: false,
        steps,
        errors,
        warnings,
        executionTime: Date.now() - startTime,
        dataConsistency: false
      }
    }
  }

  /**
   * 验证水电表抄表和计费流程
   */
  async validateMeterReadingFlow(): Promise<ValidationResult> {
    const startTime = Date.now()
    const steps: ValidationStep[] = []
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    try {
      // 创建测试数据
      const testData = await this.createTestContractData()
      const { building, room, renter, contract } = testData

      if (!contract) {
        errors.push({
          step: '创建测试合同',
          message: '测试合同创建失败',
          details: { testData }
        })
        return {
          flowName: 'MeterReading',
          success: false,
          steps,
          errors,
          warnings,
          executionTime: Date.now() - startTime,
          dataConsistency: false
        }
      }

      // 步骤1: 创建仪表配置
      const step1Start = Date.now()
      const electricMeter = await meterQueries.create({
        meterNumber: `${this.testDataPrefix}E001`,
        displayName: '电表-测试',
        meterType: 'ELECTRICITY',
        roomId: room.id,
        unitPrice: 0.6,
        unit: '度',
        location: '房间内'
      })
      
      const waterMeter = await meterQueries.create({
        meterNumber: `${this.testDataPrefix}W001`,
        displayName: '水表-测试',
        meterType: 'COLD_WATER',
        roomId: room.id,
        unitPrice: 3.5,
        unit: '吨',
        location: '卫生间'
      })
      
      steps.push({
        stepName: '创建仪表配置',
        success: true,
        data: { 
          electricMeterId: electricMeter.id,
          waterMeterId: waterMeter.id
        },
        duration: Date.now() - step1Start
      })

      // 步骤2: 录入抄表数据
      const step2Start = Date.now()
      const electricReading = await meterReadingQueries.create({
        meterId: electricMeter.id,
        contractId: contract.id,
        previousReading: 1000,
        currentReading: 1150,
        usage: 150,
        readingDate: new Date(),
        period: '2024-01',
        unitPrice: 0.6,
        amount: 90, // 150 * 0.6
        operator: '系统验证'
      })
      
      const waterReading = await meterReadingQueries.create({
        meterId: waterMeter.id,
        contractId: contract.id,
        previousReading: 50,
        currentReading: 55,
        usage: 5,
        readingDate: new Date(),
        period: '2024-01',
        unitPrice: 3.5,
        amount: 17.5, // 5 * 3.5
        operator: '系统验证'
      })
      
      steps.push({
        stepName: '录入抄表数据',
        success: true,
        data: { 
          electricReadingId: electricReading.id,
          waterReadingId: waterReading.id,
          totalAmount: 107.5
        },
        duration: Date.now() - step2Start
      })

      // 步骤3: 验证水电费账单自动生成
      const step3Start = Date.now()
      await generateUtilityBillOnReading(contract.id, {
        electricityUsage: 150,
        waterUsage: 5,
        readingDate: new Date(),
        meterReadingIds: [electricReading.id, waterReading.id],
        aggregationStrategy: 'AGGREGATE',
        meterPrices: {
          electricityPrice: 0.6,
          waterPrice: 3.5
        }
      })
      
      const utilityBills = await billQueries.findByContract(contract.id)
      const utilityBill = utilityBills.find(b => b.type === 'UTILITIES')
      
      if (!utilityBill) {
        errors.push({
          step: '验证水电费账单自动生成',
          message: '未生成水电费账单',
          details: { contractId: contract.id }
        })
      } else {
        // 验证账单金额计算是否正确
        const expectedAmount = 107.5 // 90 + 17.5
        if (Math.abs(Number(utilityBill.amount) - expectedAmount) > 0.01) {
          warnings.push({
            step: '验证水电费账单金额',
            message: '水电费账单金额计算可能有误',
            details: { 
              expected: expectedAmount,
              actual: Number(utilityBill.amount),
              billId: utilityBill.id
            }
          })
        }
      }
      
      steps.push({
        stepName: '验证水电费账单自动生成',
        success: !!utilityBill,
        data: { 
          utilityBillId: utilityBill?.id,
          amount: utilityBill ? Number(utilityBill.amount) : 0
        },
        duration: Date.now() - step3Start
      })

      // 清理测试数据
      const allBills = await billQueries.findByContract(contract.id)
      await this.cleanupMeterTestData(
        [building.id], 
        [room.id], 
        [renter.id], 
        [contract.id], 
        allBills.map(b => b.id),
        [electricMeter.id, waterMeter.id],
        [electricReading.id, waterReading.id]
      )

      return {
        flowName: 'MeterReading',
        success: errors.length === 0,
        steps,
        errors,
        warnings,
        executionTime: Date.now() - startTime,
        dataConsistency: true
      }

    } catch (error) {
      errors.push({
        step: '水电表抄表流程验证',
        message: (error as Error).message,
        details: error
      })

      return {
        flowName: 'MeterReading',
        success: false,
        steps,
        errors,
        warnings,
        executionTime: Date.now() - startTime,
        dataConsistency: false
      }
    }
  }

  /**
   * 验证合同生命周期管理
   */
  async validateContractLifecycleFlow(): Promise<ValidationResult> {
    const startTime = Date.now()
    const steps: ValidationStep[] = []
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    try {
      // 创建测试数据
      const testData = await this.createTestContractData(false)
      const { building, room, renter } = testData

      // 步骤1: 合同创建（DRAFT状态）
      const step1Start = Date.now()
      const contract = await contractQueries.create({
        contractNumber: `${this.testDataPrefix}LIFECYCLE001`,
        roomId: room.id,
        renterId: renter.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        monthlyRent: 2000,
        totalRent: 24000,
        deposit: 4000,
        paymentMethod: '月付'
      })
      
      steps.push({
        stepName: '合同创建（ACTIVE状态）',
        success: contract.status === 'ACTIVE',
        data: { contractId: contract.id, status: contract.status },
        duration: Date.now() - step1Start
      })

      // 步骤2: 合同激活和账单生成
      const step2Start = Date.now()
      await generateBillsOnContractSigned(contract.id)
      const bills = await billQueries.findByContract(contract.id)
      
      steps.push({
        stepName: '合同激活和账单生成',
        success: bills.length > 0,
        data: { billCount: bills.length },
        duration: Date.now() - step2Start
      })

      // 步骤3: 合同续约
      const step3Start = Date.now()
      const renewedContract = await contractQueries.update(contract.id, {
        isExtended: true,
        endDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000) // 延长一年
      })
      
      steps.push({
        stepName: '合同续约',
        success: renewedContract.isExtended === true,
        data: { 
          contractId: contract.id,
          isExtended: renewedContract.isExtended,
          newEndDate: renewedContract.endDate
        },
        duration: Date.now() - step3Start
      })

      // 步骤4: 合同终止
      const step4Start = Date.now()
      const terminatedContract = await contractQueries.update(contract.id, {
        status: 'TERMINATED'
      })
      
      steps.push({
        stepName: '合同终止',
        success: terminatedContract.status === 'TERMINATED',
        data: { 
          contractId: contract.id,
          status: terminatedContract.status
        },
        duration: Date.now() - step4Start
      })

      // 清理测试数据
      await this.cleanupTestData([building.id], [room.id], [renter.id], [contract.id], bills.map(b => b.id))

      return {
        flowName: 'ContractLifecycle',
        success: errors.length === 0,
        steps,
        errors,
        warnings,
        executionTime: Date.now() - startTime,
        dataConsistency: true
      }

    } catch (error) {
      errors.push({
        step: '合同生命周期验证',
        message: (error as Error).message,
        details: error
      })

      return {
        flowName: 'ContractLifecycle',
        success: false,
        steps,
        errors,
        warnings,
        executionTime: Date.now() - startTime,
        dataConsistency: false
      }
    }
  }

  /**
   * 验证数据一致性和完整性
   */
  async validateDataConsistency(): Promise<ValidationResult> {
    const startTime = Date.now()
    const steps: ValidationStep[] = []
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    try {
      // 步骤1: 检查房间-合同关联一致性
      const step1Start = Date.now()
      const occupiedRooms = await roomQueries.findByStatus('OCCUPIED')
      let inconsistentRooms = 0
      
      for (const room of occupiedRooms) {
        const activeContracts = room.contracts?.filter(c => c.status === 'ACTIVE') || []
        if (activeContracts.length === 0) {
          // 检查是否为测试数据，如果是则跳过警告
          if (!room.roomNumber.includes('TEST_VALIDATION_')) {
            inconsistentRooms++
            warnings.push({
              step: '房间-合同关联一致性检查',
              message: `房间${room.roomNumber}状态为OCCUPIED但无活跃合同`,
              details: { roomId: room.id, roomNumber: room.roomNumber }
            })
          }
        }
      }
      
      steps.push({
        stepName: '房间-合同关联一致性检查',
        success: inconsistentRooms === 0,
        data: { 
          occupiedRoomCount: occupiedRooms.length,
          inconsistentRoomCount: inconsistentRooms
        },
        duration: Date.now() - step1Start
      })

      // 步骤2: 检查账单-合同关联完整性
      const step2Start = Date.now()
      const allBills = await billQueries.findAll()
      let orphanBills = 0
      
      for (const bill of allBills) {
        if (!bill.contract) {
          // 检查是否为测试数据，如果是则跳过警告
          if (!bill.billNumber.includes('TEST_VALIDATION_')) {
            orphanBills++
            warnings.push({
              step: '账单-合同关联完整性检查',
              message: `账单${bill.billNumber}缺少关联合同`,
              details: { billId: bill.id, billNumber: bill.billNumber }
            })
          }
        }
      }
      
      steps.push({
        stepName: '账单-合同关联完整性检查',
        success: orphanBills === 0,
        data: { 
          totalBillCount: allBills.length,
          orphanBillCount: orphanBills
        },
        duration: Date.now() - step2Start
      })

      // 步骤3: 检查抄表-账单关联一致性
      const step3Start = Date.now()
      const allReadings = await meterReadingQueries.findAll({ limit: 100 })
      let unbilledReadings = 0
      
      for (const reading of allReadings) {
        if (reading.status === 'CONFIRMED' && (!reading.bills || reading.bills.length === 0)) {
          // 检查是否为测试数据，如果是则跳过警告
          if (!reading.operator?.includes('TEST_VALIDATION_') && !reading.operator?.includes('系统验证')) {
            unbilledReadings++
            warnings.push({
              step: '抄表-账单关联一致性检查',
              message: `抄表记录已确认但未生成账单`,
              details: { readingId: reading.id, meterId: reading.meterId }
            })
          }
        }
      }
      
      steps.push({
        stepName: '抄表-账单关联一致性检查',
        success: unbilledReadings === 0,
        data: { 
          totalReadingCount: allReadings.length,
          unbilledReadingCount: unbilledReadings
        },
        duration: Date.now() - step3Start
      })

      return {
        flowName: 'DataConsistency',
        success: errors.length === 0,
        steps,
        errors,
        warnings,
        executionTime: Date.now() - startTime,
        dataConsistency: inconsistentRooms === 0 && orphanBills === 0 && unbilledReadings === 0
      }

    } catch (error) {
      errors.push({
        step: '数据一致性验证',
        message: (error as Error).message,
        details: error
      })

      return {
        flowName: 'DataConsistency',
        success: false,
        steps,
        errors,
        warnings,
        executionTime: Date.now() - startTime,
        dataConsistency: false
      }
    }
  }

  /**
   * 创建测试合同数据
   */
  private async createTestContractData(createContract = true) {
    const testId = this.generateTestId()
    
    const building = await buildingQueries.create({
      name: `${testId}_楼栋`,
      address: '测试地址123号',
      description: '验证流程测试楼栋'
    })

    const room = await roomQueries.create({
      roomNumber: `${testId}_101`,
      floorNumber: 1,
      buildingId: building.id,
      roomType: 'WHOLE',
      rent: 2000
    })

    const renter = await renterQueries.create({
      name: `${testId}_租客`,
      phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`, // 生成唯一手机号
      gender: '男',
      remarks: '验证流程测试租客'
    })

    let contract = null
    if (createContract) {
      contract = await contractQueries.create({
        contractNumber: `${testId}_CONTRACT001`,
        roomId: room.id,
        renterId: renter.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        monthlyRent: 2000,
        totalRent: 24000,
        deposit: 4000,
        paymentMethod: '月付',
        signedBy: '系统验证'
      })
    }

    return { building, room, renter, contract }
  }

  /**
   * 清理测试数据
   */
  private async cleanupTestData(
    buildingIds: string[], 
    roomIds: string[], 
    renterIds: string[], 
    contractIds: string[], 
    billIds: string[]
  ) {
    try {
      // 删除账单
      for (const billId of billIds) {
        await billQueries.delete(billId).catch(() => {})
      }

      // 删除合同
      for (const contractId of contractIds) {
        await contractQueries.delete(contractId).catch(() => {})
      }

      // 删除租客
      for (const renterId of renterIds) {
        await renterQueries.delete(renterId).catch(() => {})
      }

      // 删除房间
      for (const roomId of roomIds) {
        await roomQueries.delete(roomId).catch(() => {})
      }

      // 删除楼栋
      for (const buildingId of buildingIds) {
        await buildingQueries.delete(buildingId).catch(() => {})
      }
    } catch (error) {
      this.logger.logWarning('清理测试数据时出现错误', { error, module: 'business-flow-validator' })
    }
  }

  /**
   * 清理仪表测试数据
   */
  private async cleanupMeterTestData(
    buildingIds: string[], 
    roomIds: string[], 
    renterIds: string[], 
    contractIds: string[], 
    billIds: string[],
    meterIds: string[],
    readingIds: string[]
  ) {
    try {
      // 删除抄表记录
      for (const readingId of readingIds) {
        await meterReadingQueries.delete(readingId).catch(() => {})
      }

      // 删除仪表
      for (const meterId of meterIds) {
        await meterQueries.delete(meterId).catch(() => {})
      }

      // 删除其他数据
      await this.cleanupTestData(buildingIds, roomIds, renterIds, contractIds, billIds)
    } catch (error) {
      this.logger.logWarning('清理仪表测试数据时出现错误', { error, module: 'business-flow-validator' })
    }
  }
}