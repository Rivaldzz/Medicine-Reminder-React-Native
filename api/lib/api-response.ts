import { NextResponse } from 'next/server'

export function successResponse<T = unknown>(data: T, message = 'Success', status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  )
}

export function errorResponse(message: string, status = 400, errors?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status }
  )
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return errorResponse(message, 401)
}

export function notFoundResponse(message = 'Resource not found') {
  return errorResponse(message, 404)
}

export function serverErrorResponse(message = 'Internal server error') {
  return errorResponse(message, 500)
}