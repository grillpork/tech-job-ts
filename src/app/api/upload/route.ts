import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendUnauthorized, sendError, sendServerError } from '@/lib/api-utils';

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') 
    .replace(/[^\w\u0E00-\u0E7F-]+/g, '') 
    .replace(/--+/g, '-') 
    .replace(/^-+/, '') 
    .replace(/-+$/, '');
}

export async function POST(request: Request) {
  try {
    // SECURITY: Must be logged in to upload anything
    const session = await getServerSession(authOptions);
    if (!session) return sendUnauthorized();

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const folder = (data.get('folder') as string) || 'general';
    const subFolder = (data.get('subFolder') as string) || '';
    
    if (!file) {
      return sendError("ไม่พบไฟล์ที่ต้องการอัปโหลด");
    }

    // SECURITY: Limit file size to 10MB
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return sendError("ขนาดไฟล์ใหญ่เกินไป (สูงสุด 10MB)", 413);
    }

    // SECURITY: Allowed file types (Images only for now)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return sendError(`ไม่รองรับประเภทไฟล์นี้ (${file.type})`, 415);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${uniqueSuffix}-${sanitizedFileName}`;
    
    let uploadPath = join(process.cwd(), 'public', 'uploads', slugify(folder));
    if (subFolder) {
      uploadPath = join(uploadPath, slugify(subFolder));
    }

    await mkdir(uploadPath, { recursive: true });
    const filepath = join(uploadPath, filename);
    await writeFile(filepath, buffer);
    
    const publicPath = subFolder 
      ? `/uploads/${slugify(folder)}/${slugify(subFolder)}/${filename}`
      : `/uploads/${slugify(folder)}/${filename}`;
    
    return NextResponse.json({ 
      success: true, 
      url: publicPath, 
      filename,
      requestId: crypto.randomUUID(),
      message: 'อัปโหลดสำเร็จ'
    });
  } catch (error) {
    return sendServerError(error, "การอัปโหลดไฟล์ล้มเหลว");
  }
}
