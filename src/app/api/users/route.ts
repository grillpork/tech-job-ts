import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { 
  sendSuccess, 
  sendUnauthorized, 
  sendError, 
  sendServerError 
} from '@/lib/api-utils';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     description: Returns a list of all users ordered by join date.
 *     responses:
 *       200:
 *         description: Array of users
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return sendUnauthorized();

    const users = await prisma.user.findMany({
      orderBy: { joinedAt: 'desc' }
    });
    
    // Transform JSON strings back to objects where necessary
    const formattedUsers = users.map(user => {
      try {
        return {
          ...user,
          skills: user.skills ? JSON.parse(user.skills as string) : [],
        };
      } catch (e) {
        console.error(`Failed to parse skills for user ${user.id}:`, e);
        return { ...user, skills: [] };
      }
    });

    return sendSuccess(formattedUsers, 'ดึงข้อมูลผู้ใช้งานสำเร็จ');
  } catch (error) {
    return sendServerError(error);
  }
}

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     description: Adds a new user to the database.
 *     responses:
 *       200:
 *         description: The newly created user
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return sendUnauthorized();

    const body = await request.json();
    const { name, email, password, role, skills, ...rest } = body;

    if (!name || !email || !password) {
      return sendError("กรุณาระบุชื่อ อีเมล และรหัสผ่าน", 400);
    }

    // Check if user exists (Email)
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return sendError("อีเมลนี้มีอยู่ในระบบแล้ว", 400);
    }

    // Check if employeeId exists
    if (body.employeeId) {
      const existingId = await prisma.user.findFirst({
        where: { employeeId: body.employeeId }
      });
      if (existingId) {
        return sendError("รหัสพนักงานนี้มีอยู่ในระบบแล้ว", 400);
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'employee',
        skills: skills ? JSON.stringify(skills) : "[]",
        ...rest,
      }
    });

    const formattedUser = {
      ...newUser,
      skills: newUser.skills ? JSON.parse(newUser.skills as string) : [],
    };

    return sendSuccess(formattedUser, 'สร้างผู้ใช้งานสำเร็จ');
  } catch (error) {
    return sendServerError(error);
  }
}

/**
 * @swagger
 * /api/users:
 *   patch:
 *     summary: Update a user
 *     tags: [Users]
 *     description: Updates an existing user's information.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The updated user
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return sendUnauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return sendError("ไม่พบรหัสผู้ใช้งาน", 400);
    }

    const body = await request.json();
    const { password, skills, id: bodyId, ...rest } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataToUpdate: any = { ...rest };

    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    if (skills) {
      dataToUpdate.skills = JSON.stringify(skills);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    const formattedUser = {
      ...updatedUser,
      skills: updatedUser.skills ? JSON.parse(updatedUser.skills as string) : [],
    };

    return sendSuccess(formattedUser, 'อัปเดตข้อมูลผู้ใช้งานสำเร็จ');
  } catch (error: any) {
    // Check for Prisma unique constraint violation
    if (error.code === 'P2002') {
      const target = error.meta?.target || [];
      if (target.includes('email')) {
        return sendError('อีเมลนี้ถูกใช้งานแล้ว', 409);
      }
      if (target.includes('employeeId')) {
        return sendError('รหัสพนักงานนี้ถูกใช้งานแล้ว', 409);
      }
    }

    return sendServerError(error);
  }
}

/**
 * @swagger
 * /api/users:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     description: Removes a user from the database.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success message
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return sendUnauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return sendError("ไม่พบรหัสผู้ใช้งาน", 400);
    }

    await prisma.user.delete({
      where: { id }
    });

    return sendSuccess(null, 'ลบผู้ใช้งานสำเร็จ');
  } catch (error) {
    return sendServerError(error);
  }
}
