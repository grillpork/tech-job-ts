import { NextResponse } from 'next/server';

/**
 * Standard API Response Structure
 */
export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
  requestId: string;
  error?: any;
};

/**
 * Send a standardized success response
 */
export function sendSuccess<T = any>(data: T, message: string = 'ดำเนินการสำเร็จ') {
  return NextResponse.json({
    success: true,
    message,
    data,
    requestId: crypto.randomUUID(),
  } as ApiResponse<T>);
}

/**
 * Send a standardized error response
 */
export function sendError(message: string, status: number = 400, error?: any) {
  return NextResponse.json({
    success: false,
    message,
    requestId: crypto.randomUUID(),
    error: error || undefined,
  } as ApiResponse, { status });
}

/**
 * Helper to handle session errors
 */
export function sendUnauthorized(message: string = 'สิทธิ์การเข้าถึงไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่') {
  return sendError(message, 401);
}

/**
 * Helper to handle forbidden errors (role issues)
 */
export function sendForbidden(message: string = 'คุณไม่มีสิทธิ์เข้าถึงฟีเจอร์นี้') {
  return sendError(message, 403);
}

/**
 * Helper to handle internal server errors
 */
export function sendServerError(error: any, message: string = 'เกิดข้อผิดพลาดภายในระบบ กรุณาติดต่อผู้ดูแล') {
  console.error("API ERROR:", error);
  return sendError(message, 500, process.env.NODE_ENV === 'development' ? error : undefined);
}
