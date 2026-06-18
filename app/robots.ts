import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard/', '/projects/', '/api/', '/setup/', '/test/', '/diagnostics/', '/dev-test/', '/logo-preview/'],
        },
        sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://quadrants.dev'}/sitemap.xml`,
    }
}
