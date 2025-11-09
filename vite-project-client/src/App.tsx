import React, { useEffect, useState } from 'react';
import XSS from './pages/XSS';
import PasswordStorage from './pages/PasswordStorage';

type Flags = { XSS_ENABLED: boolean; INSECURE_STORAGE_ENABLED: boolean };

export default function App() {
  const [flags, setFlags] = useState<Flags>({
    XSS_ENABLED: true,
    INSECURE_STORAGE_ENABLED: true,
  });

  // ultra-minimalni stilovi samo za odvajanje sekcija
  const boxBase: React.CSSProperties = {
    borderRadius: 12,
    padding: 12,
    margin: '16px 0',
    border: '1px solid #eee',
  };
  const xssBox: React.CSSProperties = {
    ...boxBase,
    background: '#fff0f6',          // rozo
    borderColor: '#ffc2d8',
  };
  const sdeBox: React.CSSProperties = {
    ...boxBase,
    background: '#f0f6ff',          // plavo
    borderColor: '#cfe2ff',
  };
  const headerRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  };

  async function refresh() {
    const f = await fetch('/api/flags', { credentials: 'include' }).then(r => r.json());
    setFlags(f);
  }
  useEffect(() => { refresh(); }, []);

  async function toggle(key: keyof Flags) {
    await fetch('/api/toggle', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    refresh();
  }

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: '0 16px', fontFamily: 'system-ui' }}>
  
      {/* XSS sekcija (roza) */}
      <section style={xssBox}>
        <div style={headerRow}>
          <h2 style={{ margin: 0, fontSize: 20 }}>XSS demo</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={flags.XSS_ENABLED}
              onChange={() => toggle('XSS_ENABLED')}
            />
            Omogući XSS ranjivost
          </label>
        </div>
        <XSS enabled={flags.XSS_ENABLED} />
      </section>

      {/* Nesigurna pohrana lozinki (plava) */}
      <section style={sdeBox}>
        <div style={headerRow}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Nesigurna pohrana podataka</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={flags.INSECURE_STORAGE_ENABLED}
              onChange={() => toggle('INSECURE_STORAGE_ENABLED')}
            />
            Omogući NESIGURNU pohranu (plaintext)
          </label>
        </div>
        <PasswordStorage insecure={flags.INSECURE_STORAGE_ENABLED} />
      </section>
    </div>
  );
}
