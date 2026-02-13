/**
 * API 响应类型定义模块
 *
 * 提供统一的 API 响应结构类型定义
 *
 * ## 主要功能
 *
 * - 基础响应结构定义
 * - 泛型支持（适配不同数据类型）
 * - 统一的响应格式约束
 *
 * ## 使用场景
 *
 * - API 请求响应类型约束
 * - 接口数据类型定义
 * - 响应数据解析
 *
 * @module types/common/response
 * @author Art Design Pro Team
 */

/** 基础 API 响应结构（适配接码平台后端） */
export interface BaseResponse<T = unknown> {
  /** 是否成功 */
  success: boolean
  /** 状态码（兼容旧格式） */
  code?: number
  /** 消息（兼容旧格式） */
  msg?: string
  /** 错误信息 */
  message?: string
  /** 数据 */
  data: T
  /** 时间戳 */
  timestamp?: string
}
