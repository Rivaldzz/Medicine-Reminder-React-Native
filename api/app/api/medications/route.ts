import { NextRequest } from 'next/server'
import prisma from '../../../lib/prisma'
import { getUserFromRequest } from '../../../lib/auth'
import { errorResponse, successResponse, unauthorizedResponse } from '../../../lib/api-response'

// GET - Ambil semua medications user
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return unauthorizedResponse()
    }

    const medications = await prisma.medication.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        logs: {
          where: {
            scheduledTime: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          orderBy: { scheduledTime: 'asc' }
        }
      }
    })

    return successResponse(medications)
  } catch (error) {
    console.error('Get medications error:', error)
    return errorResponse('Failed to fetch medications', 500)
  }
}

// POST - Buat medication baru
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const {
      name,
      dosage,
      unit,
      frequency,
      timeSlots,
      startDate,
      endDate,
      totalSupply,
      refillReminder,
      instructions,
      reminderEnabled
    } = body

    // Validasi
    if (!name || !dosage || !unit || !frequency || !timeSlots || !startDate || !totalSupply) {
      return errorResponse('Missing required fields')
    }

    // Buat medication
    const medication = await prisma.medication.create({
      data: {
        userId: user.userId,
        name,
        dosage,
        unit,
        frequency,
        timeSlots,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        totalSupply,
        currentSupply: totalSupply,
        refillReminder: refillReminder || Math.floor(totalSupply * 0.2), // Default 20%
        instructions,
        reminderEnabled: reminderEnabled ?? true,
      }
    })

    // Generate medication logs untuk hari ini dan besok
    await generateMedicationLogs(medication.id, user.userId, medication.timeSlots, new Date(), 2)

    return successResponse(medication, 'Medication created successfully', 201)
  } catch (error) {
    console.error('Create medication error:', error)
    return errorResponse('Failed to create medication', 500)
  }
}

// Helper function untuk generate logs
async function generateMedicationLogs(
  medicationId: string,
  userId: string,
  timeSlots: string[],
  startDate: Date,
  daysAhead: number
) {
  const logs = []
  
  for (let day = 0; day < daysAhead; day++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + day)
    
    for (const timeSlot of timeSlots) {
      const [hours, minutes] = timeSlot.split(':').map(Number)
      const scheduledTime = new Date(date)
      scheduledTime.setHours(hours, minutes, 0, 0)
      
      logs.push({
        medicationId,
        userId,
        scheduledTime,
        status: 'PENDING' as const,
      })
    }
  }

  await prisma.medicationLog.createMany({
    data: logs,
    skipDuplicates: true,
  })
}