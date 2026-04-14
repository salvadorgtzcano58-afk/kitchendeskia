'use client'
export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Introducción',
      content: `KitchenDeskia es una plataforma de gestión operativa diseñada para dark kitchens y restaurantes. Operamos como sistema de control de ventas, inventario, mensajes y turnos de trabajo. Esta política describe cómo recopilamos, usamos y protegemos la información de los operadores y negocios que utilizan nuestra plataforma.`,
    },
    {
      title: '2. Datos que recopilamos',
      content: null,
      list: [
        'Información operativa del restaurante: nombre del negocio, turno activo, horarios.',
        'Ventas y pedidos: canal de venta, monto, método de pago, productos vendidos.',
        'Inventario: nombres de productos, categorías, niveles de stock, requerimientos diarios.',
        'Requisiciones: historial de pedidos a proveedores enviados vía WhatsApp.',
        'Mensajes de WhatsApp Business: conversaciones de clientes procesadas para automatización de pedidos.',
        'Información de acceso: correo electrónico del operador para autenticación.',
      ],
    },
    {
      title: '3. Uso de los datos',
      content: `Los datos recopilados se utilizan exclusivamente para operar la plataforma KitchenDeskia. Esto incluye mostrar reportes de ventas, gestionar el inventario, enviar requisiciones a proveedores y automatizar respuestas a clientes vía WhatsApp Business. No vendemos, alquilamos ni compartimos datos personales con terceros con fines comerciales. El acceso a los datos está restringido al operador del negocio y al equipo técnico de KitchenDeskia para soporte.`,
    },
    {
      title: '4. WhatsApp Business API',
      content: `Los mensajes de clientes son procesados a través de la API oficial de WhatsApp Business de Meta. KitchenDeskia actúa como Business Solution Provider (BSP) para automatizar respuestas y gestión de pedidos. Al utilizar esta funcionalidad, los mensajes de clientes son procesados conforme a la Política de Privacidad de Meta y las Políticas de uso de WhatsApp Business. Los mensajes se almacenan únicamente para el historial operativo del negocio y no son compartidos con terceros.`,
    },
    {
      title: '5. Seguridad',
      content: `Todos los datos de la plataforma son almacenados en Supabase, infraestructura que cuenta con encriptación en tránsito (TLS) y en reposo. El acceso a la plataforma está protegido por autenticación segura con correo y contraseña. Los tokens de sesión se gestionan de forma segura y expiran automáticamente. Realizamos revisiones periódicas de seguridad para mantener la integridad de los datos.`,
    },
    {
      title: '6. Retención de datos',
      content: `Los datos operativos (ventas, inventario, mensajes) se conservan mientras la cuenta del negocio esté activa. Al solicitar la eliminación de la cuenta, los datos serán eliminados en un plazo máximo de 30 días, salvo obligación legal de conservarlos.`,
    },
    {
      title: '7. Contacto',
      content: null,
      contact: true,
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0e0f0c', color: '#e8ead4', fontFamily: 'system-ui, sans-serif', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#c8f135', letterSpacing: -0.5 }}>KitchenDeskia</span>
        </a>
        <a href="/login" style={{ fontSize: 12, color: '#5a5c4e', textDecoration: 'none' }}
          onMouseEnter={e => (e.target as HTMLElement).style.color = '#c8f135'}
          onMouseLeave={e => (e.target as HTMLElement).style.color = '#5a5c4e'}>
          ← Volver al login
        </a>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e8ead4', marginBottom: 8, letterSpacing: -0.5 }}>
            Política de Privacidad
          </h1>
          <div style={{ fontSize: 12, color: '#5a5c4e', textTransform: 'uppercase', letterSpacing: 2 }}>
            Última actualización: Abril 2026
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {sections.map((s, i) => (
            <div key={i} style={{ borderLeft: '2px solid rgba(200,241,53,0.2)', paddingLeft: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#c8f135', marginBottom: 12, marginTop: 0 }}>
                {s.title}
              </h2>
              {s.content && (
                <p style={{ fontSize: 14, color: '#9a9c88', lineHeight: 1.8, margin: 0 }}>
                  {s.content}
                </p>
              )}
              {s.list && (
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {s.list.map((item, j) => (
                    <li key={j} style={{ fontSize: 14, color: '#9a9c88', lineHeight: 1.7 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {s.contact && (
                <p style={{ fontSize: 14, color: '#9a9c88', lineHeight: 1.8, margin: 0 }}>
                  Para consultas sobre el manejo de tus datos o para solicitar la eliminación de tu cuenta, contáctanos en:{' '}
                  <a href="mailto:contacto@kitchendeskia.com"
                    style={{ color: '#c8f135', textDecoration: 'none' }}>
                    contacto@kitchendeskia.com
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#3a3c2e', textAlign: 'center' }}>
          KitchenDeskia · Paneki Neko · Beta 2026
        </div>
      </div>
    </div>
  )
}
