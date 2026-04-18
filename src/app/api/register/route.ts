import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  sendSuccess, 
  sendUnauthorized, 
  sendForbidden, 
  sendError, 
  sendServerError 
} from "@/lib/api-utils";

export async function POST(req: Request) {
  try {
    // SECURITY: Only Admin or Manager can register new users
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return sendUnauthorized();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUser = session.user as any;
    if (!['admin', 'manager'].includes(currentUser.role)) {
      return sendForbidden('คุณไม่มีสิทธิ์ในการสร้างผู้ใช้งานใหม่');
    }

    const body = await req.json();
    const { name, email, password, role, department } = body;

    if (!name || !email || !password) {
      return sendError("กรุณากรอกข้อมูลพื้นฐานให้ครบถ้วน (ชื่อ, อีเมล, รหัสผ่าน)");
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendError("อีเมลนี้ถูกใช้งานไปแล้วในระบบ", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "employee",
        department: department || null,
      },
    });

    // Create audit log for security tracking
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "USER",
        entityId: newUser.id,
        entityName: newUser.name,
        performedById: currentUser.id,
        performedByName: currentUser.name,
        performedByRole: currentUser.role,
        details: `Created new user: ${newUser.name} with role ${newUser.role}`,
      }
    });

    // Don't return the password
    const { password: _, ...userWithoutPassword } = newUser;

    return sendSuccess(userWithoutPassword, "ลงทะเบียนผู้ใช้งานใหม่สำเร็จ");
  } catch (error) {
    return sendServerError(error);
  }
}
