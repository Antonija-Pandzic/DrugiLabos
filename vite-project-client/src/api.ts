export async function api<T>(url: string, opts: RequestInit = {}): Promise<T>{
const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opts });
if(!res.ok) throw new Error(await res.text());
return res.json();
}