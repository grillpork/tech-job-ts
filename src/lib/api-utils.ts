import { NextResponse } from 'next/server';

/**
 * ส่ง Response เมื่อสำเร็จ (200 OK)
 */
export function sendSuccess(data: any, message: string = 'ดำเนินการสำเร็จ') {
  return NextResponse.json({
    success: true,
    message,
    data: data ?? null,
  }, { status: 200 });
}

/**
 * ส่ง Response เมื่อเกิดข้อผิดพลาดทั่วไป (ค่าเริ่มต้น 400 Bad Request)
 */
export function sendError(message: string, status: number = 400) {
  return NextResponse.json({
    success: false,
    message,
  }, { status });
}

/**
 * ส่ง Response เมื่อไม่ได้รับอนุญาต (401 Unauthorized)
 */
export function sendUnauthorized(message: string = 'กรุณาเข้าสู่ระบบก่อนดำเนินการ') {
  return sendError(message, 401);
}

/**
 * ส่ง Response เมื่อไม่มีสิทธิ์เข้าถึง (403 Forbidden)
 */
export function sendForbidden(message: string = 'คุณไม่มีสิทธิ์ในการดำเนินการนี้') {
  return sendError(message, 403);
}

/**
 * ส่ง Response เมื่อเกิดข้อผิดพลาดที่ Server (500 Internal Server Error)
 */
export function sendServerError(error: any) {
  console.error('[API_ERROR]', error);
  
  const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์';
  
  return sendError(message, 500);
}
