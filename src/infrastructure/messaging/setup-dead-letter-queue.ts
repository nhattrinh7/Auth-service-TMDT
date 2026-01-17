import * as amqp from 'amqplib'

export async function setupDeadLetterQueue() {
  try {
    const connection = await amqp.connect('amqp://admin:admin123@localhost:5672')
    const channel = await connection.createChannel()

    // Tạo Common Dead Letter Queue - DLQ chung cho tất cả service
    // Message ở đây KHÔNG retry, chỉ để lưu trữ và phân tích
    await channel.assertQueue('common_dlq', {
      durable: true,
    })
    console.log('✅ Created common_dlq')

    // Bind DLQ chung với events_exchange, nhận tất cả routing key dlq.*
    await channel.bindQueue('common_dlq', 'events_exchange', 'dlq.*')
    console.log('✅ Bound common_dlq to events_exchange with pattern dlq.*')

    await channel.close()
    await connection.close()
    console.log('✅ DLQ setup completed')
  } catch (error) {
    console.error('❌ Failed to setup DLQ:', error)
    throw error
  }
}

// Chạy script này 1 lần duy nhất: yarn setup:dlq
if (require.main === module) {
  setupDeadLetterQueue()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

// Đây là tạo 1 DeadLetterQueue chung cho tất cả các service trong hệ thống, queue này không thuộc service nào cả
// Nếu muốn consume từ queue này thì tạo 1 service riêng chỉ để consume DLQ và phân tích logs từ DLQ thôi
// Mục đích của DLQ này là lưu trữ tất cả message bị reject hoặc không thể xử lý được từ các service khác
// để sau này có thể phân tích nguyên nhân lỗi, thống kê, hoặc retry thủ công nếu cần thiết