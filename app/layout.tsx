import './globals.css';
export const metadata={title:'Apex Roads | Discover the drive',description:'Explore mountain roads and find driving videos on an interactive map.'};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#111814'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
