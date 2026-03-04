// app/api/subtasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { db } from '@/lib/db/mysql';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuth(request);
    const { id } = await params;  

    const subtareas = await db.query<any>(
      `SELECT s.id, s.esta_completada 
       FROM subtareas s
       INNER JOIN tareas t ON s.tarea_id = t.id
       WHERE s.id = ? AND t.usuario_id = ?`,
      [id, userId]
    );

    if (!subtareas.length) {
      return NextResponse.json({ success: false, error: 'Subtarea no encontrada' }, { status: 404 });
    }

    const nuevoEstado = !subtareas[0].esta_completada;

    await db.execute(
      'UPDATE subtareas SET esta_completada = ? WHERE id = ?',
      [nuevoEstado, id]
    );

    return NextResponse.json({ success: true, data: { id, esta_completada: nuevoEstado } });

  } catch (error: any) {
    const isAuthError = error.message.includes('Token') || error.message.includes('autenticación');
    return NextResponse.json(
      { success: false, error: error.message },
      { status: isAuthError ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuth(request);
    const { id } = await params;  

    const subtareas = await db.query<any>(
      `SELECT s.id 
       FROM subtareas s
       INNER JOIN tareas t ON s.tarea_id = t.id
       WHERE s.id = ? AND t.usuario_id = ?`,
      [id, userId]
    );

    if (!subtareas.length) {
      return NextResponse.json({ success: false, error: 'Subtarea no encontrada' }, { status: 404 });
    }

    await db.execute('DELETE FROM subtareas WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Subtarea eliminada correctamente' });

  } catch (error: any) {
    const isAuthError = error.message.includes('Token') || error.message.includes('autenticación');
    return NextResponse.json(
      { success: false, error: error.message },
      { status: isAuthError ? 401 : 500 }
    );
  }
}