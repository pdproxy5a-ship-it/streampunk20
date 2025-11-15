import './globals.css'

export const metadata = {
  title: 'StreamPunk - Universal Music Crawler',
  description: 'Internet-wide music crawler with auto-updating catalog',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}