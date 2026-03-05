import { supabase } from '@/lib/supabase/client'

export class AuthService {

  // Registro de nuevo usuario
  static async register(data: {
    email: string
    password: string
    first_name: string
    last_name: string
  }) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name
        }
      }
    })

    if (error) throw new Error(error.message)
    if (!authData.user) throw new Error('No se pudo crear el usuario')

    return {
      id: authData.user.id,
      email: authData.user.email,
      first_name: data.first_name,
      last_name: data.last_name,
      access_token: authData.session?.access_token
    }
  }

  // Login
  static async login(email: string, password: string) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw new Error('Credenciales incorrectas')

    // Obtener el perfil del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', authData.user.id)
      .single()

    return {
      access_token: authData.session.access_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        first_name: profile?.first_name,
        last_name: profile?.last_name
      }
    }
  }

  // Obtener datos del usuario autenticado
  static async getMe(userId: string) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, created_at')
      .eq('id', userId)
      .single()

    if (error || !profile) throw new Error('Usuario no encontrado')

    return profile
  }
}