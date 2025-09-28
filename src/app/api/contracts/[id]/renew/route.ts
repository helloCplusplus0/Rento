import { NextRequest } from 'next/server'
import { contractQueries, roomQueries } from '@/lib/queries'
import { generateBillsOnContractSigned } from '@/lib/auto-bill-generator'
import { prisma } from '@/lib/prisma'
import { 
  withApiErrorHandler, 
  createSuccessResponse,
  parseRequestBody,
  validateRequired
} from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'

/**
 * 合同续租API
 * POST /api/contracts/[id]/renew
 * 
 * 根据renew_lease_chart.md设计实现续租功能
 * 复用现有的合同创建和账单生成逻辑
 */
async function handleRenewContract(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: originalContractId } = await params
  const body = await parseRequestBody(request)
  
  const {
    newStartDate,
    newEndDate,
    newMonthlyRent,
    newDeposit,
    newKeyDeposit,
    newCleaningFee,
    paymentMethod,
    paymentTiming,
    signedBy,
    signedDate,
    remarks
  } = body

  // 基础字段验证
  validateRequired(body, ['newStartDate', 'newEndDate', 'newMonthlyRent'])

  // 验证日期
  const start = new Date(newStartDate)
  const end = new Date(newEndDate)
  if (end <= start) {
    throw new Error('结束日期必须晚于开始日期')
  }

  // 验证金额
  if (newMonthlyRent <= 0) {
    throw new Error('租金必须大于0')
  }

  // 开始数据库事务
  return await prisma.$transaction(async (tx) => {
    // 1. 查询原合同详情
    const originalContract = await tx.contract.findUnique({
      where: { id: originalContractId },
      include: {
        room: { include: { building: true } },
        renter: true,
        bills: true
      }
    })

    if (!originalContract) {
      throw new Error('原合同不存在')
    }

    // 2. 业务验证阶段
    // 检查原合同状态
    if (!['ACTIVE', 'EXPIRED'].includes(originalContract.status)) {
      throw new Error(`合同状态不允许续租，当前状态：${originalContract.status}`)
    }

    // 检查房间可用性
    if (originalContract.room.status !== 'OCCUPIED') {
      throw new Error(`房间状态异常，当前状态：${originalContract.room.status}`)
    }

    // 检查未结清账单 - 只检查PENDING和OVERDUE状态的账单
    const unpaidBills = originalContract.bills.filter(bill => 
      ['PENDING', 'OVERDUE'].includes(bill.status)
    )
    if (unpaidBills.length > 0) {
      throw new Error(`存在${unpaidBills.length}个未结清账单，请先处理完毕再续租`)
    }

    // 3. 更新原合同状态为EXPIRED
    await tx.contract.update({
      where: { id: originalContractId },
      data: { 
        status: 'EXPIRED',
        updatedAt: new Date()
      }
    })

    // 4. 创建新续租合同(复用添加合同逻辑)
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const contractNumber = `CT${year}${month}${String(Date.now()).slice(-6)}`

    // 计算总租金 - 修复月份计算逻辑
    const calculateMonthsDifference = (startDate: Date, endDate: Date): number => {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      // 计算总天数
      const timeDiff = end.getTime() - start.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1 // +1 包含结束日期当天
      
      // 对于标准租期，按天数计算更准确
      if (daysDiff >= 365) {
        // 一年或以上，按年计算
        const years = Math.floor(daysDiff / 365)
        return years * 12
      } else if (daysDiff >= 30) {
        // 按月计算，每30天为一个月
        return Math.ceil(daysDiff / 30)
      } else {
        // 不足30天，按1个月计算
        return 1
      }
    }

    const monthsDiff = calculateMonthsDifference(start, end)
    const totalRent = newMonthlyRent * monthsDiff

    // 创建新合同，继承原合同的基础信息
    const newContract = await tx.contract.create({
      data: {
        contractNumber,
        roomId: originalContract.roomId,
        renterId: originalContract.renterId,
        startDate: start,
        endDate: end,
        monthlyRent: newMonthlyRent,
        totalRent,
        deposit: newDeposit || originalContract.deposit,
        keyDeposit: newKeyDeposit !== undefined ? newKeyDeposit : originalContract.keyDeposit,
        cleaningFee: newCleaningFee !== undefined ? newCleaningFee : originalContract.cleaningFee,
        paymentMethod: paymentMethod || originalContract.paymentMethod,
        paymentTiming: paymentTiming || originalContract.paymentTiming,
        signedBy: signedBy || originalContract.signedBy,
        signedDate: signedDate ? new Date(signedDate) : new Date(),
        remarks: remarks ? `续租自合同${originalContract.contractNumber}。${remarks}` : `续租自合同${originalContract.contractNumber}`,
        status: 'ACTIVE'
      },
      include: {
        room: { include: { building: true } },
        renter: true
      }
    })

    // 5. 更新房间租赁信息（保持OCCUPIED状态）
    await tx.room.update({
      where: { id: originalContract.roomId },
      data: {
        currentRenter: originalContract.renter.name,
        updatedAt: new Date()
      }
    })

    return newContract
  })
}

/**
 * 续租后账单生成
 * 在事务外调用，避免事务过长
 */
async function handleRenewContractWithBills(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 先执行续租事务
  const newContract = await handleRenewContract(request, { params })
  
  // 5. 账单生成阶段(复用添加合同账单生成)
  try {
    await generateBillsOnContractSigned(newContract.id)
  } catch (error) {
    console.error('续租账单生成失败:', error)
    // 账单生成失败不影响续租成功，记录错误即可
  }

  // 返回续租成功信息
  return createSuccessResponse({
    originalContractId: (await params).id,
    newContract: {
      ...newContract,
      monthlyRent: Number(newContract.monthlyRent),
      totalRent: Number(newContract.totalRent),
      deposit: Number(newContract.deposit),
      keyDeposit: newContract.keyDeposit ? Number(newContract.keyDeposit) : null,
      cleaningFee: newContract.cleaningFee ? Number(newContract.cleaningFee) : null
    }
  }, '续租成功')
}

export const POST = withApiErrorHandler(handleRenewContractWithBills, {
  module: 'renew-contract-api',
  errorType: ErrorType.VALIDATION_ERROR,
  enableFallback: true
})