let generator;
self.onmessage=async({data})=>{try{
 if(!generator){self.postMessage({type:'progress',message:'Loading the open model. The first download can take several minutes.'});const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');env.allowLocalModels=false;env.backends.onnx.wasm.numThreads=1;generator=await pipeline('text2text-generation','Xenova/flan-t5-base',{dtype:'q8',device:'wasm',progress_callback:p=>{if(p.status==='progress')self.postMessage({type:'progress',message:'Downloading '+p.file+': '+Math.round(p.progress||0)+'%'});}});}
 self.postMessage({type:'progress',message:'Generating an experimental draft locally…'});
 const prompt='Write a short summary of this text: '+data.source+'\nSummary:';
 const start=performance.now();const result=await generator(prompt,{max_new_tokens:64,do_sample:false,num_beams:3});self.postMessage({type:'result',draft:result[0]?.generated_text||'',model:'Xenova/flan-t5-base',elapsedMs:Math.round(performance.now()-start)});
}catch(e){self.postMessage({type:'error',message:'The local model could not run in this browser. '+String(e.message).slice(0,240)});}};
