import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file
 *     description: Uploads a file to a structured path and returns its public URL.
 *     responses:
 *       200:
 *         description: Successfully uploaded file
 */
export async function POST(request: Request) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const entity = (data.get('entity') as string) || 'general'; // e.g. "inventory", "job", "user"
    const entityId = (data.get('entityId') as string) || 'unknown';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (images only unless entity allows other types)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'File type not allowed' }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Structured filename: timestamp-sanitized-original-name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${uniqueSuffix}-${sanitizedName}`;

    // Path: public/uploads/{entity}/{entityId}/filename
    const uploadDir = join(process.cwd(), 'public', 'uploads', entity, entityId);
    await mkdir(uploadDir, { recursive: true });

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Public URL
    const url = `/uploads/${entity}/${entityId}/${filename}`;

    return NextResponse.json({ success: true, url, filename, entity, entityId });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
