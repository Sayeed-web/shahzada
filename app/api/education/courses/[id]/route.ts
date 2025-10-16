import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sampleCourses } from '@/scripts/seedEducation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id

    // Use fallback storage when database is not available
    const coursesStorage = global.coursesStorage || sampleCourses
    global.coursesStorage = coursesStorage

    try {
      const course = await prisma.educationCourse.findUnique({
        where: { 
          id: courseId,
          isPublished: true 
        },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          level: true,
          duration: true,
          price: true,
          isPremium: true,
          thumbnailUrl: true,
          videoUrl: true,
          content: true,
          tags: true,
          rating: true,
          enrollments: true,
          createdAt: true
        }
      })

      if (course) {
        return NextResponse.json(course)
      } else {
        throw new Error('Course not found in database')
      }
    } catch (dbError) {
      console.log('Using fallback course storage')
      const course = coursesStorage.find((c: any) => c.id === courseId && c.isPublished)
      
      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }
      
      return NextResponse.json(course)
    }
  } catch (error) {
    console.error('Course fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id
    const body = await request.json()

    // Use fallback storage when database is not available
    const coursesStorage = global.coursesStorage || sampleCourses
    
    try {
      const updatedCourse = await prisma.educationCourse.update({
        where: { id: courseId },
        data: body
      })

      // Also update in storage
      const courseIndex = coursesStorage.findIndex((c: any) => c.id === courseId)
      if (courseIndex !== -1) {
        coursesStorage[courseIndex] = { ...coursesStorage[courseIndex], ...body }
        global.coursesStorage = coursesStorage
      }

      return NextResponse.json(updatedCourse)
    } catch (dbError) {
      console.log('Using fallback course storage for update')
      const courseIndex = coursesStorage.findIndex((c: any) => c.id === courseId)
      
      if (courseIndex === -1) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }
      
      coursesStorage[courseIndex] = { ...coursesStorage[courseIndex], ...body, updatedAt: new Date().toISOString() }
      global.coursesStorage = coursesStorage
      
      return NextResponse.json(coursesStorage[courseIndex])
    }
  } catch (error) {
    console.error('Course update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id

    // Use fallback storage when database is not available
    const coursesStorage = global.coursesStorage || sampleCourses
    
    try {
      await prisma.educationCourse.delete({
        where: { id: courseId }
      })

      // Also remove from storage
      const courseIndex = coursesStorage.findIndex((c: any) => c.id === courseId)
      if (courseIndex !== -1) {
        coursesStorage.splice(courseIndex, 1)
        global.coursesStorage = coursesStorage
      }

      return NextResponse.json({ message: 'Course deleted successfully' })
    } catch (dbError) {
      console.log('Using fallback course storage for delete')
      const courseIndex = coursesStorage.findIndex((c: any) => c.id === courseId)
      
      if (courseIndex === -1) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }
      
      coursesStorage.splice(courseIndex, 1)
      global.coursesStorage = coursesStorage
      
      return NextResponse.json({ message: 'Course deleted successfully' })
    }
  } catch (error) {
    console.error('Course delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}