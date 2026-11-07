type Env={ALLOWED_ORIGIN:string;OPERATOR_EMAIL?:string};
const worker = {async fetch(request:Request,env:Env):Promise<Response>{
 const origin=request.headers.get('Origin');const headers={'Access-Control-Allow-Origin':env.ALLOWED_ORIGIN,'Access-Control-Expose-Headers':'Retry-After','Vary':'Origin','Content-Type':'application/json','Cache-Control':'no-store'};
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(origin!==env.ALLOWED_ORIGIN)return reply({error:'Origin not allowed'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET','Access-Control-Max-Age':'86400'}});
 if(request.method!=='GET')return reply({error:'GET only'},405);
 const url=new URL(request.url);let upstream:URL;
 if(url.pathname==='/openalex'){
  const query=url.searchParams.get('search')||'';
  if(query.length<3||query.length>300||/\b(AND|OR|NOT)\b|[()*]/.test(query))return reply({error:'Unsupported keyword query'},400);
  upstream=new URL('https://api.openalex.org/works');
  upstream.searchParams.set('search',query);
  upstream.searchParams.set('per_page','20');
  const page=url.searchParams.get('page')||'1';
  if(!/^[1-5]$/.test(page))return reply({error:'Page must be between 1 and 5'},400);
  if(page!=='1')upstream.searchParams.set('page',page);
  const filter=url.searchParams.get('filter');
  if(filter){
   if(!/^(from_publication_date:\d{4}-01-01(,is_oa:true)?|is_oa:true)$/.test(filter))return reply({error:'Unsupported filter'},400);
   upstream.searchParams.set('filter',filter);
  }
 }
 else if(['/crossref','/unpaywall'].includes(url.pathname)){const doi=url.searchParams.get('doi')||'';if(!/^10\.\d{4,9}\/\S+$/i.test(doi)||doi.length>300)return reply({error:'Invalid DOI'},400);if(url.pathname==='/unpaywall'){if(!env.OPERATOR_EMAIL)return reply({error:'Operator contact not configured'},503);upstream=new URL('https://api.unpaywall.org/v2/'+encodeURIComponent(doi));upstream.searchParams.set('email',env.OPERATOR_EMAIL);}else upstream=new URL('https://api.crossref.org/works/'+encodeURIComponent(doi));}
 else return reply({error:'Unknown endpoint'},404);
 try {
  const result=await fetch(upstream,{signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'}});
  if(result.status===429){
   const response=reply({error:'Free quota reached'},429);
   const retryAfter=result.headers.get('Retry-After');
   if(retryAfter)response.headers.set('Retry-After',retryAfter);
   return response;
  }
  if(!result.ok)return reply({error:'Upstream unavailable'},result.status===404?404:502);
  const reader=result.body?.getReader();
  if(!reader)return reply({error:'Empty upstream response'},502);
  const chunks:Uint8Array[]=[];
  let size=0;
  while(true){
   const {value,done}=await reader.read();
   if(done)break;
   size+=value.byteLength;
   if(size>2_000_000){await reader.cancel();return reply({error:'Response too large'},502);}
   chunks.push(value);
  }
  const body=new Uint8Array(size);
  let offset=0;
  for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
  return new Response(body,{headers});
 } catch {
  return reply({error:'Research provider unavailable. Try its official website.'},503);
 }
}};
export default worker;
