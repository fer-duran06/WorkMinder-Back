import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/middleware/auth'
import { AuthService } from '@/services/AuthService'

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request)
    const profile = await AuthService.getMe(userId)
    return NextResponse.json({ success: true, data: profile })

  } catch (error: any) {
    const isAuthError = error.message.includes('Token')
    return NextResponse.json(
      { success: false, error: error.message },
      { status: isAuthError ? 401 : 500 }
    )
  }
}