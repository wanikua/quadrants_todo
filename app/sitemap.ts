import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://quadrants.ch'

    // List of public routes
    const routes = [
        '',
        '/pricing',
        '/about',
        '/contact',
        '/privacy',
        '/terms',
        '/sign-in',
        '/sign-up',
    ]

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1 : 0.8,
    }))
}
