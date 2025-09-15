/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuración de proxy seguro - Las URLs reales solo se manejan en el servidor
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // La URL real está hardcodeada aquí para mayor seguridad
        // Solo el servidor tiene acceso a esta URL
        //DESARROLLO
        destination: 'https://almacen-dev.adpredcell.com/gateway/api/:path*',
        //PRODUCCION
        //destination: 'https://almacen-mx-prod.adpredcell.com/gateway/api/:path*'
      },
    ];
  },
  
  // Configuración adicional para manejar CORS
  async headers() {
    return [
      {
        // Aplicar estos encabezados a todas las rutas
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
}

export default nextConfig
