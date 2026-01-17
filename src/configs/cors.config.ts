export const corsOptions = {
  origin: ['http://localhost:3000'],
  // origin: true, // Accept mọi origin, browser gửi từ http://example.com thì trả về Access-Control-Allow-Origin: http://example.com
  credentials: true, // chấp nhận nhận credentials từ FE (cookie, header Authorization)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}