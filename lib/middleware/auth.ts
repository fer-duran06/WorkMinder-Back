import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// Verifica el token de Supabase y devuelve el userId
// Si el token es inválido o no existe, lanza un error (el route devuelve 401)
export async function verifyAuth(request: NextRequest): Promise<string> {
  const header = request.headers.get('Authorization')

  if (!header || !header.startsWith('Bearer ')) {
    throw new Error('Token no proporcionado')
  }

  const token = header.split(' ')[1]

  // Supabase verifica el token y devuelve el usuario
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Error('Token inválido o expirado')
  }

  return user.id // UUID del usuario autenticado
}