import { NextRequest } from 'next/server'
import { billQueries, contractQueries } from '@/lib/queries'
import type { BillStatus, BillType } from '@prisma/client'

/**
 * 获取账单列表API（优化版）
 * GET /api/bills
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 解析分页参数
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // 解析筛选参数
    const status = searchParams.get('status') as BillStatus | null
    const type = searchParams.get('type') as BillType | null
    const contractId = searchParams.get('contractId')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const buildingId = searchParams.get('buildingId')
    const renterId = searchParams.get('renterId')
    
    // 构建筛选条件
    const filters = {
      ...(status && { status }),
      ...(type && { type }),
      ...(contractId && { contractId }),
      ...(search && { search }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(buildingId && { buildingId }),
      ...(renterId && { renterId })
    }
    
    // 使用现有的billQueries获取数据
    const bills = await billQueries.findAll()
    
    // 应用筛选逻辑
    let filteredBills = bills
    
    if (status) {
      filteredBills = filteredBills.filter(bill => bill.status === status)
    }
    
    if (type) {
      filteredBills = filteredBills.filter(bill => bill.type === type)
    }
    
    if (contractId) {
      filteredBills = filteredBills.filter(bill => bill.contractId === contractId)
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      filteredBills = filteredBills.filter(bill => 
        bill.billNumber.toLowerCase().includes(searchLower) ||
        bill.contract.renter.name.toLowerCase().includes(searchLower) ||
        bill.contract.room.roomNumber.toLowerCase().includes(searchLower) ||
        bill.contract.room.building.name.toLowerCase().includes(searchLower)
      )
    }
    
    // 分页处理
    const total = filteredBills.length
    const totalPages = Math.ceil(total / limit)
    const skip = (page - 1) * limit
    const paginatedBills = filteredBills.slice(skip, skip + limit)
    
    // 转换 Decimal 类型为 number
    const billsData = paginatedBills.map(bill => ({
      ...bill,
      amount: Number(bill.amount),
      receivedAmount: Number(bill.receivedAmount),
      pendingAmount: Number(bill.pendingAmount),
      contract: {
        ...bill.contract,
        monthlyRent: Number(bill.contract.monthlyRent),
        totalRent: Number(bill.contract.totalRent),
        deposit: Number(bill.contract.deposit),
        keyDeposit: bill.contract.keyDeposit ? Number(bill.contract.keyDeposit) : null,
        cleaningFee: bill.contract.cleaningFee ? Number(bill.contract.cleaningFee) : null
      }
    }))
    
    return Response.json({
      data: billsData,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    })
  } catch (error) {
    console.error('Failed to fetch bills:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 创建账单API
 * POST /api/bills
 */
export async function POST(request: NextRequest) {
  try {
    const billData = await request.json()
    
    // 基础字段验证
    if (!billData.billNumber || !billData.contractId || !billData.amount || !billData.dueDate) {
      return Response.json(
        { error: '缺少必填字段: billNumber, contractId, amount, dueDate' },
        { status: 400 }
      )
    }
    
    // 增强的数据验证
    const validationResult = await validateBillCreation(billData)
    if (!validationResult.valid) {
      return Response.json(
        { error: validationResult.error },
        { status: 400 }
      )
    }
    
    // 创建账单
    const newBill = await billQueries.create({
      billNumber: billData.billNumber,
      type: billData.type || 'OTHER',
      amount: billData.amount,
      pendingAmount: billData.pendingAmount || billData.amount,
      dueDate: new Date(billData.dueDate),
      period: billData.period,
      contractId: billData.contractId,
      paymentMethod: billData.paymentMethod || '待确定',
      operator: billData.operator || '手动创建',
      remarks: billData.remarks || `${billData.type || 'OTHER'}账单 - 手动创建`
    })
    
    // 转换 Decimal 类型
    const transformedBill = {
      ...newBill,
      amount: Number(newBill.amount),
      receivedAmount: Number(newBill.receivedAmount),
      pendingAmount: Number(newBill.pendingAmount),
      contract: {
        ...newBill.contract,
        monthlyRent: Number(newBill.contract.monthlyRent),
        totalRent: Number(newBill.contract.totalRent),
        deposit: Number(newBill.contract.deposit),
        keyDeposit: newBill.contract.keyDeposit ? Number(newBill.contract.keyDeposit) : null,
        cleaningFee: newBill.contract.cleaningFee ? Number(newBill.contract.cleaningFee) : null
      }
    }
    
    return Response.json(transformedBill)
  } catch (error) {
    console.error('账单生成失败:', error)
    return Response.json(
      { error: '账单生成失败' },
      { status: 500 }
    )
  }
}

// 验证函数
async function validateBillCreation(data: any) {
  // 合同验证
  try {
    const contract = await contractQueries.findById(data.contractId)
    if (!contract || contract.status !== 'ACTIVE') {
      return { valid: false, error: '合同不存在或已失效' }
    }
  } catch (error) {
    return { valid: false, error: '合同验证失败' }
  }
  
  // 金额验证
  if (typeof data.amount !== 'number' || data.amount <= 0 || data.amount > 999999.99) {
    return { valid: false, error: '金额必须在0.01-999999.99之间' }
  }
  
  // 日期验证
  const dueDate = new Date(data.dueDate)
  if (isNaN(dueDate.getTime()) || dueDate < new Date()) {
    return { valid: false, error: '到期日期格式错误或早于今天' }
  }
  
  // 账单编号格式验证
  if (!/^BILL[A-Z0-9]{6,12}$/.test(data.billNumber)) {
    return { valid: false, error: '账单编号格式不正确' }
  }
  
  return { valid: true }
}