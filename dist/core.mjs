import {clauses,POLICY_VERSION} from './policy.mjs';
export const VERSION=1;
const statuses=['Actual','Exercise','Test','Draft','System'];
export const taskStates=['To do','In progress','Blocked','Done'];
export const text=(x,max=12000)=>{if(typeof x!=='string'||x.length>max)throw new Error('Invalid or oversized text field.');return x.trim();};
export function safeUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function dateTime(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))throw new Error('Use a valid timestamp with an explicit timezone.');const d=value.slice(0,10).split('-').map(Number);if(new Date(Date.UTC(d[0],d[1]-1,d[2])).toISOString().slice(0,10)!==value.slice(0,10))throw new Error('Invalid calendar date.');return value;}
export function normalizeAlert(raw){
 const a={};for(const k of ['identifier','sender','sent','status','msgType','scope'])a[k]=text(raw[k],2000);
 if(!a.identifier||!a.sender||/[\s,]/.test(a.identifier)||/[\s,]/.test(a.sender))throw new Error('Identifier and sender must be nonempty CAP identifiers.');
 dateTime(a.sent);if(!statuses.includes(a.status))throw new Error('Unsupported CAP status.');
 if(!['Alert','Update','Cancel'].includes(a.msgType))throw new Error('Only Alert, Update and Cancel messages are supported.');
 if(a.scope!=='Public')throw new Error('This prototype accepts Public-scope messages only.');
 a.references=(raw.references||[]).map(r=>{if(!r||typeof r!=='object')throw new Error('Invalid CAP reference.');return {sender:text(r.sender,2000),identifier:text(r.identifier,2000),sent:dateTime(r.sent)};});
 if(a.msgType!=='Alert'&&!a.references.length)throw new Error('Updates and cancellations must reference an earlier message.');
 if(a.references.some(r=>r.sender!==a.sender))throw new Error('Cross-sender references require manual source review and are not supported.');
 if(a.references.some(r=>Date.parse(r.sent)>=Date.parse(a.sent)))throw new Error('Referenced messages must be older than this message.');
 a.info=Array.isArray(raw.info)?raw.info.map(i=>{
  const out={};for(const k of ['language','event','headline','description','instruction','areaDesc','severity','urgency','certainty'])out[k]=text(i[k]??'',k==='description'||k==='instruction'?12000:2000);
  out.language=out.language||'en-US';out.effective=dateTime(i.effective||a.sent);out.expires=dateTime(i.expires);
  if(i.onset)out.onset=dateTime(i.onset);out.web=i.web?safeUrl(i.web):null;
  if(Date.parse(out.expires)<=Date.parse(out.effective)||Date.parse(out.expires)<=Date.parse(a.sent))throw new Error('Expiry must be later than the effective and sent timestamps.');
  if(!out.event||!out.areaDesc)throw new Error('Event and affected area are required.');
  if(!['Extreme','Severe','Moderate','Minor','Unknown'].includes(out.severity))throw new Error('Invalid severity.');
  if(!['Immediate','Expected','Future','Past','Unknown'].includes(out.urgency)||!['Observed','Likely','Possible','Unlikely','Unknown'].includes(out.certainty))throw new Error('Invalid urgency or certainty.');
  return out;
 }):[];
 if(a.msgType!=='Cancel'&&!a.info.length)throw new Error('The alert needs an information block with an expiry time.');
 a.sourceUrl=safeUrl(raw.sourceUrl)||a.info.find(i=>i.web)?.web||null;
 return a;
}
export const identity=a=>[a.sender,a.identifier,a.sent].join('|');
export const referenceIdentity=r=>[r.sender,r.identifier,r.sent].join('|');
export function infoFor(a,language='en'){const list=a.info||[];return list.find(i=>i.language.toLowerCase().startsWith(language.toLowerCase()))||null;}
export async function fingerprint(value){const bytes=new TextEncoder().encode(JSON.stringify(value));const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');}
export function newState(){return {version:VERSION,alerts:[],active:null,plans:{},audit:[]};}
export function log(s,type,details,now=new Date().toISOString()){s.audit.push({at:now,type,details});}
export async function ingest(s,raw,now=new Date().toISOString()){
 const a=normalizeAlert(raw),key=identity(a);a.revision=await fingerprint(a);const old=s.alerts.find(x=>identity(x)===key);
 if(old){if(old.revision!==a.revision)throw new Error('The same CAP identity has different content. Obtain a correctly identified update; existing review was not changed.');s.active=key;return {duplicate:true,key};}
 if(a.msgType!=='Alert')for(const ref of a.references){const target=s.alerts.find(x=>identity(x)===referenceIdentity(ref));if(target&&a.status!==target.status)throw new Error('Lifecycle messages must preserve the referenced CAP status.');}
 s.alerts.push(a);
 // Reconcile across the full imported history, including out-of-order delivery.
 for(const prior of s.alerts){delete prior.supersededBy;delete prior.cancelledBy;for(const newer of s.alerts){if(newer.msgType==='Alert'||newer.status!==prior.status||Date.parse(newer.sent)<=Date.parse(prior.sent))continue;if(newer.sender===prior.sender&&newer.references.some(r=>referenceIdentity(r)===identity(prior))){if(newer.msgType==='Cancel')prior.cancelledBy=identity(newer);else prior.supersededBy=identity(newer);const p=s.plans[identity(prior)];if(p)p.approval=null;}}}
 if(a.msgType!=='Cancel')s.active=key;
 log(s,'import',{key,type:a.msgType,status:a.status,revision:a.revision},now);return {duplicate:false,key};
}
export function gate(a,now=new Date().toISOString(),exercise=false){
 if(!a)return {allowed:false,reason:'Import or select a warning first.'};
 if(a.cancelledBy)return {allowed:false,reason:'Cancelled by a newer imported message.'};if(a.supersededBy)return {allowed:false,reason:'Superseded by a newer imported message.'};if(a.msgType==='Cancel')return {allowed:false,reason:'Cancellation record; no task plan is generated.'};
 const i=infoFor(a);if(!i)return {allowed:false,reason:'An English information block is required for this version. Review other-language warnings at the source.'};
 if(!/flood|heavy rain|extreme rain|inundation/i.test(i.event))return {allowed:false,reason:'This version supports flood and heavy-rain preparedness only.'};
 if(!Number.isFinite(Date.parse(now)))return {allowed:false,reason:'Invalid review clock.'};
 if(Date.parse(now)<Date.parse(a.sent)||Date.parse(now)<Date.parse(i.effective))return {allowed:false,reason:'The warning is not yet effective at the review clock.'};
 if(Date.parse(now)>=Date.parse(i.expires))return {allowed:false,reason:'Expired at the review clock. Historical evidence remains available.'};
 if(exercise){if(!['Exercise','Test'].includes(a.status))return {allowed:false,reason:'Exercise mode accepts only Exercise or Test CAP messages.'};}
 else if(a.status!=='Actual')return {allowed:false,reason:'Non-Actual CAP message. Use exercise mode for explicitly labelled exercises.'};
 return {allowed:true,reason:exercise?'Exercise warning: draft for a simulation only.':'Imported warning: original source and local applicability still require review.'};
}
const tokens=s=>(s.toLowerCase().match(/[a-z]{3,}/g)||[]).filter(w=>!['the','and','for','with','that','this','from','your','what','should','does','are','can','how'].includes(w));
export function retrieve(query,limit=4){
 const q=[...new Set(tokens(query))];if(!q.length)return [];
 const docs=clauses.map(c=>tokens(c.title+' '+c.text+' '+c.tags));const N=docs.length;
 return clauses.map((c,n)=>{let score=0;for(const term of q){const df=docs.filter(d=>d.includes(term)).length;const tf=docs[n].filter(w=>w===term).length;if(tf)score+=(1+Math.log(tf))*(Math.log((N+1)/(df+1))+1);}return {...c,score};}).filter(c=>c.score>0).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,limit);
}
export async function draftPlan(s,{facility='Community organisation',exercise=false,now=new Date().toISOString()}={}){
 const a=s.alerts.find(x=>identity(x)===s.active);const g=gate(a,now,exercise);if(!g.allowed)throw new Error(g.reason);
 const key=identity(a),previous=s.plans[key];const tasks=clauses.map(c=>({id:c.id,title:c.title,text:c.text,source:c.source,basis:c.basis,owner:'Unassigned',status:'To do',note:''}));
 const p={key,alertRevision:a.revision,policyVersion:POLICY_VERSION,facility:text(facility,150),exercise,createdAt:now,tasks,approval:null};
 if(previous?.approval)log(s,'review_invalidated',{key,reason:'New draft replaced previous plan'},now);
 s.plans[key]=p;log(s,'draft',{key,taskCount:tasks.length,mode:'source-linked templates + lexical retrieval; no generative model'},now);return p;
}
export async function planHash(p){return fingerprint({alertRevision:p.alertRevision,policyVersion:p.policyVersion,facility:p.facility,exercise:p.exercise,tasks:p.tasks.map(({id,title,text,source,owner})=>({id,title,text,source,owner}))});}
export async function approve(s,{approved,sourceReviewed,reviewer,now=new Date().toISOString(),exercise=false}){
 if(approved!==true||sourceReviewed!==true)throw new Error('Explicit Boolean approval and source review are required.');
 const a=s.alerts.find(x=>identity(x)===s.active),p=s.plans[s.active],g=gate(a,now,exercise);if(!g.allowed)throw new Error(g.reason);
 if(!p||p.alertRevision!==a.revision||p.exercise!==exercise)throw new Error('Generate and review a current plan first.');
 if(p.policyVersion!==POLICY_VERSION)throw new Error('Policy changed; regenerate the draft.');
 if(p.tasks.some(t=>!t.owner.trim()||t.owner==='Unassigned'))throw new Error('Assign a responsible role to every task before approval.');
 const name=text(reviewer,100);if(!name)throw new Error('A reviewer name or role is required.');
 p.approval={reviewer:name,at:now,planHash:await planHash(p)};log(s,'approved',{key:s.active,reviewer:name,exercise},now);return p.approval;
}
export function assign(s,id,owner,now=new Date().toISOString()){
 const p=s.plans[s.active];if(!p)throw new Error('No plan found.');const t=p.tasks.find(t=>t.id===id);if(!t)throw new Error('Task not found.');
 const name=text(owner,100)||'Unassigned';if(name!==t.owner){t.owner=name;p.approval=null;log(s,'assignment_changed',{key:s.active,id,owner:name,reviewRequired:true},now);}
}
export function reviseFacility(s,value,now=new Date().toISOString()){const p=s.plans[s.active];if(!p)throw new Error('No plan found.');const facility=text(value,150);if(!facility)throw new Error('An organisation or site name is required.');if(p.facility!==facility){p.facility=facility;p.approval=null;log(s,'site_changed',{key:s.active,reviewRequired:true},now);}}
export async function taskUpdate(s,id,{status,note=''},{exercise=false,now=new Date().toISOString()}={}){
 const p=s.plans[s.active],a=s.alerts.find(x=>identity(x)===s.active),g=gate(a,now,exercise);if(!g.allowed)throw new Error(g.reason);
 if(!p?.approval||p.exercise!==exercise||p.approval.planHash!==await planHash(p))throw new Error('Current source review and plan approval are required.');
 if(!taskStates.includes(status))throw new Error('Invalid task status.');const t=p.tasks.find(t=>t.id===id);if(!t)throw new Error('Task not found.');t.status=status;t.note=text(note,2000);log(s,'task_changed',{key:s.active,id,status,note:t.note},now);
}
export async function restore(input){
 if(!input||input.version!==VERSION||!Array.isArray(input.alerts)||input.alerts.length>100||!Array.isArray(input.audit)||input.audit.length>10000)throw new Error('Unsupported or oversized workspace export.');
 const s=newState();for(const raw of input.alerts)await ingest(s,raw);
 for(const [key,p] of Object.entries(input.plans||{})){
  const a=s.alerts.find(x=>identity(x)===key);if(!a||!Array.isArray(p.tasks)||p.tasks.length!==clauses.length||p.alertRevision!==a.revision)throw new Error('Invalid plan in workspace.');
  const expected=clauses;const tasks=p.tasks.map((t,n)=>{const c=expected[n];if(t.id!==c.id||t.title!==c.title||t.text!==c.text||t.source!==c.source||!taskStates.includes(t.status))throw new Error('The workspace contains altered plan content.');return {...c,owner:text(t.owner,100),status:t.status,note:text(t.note??'',2000)};});
  s.plans[key]={key,alertRevision:a.revision,policyVersion:POLICY_VERSION,facility:text(p.facility,150),exercise:p.exercise===true,createdAt:dateTime(p.createdAt),tasks,approval:null};
 }
 s.active=s.alerts.some(a=>identity(a)===input.active)?input.active:s.alerts.find(a=>a.msgType!=='Cancel')?identity(s.alerts.find(a=>a.msgType!=='Cancel')):null;
 s.audit=input.audit.map(e=>{const at=dateTime(e.at),type=text(e.type,100);if(!e.details||typeof e.details!=='object'||JSON.stringify(e.details).length>16000)throw new Error('Invalid activity record.');return {at,type,details:JSON.parse(JSON.stringify(e.details)),origin:'Imported browser history; not independently authenticated'};});
 // Imported browser files do not carry trustworthy reviewer identity or approvals.
 log(s,'restored',{alerts:s.alerts.length,approvalReset:true});return s;
}
export function brief(a,p){const i=infoFor(a);return ['FLOODOPS — '+(p.exercise?'EXERCISE ONLY':'REVIEWED PREPAREDNESS RECORD'),p.facility,'Imported event: '+i.event,'Area: '+i.areaDesc,'Expires: '+i.expires,'Original source: '+(a.sourceUrl||'Not provided'),'Reviewer (self-reported): '+(p.approval?.reviewer||'NOT APPROVED'),'',...p.tasks.map(t=>`${t.status} | ${t.owner} | ${t.title}\n${t.text}\nEvidence: ${t.source}`),'','No messages were sent by FloodOps. No route, shelter capacity or site safety is verified.'].join('\n');}
