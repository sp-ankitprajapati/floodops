export function assessDraft(draft,source){
 if(typeof draft!=='string'||!draft.trim()||draft.length>4000)return {ok:false,reason:'The model returned an empty or oversized draft.'};
 if(/\bexercise|synthetic|fictional\b/i.test(source)&&!/\bexercise|synthetic|fictional|simulation\b/i.test(draft))return {ok:false,reason:'The model omitted the exercise label. Its draft has been withheld.'};
 const numbers=s=>new Set(s.match(/\d+(?:[.:]\d+)*/g)||[]);const allowed=numbers(source);const unsupported=[...numbers(draft)].filter(n=>!allowed.has(n));
 if(unsupported.length)return {ok:false,reason:'The draft introduced a numeric claim absent from its input. It has been withheld.'};
 if(/\b(?:evacuate|drive|cross|safe route|safe shelter|all clear|take medicine|rescue)\b/i.test(draft))return {ok:false,reason:'The draft contained a movement, safety or medical instruction outside this writing experiment. It has been withheld.'};
 return {ok:true,reason:'Only limited numeric/instruction checks passed. Meaning, omissions and factual accuracy still require human review.'};
}
