export function parseCAP(xml,sourceUrl=''){
 if(typeof xml!=='string'||xml.length>200000)throw new Error('CAP XML must be at most 200 KB.');
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error('DTD and entity declarations are not supported.');
 const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw new Error('The XML is malformed.');
 const root=doc.documentElement;if(root.localName!=='alert'||root.namespaceURI!=='urn:oasis:names:tc:emergency:cap:1.2')throw new Error('Use a CAP 1.2 alert XML document.');
 const children=(e,n)=>Array.from(e.children).filter(c=>c.localName===n&&c.namespaceURI===root.namespaceURI);
 const one=(e,n)=>{const v=children(e,n);if(v.length>1)throw new Error('Repeated single-value CAP field: '+n);return v[0]?.textContent.trim()||'';};
 const a={sourceUrl};for(const k of ['identifier','sender','sent','status','msgType','scope'])a[k]=one(root,k);
 a.references=one(root,'references').split(/\s+/).filter(Boolean).map(v=>{const [sender,identifier,sent,...extra]=v.split(',');if(!sender||!identifier||!sent||extra.length)throw new Error('Malformed CAP references.');return {sender,identifier,sent};});
 a.info=children(root,'info').map(e=>{const i={};for(const k of ['language','event','headline','description','instruction','severity','urgency','certainty','effective','onset','expires','web'])i[k]=one(e,k);i.areaDesc=children(e,'area').map(ar=>one(ar,'areaDesc')).filter(Boolean).join('; ');return i;});return a;
}
