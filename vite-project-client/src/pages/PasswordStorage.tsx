import { useEffect, useState } from 'react';

type Row = { username:string; password:string|null };

export default function PasswordStorage({ insecure }:{ insecure:boolean }){
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [rows,setRows] = useState<Row[]>([]);

  async function register(){
    if (!username || !password) return;
    await fetch('/api/register',{
      method:'POST',
      credentials:'include',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username, password })
    });
    setUsername(''); setPassword('');
    load();
  }

  async function load(){
    const data = await fetch('/api/storage/users',{credentials:'include'}).then(r=>r.json());
    setRows(data);
  }

  useEffect(()=>{ load(); },[insecure]);

  return (
    <section>

      <h2>({insecure ? 'PLAINTEXT – RANJIVO' : 'HASH – SIGURNO'})</h2>
      <p>
        {insecure
          ? 'Lozinka se sprema u čitljivom obliku (plaintext).'
          : 'Lozinka se hashira (bcrypt) prije pohrane.'}
      </p>

      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <input placeholder="korisnickoIme" value={username} onChange={e=>setUsername(e.target.value)} />
        <input placeholder="lozinka" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button onClick={register}>Registriraj</button>
      </div>

      <table>
        <thead><tr><th>Korisničko ime</th><th>Lozinka</th></tr></thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i}>
              <td>{r.username}</td>
              <td><code>{r.password ?? 'null'}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
