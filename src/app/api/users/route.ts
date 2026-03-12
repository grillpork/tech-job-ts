import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
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

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, skills, ...rest } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
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

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: "User ID required" }, { status: 400 });
    }

    const body = await request.json();
    const { password, skills, id: bodyId, ...rest } = body; // Destructure id to exclude it from update

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

    return NextResponse.json(formattedUser);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    // Check for Prisma unique constraint violation (e.g., email already taken)
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 }); // 409 Conflict
    }

    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: "User ID required" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
