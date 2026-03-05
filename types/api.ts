export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface AuthResponse {
  access_token: string
  user: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
}

export interface CreateTaskRequest {
  task_title: string
  extra_note?: string
  due_date: string
  importance?: number
  complexity?: number
  subject_id?: string
}

export interface CreateSubjectRequest {
  subject_name: string
  color?: string
}

export interface CreateSubtaskRequest {
  subtask_name: string
}