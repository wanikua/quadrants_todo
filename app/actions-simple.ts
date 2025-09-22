'use server'

import { auth } from '@clerk/nextjs/server'
import { createProject, getUserProjects, joinProject } from '@/lib/database-simple'
import { revalidatePath } from 'next/cache'

export async function createProjectAction(name: string, type: 'personal' | 'team' = 'personal') {
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }
  
  if (!name?.trim()) {
    return { success: false, error: 'Project name is required' }
  }
  
  try {
    const result = await createProject(name.trim(), type, userId)
    
    if (result.success) {
      revalidatePath('/projects')
    }
    
    return result
  } catch (error: any) {
    console.error('Error in createProjectAction:', error)
    return { success: false, error: error.message || 'Failed to create project' }
  }
}

export async function joinProjectAction(inviteCode: string) {
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }
  
  if (!inviteCode?.trim()) {
    return { success: false, error: 'Invite code is required' }
  }
  
  try {
    const result = await joinProject(inviteCode.trim().toUpperCase(), userId)
    
    if (result.success) {
      revalidatePath('/projects')
    }
    
    return result
  } catch (error: any) {
    console.error('Error in joinProjectAction:', error)
    return { success: false, error: error.message || 'Failed to join project' }
  }
}

export async function getUserProjectsAction() {
  const { userId } = await auth()
  
  if (!userId) {
    return []
  }
  
  try {
    return await getUserProjects(userId)
  } catch (error) {
    console.error('Error in getUserProjectsAction:', error)
    return []
  }
}