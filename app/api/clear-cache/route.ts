import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST() {
  try {
    // Clear all relevant caches
    revalidatePath('/')
    revalidatePath('/api/content')
    revalidatePath('/admin/content')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache cleared successfully' 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear cache' 
    }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}