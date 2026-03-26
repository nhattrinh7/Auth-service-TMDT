// Default userAgent khi không có thông tin thiết bị
export const DEFAULT_USER_AGENT = 'Unknown'

// Các role không phải admin → không cần trả categoryIds khi verify request
export const NON_ADMIN_ROLES = new Set([
  'CUSTOMER',
  'SELLER',
  'SHIPPER',
  'WAREHOUSE_SCANNER',
])
