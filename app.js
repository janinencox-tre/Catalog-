
(function(){
  const COMPANY = window.TRE_COMPANY || {name:'The Rented Event',phone:'',email:'',web:''};
  const STORAGE_KEY = 'tre_quote_cart_v1';
  const FIELDS_KEY = 'tre_quote_fields_v1';

  const grid = document.getElementById('grid');
  const search = document.getElementById('search');
  const categoryFilter = document.getElementById('categoryFilter');
  const sidebar = document.getElementById('quoteSidebar');
  const backdrop = document.getElementById('backdrop');
  const fab = document.getElementById('quoteFab');
  const closeSidebar = document.getElementById('closeSidebar');
  const quoteItems = document.getElementById('quoteItems');
  const quoteTotal = document.getElementById('quoteTotal');
  const dateInput = document.getElementById('quoteDate');
  const locInput = document.getElementById('quoteLocation');
  const notesInput = document.getElementById('quoteNotes');
  const btnPdf = document.getElementById('downloadPdf');
  const btnCsv = document.getElementById('downloadCsv');
  const btnEmail = document.getElementById('emailQuote');

  let PRODUCTS = [];
  let CART = loadCart();
  let FIELDS = loadFields();

  // Load products and init UI
  fetch('assets/js/products.json').then(r=>r.json()).then(products => {
    PRODUCTS = products;
    buildFilters(products);
    renderGrid();
    applyFields();
    updateCartUI();
  });

  function buildFilters(products){
    const cats = [...new Set(products.map(p => p.category))].sort();
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      categoryFilter.appendChild(opt);
    });
  }

  function renderGrid(){
    const q = (search.value || '').toLowerCase();
    const cat = categoryFilter.value;
    grid.innerHTML = '';
    PRODUCTS
      .filter(p => (!cat || p.category === cat))
      .filter(p => (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)))
      .forEach(p => grid.appendChild(cardFor(p)));
  }

  function cardFor(p){
    const card = document.createElement('article');
    card.className = 'card';
    const img = document.createElement('img');
    img.className = 'thumb'; img.loading='lazy'; img.alt = p.name;
    img.src = (p.images && p.images[0]) ? p.images[0] : '';
    const body = document.createElement('div');
    body.className = 'card-body';
    const name = document.createElement('h3');
    name.className = 'name'; name.textContent = p.name;
    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = `Qty: ${p.quantity} • Price: ${p.price}`;
    const badge = document.createElement('span');
    badge.className = 'badge'; badge.textContent = p.category;
    const actions = document.createElement('div');
    actions.className = 'actions';
    const addBtn = document.createElement('button');
    addBtn.className = 'btn'; addBtn.textContent = 'Add to Quote';
    addBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      addToCart(p, 1);
    });
    actions.appendChild(addBtn);
    body.appendChild(name); body.appendChild(meta); body.appendChild(badge); body.appendChild(actions);
    card.appendChild(img); card.appendChild(body);
    return card;
  }

  function parsePrice(str){
    if(!str) return 0;
    // Extract first number in the string
    const m = String(str).replace(/,/g,'').match(/(\d+(\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
  }

  function addToCart(product, qty){
    const existing = CART.find(i => i.id === product.id);
    if(existing){ existing.qty += qty; }
    else {
      CART.push({
        id: product.id,
        name: product.name,
        category: product.category,
        price: parsePrice(product.price),
        priceLabel: product.price,
        image: (product.images && product.images[0]) ? product.images[0] : '',
        qty: qty
      });
    }
    saveCart(); updateCartUI(); openSidebar();
  }

  function removeFromCart(id){
    CART = CART.filter(i => i.id !== id);
    saveCart(); updateCartUI();
  }

  function updateQty(id, qty){
    const it = CART.find(i => i.id === id);
    if(!it) return;
    it.qty = Math.max(0, parseInt(qty || 0,10));
    if(it.qty === 0) removeFromCart(id);
    saveCart(); updateCartUI();
  }

  function calcTotal(){
    return CART.reduce((s,i)=> s + (i.price * i.qty), 0);
  }

  function currency(n){ return n.toLocaleString(undefined,{style:'currency',currency:'USD'}); }

  function updateCartUI(){
    quoteItems.innerHTML = '';
    CART.forEach(it => {
      const row = document.createElement('div');
      row.className = 'item';
      const im = document.createElement('img');
      im.src = it.image || ''; im.alt = it.name;
      const info = document.createElement('div');
      const h = document.createElement('h4'); h.textContent = it.name;
      const s = document.createElement('div'); s.className='sub';
      s.textContent = `${it.category} • ${it.price ? currency(it.price)+'/day' : it.priceLabel}`;
      info.appendChild(h); info.appendChild(s);
      const right = document.createElement('div');
      right.className = 'qty';
      const input = document.createElement('input');
      input.type = 'number'; input.min = '0'; input.value = it.qty;
      input.addEventListener('input', ()=> updateQty(it.id, input.value));
      const line = document.createElement('div');
      line.textContent = currency((it.price || 0) * it.qty);
      const rm = document.createElement('button'); rm.className='remove'; rm.textContent='Remove';
      rm.addEventListener('click', ()=> removeFromCart(it.id));
      right.appendChild(input); right.appendChild(line); right.appendChild(rm);
      row.appendChild(im); row.appendChild(info); row.appendChild(right);
      quoteItems.appendChild(row);
    });
    const total = calcTotal();
    quoteTotal.textContent = currency(total);
    document.getElementById('quoteDisclaimer').textContent = window.TRE_SETTINGS.disclaimer;
    fab.textContent = `🛒 Quote (${CART.reduce((s,i)=>s+i.qty,0)})`;
    saveCart();
  }

  function openSidebar(){
    sidebar.setAttribute('aria-hidden','false');
    backdrop.setAttribute('aria-hidden','false');
  }
  function closeSide(){
    sidebar.setAttribute('aria-hidden','true');
    backdrop.setAttribute('aria-hidden','true');
  }

  fab.addEventListener('click', openSidebar);
  closeSidebar.addEventListener('click', closeSide);
  backdrop.addEventListener('click', closeSide);
  search.addEventListener('input', renderGrid);
  categoryFilter.addEventListener('change', renderGrid);

  // Persist fields
  function applyFields(){
    if(FIELDS.date) dateInput.value = FIELDS.date;
    if(FIELDS.location) locInput.value = FIELDS.location;
    if(FIELDS.notes) notesInput.value = FIELDS.notes;
  }
  function saveFields(){
    FIELDS = {
      date: dateInput.value || '',
      location: locInput.value || '',
      notes: notesInput.value || ''
    };
    localStorage.setItem(FIELDS_KEY, JSON.stringify(FIELDS));
  }
  [dateInput, locInput, notesInput].forEach(el => el.addEventListener('input', saveFields));

  function loadCart(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }catch(e){ return []; }
  }
  function saveCart(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CART));
  }
  function loadFields(){
    try{ return JSON.parse(localStorage.getItem(FIELDS_KEY) || '{}'); }catch(e){ return {}; }
  }

  // CSV Export
  btnCsv.addEventListener('click', () => {
    const ts = new Date().toISOString();
    const rows = [
      ['The Rented Event', COMPANY.phone, COMPANY.email, COMPANY.web],
      ['Generated', ts, '', ''],
      ['Event Date', FIELDS.date || '', 'Event Location', FIELDS.location || ''],
      ['Notes', (FIELDS.notes||'').replace(/\n/g,' '), '', ''],
      ['Disclaimer', window.TRE_SETTINGS.disclaimer, '', ''],
      [],
      ['Product','Category','Qty','Price/day','Line Total']
    ];
    CART.forEach(it => {
      rows.push([it.name, it.category, it.qty, it.price || it.priceLabel, (it.price? (it.price*it.qty).toFixed(2): '')]);
    });
    rows.push(['','','','','']);
    rows.push(['','','','Grand Total', calcTotal().toFixed(2)]);

    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'TRE_Quote.csv';
    a.click();
  });

  // Print-friendly PDF (via browser print dialog)
  const btnPdfDirect = document.getElementById('downloadPdfDirect');

  // Direct PDF export with jsPDF
  btnPdfDirect.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const ts = new Date().toLocaleString();

    doc.setFontSize(16);
    doc.text(COMPANY.name, 14, 20);
    doc.setFontSize(11);
    doc.text(`${COMPANY.phone} • ${COMPANY.email} • ${COMPANY.web}`, 14, 28);
    doc.text(`Quote generated: ${ts}`, 14, 36);

    doc.text(`Event Date: ${FIELDS.date||''}`, 14, 46);
    doc.text(`Location: ${FIELDS.location||''}`, 14, 52);
    doc.text(`Notes: ${FIELDS.notes||''}`, 14, 58);
    doc.text(window.TRE_SETTINGS.disclaimer, 14, 66);

    const rows = CART.map(it => [
      it.name, it.category, String(it.qty),
      it.price ? '$'+it.price.toFixed(2) : it.priceLabel,
      it.price ? '$'+(it.price*it.qty).toFixed(2) : ''
    ]);

    doc.autoTable({
      startY: 72,
      head: [['Product','Category','Qty','Price/day','Line Total']],
      body: rows,
      foot: [['','','','Grand Total', (calcTotal()).toLocaleString(undefined,{style:'currency',currency:'USD'})]],
      theme: 'grid'
    });

    doc.save('TRE_Quote.pdf');
  });

btnPdf.addEventListener('click', () => {
    const ts = new Date().toLocaleString();
    const head = `
      <h1 style="margin:0">The Rented Event</h1>
      <div>${COMPANY.phone} • ${COMPANY.email} • ${COMPANY.web}</div>
      <div style="margin-top:6px;font-size:12px;color:#444">Quote generated: ${ts}</div>
      <hr/>
      <div><strong>Event Date:</strong> ${FIELDS.date||''} &nbsp; <strong>Location:</strong> ${FIELDS.location||''}</div>
      <div style="white-space:pre-wrap"><strong>Notes:</strong> ${FIELDS.notes||''}</div>
      <hr/>
    `;
    const rows = CART.map(it => `
      <tr>
        <td>${it.name}</td>
        <td>${it.category}</td>
        <td style="text-align:right">${it.qty}</td>
        <td style="text-align:right">${it.price ? '$'+it.price.toFixed(2) : it.priceLabel}</td>
        <td style="text-align:right">${it.price ? '$'+(it.price*it.qty).toFixed(2) : ''}</td>
      </tr>
    `).join('');
    const html = `
      <html><head><meta charset="utf-8"><title>TRE Quote</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;margin:24px}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th,td{border:1px solid #ddd;padding:8px}
        th{background:#f5f5f7;text-align:left}
        tfoot td{font-weight:bold}
      </style>
      </head><body>
      ${head}
      <table>
        <thead><tr><th>Product</th><th>Category</th><th>Qty</th><th>Price/day</th><th>Line Total</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="4" style="text-align:right">Grand Total</td><td style="text-align:right">${(calcTotal()).toLocaleString(undefined,{style:'currency',currency:'USD'})}</td></tr></tfoot>
      </table>
      </body></html>
    `;
    const w = window.open('', '_blank');
    w.document.write(html); w.document.close();
    w.focus();
    w.print();
  });

  // Email quote
  btnEmail.addEventListener('click', () => {
    const ts = new Date().toLocaleString();
    const lines = [];
    lines.push(`The Rented Event`);
    lines.push(`${COMPANY.phone} • ${COMPANY.email} • ${COMPANY.web}`);
    lines.push(`Quote generated: ${ts}`);
    lines.push('');
    lines.push(`Event Date: ${FIELDS.date||''}`);
    lines.push(`Location: ${FIELDS.location||''}`);
    lines.push(`Notes: ${(FIELDS.notes||'').replace(/\n/g,' ')}`);
    lines.push(window.TRE_SETTINGS.disclaimer);
    lines.push('');
    lines.push(`Items:`);
    CART.forEach(it => {
      lines.push(`- ${it.name} (${it.category}) — Qty ${it.qty} @ ${it.price? ('$'+it.price.toFixed(2)) : it.priceLabel} = ${it.price? ('$'+(it.price*it.qty).toFixed(2)) : ''}`);
    });
    lines.push('');
    lines.push(`Grand Total (per day): ${(calcTotal()).toLocaleString(undefined,{style:'currency',currency:'USD'})}`);
    const body = encodeURIComponent(lines.join('\n'));
    const subj = encodeURIComponent('Quote Request – The Rented Event');
    window.location.href = `mailto:${COMPANY.email}?subject=${subj}&body=${body}`;
  });

})(); 

  const disclaimerEl = document.getElementById('disclaimerText');
  const btnPdfDirect = document.getElementById('downloadPdfDirect');
  function setDisclaimer(){
    disclaimerEl.textContent = (window.TRE_SETTINGS && window.TRE_SETTINGS.disclaimer) ? window.TRE_SETTINGS.disclaimer : '';
  }
  setDisclaimer();

  // DIRECT PDF via jsPDF + autoTable
  btnPdfDirect.addEventListener('click', async () => {
    const { jsPDF } = window.jspdf || {};
    if(!jsPDF || typeof jsPDF !== 'function'){
      alert('PDF library not loaded. Please check your internet connection.');
      return;
    }
    const doc = new jsPDF({unit:'pt', format:'letter'});
    const marginX = 40;
    let y = 48;

    const ts = new Date().toLocaleString();
    const company = window.TRE_COMPANY || {};
    const disclaimer = (window.TRE_SETTINGS && window.TRE_SETTINGS.disclaimer) ? window.TRE_SETTINGS.disclaimer : '';

    doc.setFont('helvetica','bold'); doc.setFontSize(16);
    doc.text('The Rented Event', marginX, y); y += 18;
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.text(`${company.phone || ''} • ${company.email || ''} • ${company.web || ''}`, marginX, y); y += 16;
    doc.text(`Quote generated: ${ts}`, marginX, y); y += 16;
    doc.text(`Event Date: ${dateInput.value || ''}    Location: ${locInput.value || ''}`, marginX, y); y += 16;
    if((notesInput.value||'').trim()){
      const noteLines = doc.splitTextToSize(`Notes: ${notesInput.value}`, 532);
      doc.text(noteLines, marginX, y);
      y += (noteLines.length * 12) + 4;
    }
    if(disclaimer){
      doc.setFont('helvetica','italic'); 
      doc.text(disclaimer, marginX, y); 
      doc.setFont('helvetica','normal'); 
      y += 16;
    }
    // Table
    const body = CART.map(it => [it.name, it.category, String(it.qty), it.price ? `$${it.price.toFixed(2)}` : it.priceLabel, it.price ? `$${(it.price*it.qty).toFixed(2)}` : '']);
    doc.autoTable({
      startY: y,
      head: [['Product','Category','Qty','Price/day','Line Total']],
      body,
      styles: { font:'helvetica', fontSize:10, cellPadding:4 },
      headStyles: { fillColor:[245,245,247], textColor:20, lineWidth:0.5 },
      columnStyles: {
        2: { halign:'right', cellWidth:50 },
        3: { halign:'right', cellWidth:80 },
        4: { halign:'right', cellWidth:90 },
      },
      bodyStyles: { lineWidth:0.5 }
    });
    const finalY = doc.lastAutoTable.finalY || y;
    const total = calcTotal();
    doc.setFont('helvetica','bold'); doc.setFontSize(12);
    doc.text(`Grand Total (per day): ${total.toLocaleString(undefined,{style:'currency',currency:'USD'})}`, marginX, finalY + 24);

    doc.save('TRE_Quote.pdf');
  });

  // === Admin Fee Controls (hidden, toggle with Shift+D) ===
  let adminVisible = false;
  const footer = document.querySelector('.sidebar-footer');
  const adminBox = document.createElement('div');
  adminBox.id = 'adminFees';
  adminBox.style.display = 'none';
  adminBox.style.marginTop = '6px';
  adminBox.innerHTML = `
    <label style="display:flex;align-items:center;gap:6px;font-size:.85rem;">
      <input type="checkbox" id="addDelivery"> Delivery Fee $<input type="number" id="deliveryAmount" value="${(window.TRE_SETTINGS && window.TRE_SETTINGS.deliveryFee) || 100}" style="width:70px">
    </label>
    <label style="display:flex;align-items:center;gap:6px;font-size:.85rem;margin-top:4px;">
      <input type="checkbox" id="addSetup"> Setup Fee $<input type="number" id="setupAmount" value="${(window.TRE_SETTINGS && window.TRE_SETTINGS.setupFee) || 50}" style="width:70px">
    </label>
  `;
  footer.insertBefore(adminBox, footer.firstChild);

  const addDelivery = adminBox.querySelector('#addDelivery');
  const addSetup = adminBox.querySelector('#addSetup');
  const deliveryAmount = adminBox.querySelector('#deliveryAmount');
  const setupAmount = adminBox.querySelector('#setupAmount');

  function updateFees(){
    // Remove any existing fee items
    CART = CART.filter(it => !it.fee);
    if(addDelivery.checked){
      CART.push({
        id: 'delivery',
        name: 'Delivery Fee',
        category: 'Fee',
        price: parseFloat(deliveryAmount.value)||0,
        priceLabel: '$'+(parseFloat(deliveryAmount.value)||0),
        qty: 1,
        fee: true
      });
    }
    if(addSetup.checked){
      CART.push({
        id: 'setup',
        name: 'Setup Fee',
        category: 'Fee',
        price: parseFloat(setupAmount.value)||0,
        priceLabel: '$'+(parseFloat(setupAmount.value)||0),
        qty: 1,
        fee: true
      });
    }
    saveCart();
    updateCartUI();
  }
  [addDelivery, addSetup, deliveryAmount, setupAmount].forEach(el => el.addEventListener('input', updateFees));

  // Toggle admin controls with Shift+D
  document.addEventListener('keydown', (e)=>{
    if(e.shiftKey && e.key.toLowerCase()==='d'){
      adminVisible = !adminVisible;
      adminBox.style.display = adminVisible ? 'block' : 'none';
      if(adminVisible){
        if(deliveryAmount){ deliveryAmount.value = (window.TRE_SETTINGS && window.TRE_SETTINGS.deliveryFee) || 0; }
        if(setupAmount){ setupAmount.value = (window.TRE_SETTINGS && window.TRE_SETTINGS.setupFee) || 0; }
        if(taxInput){ taxInput.value = (window.TRE_SETTINGS && window.TRE_SETTINGS.taxRate) || 0; updateTax(); }
        updateFees();
      }

    }
  });

  // Gear icon toggle for admin controls
  const gearIcon = document.getElementById('gearIcon');
  if(gearIcon){
    gearIcon.addEventListener('click', ()=>{
      adminVisible = !adminVisible;
      adminBox.style.display = adminVisible ? 'block' : 'none';
      if(adminVisible){
        if(deliveryAmount){ deliveryAmount.value = (window.TRE_SETTINGS && window.TRE_SETTINGS.deliveryFee) || 0; }
        if(setupAmount){ setupAmount.value = (window.TRE_SETTINGS && window.TRE_SETTINGS.setupFee) || 0; }
        if(taxInput){ taxInput.value = (window.TRE_SETTINGS && window.TRE_SETTINGS.taxRate) || 0; updateTax(); }
        updateFees();
      }

    });
  }

  // === Admin Tax Control ===
  const taxLabel = document.createElement('label');
  taxLabel.style.cssText = "display:flex;align-items:center;gap:6px;font-size:.85rem;margin-top:4px;";
  taxLabel.innerHTML = `Tax % <input type="number" id="taxRate" value="${(window.TRE_SETTINGS && window.TRE_SETTINGS.taxRate) || 0}" style="width:70px">`;
  adminBox.appendChild(taxLabel);

  const taxInput = taxLabel.querySelector('#taxRate');

  function updateTax(){
    // Remove any existing tax items
    CART = CART.filter(it => !it.tax);
    const rate = parseFloat(taxInput.value)||0;
    if(rate>0){
      const subTotal = CART.reduce((sum,it)=> sum + (it.price? it.price*it.qty:0), 0);
      const taxAmt = subTotal * (rate/100);
      CART.push({
        id:'tax',
        name:`Tax (${rate.toFixed(2)}%)`,
        category:'Fee',
        price: taxAmt,
        priceLabel: '$'+taxAmt.toFixed(2),
        qty:1,
        tax:true
      });
    }
    saveCart();
    updateCartUI();
  }
  taxInput.addEventListener('input', updateTax);
