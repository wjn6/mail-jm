import type { TagProps } from 'element-plus'

const TRANSACTION_TYPE_TEXT_MAP: Record<string, string> = {
  RECHARGE: '充值',
  CONSUME: '消费',
  REFUND: '退款',
  FREEZE: '冻结',
  UNFREEZE: '解冻',
  ADJUST: '调整'
}

const TRANSACTION_TYPE_TAG_MAP: Record<string, TagProps['type']> = {
  RECHARGE: 'success',
  CONSUME: 'danger',
  REFUND: 'warning',
  FREEZE: 'info',
  UNFREEZE: 'info',
  ADJUST: 'primary'
}

export function getTransactionTypeText(type?: string): string {
  if (!type) return '-'
  return TRANSACTION_TYPE_TEXT_MAP[type] || type
}

export function getTransactionTypeTagType(type?: string): TagProps['type'] {
  if (!type) return 'info'
  return TRANSACTION_TYPE_TAG_MAP[type] || 'info'
}
