import { useState } from 'react';


export default function XSS({ enabled }:{ enabled:boolean }){
const [text,setText] = useState("<b>Pozdrav!</b>");
const [echo,setEcho] = useState('');


async function send(){
const res = await fetch('/api/xss/echo',{method:'POST',credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text})});
const j = await res.json();
setEcho(j.text);
}


return (
<section>
<h2>XSS demo ({enabled? 'RANJIVO':'SIGURNO'})</h2>
<p>Unesi bilo što i klikni Echo. U ranjivom modu koristimo nesigurno renderiranje pa se npr. <code>&lt;img src=x onerror=alert(document.cookie)&gt;</code> izvrši.</p>
<div style={{display:'flex',gap:8}}>
<input value={text} onChange={e=>setText(e.target.value)} style={{flex:1}}/>
<button onClick={send}>Echo</button>
</div>
<div style={{marginTop:12,padding:12,border:'1px solid #ccc'}}>
<p><b>Prikaz odgovora:</b></p>
{enabled
? (<div dangerouslySetInnerHTML={{__html: echo}} />) // NESIGURNO: omogućava XSS
: (<pre style={{whiteSpace:'pre-wrap'}}>{echo}</pre>) // SIGURNO: prikaz kao tekst
}
</div>
</section>
);
}