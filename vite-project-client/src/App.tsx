import React, { useEffect, useState } from 'react';
import XSS from './pages/XSS';
import PasswordStorage from './pages/PasswordStorage';

type Flags = { XSS_ENABLED:boolean; INSECURE_STORAGE_ENABLED:boolean };

export default function App(){
  const [flags,setFlags] = useState<Flags>({ XSS_ENABLED:true, INSECURE_STORAGE_ENABLED:true });

  async function refresh(){
    const f = await fetch('/api/flags', {credentials:'include'}).then(r=>r.json());
    setFlags(f);
  }
  useEffect(()=>{ refresh(); },[]);

  async function toggle(key: keyof Flags){
    await fetch('/api/toggle',{ method:'POST', credentials:'include',
      headers:{'Content-Type':'application/json'}, body: JSON.stringify({key}) });
    refresh();
  }

  return (
    <div style={{maxWidth:900,margin:'0 auto',fontFamily:'system-ui'}}>
      <h1>Cross-site scripting (XSS) & Sensitive Data Exposure</h1>

      <div style={{display:'flex',gap:16}}>
        <label><input type="checkbox"
          checked={flags.XSS_ENABLED}
          onChange={()=>toggle('XSS_ENABLED')}/> Omogući XSS ranjivost</label>

        <label><input type="checkbox"
          checked={flags.INSECURE_STORAGE_ENABLED}
          onChange={()=>toggle('INSECURE_STORAGE_ENABLED')}/> Omogući NESIGURNU pohranu (plaintext)</label>
      </div>

      <hr/>
      <XSS enabled={flags.XSS_ENABLED}/>
      <hr/>
      <PasswordStorage insecure={flags.INSECURE_STORAGE_ENABLED}/>
    </div>
  );
}
