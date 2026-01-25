import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard/', '/projects/', '/api/', '/setup/', '/test/', '/diagnostics/', '/dev-test/', '/logo-preview/'],
        },
        sitemap: 'https://quadrants.ch/sitemap.xml',
    }
}
