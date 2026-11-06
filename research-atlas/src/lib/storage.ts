import { backupSchema, type Project } from './model';
function openDB():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open('research-atlas',1);request.onupgradeneeded=()=>request.result.createObjectStore('workspace');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
export async function loadProjects():Promise<Project[]> {const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readonly');const r=tx.objectStore('workspace').get('projects');r.onsuccess=()=>{try{resolve(r.result?backupSchema.parse(r.result).projects:[]);}catch{reject(Error('Saved data could not be read. Export a backup before making changes.'));}};r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();});}
export async function saveProjects(projects: Project[]) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    try {
      const transaction = db.transaction('workspace', 'readwrite');
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onabort = () => { db.close(); reject(transaction.error); };
      transaction.objectStore('workspace').put({ schemaVersion: 1, exportedAt: new Date().toISOString(), projects }, 'projects');
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}
export function download(name:string,body:string,type='text/plain'){const url=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
