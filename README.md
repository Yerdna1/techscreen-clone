# TechScreen AI Clone

An AI-powered interview assistant that provides real-time help during technical interviews. Built with Next.js 16, TypeScript, and Electron.

## Features

- **Invisible Mode** - Desktop app is invisible to screen sharing (Zoom, Meet, Discord)
- **AI Assistance** - Get instant answers to coding questions
- **Multi-Input** - Text, screenshot, and audio input support
- **Multi-Language** - Support for 15+ programming languages
- **Token System** - Pay-per-question pricing model
- **Subscription Tiers** - Free, Essential, Professional, Expert

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **UI Components**: shadcn/ui (custom implementation)
- **Authentication**: Clerk
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Payments**: Polar
- **AI**: OpenAI GPT-4o
- **Security**: Arcjet
- **Desktop**: Electron

## Getting Started

### Prerequisites

- Node.js 20+ (required for Next.js 16)
- npm or pnpm
- PostgreSQL database (Neon recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/techscreen-clone.git
cd techscreen-clone
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Fill in the environment variables in `.env.local`:
- Get Clerk keys from [clerk.com](https://clerk.com)
- Get Neon database URL from [neon.tech](https://neon.tech)
- Get OpenAI API key from [platform.openai.com](https://platform.openai.com)
- Get Polar keys from [polar.sh](https://polar.sh)
- Get Arcjet key from [arcjet.com](https://arcjet.com)

5. Push database schema:
```bash
npm run db:push
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

### Desktop App

1. Install Electron dependencies:
```bash
cd electron
npm install
```

2. Run the desktop app:
```bash
npm run start
```

3. Build for distribution:
```bash
npm run build:mac  # For macOS
npm run build:win  # For Windows
```

## Project Structure

```
techscreen-clone/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── (auth)/         # Auth pages (sign-in, sign-up)
│   │   ├── (dashboard)/    # Dashboard pages
│   │   ├── (marketing)/    # Marketing pages
│   │   └── api/            # API routes
│   ├── components/         # React components
│   │   ├── ui/            # Base UI components
│   │   ├── landing/       # Landing page components
│   │   ├── dashboard/     # Dashboard components
│   │   └── assistant/     # AI assistant components
│   ├── lib/               # Utility libraries
│   │   ├── db/           # Database schema and queries
│   │   ├── ai/           # AI integration
│   │   └── utils.ts      # Helper functions
│   ├── config/           # App configuration
│   ├── types/            # TypeScript types
│   └── middleware.ts     # Auth middleware
├── electron/             # Electron desktop app
│   ├── main.js          # Main process
│   ├── preload.js       # Preload script
│   └── package.json     # Electron dependencies
├── drizzle/             # Database migrations
└── public/              # Static assets
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linting
npm run db:generate  # Generate migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## Environment Variables

See `.env.example` for all required variables.

## Deployment

### Vercel

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Desktop App

Build the Electron app for distribution:

```bash
cd electron
npm run build:mac   # macOS (Intel + Apple Silicon)
npm run build:win   # Windows (x64)
```

## License

MIT

## Acknowledgments

Inspired by [TechScreen.app](https://techscreen.app)
