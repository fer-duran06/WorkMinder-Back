// services/TasksService.ts
import { db } from '@/lib/db/mysql';
import type { TareaPriorizada, Subtarea, Tarea } from '@/types/database';
import type { CreateTaskDTO, UpdateTaskDTO, TaskResponseDTO } from '@/types/dto';
import { mapTaskToDTO, mapTasksToDTO } from './TaskMapper';

export class TasksService {
  
  /**
   * Obtener todas las tareas de un usuario con prioridad calculada
   */
  static async getTasks(userId: string, filters?: {
    estado?: string;
    materiaId?: string;
  }): Promise<TaskResponseDTO[]> {
    let sql = `
      SELECT * FROM vw_tareas_priorizadas
      WHERE usuario_id = ?
    `;
    const params: any[] = [userId];

    // Aplicar filtros
    if (filters?.estado) {
      sql += ` AND estado = ?`;
      params.push(filters.estado);
    }

    if (filters?.materiaId) {
      sql += ` AND materia_id = ?`;
      params.push(filters.materiaId);
    }

    sql += ` ORDER BY prioridad_calculada DESC`;

    const tareas = await db.query<TareaPriorizada>(sql, params);
    
    return mapTasksToDTO(tareas);
  }

  /**
   * Obtener tareas priorizadas (endpoint principal)
   */
  static async getPrioritizedTasks(userId: string): Promise<TaskResponseDTO[]> {
    const sql = `
      SELECT * FROM vw_tareas_priorizadas
      WHERE usuario_id = ?
      AND estado != 'completada'
      ORDER BY prioridad_calculada DESC
    `;

    const tareas = await db.query<TareaPriorizada>(sql, [userId]);
    
    return mapTasksToDTO(tareas);
  }

  /**
   * Obtener una tarea específica con subtareas
   */
  static async getTaskById(userId: string, taskId: string): Promise<TaskResponseDTO | null> {
    // Obtener tarea
    const sql = `
      SELECT * FROM vw_tareas_priorizadas
      WHERE usuario_id = ? AND id = ?
    `;
    
    const tarea = await db.queryOne<TareaPriorizada>(sql, [userId, taskId]);
    
    if (!tarea) {
      return null;
    }

    // Obtener subtareas
    const subtareas = await db.query<Subtarea>(
      'SELECT * FROM subtareas WHERE tarea_id = ? ORDER BY indice_orden',
      [taskId]
    );

    return mapTaskToDTO(tarea, subtareas);
  }

  /**
   * Obtener estadísticas del dashboard
   */
  static async getDashboardStats(userId: string) {
    // Obtener todas las tareas
    const allTasks = await this.getTasks(userId);
    
    // Tareas pendientes (no completadas)
    const activeTasks = allTasks.filter(t => 
      t.status === 'PENDING' || t.status === 'IN_PROGRESS'
    );
    
    // Tareas tarde
    const lateTasks = allTasks.filter(t => t.status === 'LATE');
    
    // Tareas completadas
    const completedTasks = allTasks.filter(t => t.status === 'DONE');

    // Tareas sugeridas (top 3 por urgencia)
    const suggestedTasks = activeTasks
      .sort((a, b) => {
        const urgencyOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      })
      .slice(0, 3);

    return {
      pendingCount: activeTasks.length,
      lateCount: lateTasks.length,
      completedCount: completedTasks.length,
      suggestedTasks,
      allTasks: activeTasks
    };
  }

  /**
   * Crear nueva tarea
   */
  static async createTask(userId: string, data: CreateTaskDTO): Promise<TaskResponseDTO> {
    const sql = `
      INSERT INTO tareas (
        usuario_id, materia_id, titulo, descripcion,
        fecha_entrega, peso_calificacion, nivel_complejidad,
        tipo_tarea, horas_estimadas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.execute(sql, [
      userId,
      data.materia_id || null,
      data.titulo,
      data.descripcion || null,
      data.fecha_entrega,
      data.peso_calificacion,
      data.nivel_complejidad || 3,
      data.tipo_tarea || 'tarea',
      data.horas_estimadas || null
    ]);

    const taskId = (result as any).insertId;

    // Obtener la tarea creada con prioridad calculada
    const createdTask = await this.getTaskById(userId, taskId);
    
    if (!createdTask) {
      throw new Error('Error al crear la tarea');
    }

    return createdTask;
  }

  /**
   * Actualizar tarea existente
   */
  static async updateTask(
    userId: string,
    taskId: string,
    data: UpdateTaskDTO
  ): Promise<TaskResponseDTO> {
    // Verificar que la tarea pertenece al usuario
    const existingTask = await db.queryOne<Tarea>(
      'SELECT * FROM tareas WHERE id = ? AND usuario_id = ?',
      [taskId, userId]
    );

    if (!existingTask) {
      throw new Error('Tarea no encontrada');
    }

    // Construir query dinámico
    const updates: string[] = [];
    const params: any[] = [];

    if (data.titulo !== undefined) {
      updates.push('titulo = ?');
      params.push(data.titulo);
    }
    if (data.descripcion !== undefined) {
      updates.push('descripcion = ?');
      params.push(data.descripcion);
    }
    if (data.fecha_entrega !== undefined) {
      updates.push('fecha_entrega = ?');
      params.push(data.fecha_entrega);
    }
    if (data.peso_calificacion !== undefined) {
      updates.push('peso_calificacion = ?');
      params.push(data.peso_calificacion);
    }
    if (data.nivel_complejidad !== undefined) {
      updates.push('nivel_complejidad = ?');
      params.push(data.nivel_complejidad);
    }
    if (data.tipo_tarea !== undefined) {
      updates.push('tipo_tarea = ?');
      params.push(data.tipo_tarea);
    }
    if (data.horas_estimadas !== undefined) {
      updates.push('horas_estimadas = ?');
      params.push(data.horas_estimadas);
    }
    if (data.estado !== undefined) {
      updates.push('estado = ?');
      params.push(data.estado);
    }

    if (updates.length === 0) {
      throw new Error('No hay datos para actualizar');
    }

    params.push(taskId, userId);

    const sql = `
      UPDATE tareas 
      SET ${updates.join(', ')}
      WHERE id = ? AND usuario_id = ?
    `;

    await db.execute(sql, params);

    // Obtener la tarea actualizada
    const updatedTask = await this.getTaskById(userId, taskId);
    
    if (!updatedTask) {
      throw new Error('Error al actualizar la tarea');
    }

    return updatedTask;
  }

  /**
   * Marcar tarea como completada
   */
  static async completeTask(userId: string, taskId: string): Promise<TaskResponseDTO> {
    const sql = `
      UPDATE tareas 
      SET estado = 'completada', completada_en = NOW()
      WHERE id = ? AND usuario_id = ?
    `;

    const result = await db.execute(sql, [taskId, userId]);

    if ((result as any).affectedRows === 0) {
      throw new Error('Tarea no encontrada');
    }

    const completedTask = await this.getTaskById(userId, taskId);
    
    if (!completedTask) {
      throw new Error('Error al completar la tarea');
    }

    return completedTask;
  }

  /**
   * Eliminar tarea
   */
  static async deleteTask(userId: string, taskId: string): Promise<void> {
    const sql = `
      DELETE FROM tareas 
      WHERE id = ? AND usuario_id = ?
    `;

    const result = await db.execute(sql, [taskId, userId]);

    if ((result as any).affectedRows === 0) {
      throw new Error('Tarea no encontrada');
    }
  }

  /**
   * Crear subtarea
   */
  static async createSubtask(
    userId: string,
    taskId: string,
    titulo: string
  ): Promise<void> {
    // Verificar que la tarea existe y pertenece al usuario
    const task = await db.queryOne<Tarea>(
      'SELECT id FROM tareas WHERE id = ? AND usuario_id = ?',
      [taskId, userId]
    );

    if (!task) {
      throw new Error('Tarea no encontrada');
    }

    // Obtener el siguiente índice de orden
    const result = await db.queryOne<{ max_orden: number }>(
      'SELECT COALESCE(MAX(indice_orden), -1) + 1 as max_orden FROM subtareas WHERE tarea_id = ?',
      [taskId]
    );

    const indiceOrden = result?.max_orden || 0;

    // Insertar subtarea
    await db.execute(
      'INSERT INTO subtareas (tarea_id, titulo, indice_orden) VALUES (?, ?, ?)',
      [taskId, titulo, indiceOrden]
    );
  }

  /**
   * Toggle subtarea completada
   */
  static async toggleSubtask(
    userId: string,
    subtaskId: string
  ): Promise<void> {
    // Verificar que la subtarea pertenece a una tarea del usuario
    const subtask = await db.queryOne<Subtarea>(
      `SELECT s.* FROM subtareas s
       INNER JOIN tareas t ON s.tarea_id = t.id
       WHERE s.id = ? AND t.usuario_id = ?`,
      [subtaskId, userId]
    );

    if (!subtask) {
      throw new Error('Subtarea no encontrada');
    }

    // Toggle estado
    await db.execute(
      'UPDATE subtareas SET esta_completada = NOT esta_completada WHERE id = ?',
      [subtaskId]
    );
  }

  /**
   * Eliminar subtarea
   */
  static async deleteSubtask(
    userId: string,
    subtaskId: string
  ): Promise<void> {
    const result = await db.execute(
      `DELETE s FROM subtareas s
       INNER JOIN tareas t ON s.tarea_id = t.id
       WHERE s.id = ? AND t.usuario_id = ?`,
      [subtaskId, userId]
    );

    if ((result as any).affectedRows === 0) {
      throw new Error('Subtarea no encontrada');
    }
  }
  
}