import { ShoppingBag } from 'lucide-react';

export default function AmazonCTA({ url }: { url: string }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ctaPulse {
          0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.7); transform: scale(1); }
          50% { box-shadow: 0 0 0 15px rgba(234, 179, 8, 0); transform: scale(1.02); }
          100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); transform: scale(1); }
        }
      `}} />
      <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          backgroundColor: '#ff9900',
          color: '#0f1111',
          padding: '1.25rem 2rem',
          borderRadius: '9999px',
          fontWeight: 800,
          fontSize: '1.5rem',
          textDecoration: 'none',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(255, 153, 0, 0.4)',
          width: '100%',
          animation: 'ctaPulse 2s infinite',
        }}
      >
        <ShoppingBag size={28} />
        شراء الآن من أمازون
      </a>
    </>
  );
}
