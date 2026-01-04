import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'DGS - Digital Gold System',
        short_name: 'DGS Pro',
        description: 'The ultimate investment platform for digital gold. Secure, fast, and rewarding.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#3b82f6',
        categories: ['finance', 'investment'],
        id: 'com.dgs.pro',
        icons: [
            {
                src: '/dgs_app_icon.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/dgs_app_icon.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
        ],
        screenshots: [
            {
                src: '/banner_jewelry.jpg',
                sizes: '1080x1920',
                type: 'image/jpeg',
                form_factor: 'narrow',
                label: 'DGS Pro Investment Dashboard'
            },
            {
                src: '/invite.jpg',
                sizes: '1080x1920',
                type: 'image/jpeg',
                form_factor: 'narrow',
                label: 'Team Rewards System'
            }
        ]
    }
}
