import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { checkUserAuth } from '@/lib/auth-utils'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.php', '.asp', '.jsp']

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkUserAuth()
    if (authResult.status !== 200) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 })
    }

    // Security checks
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Check dangerous extensions
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (DANGEROUS_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json({ error: 'File extension not allowed' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Sanitize filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100)
    const filename = `${timestamp}-${safeName}`
    const path = join(process.cwd(), 'public/uploads', filename)

    await writeFile(path, buffer)

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
      filename: safeName
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}