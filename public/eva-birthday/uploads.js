const boxes=[...document.querySelectorAll('.box-upload')];
let key='';
async function api(scope,body){
 if(location.protocol==='file:')throw new Error('Shared uploads require the hosted site.');
 const response=await fetch('/api/eva-images?scope='+encodeURIComponent(scope),{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-Eva-Team-Key':key},...(body?{body:JSON.stringify(body)}:{})});
 let data;try{data=await response.json()}catch{throw new Error('Upload service is not deployed yet.')}
 if(!response.ok)throw new Error(data.error||'Request failed.');return data;
}
async function load(scope){
 const data=await api(scope);
 for(const box of boxes.filter(b=>b.dataset.scope===scope)){
  const gallery=box.querySelector('.box-images');gallery.replaceChildren();
  for(const item of data.images){const a=document.createElement('a');a.href=item.url;a.target='_blank';a.rel='noopener';const img=document.createElement('img');img.src=item.url;img.alt=item.name;img.loading='lazy';a.append(img);gallery.append(a)}
 }
}
const connect=document.querySelector('.box-connect');
connect?.addEventListener('click',async()=>{
 key=document.querySelector('.box-team-key').value.trim();const status=document.querySelector('.access-status');
 if(!key){status.textContent='Enter the team access key.';return}
 connect.disabled=true;status.textContent='Loading shared images…';
 try{for(const scope of new Set(boxes.map(b=>b.dataset.scope)))await load(scope);status.textContent='Connected. Upload into any box below.'}catch(e){status.textContent=e.message}finally{connect.disabled=false}
});
for(const box of boxes){
 const pick=box.querySelector('button'),input=box.querySelector('input'),status=box.querySelector('.box-status');let busy=false;
 async function upload(files){
  if(busy)return;if(!key){status.textContent='Enter the team access key at the top first.';return}
  busy=true;pick.disabled=true;let count=0;const errors=[];
  try{for(const file of files){
   try{
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||!file.size||file.size>20*1024*1024)throw new Error('Use JPG, PNG or WebP up to 20 MB.');
    const bitmap=await createImageBitmap(file);bitmap.close();status.textContent='Uploading '+file.name+'…';
    const ticket=await api(box.dataset.scope,{category:box.dataset.scope,name:file.name,type:file.type,size:file.size});
    const response=await fetch(ticket.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type},body:file});if(!response.ok)throw new Error('Upload failed.');count++;
   }catch(e){errors.push(file.name+': '+e.message)}
  }
  if(count)await load(box.dataset.scope);
  status.textContent=count+' image(s) saved in this shared '+box.dataset.scope.split('_')[0].toLowerCase()+' collection. '+errors.join(' ');
  }catch(e){status.textContent=count+' uploaded. '+e.message}finally{busy=false;pick.disabled=false;input.value=''}
 }
 pick.addEventListener('click',()=>input.click());input.addEventListener('change',()=>upload([...input.files]));
 box.addEventListener('dragover',e=>{e.preventDefault();box.classList.add('dragging')});
 box.addEventListener('dragleave',e=>{if(!box.contains(e.relatedTarget))box.classList.remove('dragging')});
 box.addEventListener('drop',e=>{e.preventDefault();box.classList.remove('dragging');upload([...e.dataTransfer.files])});
}
window.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('Files'))e.preventDefault()});
window.addEventListener('drop',e=>{if(e.dataTransfer.types.includes('Files'))e.preventDefault()});
