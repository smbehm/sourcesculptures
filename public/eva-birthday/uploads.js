const root = document.querySelector('#team-uploader');
if (root) {
  const input = root.querySelector('#image-files');
  const drop = root.querySelector('#image-drop');
  const status = root.querySelector('#upload-status');
  const gallery = root.querySelector('#team-images');
  const category = root.querySelector('#upload-category');
  const keyInput = root.querySelector('#team-key');
  let key = '';
  let busy = false;
  let images = [];
  const say = message => { status.textContent = message; };
  async function api(body) {
    if (location.protocol === 'file:') throw new Error('Shared uploads work on the hosted site, not in a local file preview.');
    const response = await fetch('/api/eva-images', { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'X-Eva-Team-Key': key }, ...(body ? { body: JSON.stringify(body) } : {}) });
    let data;
    try { data = await response.json(); } catch { throw new Error('The upload service is not deployed on this host yet.'); }
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }
  function render() {
    gallery.replaceChildren();
    for (const item of images.filter(i => root.querySelector('#collection-filter').value === 'All' || i.category === root.querySelector('#collection-filter').value)) {
      const card = document.createElement('article');
      const link = document.createElement('a'); link.href = item.url; link.target = '_blank'; link.rel = 'noopener';
      const img = document.createElement('img'); img.src = item.url; img.alt = item.name; img.loading = 'lazy'; link.append(img);
      const caption = document.createElement('p'); caption.textContent = `${item.category} · ${item.name}`;
      card.append(link, caption); gallery.append(card);
    }
  }
  async function refresh() {
    const data = await api(); images = data.images; render();
    say(`${images.length} shared image${images.length === 1 ? '' : 's'} in the team collection.`);
  }
  root.querySelector('#connect-team').addEventListener('click', async () => {
    key = keyInput.value.trim();
    if (!key) return say('Enter your team access key.');
    say('Connecting to the shared collection…');
    try { await refresh(); } catch (error) { say(error.message); }
  });
  async function upload(files) {
    if (busy) return say('An upload is already in progress.');
    if (!key) return say('Connect with your team access key before uploading.');
    busy = true; input.disabled = true; root.querySelector('#pick-images').disabled = true;
    let succeeded = 0; const errors = [];
    try {
      for (const file of files) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 20 * 1024 * 1024) { errors.push(`${file.name}: use JPG, PNG or WebP up to 20 MB.`); continue; }
        try {
          // Decode before upload so a renamed non-image is rejected in the browser.
          const bitmap = await createImageBitmap(file); bitmap.close();
          say(`Uploading ${file.name}…`);
          const ticket = await api({ name: file.name, type: file.type, size: file.size, category: category.value });
          const response = await fetch(ticket.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
          if (!response.ok) throw new Error('Upload failed.');
          succeeded++;
        } catch (error) { errors.push(`${file.name}: ${error.message}`); }
      }
      if (succeeded) await refresh();
      say(`${succeeded} image${succeeded === 1 ? '' : 's'} uploaded to the shared team collection.${errors.length ? ' ' + errors.join(' ') : ''}`);
    } catch (error) { say(`${succeeded} uploaded. ${error.message}`); }
    finally { busy = false; input.disabled = false; root.querySelector('#pick-images').disabled = false; input.value = ''; }
  }
  root.querySelector('#pick-images').addEventListener('click', () => input.click());
  input.addEventListener('change', () => upload([...input.files]));
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('dragging'); });
  drop.addEventListener('dragleave', e => { if (!drop.contains(e.relatedTarget)) drop.classList.remove('dragging'); });
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('dragging'); upload([...e.dataTransfer.files]); });
  root.querySelector('#collection-filter').addEventListener('change', render);
  root.querySelector('#refresh-images').addEventListener('click', async () => { try { await refresh(); } catch (error) { say(error.message); } });
  window.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); });
  window.addEventListener('drop', e => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); });
}
