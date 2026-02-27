// app/api/test/route.ts
import { NextResponse } from 'next/server';
import { db, testConnection } from '@/lib/db/mysql';
import { PriorityCalculator } from '@/services/PriorityCalculator';

export async function GET() {
  try {
    // Test conexión
    await testConnection();
    
    // Test query
    const users = await db.query('SELECT id, nombre_completo FROM usuarios LIMIT 1');
    
    // Test algoritmo
    const testPriority = PriorityCalculator.calculate(40, new Date(Date.now() + 86400000)); // mañana
    
    return NextResponse.json({
      success: true,
      message: '✅ Backend funcionando correctamente',
      data: {
        database: 'Connected',
        users,
        algorithm: {
          priority: testPriority,
          level: PriorityCalculator.getLevel(testPriority)
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}