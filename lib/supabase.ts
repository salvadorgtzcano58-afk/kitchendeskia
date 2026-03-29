import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Conversacion = {
  id: string
  cliente_nombre: string
  cliente_telefono?: string
  canal: 'whatsapp' | 'instagram' | 'facebook'
  clasificacion: 'pedido' | 'lead' | 'duda' | 'otro'
  estado: 'abierta' | 'respondida' | 'cerrada'
  atendido_por_ia: boolean
  created_at: string
  updated_at: string
}

export type Mensaje = {
  id: string
  conversacion_id: string
  rol: 'cliente' | 'ia' | 'humano'
  contenido: string
  created_at: string
}
