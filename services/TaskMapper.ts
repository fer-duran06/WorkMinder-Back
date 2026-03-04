// services/TaskMapper.ts
import type { TareaPriorizada, Subtarea } from '@/types/database';
import type { 
  TaskResponseDTO, 
  TaskStatusDTO, 
  TaskUrgencyDTO, 
  TaskComplexityDTO 
} from '@/types/dto';

/**
 * Mapea el estado de la BD al formato del frontend
 */
export function mapStatus(estado: string): TaskStatusDTO {
  const statusMap: Record<string, TaskStatusDTO> = {
    'pendiente': 'PENDING',
    'en_progreso': 'IN_PROGRESS',
    'completada': 'DONE',
    'tarde': 'LATE'
  };
  return statusMap[estado] || 'PENDING';
}

/**
 * Calcula la urgencia basada en la prioridad calculada
 * HIGH: prioridad >= 0.7
 * MEDIUM: prioridad >= 0.4
 * LOW: prioridad < 0.4
 */
export function calculateUrgency(prioridad: number): TaskUrgencyDTO {
  if (prioridad >= 0.7) return 'HIGH';
  if (prioridad >= 0.4) return 'MEDIUM';
  return 'LOW';
}

/**
 * Mapea el nivel de complejidad numérico a texto en español
 */
export function mapComplexity(nivel: number): TaskComplexityDTO {
  if (nivel >= 4) return 'Alta';
  if (nivel >= 2) return 'Media';
  return 'Baja';
}

/**
 * Formatea fecha de Date a string "dd/MM/yyyy"
 */
export function formatDateDDMMYYYY(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Convierte una tarea de BD a formato DTO para el frontend
 */
export function mapTaskToDTO(
  tarea: TareaPriorizada,
  subtareas: Subtarea[] = []
): TaskResponseDTO {
  return {
    id: tarea.id,
    title: tarea.titulo,
    subject: tarea.materia_nombre || 'Sin materia',
    dueDate: formatDateDDMMYYYY(tarea.fecha_entrega),
    status: mapStatus(tarea.estado),
    urgency: calculateUrgency(tarea.prioridad_calculada),
    complexity: mapComplexity(tarea.nivel_complejidad),
    notes: tarea.descripcion || '',
    subtasks: subtareas.map(s => s.titulo)
  };
}

/**
 * Convierte array de tareas a DTOs
 */
export function mapTasksToDTO(tareas: TareaPriorizada[]): TaskResponseDTO[] {
  return tareas.map(tarea => mapTaskToDTO(tarea, []));
}

/**
 * Mapea estado del frontend a BD
 */
export function mapStatusToDB(status: TaskStatusDTO): string {
  const statusMap: Record<TaskStatusDTO, string> = {
    'PENDING': 'pendiente',
    'IN_PROGRESS': 'en_progreso',
    'DONE': 'completada',
    'LATE': 'tarde'
  };
  return statusMap[status] || 'pendiente';
}