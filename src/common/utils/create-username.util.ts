// utils/username.ts
import { uniqueNamesGenerator, Config, colors, animals } from 'unique-names-generator'

// Cấu hình mặc định
const usernameConfig: Config = {
  dictionaries: [colors, animals],
  separator: '-',
  length: 2,
  style: 'lowerCase',
}

// Hàm tạo username ngẫu nhiên
export function generateUsername(): string {
  const name = uniqueNamesGenerator(usernameConfig)
  const randomSuffix = Math.floor(Math.random() * 10000)
  return `${name}-${randomSuffix}`
}
