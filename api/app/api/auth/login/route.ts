import { NextRequest } from 'next/server'
import prisma from '../../../../lib/prisma'
import { comparePassword, generateToken } from '../../../../lib/auth'
import { errorResponse, successResponse } from '../../../../lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validasi input
    if (!email || !password) {
      return errorResponse('Email and password are required')
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return errorResponse('Invalid email or password', 401)
    }

    // Verifikasi password
    const isPasswordValid = comparePassword(password, user.password)

    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401)
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    // Return user data (tanpa password)
    const { password: _, ...userWithoutPassword } = user

    return successResponse(
      {
        user: userWithoutPassword,
        token,
      },
      'Login successful'
    )
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('Login failed', 500)
  }
}