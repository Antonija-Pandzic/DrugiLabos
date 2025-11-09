import { useState } from 'react';

/* RUČNA SANITIZACIJA: 
   - allow-lista tagova: b, i, em, strong, u, code, a, p, br, ul, ol, li
   - brišem sve on* (onerror/onclick/…)
   - za href/src blokiram javascript: i data:text/html (propuštam http/https/mailto) */
function sanitize(dirty: string): string {
  const ALLOWED_TAGS = new Set(['B','I','EM','STRONG','U','CODE','A','P','BR','UL','OL','LI']);
  const ALLOWED_ATTRS: Record<string, Set<string>> = {
    A:   new Set(['href','title','target','rel']),
    IMG: new Set(['src','alt','title']),
  };

  const doc = new DOMParser().parseFromString(dirty, 'text/html');

  // ukloni opasne elemente
  doc.querySelectorAll('script, style, iframe').forEach(n => n.remove());

  // prođi sve elemente
  const nodes = doc.body.querySelectorAll('*');
  nodes.forEach(el => {
    const tag = el.tagName.toUpperCase();

    // ako tag nije dopušten → zamijeni ga tekstom
    if (!ALLOWED_TAGS.has(tag)) {
      const text = document.createTextNode(el.textContent || '');
      el.replaceWith(text);
      return;
    }

    // ukloni on* i nedopuštene atribute
    [...el.attributes].forEach(attr => {
      const name = attr.name.toLowerCase();

      // event handleri (onerror/onclick/…)
      if (name.startsWith('on')) { el.removeAttribute(attr.name); return; }

      // dopušteni atributi po tagu
      const allowedForTag = ALLOWED_ATTRS[tag as keyof typeof ALLOWED_ATTRS];
      if (!allowedForTag || !allowedForTag.has(name)) {
        el.removeAttribute(attr.name);
        return;
      }

      // dodatna provjera href/src
      if ((name === 'href' || name === 'src') && attr.value) {
        const v = attr.value.trim().toLowerCase();
        if (v.startsWith('javascript:') || v.startsWith('data:text/html')) {
          el.removeAttribute(attr.name);
        } else if (name === 'href' && tag === 'A') {
          el.setAttribute('rel', 'noopener noreferrer');
        }
      }
    });
  });

  return doc.body.innerHTML;
}

export default function XSS({ enabled }:{ enabled:boolean }) {
  const [text,setText]   = useState('');
  const [echo,setEcho]   = useState('');
  const safeHtml         = sanitize(echo); 

//Šaljem XSS dio na backend.
  async function send(){
    const res = await fetch('/api/xss/echo', {
      method:'POST',
      credentials:'include',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ text })
    });
    const j = await res.json();
    setEcho(j.text);
  }

  


//Korisničko sučelje za XSS dio.
return (
  <>
    <h2>({enabled? 'RANJIVO (nema sanitizacije)' : 'SIGURNO (sanitizirano)'})</h2>
    <p className="muted">
      U <b>ranjivom</b> modu renderiram HTML pa se opasni payloadi mogu izvršiti.
      U <b>sigurnom</b> modu unos <i>sanitiziram ručno</i> (allow-lista tagova/atributa, skidanje svih <code>on*</code> handlera i blok <code>javascript:</code> URL-ova).
    </p>

    <div className="row">
      <input className="input" placeholder="unesiteTekst" value={text} onChange={e=>setText(e.target.value)} />
      <button className="btn" onClick={send}>Echo</button>
    </div>

    <div className="card" style={{padding:'12px'}}>
      <p><b>Prikaz odgovora:</b></p>
      {enabled
        ? (<div dangerouslySetInnerHTML={{__html: echo}} />)
        : (<div dangerouslySetInnerHTML={{__html: safeHtml}} />)
      }
    </div>
  </>
);
}
