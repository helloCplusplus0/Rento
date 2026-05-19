## id:TC-001
功能：导航栏 xpath:/html/body/div[2]/main/div/div/nav/div/div
测试标题：导航栏一致性
前置条件：
测试步骤：
预期效果：Rento导航栏，一个应用应该只有一个
实际结果：桌面版（置顶）和移动端（置底）同时维护了两个导航栏且功能展示不一致

## id:TC-002
功能：工作台-》财务统计 xpath:/html/body/div[2]/main/div/main/div/main/div[2]
测试标题：合适的数据刷新频率
前置条件：
测试步骤：
预期效果：该数据统计模块展示待收待付数据，通过定时拉取数据并展示，不是一个高频实时性功能，避免高频请求后端带来负担，数据刷新频率应该控制在一小时一次，而且该模块提供了手动刷新按钮
实际结果：检查该模块的数据刷新频率，如果太频繁，应该作出调整

## id:TC-003
功能：工作台-》合同到期提醒 xpath:/html/body/div[2]/main/div/main/div/main/div[4]/div[2]
测试标题：工作台提醒实现合理性
前置条件：
测试步骤：
预期效果：工作台应该汇总集中展示租务相关的信息提示，比如：空房，到期合同等等
实际结果：工作台已经存在一个“提醒”模块 xpath:/html/body/div[2]/main/div/main/div/main/div[4]/div[1],底部还存在一个“合同到期提醒” xpath:/html/body/div[2]/main/div/main/div/main/div[4]/div[2] 我觉得“合同到期提醒”与"提醒"功能冲突，合同到期提醒更改为“提醒”详情组件，点击“提醒”卡片，下面展示各个提醒类目详情


## id:TC-004
功能：添加房间 url:http://localhost:3001/add/room xpath:/html/body/div[2]/main/div/main/div/div
测试标题：添加房间操作合理性
前置条件：
测试步骤：点击导航栏添加-》点击添加房间卡片->添加房间操作页
预期效果：
- 首先提供building新建
- 其次提供building选择和编辑，删除（存在房间情况下，禁止直接删除building）
- 再次选中building,编辑批量添加房间
实际结果：
- 实现了building新建
- 实现了building选择，没有提供编辑和删除
- 实现了选中building并设置批量添加房间

## id:TC-005
功能：
- 房源列表 
- url: http://localhost:3001/rooms
- xpath:/html/body/div[2]/main/div/main
测试标题：检查房源列表展示合理性
前置条件：已经新建Building且添加了房间
测试步骤：
预期效果：
- 提供搜索框
- 提供按照房间状态快速筛选按钮
- 提供按照Building快速筛选按钮
- 展示响应筛选条件下的房间总数
实际结果：
- 实现搜索框
- 实现按房间状态筛选
- 缺失按Building快速筛选按钮
- 实现房间数展示仅仅展示总房间数，没有实现响应筛选条件下符合条件房间数

## id:TC-006
功能：
- 房间详情
- url: http://localhost:3001/rooms/cmg0jm5of0002rmsqqr3mx341
- xpath:/html/body/div[2]/main/div/main
测试标题：检查房间详情设计合理性
前置条件：已经新建Building且添加了房间
测试步骤：
预期效果：
- 提供编辑房间
- 提供在该房间添加合同
- 提供删除房间
- 提供手动房间状态变更
- 提供组合信息展示
- 提供仪表添加
实际结果：
- 点击“编辑房间”->GET http://localhost:3001/rooms/cmg0jm5of0002rmsqqr3mx341/edit 404 (Not Found)
- 点击“添加合同”->无响应（我们已经设计了“添加合同”模块：http://localhost:3001/add/contract 唯一不同的就是已经给定了房间，不需要再选择房间，全面分析是否可以较好的使用现有设计，不需要再设计一套“添加合同”逻辑）
- 提供了“查看账单”，我觉得账单应该跟合同更密切，不应该在房间内查看账单，应该取消
- 点击“删除房间”，可以直接删除，不过这里应该加强，从房间状态来看（空房，在租，逾期，维护中），“空房”和“维护中”应该没有绑定的合同和客户，可以直接删除，但是“在租”和“逾期”说明该房间绑定租客和合同，应该首先完结合同相关账单，租客退出房间，房间变成“空房”才能直接删除

## id:TC-007
功能：
- 仪表卡片
- url: http://localhost:3001/rooms/cmg0jm5oi0004rmsq8ngx7ndy
- xpath:/html/body/div[2]/main/div/main/div/div[5]/div/div[2]/div[1]
测试标题：检查仪表卡片设计合理性
前置条件：已经新建Building且添加了房间
测试步骤：
预期效果：
- 提供编辑仪表
- 提供删除仪表
- 提供仪表开启，禁止
实际结果：
- 实现了仪表编辑
- 实现了仪表删除，但是删除提示：该仪表所有历史数据将被永久删除，我觉得这个逻辑不对，仪表的添加和移除具有很多的场景，比如该仪表损坏，需要更换新的仪表，我们移除损坏的，添加一个新的，那么损坏的仪表之前的计量数据和由此产生的账单依旧具有存在价值，不应该由于该仪表的移除而被彻底删除，反思当前Rento仪表源代码设计中仪表是否独立于房间？我们在房间添加仪表的操作应该更像是让房间和仪表建立关联，删除仪表仅仅是取消这种关联，不应该影响该仪表所产生的历史数据
- 实现了仪表开启，禁止


## id:TC-008
功能：
- 添加租客
- url: http://localhost:3001/renters/new
- xpath:/html/body/div[2]/main/div/main
测试标题：检查添加租客功能正确性
前置条件：
测试步骤：
预期效果：
- 可以正常且正确新建住客
实际结果：
- 填写完毕关键信息-》点击创建租客按钮-》404报错，跳转地址：http://192.168.31.84:3001/renters/undefined
- 浏览器日志： Server  Failed to load renter: Error: NEXT_HTTP_ERROR_FALLBACK;404
    at RenterDetailRoute (page.tsx:34:15)


## id:TC-009
功能：
- 租客详情
- url: http://192.168.31.84:3001/renters/cmg20f7cc0001rm7z9ica763u
- xpath:/html/body/div[2]/main/div/main
测试标题：检查租客详情设计可用性
前置条件：创建租客成功
测试步骤：
预期效果：
- 展示租客创建提供的所有信息
- 展示该租客的合同信息
- 提供编辑，删除该租客信息
实际结果：
- 实现租客信息展示
- 实现租客合同展示
- 租客信息编辑，删除UI需要重构，存在重复设计和布局不合理
-- 编辑和删除操作布局可以参考房间详情设计(xpath:/html/body/div[2]/main/div/main/div/div[3])，操作入口提前
-- 设计重复，操作面板的“编辑”（xpath:/html/body/div[2]/main/div/main/div/div[3]/div[2]/div）和租客信息面板“编辑”（xpath:/html/body/div[2]/main/div/main/div/div[1]/div[1]/button）重复，应该移除租客信息面板“编辑”


## id:TC-010
功能：
- 添加合同
- url: http://192.168.31.84:3001/add/contract
- xpath:/html/body/div[2]/main/div/main/div/form
测试标题：检查添加合同功能正确性
前置条件：成功创建房间和租客
测试步骤：
预期效果：
- 提供创建合同必要的信息入口
实际结果：
- 实现了创建合同必要信息入口，但是存在如下问题：
-- 租金信息（xpath:/html/body/div[2]/main/div/main/div/form/div[4]）
   支付信息（支付方式[月付，季付，半年付，年付] xpath:/html/body/div[2]/main/div/main/div/form/div[5]）
   费用预览（xpath:/html/body/div[2]/main/div/main/div/form/div[8]）
费用预览并没有根据月租金和支付信息中的支付方式（支付周期）来关联首期缴费综合，比如：
当前月租金600，支付方式是年付，费用预览展示：月租金600，也就是默认按月收取，没有关联年付这个支付周期，正确的费用预览应该是：首期缴费租金应该显示：600*12=7200
- 还需要反思一点：当前的账单实际的设计情况是否支持月付，季付，半年付，年付之类设计，还是仅仅实现了默认按月收取？


## id:TC-011
功能：
- 合同详情
- url: http://192.168.31.84:3001/contracts/cmg2ahfh80045rmw1os0a27b0
- xpath:/html/body/div[2]/main/div/main
测试标题：检查合同详情展示正确性
前置条件：成功创建合同
测试步骤：
预期效果：
- 提供展示租客+房间信息
- 提供展示合同状态
- 提供创建合同时编辑的所有信息展示
- 提供展示属于该合同的所有账单，以由近及远排列展示
- 提供属于该合同租客信息展示
- 提供房间提供物品展示

- 提供续租操作
- 提供退租操作
- 提供删除操作
实际结果：
- 当前的合同详情展示信息简略，UI配色也不统一，需要重新设计，使得展示预期信息，提供预期操作，保持UI风格统一

## id:TC-012
功能：
- 加强版合同详情
- url: http://192.168.31.84:3001/contracts/cmg2ahfh80045rmw1os0a27b0
- xpath:/html/body/div[2]/main/div/main
测试标题：检查新版合同详情展示正确性
前置条件：成功创建合同
测试步骤：
预期效果：
- 提供展示租客+房间信息
- 提供展示合同状态
- 提供创建合同时编辑的所有信息展示
- 提供展示属于该合同的所有账单，以由近及远排列展示
- 提供属于该合同租客信息展示
- 提供房间提供物品展示

- 提供续租操作
- 提供退租操作
- 提供删除操作
实际结果：
- 实现了租客+房间信息展示，待改进点：
-- “租客信息”（xpath:/html/body/div[2]/main/div/main/div/div/div[4]/div[1]）是具备租客详情支持的，可以添加点击跳转到对应的租客详情
-- “房间信息”（xpath:/html/body/div[2]/main/div/main/div/div/div[4]/div[2]）同样具备房间详情支持的，同样应该添加点击跳转对应详情

- 实现合同状态展示
- 实现合同信息展示（存在问题：全面检查合同设计和数据模型设计的逻辑合理性，以合同CT202509669207为例，显示月租金300，总租金显示：3900，考虑是否将非租金费用混同计算）
- 实现了“账单历史”展示（存在问题：账单历史列表[xpath:/html/body/div[2]/main/div/main/div/div/div[4]/div[3]]中每一个账单具备账单详情支持，可以添加点击跳转对应账单详情）
- 实现合同隶属租客信息展示
- 实现房间提供物品展示入口

- 实现续租操作入口（待验收）
- 实现退租操作入口（待验收）
- 实现删除操作入口（待验收）
- 增加实现编辑合同入口[xpath:/html/body/div[2]/main/div/main/div/div/div[2]/button[2]]（反思，最佳实践是否应该提供合同编辑？？？）
- 增加实现pdf查看合同入口[xpath:/html/body/div[2]/main/div/main/div/div/div[2]/button[1]]（我觉得该阶段不易引入复杂性，pdf合同查看，Rento之前没有设计实现过，暂时不应该需要这个功能）


## id:TC-013
功能：
- 合同详情->续租
- url: http://192.168.31.84:3001/contracts/cmg2ahfh80045rmw1os0a27b0
- xpath:/html/body/div[2]/main/div/main/div/div/div[2]/button[2]
测试标题：检查合同详情续租功能正确性
前置条件：成功创建合同
测试步骤：
预期效果：
- renew_lease_chart.md
实际结果：
- 按照renew_lease_chart.md 时序图设计实现


- 调用账单结算逻辑，需要正确计算未结算租金，押金，还可能由其他账单：比如水电费账单等，最终的结算账单明细部分，我觉得应该以：应退，应收，汇总等部分组织展示
- 一个合同关联着：租客，房间，账单，我觉得在：合同状态更新阶段，不仅仅需要同步变更合同，房间状态，比如租客和关联账单状态均需要同步变更

## id:TC-014
功能：
- 合同详情->退租
- url: http://192.168.31.84:3001/contracts/cmg3g4r480035rm9457xnr8xt
- xpath:/html/body/div[2]/main/div/main/div/div/div[2]/button[3]
测试标题：检查合同详情退租功能正确性
前置条件：成功创建合同
测试步骤：
预期效果：
- moving_out_rental_chart.md
实际结果：
- 按照moving_out_rental_chart.md 时序图设计实现


## id:TC-015
功能：
- 合同详情->删除
- url: http://localhost:3001/contracts/cmg3g4r480035rm9457xnr8xt
- xpath:/html/body/div[2]/main/div/main/div/div/div[2]/button[2]
测试标题：检查合同详情删除功能正确性
前置条件：成功创建合同
测试步骤：
预期效果：
- delete_contract_chart.md
实际结果：
- 按照delete_contract_chart.md时序图设计实现

## id:TC-016
功能：
- 合同详情->抄表
- url: http://localhost:3001/contracts/cmg3g4r480035rm9457xnr8xt
- xpath:/html/body/div[2]/main/div/main/div/div/div[2]/button[4]
测试标题：检查合同详情抄表功能正确性
前置条件：成功创建合同
测试步骤：
预期效果：
- SingleMeterReading_chart.md
实际结果：
- 按照SingleMeterReading_chart.md时序图设计实现

## id:TC-017
功能：
- 仪表管理，抄表流程
- url: 
-- 添加仪表
-- 批量抄表
-- 单次抄表
- xpath:
-- 添加仪表
-- 批量抄表
-- 单次抄表
测试标题：检查Rento仪表管理和抄表相关功能设计正确性
前置条件：成果创建房间
测试步骤：
预期效果：
- merter_chart.md
实际结果：
- 按照merter_chart.md时序图设计实现

## id:TC-018
功能：
- 账单详情
-- url:http://192.168.31.84:3001/bills/cmg3eykse0027rm94qnbvgzsr
-- xpath:/html/body/div[2]/main/div/main
测试标题：检查Rento账单设计和功能正确性
前置条件：成果创建账单
测试步骤：
预期效果：
- 鲜明重点展示账单的关键信息
- 展示关联的合同信息
- 展示关联的租客信息

- 提供确认支付功能
- 提供账单有关时间，金额等关键字段的编辑，以应对更加广泛的场景
- 提供删除账单功能
实际结果：
- 实现了鲜明重点展示账单关键信息，UI设计在pc端展示效果符合预期，但是移动端下，租客，房间信息（xpath:/html/body/div[2]/main/div/main/div/div[1]/div[1]/div[2]/div[1]/div[1]/div）和合同编号，账单状态指示（xpath:/html/body/div[2]/main/div/main/div/div[1]/div[1]/div[2]/div[1]/div[2]）处于同一行，导致水平挤压，文本展示效果不佳
- 实现了关联合同信息展示，（可以考虑添加点击跳转到对应的合同详情）
- 实现了关联租客信息展示（可以考虑添加点击跳转到对应的租客详情）
- 账单操作功能（确认支付，编辑，删除）存在重复且需要重新设计，操作功能的UI布局位置可以参考合同详情UI操作功能位置，问题：
-- 支付状态管理(xpath:/html/body/div[2]/main/div/main/div/div[2]/div[2]/div/div)这个卡片内部的“确认支付”按钮被验证实现良好
-- 操作（xpath:/html/body/div[2]/main/div/main/div/div[3]）该卡片“确认支付”和支付状态管理卡片内的确认支付重复，功能待确认，编辑不可用，删除可用（未支付可以直接删除，已支付不能删除）