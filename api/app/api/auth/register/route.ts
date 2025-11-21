import { NextRequest } from 'next/server'
import prisma from '../../../../lib/prisma'
import { generateToken, hashPassword } from '../../../../lib/auth'
import { errorResponse, successResponse } from '../../../../lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Validasi input
    if (!email || !password || !name) {
      return errorResponse('Email, password, and name are required')
    }

    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters')
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return errorResponse('Email already registered', 400)
    }

    // Hash password
    const hashedPassword = hashPassword(password)

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    })

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    return successResponse(
      {
        user,
        token,
      },
      'Registration successful',
      201
    )
  } catch (error) {
    console.error('Register error:', error)
    return errorResponse('Registration failed', 500)
  }
}