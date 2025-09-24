import { NextRequest, NextResponse } from 'next/server'
import { dataConsistencyChecker, type ConsistencyIssue } from '@/lib/data-consistency-checker'
import { dataRepairer } from '@/lib/data-repairer'

/**
 * 数据一致性检查和修复API
 * GET /api/data-consistency - 执行数据一致性检查
 * POST /api/data-consistency - 执行数据修复
 */

/**
 * 执行数据一致性检查
 */
export async function GET() {
  try {
    console.log('[一致性API] 开始执行数据一致性检查')
    
    const report = await dataConsistencyChecker.performFullConsistencyCheck()
    
    const response = {
      success: true,
      data: {
        timestamp: report.timestamp,
        summary: report.summary,
        checks: report.checks.map(check => ({
          name: check.name,
          passed: check.passed,
          issueCount: check.issues.length,
          executedAt: check.executedAt
        })),
        issues: report.checks.flatMap(check => check.issues),
        recommendations: generateRecommendations(report)
      },
      message: report.summary.failedChecks === 0 
        ? '所有数据一致性检查通过' 
        : `发现 ${report.summary.failedChecks} 个检查失败，共 ${report.summary.criticalIssues + report.summary.highIssues + report.summary.mediumIssues + report.summary.lowIssues} 个问题`
    }
    
    console.log(`[一致性API] 检查完成: ${report.summary.passedChecks}/${report.summary.totalChecks} 通过`)
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('[一致性API] 检查失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Data consistency check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * 执行数据修复
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      issueIds = [], 
      repairOptions = {},
      performCheckFirst = true 
    } = body
    
    console.log(`[修复API] 开始数据修复: ${issueIds.length > 0 ? `指定问题 ${issueIds.length} 个` : '所有问题'}`)
    
    let issuesToRepair: ConsistencyIssue[] = []
    
    if (performCheckFirst || issueIds.length === 0) {
      // 先执行检查获取问题列表
      const report = await dataConsistencyChecker.performFullConsistencyCheck()
      const allIssues = report.checks.flatMap(check => check.issues)
      
      if (issueIds.length > 0) {
        // 修复指定问题
        issuesToRepair = allIssues.filter(issue => 
          issue.id && issueIds.includes(issue.id)
        )
      } else {
        // 修复所有问题
        issuesToRepair = allIssues
      }
    }
    
    if (issuesToRepair.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalIssues: 0,
          repairedIssues: 0,
          skippedIssues: 0,
          failedIssues: 0,
          errors: [],
          executionTime: 0
        },
        message: '没有发现需要修复的问题'
      })
    }
    
    // 执行修复
    const repairResult = await dataRepairer.repairDataInconsistencies(
      issuesToRepair,
      repairOptions
    )
    
    const response = {
      success: repairResult.failedIssues === 0,
      data: repairResult,
      message: `修复完成: 成功 ${repairResult.repairedIssues} 个, 跳过 ${repairResult.skippedIssues} 个, 失败 ${repairResult.failedIssues} 个`
    }
    
    console.log(`[修复API] 修复完成: ${response.message}`)
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('[修复API] 修复失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Data repair failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * 生成修复建议
 */
function generateRecommendations(report: any): string[] {
  const recommendations = []
  
  if (report.summary.criticalIssues > 0) {
    recommendations.push('发现关键问题，建议立即处理以避免数据损坏')
  }
  
  if (report.summary.highIssues > 0) {
    recommendations.push('发现高优先级问题，建议尽快修复以确保数据准确性')
  }
  
  if (report.summary.mediumIssues > 0) {
    recommendations.push('发现中等优先级问题，建议在维护窗口期间修复')
  }
  
  if (report.summary.lowIssues > 0) {
    recommendations.push('发现低优先级问题，可在系统空闲时修复')
  }
  
  if (report.summary.failedChecks === 0) {
    recommendations.push('所有数据一致性检查通过，系统数据状态良好')
  }
  
  // 根据具体问题类型添加建议
  const allIssues = report.checks.flatMap((check: any) => check.issues)
  const issueTypes = [...new Set(allIssues.map((issue: any) => issue.type))]
  
  if (issueTypes.includes('AMOUNT_INCONSISTENCY')) {
    recommendations.push('建议检查账单金额计算逻辑，确保收款记录准确')
  }
  
  if (issueTypes.includes('MISSING_BILL_DETAILS')) {
    recommendations.push('建议运行账单明细修复工具，补充缺失的明细数据')
  }
  
  if (issueTypes.includes('ORPHANED_BILLED_STATUS')) {
    recommendations.push('建议检查抄表状态同步机制，确保状态更新正确')
  }
  
  return recommendations
}