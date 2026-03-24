/**
 * Update store - manages firmware update workflows
 */

import { proxy } from 'valtio'
import type { FirmwareVersion } from '@/data/firmware'

export type WorkflowStatus = 'pending' | 'in_progress' | 'complete' | 'failed'

export interface WorkflowStep {
  id: string
  name: string
  status: 'pending' | 'in_progress' | 'complete' | 'failed'
  startedAt?: Date
  completedAt?: Date
  error?: string
}

export interface UpdateWorkflow {
  id: string
  deviceIds: string[]
  targetFirmware: FirmwareVersion
  status: WorkflowStatus
  progress: number // 0-100
  steps: WorkflowStep[]
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: string
}

export interface UpdateStore {
  workflows: UpdateWorkflow[]
  activeWorkflowId?: string
}

const initialState: UpdateStore = {
  workflows: [],
}

export const updateStore = proxy<UpdateStore>(initialState)

// Actions
export function createUpdateWorkflow(deviceIds: string[], targetFirmware: FirmwareVersion): UpdateWorkflow {
  const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const workflow: UpdateWorkflow = {
    id: workflowId,
    deviceIds,
    targetFirmware,
    status: 'pending',
    progress: 0,
    steps: [
      { id: 'download', name: 'Download firmware', status: 'pending' },
      { id: 'backup', name: 'Backup configuration', status: 'pending' },
      { id: 'install', name: 'Install firmware', status: 'pending' },
      { id: 'reboot', name: 'Reboot device', status: 'pending' },
      { id: 'verify', name: 'Verify installation', status: 'pending' },
    ],
    createdAt: new Date(),
  }
  
  updateStore.workflows.push(workflow)
  return workflow
}

export function startUpdateWorkflow(workflowId: string) {
  const workflow = updateStore.workflows.find(w => w.id === workflowId)
  if (!workflow) return
  
  workflow.status = 'in_progress'
  workflow.startedAt = new Date()
  updateStore.activeWorkflowId = workflowId
  
  // Simulate workflow execution
  executeWorkflowSteps(workflow)
}

async function executeWorkflowSteps(workflow: UpdateWorkflow) {
  const stepDurations: Record<string, number> = {
    download: 5000,
    backup: 3000,
    install: 25000,
    reboot: 15000,
    verify: 5000,
  }
  
  const stepProgress: Record<string, number> = {
    download: 20,
    backup: 40,
    install: 70,
    reboot: 90,
    verify: 100,
  }
  
  for (const step of workflow.steps) {
    step.status = 'in_progress'
    step.startedAt = new Date()
    workflow.progress = stepProgress[step.id] || 0
    
    try {
      await new Promise(resolve => setTimeout(resolve, stepDurations[step.id] || 1000))
      step.status = 'complete'
      step.completedAt = new Date()
    } catch (error) {
      step.status = 'failed'
      step.error = error instanceof Error ? error.message : 'Unknown error'
      workflow.status = 'failed'
      workflow.error = step.error
      workflow.completedAt = new Date()
      return
    }
  }
  
  workflow.status = 'complete'
  workflow.progress = 100
  workflow.completedAt = new Date()
}

export function cancelUpdateWorkflow(workflowId: string) {
  const index = updateStore.workflows.findIndex(w => w.id === workflowId)
  if (index >= 0) {
    updateStore.workflows.splice(index, 1)
  }
  if (updateStore.activeWorkflowId === workflowId) {
    updateStore.activeWorkflowId = undefined
  }
}

export function getActiveWorkflow(): UpdateWorkflow | undefined {
  return updateStore.activeWorkflowId
    ? updateStore.workflows.find(w => w.id === updateStore.activeWorkflowId)
    : undefined
}

export function getWorkflowById(workflowId: string): UpdateWorkflow | undefined {
  return updateStore.workflows.find(w => w.id === workflowId)
}

export function getPendingWorkflows(): UpdateWorkflow[] {
  return updateStore.workflows.filter(w => w.status === 'pending')
}

export function getInProgressWorkflows(): UpdateWorkflow[] {
  return updateStore.workflows.filter(w => w.status === 'in_progress')
}

export function getCompletedWorkflows(): UpdateWorkflow[] {
  return updateStore.workflows.filter(w => w.status === 'complete')
}

export function getFailedWorkflows(): UpdateWorkflow[] {
  return updateStore.workflows.filter(w => w.status === 'failed')
}
