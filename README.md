# Lumio

Lumio is a premium digital connection platform featuring a high-end, responsive landing page with multi-language support and advanced animations.

## Key Features
- **Premium UI/UX**: Dark-themed, glassmorphic design with vibrant gradients and smooth micro-animations.
- **Multi-language Support**: Integrated support for 10 languages, including English, Arabic, Amharic, Chinese, and more.
- **Dynamic Language Sync**: Automatic language detection and switching based on the user's selected country.
- **Unified Responsive Layout**: A consistent tabbed interface for Login and Registration across all device sizes (Mobile & Desktop).
- **Interactive Branding**: Massive, floating "Lumio" logo with a shimmering gradient effect.
- **Secured Authentication**: Robust login and registration flows powered by Firebase.

## Getting Started

First, install the dependencies:
```bash
npm install
```

Second, run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment on Vercel

This project is optimized for deployment on [Vercel](https://vercel.com). 

### Environment Variables
To ensure the application functions correctly after deployment, you **must** configure the following Environment Variables in your Vercel project settings:

| Variable Name | Description |
|---------------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`| Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Measurement ID |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary Upload Preset |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name |

## Built With
- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/)
- [Cloudinary](https://cloudinary.com/)
