import './globals.css';

export const metadata = {
  title: 'SnapBlob — Screenshot to Vercel Blob',
  description: 'Capture screenshots and upload them to your Vercel Blob Storage in one click.',
  openGraph: {
    title: 'SnapBlob',
    description: 'Screenshot capture & upload to Vercel Blob Storage',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
