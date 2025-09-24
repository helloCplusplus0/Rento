import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始创建种子数据...')

  // 创建楼栋A
  const buildingA = await prisma.building.create({
    data: {
      name: '平安寓6688_A栋',
      address: '深圳市南山区科技园',
      totalRooms: 6,
      description: 'A栋主要为合租房型',
    },
  })

  // 创建楼栋B
  const buildingB = await prisma.building.create({
    data: {
      name: '平安寓6688_B栋',
      address: '深圳市南山区科技园',
      totalRooms: 8,
      description: 'B栋包含整租和合租房型',
    },
  })

  console.log('楼栋创建完成:', { buildingA: buildingA.name, buildingB: buildingB.name })

  // 创建A栋房间
  const roomsA = await Promise.all([
    prisma.room.create({
      data: {
        roomNumber: '101',
        floorNumber: 1,
        buildingId: buildingA.id,
        roomType: 'SHARED',
        area: 20.5,
        rent: 1200,
        status: 'VACANT',
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: '201',
        floorNumber: 2,
        buildingId: buildingA.id,
        roomType: 'SHARED',
        area: 22.0,
        rent: 1300,
        status: 'OCCUPIED',
        currentRenter: '张三',
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: '202',
        floorNumber: 2,
        buildingId: buildingA.id,
        roomType: 'SHARED',
        area: 18.5,
        rent: 1100,
        status: 'VACANT',
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: '301',
        floorNumber: 3,
        buildingId: buildingA.id,
        roomType: 'SHARED',
        area: 25.0,
        rent: 1400,
        status: 'OVERDUE',
        currentRenter: '李四',
        overdueDays: 15,
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: '302',
        floorNumber: 3,
        buildingId: buildingA.id,
        roomType: 'SHARED',
        area: 19.0,
        rent: 1150,
        status: 'MAINTENANCE',
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: '303',
        floorNumber: 3,
        buildingId: buildingA.id,
        roomType: 'SHARED',
        area: 21.5,
        rent: 1250,
        status: 'VACANT',
      },
    }),
  ])

  // 创建B栋房间
  const roomsB = await Promise.all([
    prisma.room.create({
      data: {
        roomNumber: '101',
        floorNumber: 1,
        buildingId: buildingB.id,
        roomType: 'WHOLE',
        area: 45.0,
        rent: 2800,
        status: 'OCCUPIED',
        currentRenter: '王五',
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: '102',
        floorNumber: 1,
        buildingId: buildingB.id,
        roomType: 'WHOLE',
        area: 42.0,
        rent: 2600,
        status: 'VACANT',
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: '201',
        floorNumber: 2,
        buildingId: buildingB.id,
        roomType: 'SHARED',
        area: 20.0,
        rent: 1200,
        status: 'OCCUPIED',
        currentRenter: '赵六',
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: '202',
        floorNumber: 2,
        buildingId: buildingB.id,
        roomType: 'SHARED',
        area: 22.5,
        rent: 1350,
        status: 'VACANT',
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: '301',
        floorNumber: 3,
        buildingId: buildingB.id,
        roomType: 'SINGLE',
        area: 15.0,
        rent: 900,
        status: 'OCCUPIED',
        currentRenter: '孙七',
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: '302',
        floorNumber: 3,
        buildingId: buildingB.id,
        roomType: 'SINGLE',
        area: 16.5,
        rent: 950,
        status: 'OVERDUE',
        currentRenter: '周八',
        overdueDays: 7,
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: '401',
        floorNumber: 4,
        buildingId: buildingB.id,
        roomType: 'WHOLE',
        area: 50.0,
        rent: 3200,
        status: 'VACANT',
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: '402',
        floorNumber: 4,
        buildingId: buildingB.id,
        roomType: 'WHOLE',
        area: 48.0,
        rent: 3000,
        status: 'MAINTENANCE',
      },
    }),
  ])

  console.log('房间创建完成:', { 
    buildingA: roomsA.length, 
    buildingB: roomsB.length 
  })

  // 创建租客
  const renters = await Promise.all([
    prisma.renter.create({
      data: {
        name: '张三',
        gender: '男',
        phone: '13800138001',
        idCard: '440300199001011001',
        emergencyContact: '张父',
        emergencyPhone: '13800138002',
        occupation: '软件工程师',
        company: '腾讯科技',
        moveInDate: new Date('2024-01-15'),
        tenantCount: 1,
        remarks: '工作稳定，按时缴费',
      },
    }),
    prisma.renter.create({
      data: {
        name: '李四',
        gender: '女',
        phone: '13800138003',
        idCard: '440300199002021002',
        emergencyContact: '李母',
        emergencyPhone: '13800138004',
        occupation: '产品经理',
        company: '华为技术',
        moveInDate: new Date('2024-02-01'),
        tenantCount: 1,
        remarks: '偶尔出差，需要灵活付款',
      },
    }),
    prisma.renter.create({
      data: {
        name: '王五',
        gender: '男',
        phone: '13800138005',
        idCard: '440300199003031003',
        emergencyContact: '王妻',
        emergencyPhone: '13800138006',
        occupation: '设计师',
        company: '字节跳动',
        moveInDate: new Date('2024-01-20'),
        tenantCount: 2,
        remarks: '夫妻两人，有宠物猫',
      },
    }),
    prisma.renter.create({
      data: {
        name: '赵六',
        gender: '女',
        phone: '13800138007',
        idCard: '440300199004041004',
        emergencyContact: '赵姐',
        emergencyPhone: '13800138008',
        occupation: '市场专员',
        company: '阿里巴巴',
        moveInDate: new Date('2024-03-01'),
        tenantCount: 1,
        remarks: '性格开朗，与室友相处融洽',
      },
    }),
    prisma.renter.create({
      data: {
        name: '孙七',
        gender: '男',
        phone: '13800138009',
        idCard: '440300199005051005',
        emergencyContact: '孙父',
        emergencyPhone: '13800138010',
        occupation: '销售经理',
        company: '平安保险',
        moveInDate: new Date('2024-02-15'),
        tenantCount: 1,
        remarks: '经常加班，作息不规律',
      },
    }),
    prisma.renter.create({
      data: {
        name: '周八',
        gender: '女',
        phone: '13800138011',
        idCard: '440300199006061006',
        emergencyContact: '周母',
        emergencyPhone: '13800138012',
        occupation: '教师',
        company: '深圳中学',
        moveInDate: new Date('2024-01-10'),
        tenantCount: 1,
        remarks: '作息规律，爱好阅读',
      },
    }),
  ])

  console.log('租客创建完成:', renters.length)

  // 创建合同
  const contracts = await Promise.all([
    // 张三的合同 (A栋201)
    prisma.contract.create({
      data: {
        contractNumber: 'CT202401001',
        roomId: roomsA[1].id, // A栋201
        renterId: renters[0].id, // 张三
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-07-14'),
        monthlyRent: 1300,
        totalRent: 7800,
        deposit: 1300,
        keyDeposit: 200,
        cleaningFee: 100,
        status: 'ACTIVE',
        businessStatus: '在租中',
        paymentMethod: '月付',
        paymentTiming: '每月15日前',
        signedBy: '物业管理员',
        signedDate: new Date('2024-01-15'),
      },
    }),
    // 李四的合同 (A栋301)
    prisma.contract.create({
      data: {
        contractNumber: 'CT202402001',
        roomId: roomsA[3].id, // A栋301
        renterId: renters[1].id, // 李四
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-01'),
        monthlyRent: 1400,
        totalRent: 8400,
        deposit: 1400,
        keyDeposit: 200,
        status: 'ACTIVE',
        businessStatus: '逾期中',
        paymentMethod: '季付',
        paymentTiming: '每季度首月1日前',
        signedBy: '物业管理员',
        signedDate: new Date('2024-02-01'),
      },
    }),
    // 王五的合同 (B栋101)
    prisma.contract.create({
      data: {
        contractNumber: 'CT202401002',
        roomId: roomsB[0].id, // B栋101
        renterId: renters[2].id, // 王五
        startDate: new Date('2024-01-20'),
        endDate: new Date('2025-01-19'),
        monthlyRent: 2800,
        totalRent: 33600,
        deposit: 5600,
        keyDeposit: 300,
        cleaningFee: 200,
        status: 'ACTIVE',
        businessStatus: '在租中',
        paymentMethod: '季付',
        paymentTiming: '每季度首月15日前',
        signedBy: '物业管理员',
        signedDate: new Date('2024-01-20'),
      },
    }),
    // 赵六的合同 (B栋201)
    prisma.contract.create({
      data: {
        contractNumber: 'CT202403001',
        roomId: roomsB[2].id, // B栋201
        renterId: renters[3].id, // 赵六
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-09-01'),
        monthlyRent: 1200,
        totalRent: 7200,
        deposit: 1200,
        keyDeposit: 200,
        status: 'ACTIVE',
        businessStatus: '在租中',
        paymentMethod: '月付',
        paymentTiming: '每月1日前',
        signedBy: '物业管理员',
        signedDate: new Date('2024-03-01'),
      },
    }),
    // 孙七的合同 (B栋301)
    prisma.contract.create({
      data: {
        contractNumber: 'CT202402002',
        roomId: roomsB[4].id, // B栋301
        renterId: renters[4].id, // 孙七
        startDate: new Date('2024-02-15'),
        endDate: new Date('2024-08-15'),
        monthlyRent: 900,
        totalRent: 5400,
        deposit: 900,
        keyDeposit: 150,
        status: 'ACTIVE',
        businessStatus: '在租中',
        paymentMethod: '月付',
        paymentTiming: '每月15日前',
        signedBy: '物业管理员',
        signedDate: new Date('2024-02-15'),
      },
    }),
    // 周八的合同 (B栋302)
    prisma.contract.create({
      data: {
        contractNumber: 'CT202401003',
        roomId: roomsB[5].id, // B栋302
        renterId: renters[5].id, // 周八
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-07-10'),
        monthlyRent: 950,
        totalRent: 5700,
        deposit: 950,
        keyDeposit: 150,
        status: 'ACTIVE',
        businessStatus: '逾期中',
        paymentMethod: '月付',
        paymentTiming: '每月10日前',
        signedBy: '物业管理员',
        signedDate: new Date('2024-01-10'),
      },
    }),
  ])

  console.log('合同创建完成:', contracts.length)

  // 创建账单
  const bills = []
  
  // 为每个合同创建不同类型的账单
  for (const contract of contracts) {
    const startMonth = new Date(contract.startDate)
    const currentDate = new Date()
    
    let billMonth = new Date(startMonth)
    let billCount = 0
    
    // 创建押金账单 (合同开始时)
    const depositBillNumber = `BILL${contract.contractNumber.slice(-3)}DEP${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    const depositBill = await prisma.bill.create({
      data: {
        billNumber: depositBillNumber,
        type: 'DEPOSIT',
        amount: contract.deposit,
        receivedAmount: contract.deposit,
        pendingAmount: 0,
        dueDate: new Date(contract.startDate),
        paidDate: new Date(contract.startDate),
        period: `${contract.startDate.toISOString().slice(0, 10)} 至 ${contract.endDate.toISOString().slice(0, 10)}`,
        status: 'PAID',
        contractId: contract.id,
        paymentMethod: '微信',
        operator: '系统管理员',
        remarks: '押金已收取',
      },
    })
    bills.push(depositBill)
    
    // 创建租金账单
    while (billMonth <= currentDate && billCount < 6) {
      const billNumber = `BILL${contract.contractNumber.slice(-3)}${String(billMonth.getMonth() + 1).padStart(2, '0')}${String(billMonth.getFullYear()).slice(-2)}${String(billCount + 1).padStart(2, '0')}`
      
      const dueDate = new Date(billMonth)
      dueDate.setDate(15) // 每月15日到期
      
      // 计算账单周期 (当月1日到月末)
      const periodStart = new Date(billMonth.getFullYear(), billMonth.getMonth(), 1)
      const periodEnd = new Date(billMonth.getFullYear(), billMonth.getMonth() + 1, 0)
      
      const isOverdue = dueDate < currentDate
      const isPaid = Math.random() > 0.3 // 70% 概率已付款
      
      const bill = await prisma.bill.create({
        data: {
          billNumber,
          type: 'RENT',
          amount: contract.monthlyRent,
          receivedAmount: isPaid ? contract.monthlyRent : 0,
          pendingAmount: isPaid ? 0 : contract.monthlyRent,
          dueDate,
          paidDate: isPaid ? new Date(dueDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          period: `${periodStart.toISOString().slice(0, 10)} 至 ${periodEnd.toISOString().slice(0, 10)}`,
          status: isPaid ? 'PAID' : (isOverdue ? 'OVERDUE' : 'PENDING'),
          contractId: contract.id,
          paymentMethod: isPaid ? (Math.random() > 0.5 ? '微信' : '支付宝') : null,
          operator: isPaid ? '系统管理员' : null,
          remarks: isOverdue && !isPaid ? '已逾期，需要催收' : null,
        },
      })
      
      bills.push(bill)
      
      // 下个月
      billMonth.setMonth(billMonth.getMonth() + 1)
      billCount++
    }
    
    // 为部分合同创建水电费账单
      if (Math.random() > 0.5) {
        const utilityMonth = new Date(currentDate)
        utilityMonth.setMonth(utilityMonth.getMonth() - 1) // 上个月的水电费
        
        const utilityPeriodStart = new Date(utilityMonth.getFullYear(), utilityMonth.getMonth(), 1)
        const utilityPeriodEnd = new Date(utilityMonth.getFullYear(), utilityMonth.getMonth() + 1, 0)
        
        const utilityBillNumber = `BILL${contract.contractNumber.slice(-3)}UTL${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
        const utilityBill = await prisma.bill.create({
          data: {
            billNumber: utilityBillNumber,
            type: 'UTILITIES',
            amount: 150 + Math.random() * 100, // 150-250元的水电费
            receivedAmount: Math.random() > 0.4 ? 0 : 150 + Math.random() * 100,
            pendingAmount: Math.random() > 0.4 ? 150 + Math.random() * 100 : 0,
            dueDate: new Date(utilityPeriodEnd.getTime() + 10 * 24 * 60 * 60 * 1000), // 月末后10天到期
            paidDate: Math.random() > 0.4 ? null : new Date(),
            period: `${utilityPeriodStart.toISOString().slice(0, 10)} 至 ${utilityPeriodEnd.toISOString().slice(0, 10)}`,
            status: Math.random() > 0.4 ? 'PENDING' : 'PAID',
            contractId: contract.id,
            paymentMethod: Math.random() > 0.4 ? null : '现金',
            operator: Math.random() > 0.4 ? null : '物业管理员',
            remarks: '包含电费、冷水费、热水费',
          },
        })
        bills.push(utilityBill)
      }
      
      // 为部分合同创建其他费用账单
      if (Math.random() > 0.7) {
        const otherBillNumber = `BILL${contract.contractNumber.slice(-3)}OTH${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
        const otherBill = await prisma.bill.create({
          data: {
            billNumber: otherBillNumber,
            type: 'OTHER',
            amount: 50 + Math.random() * 50, // 50-100元的其他费用
            receivedAmount: 0,
            pendingAmount: 50 + Math.random() * 50,
            dueDate: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7天后到期
            paidDate: null,
            period: `${currentDate.toISOString().slice(0, 10)} 至 ${new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}`,
            status: 'PENDING',
            contractId: contract.id,
            paymentMethod: null,
            operator: null,
            remarks: '维修费用/清洁费用',
          },
        })
        bills.push(otherBill)
      }
  }

  console.log('账单创建完成:', bills.length)

  // 更新楼栋的房间总数
  await prisma.building.update({
    where: { id: buildingA.id },
    data: { totalRooms: roomsA.length }
  })

  await prisma.building.update({
    where: { id: buildingB.id },
    data: { totalRooms: roomsB.length }
  })

  console.log('种子数据创建完成!')
  console.log('统计:')
  console.log(`- 楼栋: 2个`)
  console.log(`- 房间: ${roomsA.length + roomsB.length}个`)
  console.log(`- 租客: ${renters.length}个`)
  console.log(`- 合同: ${contracts.length}个`)
  console.log(`- 账单: ${bills.length}个`)
}

main()
  .catch((e) => {
    console.error('种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })