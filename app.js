function readSavedCsvState(){ try { return JSON.parse(localStorage.getItem('adspilotCsvImport')||'null'); } catch { return null; } }
const savedCsvState = readSavedCsvState();
const state = {
  csvImported: Boolean(savedCsvState && Array.isArray(savedCsvState.rows) && savedCsvState.rows.length),
  csvRows: Array.isArray(savedCsvState?.rows) ? savedCsvState.rows : [],
  importMeta: savedCsvState?.meta || null,
  history: Array.isArray(savedCsvState?.rows) && savedCsvState.rows.length ? savedCsvState.rows : []
};
const $ = id => document.getElementById(id);
const money = n => 'Rp ' + Math.max(0, Math.round(Number(n)||0)).toLocaleString('id-ID');
const pct = n => (Number(n)||0).toFixed(1) + '%';
function numberValue(id){ return Number(String($(id)?.value||'0').replace(/[^0-9.-]/g,'')) || 0; }
function showToast(msg){const el=$('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove('show'),2600)}
function switchCampaignView(view='brief'){
  document.querySelectorAll('[data-campaign-view]').forEach(b=>{const active=b.dataset.campaignView===view;b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false');});
  const ids={brief:'campaignBriefView',adsmanager:'adsmanager',creative:'creative'};
  Object.entries(ids).forEach(([key,id])=>{const el=$(id);if(el){el.classList.toggle('hidden',key!==view);el.classList.toggle('active',key===view);}});
  if(view==='adsmanager'){
    const preferred=$('platform')?.value;
    if(preferred==='meta') switchAdPlatform('meta'); else if(preferred==='tiktok') switchAdPlatform('tiktok');
    syncCampaignBrief();
  }
  if(view==='creative') syncCreativeBrief();
}
function switchPerformanceView(view='import'){
  document.querySelectorAll('[data-performance-view]').forEach(b=>{const active=b.dataset.performanceView===view;b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false');});
  const ids={import:'performanceImportView',results:'performanceResultsView',analysis:'performanceAnalysisView'};
  Object.entries(ids).forEach(([key,id])=>{const el=$(id);if(el){el.classList.toggle('hidden',key!==view);el.classList.toggle('active',key===view);}});
  if(view==='results') renderCsvImportState();
}
function setRoute(route){
  const routeMap={metaads:'campaign',tiktokads:'campaign',adsmanager:'campaign',creative:'campaign',analysis:'importcsv',previous:'importcsv'};
  const pageRoute=routeMap[route]||route;
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active-page',p.id===pageRoute));
  document.querySelectorAll('.nav-item[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===pageRoute));
  const titleMap={dashboard:'Overview',campaign:'Campaign Studio',importcsv:'Performance Hub',calculator:'Profit Planner',settings:'Settings'};
  $('pageTitle').textContent=titleMap[pageRoute]||'Overview';
  if(route==='metaads'){switchCampaignView('adsmanager');switchAdPlatform('meta');}
  else if(route==='tiktokads'){switchCampaignView('adsmanager');switchAdPlatform('tiktok');}
  else if(route==='adsmanager') switchCampaignView('adsmanager');
  else if(route==='creative') switchCampaignView('creative');
  else if(route==='campaign') switchCampaignView('brief');
  // Cross-page values are synchronized only when the user clicks the explicit Sync button.
  // This prevents silently overwriting manual Profit Planner edits or fee presets.
  if(route==='analysis') switchPerformanceView('analysis');
  else if(route==='previous') switchPerformanceView('results');
  else if(route==='importcsv') switchPerformanceView(state.csvImported?'results':'import');
  if(pageRoute==='importcsv' && typeof renderCsvImportState==='function') renderCsvImportState();
  if(location.hash !== '#'+route) window.history.replaceState(null,'','#'+route);
  window.scrollTo({top:0,behavior:'smooth'});
}
function bindRouting(){document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>setRoute(b.dataset.route)));window.addEventListener('hashchange',()=>setRoute(location.hash.slice(1)||'dashboard'));setRoute(location.hash.slice(1)||'dashboard')}
function syncCampaignBrief(){
  const product=$('productName')?.value.trim()||'';const budget=$('manualBudget')?.value||'';
  if($('adCampaignName')&&product)$('adCampaignName').value=`${product} • Conversion • Test 01`;
  if($('adGroupName')&&product)$('adGroupName').value=`${product} • Broad • Test`;
  if($('adBudget')&&budget)$('adBudget').value=budget;
  if($('adAudience')&&$('painPoints')?.value.trim())$('adAudience').value=$('painPoints').value.trim();
}
function syncCreativeBrief(){if($('creativeProduct'))$('creativeProduct').value=$('productName')?.value.trim()||'';if($('creativeAudience'))$('creativeAudience').value=$('painPoints')?.value.trim()||'';}
function syncProfitFromCampaign(){
  const productPrice=numberValue('productPrice'), productHpp=numberValue('productHpp'), profit=numberValue('targetProfit');
  if(productPrice>0)$('calcPrice').value=String(productPrice);
  if($('productHpp')?.value.trim()!=='' )$('calcHpp').value=String(productHpp);
  const orders=Math.max(1,Number($('targetOrders')?.value)||1);$('calcOrders').value=String(orders);
  if(productPrice>0&&profit>=0)$('calcMargin').value=String(Math.min(95,(profit/productPrice)*100).toFixed(2));
  const channel=$('platform')?.value;
  if(channel==='shopee'||channel==='shopee_gmv'){$('calcPlatform').value='shopee';presetFees('shopee');}
  else if(channel==='tiktok'){$('calcPlatform').value='tiktok';presetFees('tiktok');}
  showToast('Data Campaign Studio disinkronkan ke Profit Planner.');
}
function applyRecommendedBudget(){
  const raw=String($('recommendedBudget')?.textContent||'').replace(/[^0-9]/g,'');const value=Number(raw)||0;
  if(value<=0){showToast('Hitung Profit Planner dengan harga dan HPP terlebih dahulu.');return;}
  $('manualBudget').value=String(value);$('adBudget').value=String(value);syncCampaignBrief();
  setRoute('campaign');switchCampaignView('adsmanager');showToast('Budget rekomendasi diterapkan ke setup campaign.');
}
function renderDecisions(){
  let rows;
  if(state.csvImported && state.history.length){
    const sorted=[...state.history].filter(x=>Number(x.spend)>0).sort((a,b)=>(b.roas||0)-(a.roas||0));
    const top=sorted[0], low=sorted[sorted.length-1];
    rows=[];
    if(top)rows.push({i:'↗',c:'lime',t:`Evaluasi kandidat scale • ${top.name}`,s:`ROAS ${top.roas>0?top.roas.toFixed(2)+'x':'belum tersedia'} • Spend ${money(top.spend)}`,p:'test'});
    if(low)rows.push({i:'!',c:'orange',t:`Audit campaign terendah • ${low.name}`,s:`ROAS ${low.roas>0?low.roas.toFixed(2)+'x':'belum tersedia'} • cek CPA, CTR, dan CVR`,p:'fix'});
    const noValue=state.history.filter(x=>!(x.gmv>0)).length;
    if(noValue)rows.push({i:'?',c:'violet',t:'Lengkapi conversion value',s:`${noValue} campaign belum punya GMV/value; cek kolom laporan`,p:'fix'});
    rows.push({i:'✦',c:'pink',t:'Jalankan Smart Analysis',s:'Gunakan ringkasan CSV untuk diagnosis dan action plan',p:'next'});
  }else{
    rows=[
      {i:'⇧',c:'cyan',t:'Import laporan pertama',s:'Unggah CSV Meta, TikTok, atau Shopee untuk mengisi dashboard.',p:'next'},
      {i:'✦',c:'violet',t:'Siapkan campaign',s:'Masukkan produk, harga, HPP, dan target profit di Campaign Studio.',p:'next'},
      {i:'◈',c:'orange',t:'Hitung batas iklan aman',s:'Gunakan Profit Planner sebelum menentukan anggaran.',p:'test'}
    ];
  }
  $('decisionList').innerHTML=rows.map(r=>`<div class="decision"><div class="icon quick-icon ${r.c}">${r.i}</div><div><b>${escapeHtml(r.t)}</b><small>${escapeHtml(r.s)}</small></div><span class="pill ${r.p}">${r.p.toUpperCase()}</span></div>`).join('');
}
function renderHistory(){
  const rows=state.history||[];const table=$('historyTable');
  if(table)table.innerHTML=rows.map(x=>`<tr><td><b>${escapeHtml(x.name)}</b><small class="table-sub">${escapeHtml(CSV_PLATFORM_LABELS[x.platform]||x.platform||'')}</small></td><td>${money(x.spend)}</td><td>${x.gmv>0?money(x.gmv):'—'}</td><td><span class="table-badge ${x.roas>=5?'good':'warn'}">${x.roas>0?x.roas.toFixed(2)+'x':'—'}</span></td><td>${x.cpa>0?money(x.cpa):'—'}</td><td>${x.cvr>0?x.cvr.toFixed(1)+'%':'—'}</td></tr>`).join('')||'<tr><td colspan="6">Belum ada data.</td></tr>';
  renderCsvDashboardMetrics();
}
function shortMoney(n){ n=Number(n)||0; if(n>=1e9)return 'Rp '+(n/1e9).toFixed(1).replace('.',',')+' M'; if(n>=1e6)return 'Rp '+(n/1e6).toFixed(1).replace('.',',')+' jt'; if(n>=1e3)return 'Rp '+(n/1e3).toFixed(1).replace('.',',')+' rb'; return money(n); }
function getHistoryTotals(rows=state.history){ return (rows||[]).reduce((a,x)=>{a.spend+=Number(x.spend)||0;a.gmv+=Number(x.gmv)||0;a.orders+=Number(x.orders)||0;a.impressions+=Number(x.impressions)||0;a.clicks+=Number(x.clicks)||0;return a;},{spend:0,gmv:0,orders:0,impressions:0,clicks:0}); }
function renderCsvDashboardMetrics(){
  const t=getHistoryTotals(); const roas=t.spend>0&&t.gmv>0?t.gmv/t.spend:0;
  if($('mGmv')) $('mGmv').textContent=t.gmv>0?shortMoney(t.gmv):'—';
  if($('mSpend')) $('mSpend').textContent=t.spend>0?shortMoney(t.spend):'—';
  if($('mRoas')) $('mRoas').textContent=roas>0?roas.toFixed(2)+'x':'—';
  if($('mProfit')) $('mProfit').textContent='—';
  const trendEls=document.querySelectorAll('.metric-grid .metric-card .trend');
  if(trendEls[0]) trendEls[0].textContent=state.csvImported?`${state.history.length} campaign dari CSV`:'Menunggu impor CSV';
  if(trendEls[1]) trendEls[1].textContent=state.csvImported?`${state.importMeta?.files?.length||0} file diimpor`:'Bukan akun live';
  if(trendEls[2]) trendEls[2].textContent='GMV ÷ Ad Spend';
  if(trendEls[3]) trendEls[3].textContent='Butuh HPP + data order per produk';
  if($('dashboardHeadline')) $('dashboardHeadline').textContent=state.csvImported?(roas>=4?'Data masuk. Sekarang optimalkan yang sudah terbukti.':'Data CSV berhasil dibaca. Mari cari peluang perbaikan.'):'Mulai dari data bisnis Anda, bukan tebakan.';
  if($('dashboardSummary')) $('dashboardSummary').textContent=state.csvImported?`Dashboard memakai data impor ${state.importMeta?.files?.join(', ')||'CSV'}; total spend ${money(t.spend)}${t.gmv>0?' dan conversion value '+money(t.gmv):''}. Jalankan Smart Analysis untuk rekomendasi berdasarkan performa sebenarnya.`:'Belum ada data yang diimpor. Unggah laporan CSV Meta, TikTok, atau Shopee agar dashboard dan Smart Analysis menggunakan data aktual Anda.';
}
function collectCampaignContext(){return {
  task:'campaign_strategy', product:{name:$('productName').value,platform:$('platform').value,price:numberValue('productPrice'),hpp:numberValue('productHpp'),url:$('productUrl').value,description:$('productDesc').value},
  target:{profit:numberValue('targetProfit'),ordersPerDay:Number($('targetOrders').value)||0,manualBudget:numberValue('manualBudget')}, painPoints:$('painPoints').value,
  history:$('useHistory').checked?state.history:[], instruction:'Bahasa Indonesia sederhana, praktis, jangan jawab generik. Prioritaskan profit dan eksekusi.'
}}
function renderCampaignResult(data){
  const title=escapeHtml(data.title||'AI Campaign Strategy');
  const verdict=escapeHtml(data.verdict||'RECOMMENDED');
  $('campaignResultTitle').textContent=data.title||'AI Campaign Strategy';
  $('campaignBadge').textContent=(data.verdict||'READY').toUpperCase();
  $('campaignBadge').className='status-badge '+((data.verdict||'').toLowerCase().includes('scale')?'good':'warn');
  const actions=(data.actions||[]).map(a=>`<div class="result-card-mini"><b>${escapeHtml(a.priority||'ACTION')} • ${escapeHtml(a.action||'')}</b><p>${escapeHtml(a.why||'')}</p></div>`).join('');
  const creatives=(data.creatives||[]).slice(0,3).map(c=>`<div class="result-card-mini"><b>${escapeHtml(c.hook||'Hook baru')}</b><p>${escapeHtml(c.angle||'')} • ${escapeHtml(c.format||'Short video')} • CTA: ${escapeHtml(c.cta||'Shop now')}</p></div>`).join('');
  const budget=data.budget||{}, audience=data.audience||{};
  const pain=(audience.pain_points||[]).slice(0,2).map(escapeHtml).join(' • ');
  $('campaignResult').innerHTML=`<div class="ai-summary"><b>${verdict}</b><p>${escapeHtml(data.summary||'AI belum memberikan ringkasan.')}</p></div><div class="two-col" style="grid-template-columns:1fr 1fr;gap:10px"><div class="result-card-mini"><b>Budget</b><p>${Number(budget.recommended_daily_budget||0).toLocaleString('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})}/hari • CPA ${Number(budget.max_cpa||0).toLocaleString('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})} • ROAS ${Number(budget.target_roas||0).toFixed(2)}x</p></div><div class="result-card-mini"><b>Audience</b><p>${escapeHtml(audience.primary||'—')}<br>${pain}</p></div></div><h5 style="margin:15px 0 7px;font-size:10px">AI ACTION PLAN</h5>${actions}<h5 style="margin:15px 0 7px;font-size:10px">CREATIVE STARTER</h5>${creatives}`;
}
async function callAI(payload){
  const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const body=await res.json().catch(()=>({})); if(!res.ok) throw new Error(body.error||'AI request gagal'); return body.data;
}
async function generateCampaign(){
  const btn=$('generateCampaignBtn');
  const product=$('productName').value.trim(),price=numberValue('productPrice'),hpp=numberValue('productHpp'),target=numberValue('targetProfit');
  if(!product||price<=0||hpp<0||target<=0){showToast('Isi nama produk, harga jual, HPP, dan target laba terlebih dahulu.');return;}
  btn.disabled=true; btn.textContent='AI sedang berpikir…';
  try{const data=await callAI(collectCampaignContext()); renderCampaignResult(data); showToast('Strategi AI selesai dibuat.')}catch(e){$('campaignResult').innerHTML=`<div class="empty-state"><div class="empty-emoji">⚠️</div><h4>AI belum bisa menjawab</h4><p>${escapeHtml(e.message)}. Periksa HERMES_API_URL dan HERMES_API_KEY di Netlify.</p></div>`;showToast('Gagal memanggil Hermes.')}finally{btn.disabled=false;btn.textContent='✦ Buat Strategi AI'}
}
function presetFees(platform){
  if(platform==='shopee'){ $('feeAdmin').value=8.25;$('feeAffiliate').value=5;$('feeProgram').value=4.5;$('feeTax').value=0.5;$('feeOperational').value=1000;$('feeReturn').value=1000;$('feeFixed').value=1250;$('feePacking').value=0; }
  else { $('feeAdmin').value=5;$('feeAffiliate').value=10;$('feeProgram').value=0;$('feeTax').value=0.5;$('feeOperational').value=1000;$('feeReturn').value=1000;$('feeFixed').value=0;$('feePacking').value=1; }
}
function calcEngine(){
  const price=numberValue('calcPrice'), hpp=numberValue('calcHpp'), disc=Number($('calcDiscount').value)||0, targetMargin=Number($('calcMargin').value)||0, orders=Math.max(1,Number($('calcOrders').value)||1);
  const admin=Number($('feeAdmin').value)||0, affiliate=Number($('feeAffiliate').value)||0, program=Number($('feeProgram').value)||0, tax=Number($('feeTax').value)||0, operational=numberValue('feeOperational'), risk=numberValue('feeReturn'), fixed=numberValue('feeFixed'), packing=Number($('feePacking').value)||0;
  const subtotal=price, discount=subtotal*disc/100, feeBase=subtotal-discount;
  const variablePct=(admin+affiliate+program+tax+packing)/100; const nonAd= hpp+operational+risk+fixed+feeBase*variablePct;
  const breakEvenAd=Math.max(0,feeBase-nonAd); const targetProfit=Math.max(0,price*targetMargin/100); const maxAd=Math.max(0,feeBase-nonAd-targetProfit); const profitWithoutAds=breakEvenAd;
  const targetRoas=maxAd>0?price/maxAd:0, breakEvenRoas=breakEvenAd>0?price/breakEvenAd:0; const recBudget=maxAd*orders*0.8;
  let score=maxAd<=0?18:Math.min(98,Math.round((maxAd/price)*100*2.2+40)); const verdict=maxAd<=0?'DO NOT SCALE':score>=70?'SAFE TO TEST / SCALE':'TEST CAREFULLY';
  $('maxCpa').textContent=money(maxAd);$('maxCpaHint').textContent=maxAd>0?`Target profit ${money(targetProfit)} / order sudah diperhitungkan.`:'Margin target terlalu tinggi dibanding unit economics.';$('profitScore').textContent=score+'/100';$('profitPerOrder').textContent=money(targetProfit);$('targetRoas').textContent=targetRoas?targetRoas.toFixed(2)+'x':'∞';$('breakEvenRoas').textContent=breakEvenRoas?breakEvenRoas.toFixed(2)+'x':'—';$('recommendedBudget').textContent=money(recBudget);$('budgetHint').textContent=`${orders} order/hari × safe CPA × 80% buffer`;$('profitScore').style.color=score>=70?'#b8e65c':score>=45?'#ffcf85':'#ff8fa8';$('calcVerdict').textContent=verdict;$('calcAdvice').innerHTML=`<b>${verdict}</b><br>Non-ad cost sekitar ${money(nonAd)} / order. Batas accounting sebelum rugi iklan sekitar ${money(breakEvenAd)} / order. Untuk tetap mencapai target margin ${targetMargin.toFixed(1)}%, safe ads cost turun menjadi ${money(maxAd)} / order.`;
  const scenarios=[['Conservative',.55,.95],['Base',.75,1],['Aggressive',.9,1.08]].map(x=>{const cpa=maxAd*x[1], budget=cpa*orders, roas=cpa>0?price/cpa:0;return {n:x[0],cpa,budget,roas,mod:x[2]}});
  $('scenarioTable').innerHTML=`<div class="scenario-row"><b>Level</b><b>CPA</b><b>ROAS</b><b>Budget/hari</b></div>`+scenarios.map(s=>`<div class="scenario-row"><b>${s.n}</b><span>${money(s.cpa)}</span><span>${s.roas?s.roas.toFixed(2)+'x':'—'}</span><span>${money(s.budget)}</span></div>`).join('');
  return {price,hpp,disc,targetMargin,orders,nonAd,maxAd,targetRoas,breakEvenRoas,recBudget,score,verdict};
}
function runCalculator(){if(numberValue('calcPrice')<=0||$('calcHpp').value.trim()===''){showToast('Masukkan harga jual dan HPP terlebih dahulu.');return;}const r=calcEngine();try{localStorage.setItem('lastCalc',JSON.stringify(r));}catch{}showToast('Profit & budget berhasil dihitung.');}
async function runSmartAnalysis(){
  if(!state.csvImported||!state.history.length){showToast('Import laporan CSV terlebih dahulu agar analisis memakai data aktual.');switchPerformanceView('import');return;}
  const btn=$('runSmartAnalysisBtn');btn.disabled=true;btn.textContent='Menganalisis…';$('analysisBadge').textContent='AI bekerja';$('analysisBadge').className='status-badge warn';
  try{const data=await callAI({task:'smart_analysis',history:state.history.slice(0,100),source_info:state.importMeta||{source:'CSV import'},instruction:'Analisis sebagai performance marketer. Jelaskan keterbatasan bila metrik tak tersedia. Bedakan metrik yang tersedia dari asumsi, jangan mengarang profit tanpa HPP. Buat diagnosis sebab-akibat, prioritas tindakan, dan aturan scale/fix/stop.'}); const actions=(data.actions||[]).map(a=>`<div class="result-card-mini"><b>${escapeHtml(a.priority||'ACTION')} • ${escapeHtml(a.action||'')}</b><p>${escapeHtml(a.why||'')}</p></div>`).join('');$('analysisResult').innerHTML=`<div class="ai-summary"><b>${escapeHtml(data.verdict||'SMART ANALYSIS')}</b><p>${escapeHtml(data.summary||'')}</p></div>${actions}`;$('analysisBadge').textContent='Updated';$('analysisBadge').className='status-badge good';showToast('Smart Analysis selesai.')}catch(e){$('analysisResult').innerHTML=`<div class="empty-state"><div class="empty-emoji">⚠️</div><h4>AI gagal membaca data</h4><p>${escapeHtml(e.message)}</p></div>`;showToast('Gagal memanggil Hermes.')}finally{btn.disabled=false;btn.textContent='✦ Analisis dengan Hermes'}
}
async function runCreative(){
  syncCreativeBrief();
  if(!$('creativeProduct').value.trim()){showToast('Isi nama produk di Brief & Tujuan terlebih dahulu.');switchCampaignView('brief');return;}
  const btn=$('runCreativeBtn');btn.disabled=true;btn.textContent='Generating…';
  try{const data=await callAI({task:'creative_ideas',product:$('creativeProduct').value,goal:$('creativeGoal').value,audience:$('creativeAudience').value,instruction:'Buat 5 creative short-form yang fokus pada hook kuat, angle jelas, proof, CTA. Bahasa Indonesia natural.'}); const items=data.creatives||[]; $('creativeResult').innerHTML=items.map((c,i)=>`<article class="creative-card"><div class="creative-number">0${i+1}</div><h4>${escapeHtml(c.hook||'Hook baru')}</h4><div class="creative-meta"><span>${escapeHtml(c.angle||'Problem-solution')}</span><span>${escapeHtml(c.format||'UGC')}</span><span>${escapeHtml(c.cta||'Shop Now')}</span></div><p>${escapeHtml(c.script||c.reason||'')}</p></article>`).join('') || `<div class="panel"><p>Belum ada creative.</p></div>`;showToast('5 creative baru siap.')}catch(e){showToast('Gagal generate creative: '+e.message)}finally{btn.disabled=false;btn.textContent='✦ Generate 5 Creative'}
}

let activeAdPlatform='meta';
function escapeHtml(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function adFormData(){
  return {
    platform:activeAdPlatform,
    campaign:{name:$('adCampaignName').value.trim(),objective:$('adObjective').value,buying_type:$('adBuyingType').value,daily_budget:numberValue('adBudget')},
    ad_group:{name:$('adGroupName').value.trim(),audience:$('adAudience').value.trim(),placements:$('adPlacements').value,optimization_goal:$('adOptimization').value,bid_strategy:$('adBidStrategy').value},
    ad:{format:$('adFormat').value,primary_text:$('adCopy').value.trim(),cta:$('adCta').value,destination_url:$('adDestination').value.trim(),creative_reference:$('adCreativeRef').value.trim()}
  };
}
function validateAdSetup(data){
  const errors=[]; const warnings=[];
  if(!data.campaign.name) errors.push('Nama campaign belum diisi.');
  if(!data.campaign.daily_budget || data.campaign.daily_budget<=0) errors.push('Budget harian harus lebih dari 0.');
  if(!data.ad_group.name) errors.push('Nama Ad Set / Ad Group belum diisi.');
  if(!data.ad_group.audience) errors.push('Audience belum diisi.');
  if(!data.ad.primary_text) errors.push('Primary copy/caption belum diisi.');
  if(!/^https?:\/\//i.test(data.ad.destination_url)) warnings.push('Destination URL belum berupa URL http/https.');
  if(activeAdPlatform==='meta' && data.campaign.objective==='SALES' && !/purchase/i.test(data.ad_group.optimization_goal)) warnings.push('Untuk Sales, cek kembali optimization goal agar sesuai event konversi akun.');
  if(activeAdPlatform==='tiktok' && data.ad_group.placements==='AUTO') warnings.push('Placement otomatis akan bergantung pada inventory yang eligible di akun/region.');
  return {ok:errors.length===0,errors,warnings};
}
function buildMetaPayload(d){
  return {platform:'meta',api_family:'Meta Marketing API',resources:{campaign:{endpoint:'/act_{AD_ACCOUNT_ID}/campaigns',method:'POST',fields:{name:d.campaign.name,objective:d.campaign.objective,special_ad_categories:[]}},adset:{endpoint:'/act_{AD_ACCOUNT_ID}/adsets',method:'POST',fields:{name:d.ad_group.name,daily_budget:Math.round(d.campaign.daily_budget),optimization_goal:d.ad_group.optimization_goal,billing_event:'IMPRESSIONS',targeting:{audience_description:d.ad_group.audience},status:'PAUSED'}},adcreative:{endpoint:'/act_{AD_ACCOUNT_ID}/adcreatives',method:'POST',fields:{name:d.ad.campaignName||d.campaign?.name||d.ad_group.name,object_story_spec:{page_id:'{PAGE_ID}',link_data:{message:d.ad.primary_text,link:d.ad.destination_url,call_to_action:{type:d.ad.cta}}}}},ad:{endpoint:'/act_{AD_ACCOUNT_ID}/ads',method:'POST',fields:{name:`${d.ad_group.name} • Ad 01`,status:'PAUSED',creative:{creative_id:'{CREATIVE_ID}'},adset_id:'{ADSET_ID}'}}},notes:['Asset IDs in braces are placeholders for a manual blueprint; this app does not call the Ads API.','Apply the steps in Ads Manager: campaign → ad set → creative → ad.']};
}
function buildTikTokPayload(d){
  return {platform:'tiktok',api_family:'TikTok Marketing API',resources:{campaign:{endpoint:'/campaign/create/',method:'POST',fields:{campaign_name:d.campaign.name,objective_type:d.campaign.objective,budget_mode:'BUDGET_MODE_DAY',budget:Math.round(d.campaign.daily_budget),operation_status:'DISABLE'}},adgroup:{endpoint:'/adgroup/create/',method:'POST',fields:{adgroup_name:d.ad_group.name,placement_type:d.ad_group.placements==='AUTO'?'PLACEMENT_TYPE_AUTOMATIC':'PLACEMENT_TYPE_NORMAL',optimization_goal:d.ad_group.optimization_goal,bid_type:d.ad_group.bid_strategy,budget_mode:'BUDGET_MODE_DAY',budget:Math.round(d.campaign.daily_budget),operation_status:'DISABLE',targeting:{audience_description:d.ad_group.audience}}},ad:{endpoint:'/ad/create/',method:'POST',fields:{ad_name:`${d.ad_group.name} • Ad 01`,ad_format:d.ad.format,ad_text:d.ad.primary_text,call_to_action:d.ad.cta,landing_page_url:d.ad.destination_url,adgroup_id:'{ADGROUP_ID}',identity_id:'{IDENTITY_ID}',video_id:'{VIDEO_ID_OR_IMAGE_IDS}'} }},notes:['This JSON is a manual blueprint, not a live API request. Field choices can vary by account and region.','Apply the steps in Ads Manager: campaign → ad group → ad.']};
}
function renderAdPlatform(){
  const meta=activeAdPlatform==='meta';
  document.querySelectorAll('.platform-tab').forEach(b=>b.classList.toggle('active',b.dataset.adPlatform===activeAdPlatform));
  $('adSetupTitle').textContent=meta?'Meta Ads Manager':'TikTok Ads Manager';
  $('payloadPlatformBadge').textContent=meta?'Meta':'TikTok';
  $('adSetupHint').innerHTML=meta?'<b>Meta:</b> campaign → Ad Set → Ad. Budget, targeting, placements, optimization berada terutama di level Ad Set.':'<b>TikTok:</b> campaign → Ad Group → Ad. TikTok mendukung manual, Search, dan Smart+ campaign; form ini memakai struktur setup yang paling mudah dikontrol.';
  $('adSetupStatus').textContent='Draft'; $('adSetupStatus').className='status-badge waiting';
  $('metaAssetFields')?.classList.toggle('hidden',activeAdPlatform!=='meta');
  $('tiktokAssetFields')?.classList.toggle('hidden',activeAdPlatform!=='tiktok');
}
async function validateAndBuildPayload(){
  const d=adFormData(); const v=validateAdSetup(d);
  $('adsValidation').innerHTML=`<b>${v.ok?'✓ Setup valid secara dasar':'⚠ Ada yang perlu diperbaiki'}</b>${v.errors.length?'<ul>'+v.errors.map(x=>`<li>${escapeHtml(x)}</li>`).join('')+'</ul>':''}${v.warnings.length?'<div class="validation-warn">'+v.warnings.map(x=>`<div>• ${escapeHtml(x)}</div>`).join('')+'</div>':''}`;
  $('adsValidation').className='validation-card '+(v.ok?'valid':'invalid');
  $('sumCampaign').textContent=d.campaign.name||'—'; $('sumGroup').textContent=d.ad_group.name||'—'; $('sumBudget').textContent=money(d.campaign.daily_budget)+'/hari'; $('sumObjective').textContent=d.campaign.objective;
  const payload=activeAdPlatform==='meta'?buildMetaPayload(d):buildTikTokPayload(d);
  $('apiPayload').textContent=JSON.stringify(payload,null,2); $('adSetupStatus').textContent=v.ok?'Ready':'Needs fix'; $('adSetupStatus').className='status-badge '+(v.ok?'good':'warn');
  window.__lastAdPayload=payload; showToast(v.ok?'Payload siap digunakan.':'Periksa field yang ditandai.');
}
async function aiFillAdsSetup(){
  const btn=$('aiFillAdsBtn');btn.disabled=true;btn.textContent='AI mengisi…';
  try{
    const calc=calcEngine();
    const data=await callAI({task:'platform_campaign_setup',platform:activeAdPlatform,product:{name:$('productName').value,price:numberValue('productPrice'),hpp:numberValue('productHpp'),description:$('productDesc').value,url:$('productUrl').value,pain_points:$('painPoints').value},goal:{profit:numberValue('targetProfit'),orders_per_day:Number($('targetOrders').value)||0,daily_budget:numberValue('manualBudget')},profit_engine:calc,previous_campaigns:$('useHistory').checked?state.history:[],current_setup:adFormData(),instruction:'Isi setup campaign platform secara konkret. Jangan mengarang field API yang tidak diketahui; bila ada ketidakpastian tulis sebagai warning. Prioritaskan profit dan simple execution.'});
    if(data?.audience?.primary) $('adAudience').value=data.audience.primary;
    if(data?.budget?.recommended_daily_budget) $('adBudget').value=Math.round(data.budget.recommended_daily_budget);
    if((data?.actions||[])[0]?.action) $('adOptimization').value=(data.actions[0].action||'Purchase').slice(0,120);
    const c=(data?.creatives||[])[0]; if(c){ if(c.script) $('adCopy').value=c.script; if(c.cta) $('adCta').value=c.cta; }
    if(data?.title) $('adCampaignName').value=`${activeAdPlatform==='meta'?'META':'TT'} • ${data.title}`.slice(0,120);
    validateAndBuildPayload(); showToast('Setup campaign diisi AI.');
  }catch(e){showToast('AI setup gagal: '+e.message)}finally{btn.disabled=false;btn.textContent='✦ Isi dengan AI';}
}
function switchAdPlatform(p){activeAdPlatform=p;renderAdPlatform();validateAndBuildPayload();}

async function testAI(){
  const settingsBadge=$('hermesStatusBadge'), sideBadge=$('hermesSidebarStatus');
  if(settingsBadge){settingsBadge.textContent='Menguji koneksi…';settingsBadge.className='status-badge warn';}
  if(sideBadge) sideBadge.textContent='TEST…';
  try{
    const data=await callAI({task:'ping',message:'Balas dengan status koneksi Hermes dan satu kalimat singkat.'});
    if(settingsBadge){settingsBadge.textContent='Terhubung';settingsBadge.className='status-badge good';}
    if(sideBadge) sideBadge.textContent='READY';
    showToast('Hermes terhubung: '+(data.summary||'OK'));
  }catch(e){
    if(settingsBadge){settingsBadge.textContent='Belum terhubung';settingsBadge.className='status-badge warn';}
    if(sideBadge) sideBadge.textContent='ERROR';
    showToast('Hermes belum terhubung: '+e.message);
  }
}
function boot(){
  bindRouting();renderDecisions();renderHistory();presetFees('tiktok');$('generateCampaignBtn').addEventListener('click',generateCampaign);$('calculateBtn').addEventListener('click',runCalculator);$('runSmartAnalysisBtn').addEventListener('click',runSmartAnalysis);$('runCreativeBtn').addEventListener('click',runCreative);$('testAiBtn')?.addEventListener('click',testAI);$('testAiBtn2')?.addEventListener('click',testAI);$('calcPlatform').addEventListener('change',e=>presetFees(e.target.value));$('modal').addEventListener('click',e=>{if(e.target.id==='modal'||e.target.id==='closeModal')$('modal').classList.add('hidden')});document.querySelectorAll('.preset').forEach(b=>b.addEventListener('click',()=>{presetFees(b.dataset.preset);setRoute('calculator');showToast('Preset biaya '+b.dataset.preset+' diterapkan.')}));
  document.querySelectorAll('.platform-tab').forEach(b=>b.addEventListener('click',()=>switchAdPlatform(b.dataset.adPlatform)));
  document.querySelectorAll('[data-campaign-view]').forEach(b=>b.addEventListener('click',()=>switchCampaignView(b.dataset.campaignView)));
  document.querySelectorAll('[data-performance-view]').forEach(b=>b.addEventListener('click',()=>switchPerformanceView(b.dataset.performanceView)));
  ['productName','productPrice','productHpp','targetProfit','targetOrders','manualBudget','productUrl','painPoints','productDesc'].forEach(id=>$(id)?.addEventListener('input',()=>{syncCampaignBrief();syncCreativeBrief();}));
  $('platform')?.addEventListener('change',()=>{const p=$('platform').value;if(p==='meta')activeAdPlatform='meta';else if(p==='tiktok')activeAdPlatform='tiktok';syncCampaignBrief();});
  $('manualBudget')?.addEventListener('change',syncCampaignBrief);
  $('syncProductToCalcBtn')?.addEventListener('click',syncProfitFromCampaign);
  $('useRecommendedBudgetBtn')?.addEventListener('click',applyRecommendedBudget);
  $('aiFillAdsBtn').addEventListener('click',aiFillAdsSetup);$('validateAdsBtn').addEventListener('click',validateAndBuildPayload);
  $('copyPayloadBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('apiPayload').textContent);showToast('JSON payload disalin.')}catch{showToast('Browser menolak clipboard.')}});
  $('exportSetupBtn')?.addEventListener('click',downloadSetupJson);
  $('importCsvBtn')?.addEventListener('click',importCampaignCsvFiles);
  $('clearCsvBtn')?.addEventListener('click',clearImportedCsvData);
  $('exportImportedCsvBtn')?.addEventListener('click',downloadImportedCsv);
  $('csvFiles')?.addEventListener('change',()=>{const files=[...($('csvFiles').files||[])];setCsvStatus(files.length?`<b>${files.length} file dipilih.</b><p>${files.map(f=>escapeHtml(f.name)).join('<br>')}</p>`:'<b>Belum ada file yang diimpor.</b><p>Pilih platform dan unggah CSV laporan performa iklan.</p>','info')});
  renderAdPlatform(); renderCsvImportState(); switchCampaignView('brief'); switchPerformanceView(state.csvImported?'results':'import');
  const saved=localStorage.getItem('lastCalc');if(saved){try{const r=JSON.parse(saved); if(r.price){$('calcPrice').value=r.price;$('calcHpp').value=r.hpp;$('calcMargin').value=r.targetMargin;$('calcOrders').value=r.orders}}catch{}}
}
function downloadSetupJson(){
  const v=validateAdSetup(adFormData());
  if(!v.ok){showToast('Perbaiki setup: '+v.errors.join(' '));return;}
  validateAndBuildPayload();
  const payload={mode:'campaign_setup_reference_only',platform:activeAdPlatform,created_at:new Date().toISOString(),note:'Blueprint untuk referensi/manual setup; file ini tidak membuat atau mengubah iklan aktif.',setup:adFormData(),payload_preview:(()=>{try{return JSON.parse($('apiPayload').textContent)}catch{return $('apiPayload').textContent}})()};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${activeAdPlatform}-campaign-setup.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);showToast('Setup JSON berhasil diunduh.');
}

/* === CSV reporting import: no platform OAuth/API credentials required === */
const CSV_PLATFORM_LABELS = {meta:'Meta Ads',tiktok:'TikTok Ads',shopee:'Shopee Ads',custom:'CSV standar',Demo:'Demo'};
function csvNorm(value){return String(value??'').replace(/^\uFEFF/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function csvParseNumber(value){
  if(value===null||value===undefined||value==='') return 0;
  let s=String(value).trim().replace(/[\u00a0\s]/g,'').replace(/[%$£€¥]/g,'').replace(/[Rr][Pp]/g,'').replace(/[()]/g,'');
  if(!s||/^[-—n\/a]+$/i.test(s)) return 0;
  const dot=s.lastIndexOf('.'), comma=s.lastIndexOf(',');
  if(dot>=0&&comma>=0){ if(dot>comma) s=s.replace(/,/g,''); else s=s.replace(/\./g,'').replace(',', '.'); }
  else if(comma>=0){const tail=s.length-comma-1; if(tail===3 && /^-?\d{1,3}(,\d{3})+$/.test(s)) s=s.replace(/,/g,''); else s=s.replace(/,/g,'.');}
  else if((s.match(/\./g)||[]).length>1) s=s.replace(/\./g,'');
  else if(dot>=0 && s.length-dot-1===3 && /^-?\d{1,3}\.\d{3}$/.test(s)) s=s.replace(/\./g,'');
  s=s.replace(/[^0-9.+-]/g,''); const n=Number(s); return Number.isFinite(n)?Math.max(0,n):0;
}
function csvDetectDelimiter(text){
  const line=(String(text).replace(/^\uFEFF/,'').split(/\r?\n/).find(x=>x.trim())||''); let quoted=false, counts={',':0,';':0,'\t':0};
  for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){i++;continue;}quoted=!quoted;}else if(!quoted&&Object.prototype.hasOwnProperty.call(counts,c))counts[c]++;}
  return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][1]>0?Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0]:',';
}
function csvParse(text){
  const delimiter=csvDetectDelimiter(text), input=String(text).replace(/^\uFEFF/,''); const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<input.length;i++){
    const c=input[i];
    if(c==='"'){ if(quoted&&input[i+1]==='"'){field+='"';i++;}else quoted=!quoted; }
    else if(c===delimiter&&!quoted){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!quoted){ if(c==='\r'&&input[i+1]==='\n')i++;row.push(field);field='';if(row.some(v=>String(v).trim()!==''))rows.push(row);row=[]; }
    else field+=c;
  }
  if(field!==''||row.length){row.push(field);if(row.some(v=>String(v).trim()!==''))rows.push(row);}
  return rows;
}
const CSV_ALIASES={
  platform:['platform','platform name','sumber platform'],
  campaign:['campaign name','campaign_name','nama campaign','nama kampanye','nama kampanye iklan','campaign','campaign id','campaign_id','ad name','nama iklan','product name','nama produk','item name','nama promosi'],
  spend:['amount spent idr','amount spent usd','amount spent','ad spend','spend idr','spend usd','spend','spent','total cost idr','total cost usd','total cost','jumlah yang dibelanjakan','jumlah dibelanjakan','biaya iklan','biaya','pengeluaran iklan','cost idr','cost usd','cost'],
  gmv:['website purchases conversion value','purchases conversion value','purchase conversion value','website purchase conversion value','purchase value','conversion value','complete payment value','nilai pembayaran lengkap','nilai konversi pembelian','nilai pembelian','gross revenue','gross merchandise value','sales amount','total sales','order value','nilai transaksi','total revenue','revenue','sales','gmv','omzet','nilai konversi'],
  orders:['complete payment website','complete payment','pembayaran lengkap','website purchases','purchases','purchase','orders','order','total orders','hasil pembelian','pesanan','pembelian','conversions','conversion'],
  impressions:['impressions','impression','tayangan','impresi'],
  clicks:['link clicks','clicks destination','clicks to website','outbound clicks','clicks','click','klik tautan','klik link','klik'],
  ctr:['ctr link click through rate','click through rate','ctr destination','ctr all','ctr','rasio klik'],
  cpc:['cost per link click','cost per click','cpc link','cpc','biaya per klik'],
  cpm:['cost per 1000 impressions','cpm','biaya per 1000 tayangan'],
  cpa:['cost per purchase','cost per complete payment','cost per order','cost per result','cost per conversion','cost per action','cpa','biaya per hasil','biaya per pembelian'],
  roas:['purchase roas','roas pembelian','website purchase roas','roas complete payment','roas','return on ad spend','return on advertising spend'],
  cvr:['purchase conversion rate','conversion rate','cvr','rasio konversi','tingkat konversi'],
  date:['reporting starts','reporting ends','date','day','tanggal','report date','time']
};
function csvFindIndex(headers, key){
  const aliases=[...(CSV_ALIASES[key]||[])]; const normalized=headers.map(csvNorm);
  for(const alias of aliases){const i=normalized.findIndex(h=>h===csvNorm(alias));if(i>=0)return i;}
  for(const alias of aliases.sort((a,b)=>b.length-a.length)){const needle=csvNorm(alias);if(needle.length<6)continue;const i=normalized.findIndex(h=>h.includes(needle));if(i>=0)return i;}
  return -1;
}
function csvFindHeader(rows){
  for(let i=0;i<Math.min(rows.length,15);i++){
    const headers=rows[i].map(x=>String(x||'').trim());
    const campaign=csvFindIndex(headers,'campaign'), spend=csvFindIndex(headers,'spend'), gmv=csvFindIndex(headers,'gmv'), roas=csvFindIndex(headers,'roas');
    if(campaign>=0&&(spend>=0||(gmv>=0&&roas>=0)))return {index:i,headers,mapping:{platform:csvFindIndex(headers,'platform'),campaign,spend,gmv,orders:csvFindIndex(headers,'orders'),impressions:csvFindIndex(headers,'impressions'),clicks:csvFindIndex(headers,'clicks'),ctr:csvFindIndex(headers,'ctr'),cpc:csvFindIndex(headers,'cpc'),cpm:csvFindIndex(headers,'cpm'),cpa:csvFindIndex(headers,'cpa'),roas,cvr:csvFindIndex(headers,'cvr'),date:csvFindIndex(headers,'date')}};
  }
  return null;
}
function csvCell(row,index){return index>=0?String(row[index]??'').trim():'';}
function csvMapPlatform(value, fallback){
  const n=csvNorm(value);
  if(n.includes('tiktok')||n==='tt'||n.includes('tik tok'))return 'tiktok';
  if(n.includes('meta')||n.includes('facebook')||n.includes('instagram')||n==='fb')return 'meta';
  if(n.includes('shopee'))return 'shopee';
  return fallback;
}
function csvToMetricRows(rows, headerInfo, platform, sourceFile){
  const output=[]; const {index:headerRow,mapping:m}=headerInfo;
  for(let i=headerRow+1;i<rows.length;i++){
    const r=rows[i]; const rawName=csvCell(r,m.campaign); if(!rawName)continue; const rowPlatform=platform==='custom'&&m.platform>=0?csvMapPlatform(csvCell(r,m.platform),platform):platform;
    const nm=csvNorm(rawName);if(['total','grand total','summary','all campaigns','total result'].includes(nm))continue;
    let spend=csvParseNumber(csvCell(r,m.spend));let gmv=csvParseNumber(csvCell(r,m.gmv));let orders=csvParseNumber(csvCell(r,m.orders));let impressions=csvParseNumber(csvCell(r,m.impressions));let clicks=csvParseNumber(csvCell(r,m.clicks));let ctr=csvParseNumber(csvCell(r,m.ctr));let cpa=csvParseNumber(csvCell(r,m.cpa));let roas=csvParseNumber(csvCell(r,m.roas));let cvr=csvParseNumber(csvCell(r,m.cvr));let cpc=csvParseNumber(csvCell(r,m.cpc));let cpm=csvParseNumber(csvCell(r,m.cpm));
    if(spend<=0&&gmv>0&&roas>0)spend=gmv/roas;
    if(gmv<=0&&spend>0&&roas>0)gmv=spend*roas;
    if(clicks<=0&&ctr>0&&impressions>0)clicks=impressions*ctr/100;
    if(orders<=0&&cpa>0&&spend>0)orders=spend/cpa;
    if(orders<=0&&cvr>0&&clicks>0)orders=clicks*cvr/100;
    output.push({platform:rowPlatform,name:rawName,spend,gmv,orders,impressions,clicks,ctr,cpc,cpm,cpa,roas,cvr,date:csvCell(r,m.date),source_file:sourceFile});
  }
  return output;
}
function csvAggregate(rows){
  const grouped=new Map();
  for(const x of rows){const key=`${x.platform}::${csvNorm(x.name)}`;let a=grouped.get(key);if(!a){a={platform:x.platform,name:x.name,spend:0,gmv:0,orders:0,impressions:0,clicks:0,_ctrWeight:0,_ctrNumer:0,_cvrWeight:0,_cvrNumer:0,sourceFiles:[]};grouped.set(key,a);}a.spend+=Number(x.spend)||0;a.gmv+=Number(x.gmv)||0;a.orders+=Number(x.orders)||0;a.impressions+=Number(x.impressions)||0;a.clicks+=Number(x.clicks)||0;if(x.ctr>0){const w=Number(x.impressions)||1;a._ctrNumer+=x.ctr*w;a._ctrWeight+=w;}if(x.cvr>0){const w=Number(x.clicks)||1;a._cvrNumer+=x.cvr*w;a._cvrWeight+=w;}if(x.source_file&&!a.sourceFiles.includes(x.source_file))a.sourceFiles.push(x.source_file);}
  return [...grouped.values()].map(a=>({platform:a.platform,platformLabel:CSV_PLATFORM_LABELS[a.platform]||a.platform,name:a.name,spend:a.spend,gmv:a.gmv,orders:a.orders,impressions:a.impressions,clicks:a.clicks,roas:a.spend>0&&a.gmv>0?a.gmv/a.spend:0,cpa:a.orders>0?a.spend/a.orders:0,ctr:a.impressions>0&&a.clicks>0?a.clicks/a.impressions*100:(a._ctrWeight>0?a._ctrNumer/a._ctrWeight:0),cvr:a.clicks>0&&a.orders>0?a.orders/a.clicks*100:(a._cvrWeight>0?a._cvrNumer/a._cvrWeight:0),cpc:a.clicks>0?a.spend/a.clicks:0,cpm:a.impressions>0?a.spend/a.impressions*1000:0,sourceFiles:a.sourceFiles})).sort((a,b)=>b.spend-a.spend);
}
function setCsvStatus(html,type='info'){const el=$('csvImportStatus');if(!el)return;el.innerHTML=html;el.className='csv-status '+type;}
function csvTotals(rows){return (rows||[]).reduce((a,x)=>{a.spend+=Number(x.spend)||0;a.gmv+=Number(x.gmv)||0;a.orders+=Number(x.orders)||0;return a;},{spend:0,gmv:0,orders:0});}
function renderCsvImportState(){
  const rows=state.csvRows||[];const t=csvTotals(rows);const fmt=(v)=>money(v);
  if($('csvCampaignCount'))$('csvCampaignCount').textContent=String(rows.length);
  if($('csvSpendTotal'))$('csvSpendTotal').textContent=fmt(t.spend);
  if($('csvGmvTotal'))$('csvGmvTotal').textContent=t.gmv>0?fmt(t.gmv):'—';
  if($('csvRoasTotal'))$('csvRoasTotal').textContent=t.spend>0&&t.gmv>0?(t.gmv/t.spend).toFixed(2)+'x':'—';
  if($('csvImportedLabel'))$('csvImportedLabel').textContent=state.csvImported?`${rows.length} campaign • CSV`:'Belum ada impor';
  if($('exportImportedCsvBtn'))$('exportImportedCsvBtn').disabled=!state.csvImported;
  if($('csvPreviewTable'))$('csvPreviewTable').innerHTML=rows.length?rows.slice(0,100).map(x=>`<tr><td><span class="csv-platform-badge ${escapeHtml(x.platform)}">${escapeHtml(CSV_PLATFORM_LABELS[x.platform]||x.platform)}</span></td><td><b>${escapeHtml(x.name)}</b></td><td>${money(x.spend)}</td><td>${x.gmv>0?money(x.gmv):'—'}</td><td>${x.orders>0?Math.round(x.orders).toLocaleString('id-ID'):'—'}</td><td>${x.roas>0?x.roas.toFixed(2)+'x':'—'}</td><td>${x.cpa>0?money(x.cpa):'—'}</td><td>${x.ctr>0?x.ctr.toFixed(2)+'%':'—'}</td><td>${x.cvr>0?x.cvr.toFixed(2)+'%':'—'}</td></tr>`).join(''):'<tr><td colspan="9" class="csv-empty">Impor CSV untuk melihat hasil pemetaan kolom.</td></tr>';
  if(state.csvImported){const files=state.importMeta?.files||[];setCsvStatus(`<b>✓ Data impor tersimpan di browser ini.</b><p>${rows.length} campaign teragregasi dari ${Number(state.importMeta?.rowCount)||rows.length} baris valid. File: ${files.map(escapeHtml).join(', ')||'CSV impor'}.</p><p><b>Terakhir diimpor:</b> ${escapeHtml(state.importMeta?.importedAt||'—')}</p>`,'success');if($('csvMappingNote')&&state.importMeta?.mappingSummary)$('csvMappingNote').textContent=state.importMeta.mappingSummary;}
  else if($('csvPreviewTable')){if($('csvMappingNote'))$('csvMappingNote').textContent='Pilih file CSV laporan performa. Data mentah dibaca di browser, lalu dikelompokkan per campaign.';}
}
async function importCampaignCsvFiles(){
  const input=$('csvFiles');const files=[...(input?.files||[])];const platform=$('csvPlatform')?.value||'meta';
  if(!files.length){setCsvStatus('<b>Pilih file CSV terlebih dahulu.</b><p>Unggah file ekspor laporan dari Ads Manager, bukan screenshot atau file Excel.</p>','error');return;}
  const btn=$('importCsvBtn');btn.disabled=true;btn.textContent='Membaca CSV…';
  try{
    let rawRows=[];const mappings=[];const validFiles=[];let validSourceRows=0;
    for(const file of files){
      if(file.size>10*1024*1024)throw new Error(`${file.name} melebihi batas 10 MB.`);
      if(!/\.csv$/i.test(file.name)&&file.type!=='text/csv'&&file.type!=='application/csv')throw new Error(`${file.name} bukan file CSV. Pilih Export → CSV dari platform.`);
      const parsed=csvParse(await file.text());if(!parsed.length)throw new Error(`${file.name} kosong.`);
      const header=csvFindHeader(parsed);if(!header)throw new Error(`Header ${file.name} belum dikenali. Pastikan file berisi kolom nama campaign + spend, atau GMV/value + ROAS.`);
      const normalized=csvToMetricRows(parsed,header,platform,file.name);if(!normalized.length)throw new Error(`Tidak ada baris campaign yang valid di ${file.name}.`);
      rawRows=rawRows.concat(normalized);validSourceRows+=normalized.length;validFiles.push(file.name);
      const labelMap=Object.entries(header.mapping).filter(([,idx])=>idx>=0).map(([key,idx])=>`${key} ← ${header.headers[idx]}`);
      mappings.push(`${file.name}: ${labelMap.join(', ')}`);
    }
    const newAggregated=csvAggregate(rawRows);
    let base=state.csvImported?[...state.csvRows]:[];
    const shouldReplace=$('csvReplacePlatform')?.checked!==false;
    const affectedPlatforms=[...new Set(newAggregated.map(x=>x.platform))];
    if(shouldReplace)base=base.filter(r=>!affectedPlatforms.includes(r.platform));
    const rows=csvAggregate(base.concat(newAggregated.map(x=>({...x,source_file:x.sourceFiles?.[0]||''}))));
    const prevFilesByPlatform={...(state.importMeta?.filesByPlatform||{})};
    for(const key of affectedPlatforms){if(shouldReplace||!prevFilesByPlatform[key])prevFilesByPlatform[key]=validFiles;else prevFilesByPlatform[key]=[...new Set([...prevFilesByPlatform[key],...validFiles])];}
    const filesAll=[...new Set(Object.values(prevFilesByPlatform).flat())];
    const mappingSummary=`Header terdeteksi otomatis. ${mappings.join(' | ')}. Nilai ROAS/CPA/CTR/CVR dihitung ulang dari spend, conversion value, order, click, dan impression jika kolom dasarnya tersedia. Data yang tidak disediakan laporan tetap ditampilkan sebagai —.`;
    const meta={files:filesAll,filesByPlatform:prevFilesByPlatform,platform,rowCount:validSourceRows,importedAt:new Date().toLocaleString('id-ID'),mappingSummary};
    state.csvRows=rows;state.history=rows;state.csvImported=rows.length>0;state.importMeta=meta;
    try{localStorage.setItem('adspilotCsvImport',JSON.stringify({rows,meta}));}catch(e){throw new Error('Browser tidak cukup ruang untuk menyimpan data impor. Coba impor periode yang lebih kecil atau hapus data lama.');}
    renderHistory();renderDecisions();renderCsvImportState();
    setCsvStatus(`<b>✓ Import berhasil.</b><p>${validSourceRows} baris sumber dibaca dari ${validFiles.length} file dan diringkas menjadi ${newAggregated.length} campaign. Data platform lain ${shouldReplace?'tetap dipertahankan':'digabungkan'}.</p><p><b>Kolom terbaca:</b> ${mappings.map(escapeHtml).join('<br>')}</p>`,'success');
    showToast(`${newAggregated.length} campaign berhasil diimpor.`);input.value='';switchPerformanceView('results');
  }catch(e){setCsvStatus(`<b>Import gagal.</b><p>${escapeHtml(e.message||'CSV tidak bisa dibaca.')}</p><p>Pastikan file merupakan laporan performa CSV dan memiliki kolom Campaign name serta Spend atau Conversion value + ROAS.</p>`,'error');showToast('CSV gagal diimpor.');}
  finally{btn.disabled=false;btn.textContent='⇧ Baca & Import CSV';}
}
function downloadImportedCsv(){
  if(!state.csvImported||!state.csvRows.length){showToast('Belum ada data untuk diunduh.');return;}
  const columns=['platform','campaign_name','spend','revenue','orders','impressions','clicks','ctr','cpa','roas','cvr','cpc','cpm'];
  const quote=value=>{const str=String(value??'');return /[\",\r\n]/.test(str)?'"'+str.replace(/"/g,'""')+'"':str;};
  const lines=[columns.join(','),...state.csvRows.map(x=>[x.platform,x.name,x.spend,x.gmv,x.orders,x.impressions,x.clicks,x.ctr,x.cpa,x.roas,x.cvr,x.cpc,x.cpm].map(quote).join(','))];
  const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`adspilot-campaign-summary-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);showToast('CSV hasil normalisasi berhasil diunduh.');
}
function clearImportedCsvData(){
  try{localStorage.removeItem('adspilotCsvImport');}catch{}
  state.csvRows=[];state.csvImported=false;state.importMeta=null;state.history=[];
  renderHistory();renderDecisions();renderCsvImportState();setCsvStatus('<b>Data impor dihapus.</b><p>Dashboard kini menunggu laporan baru. File CSV asli di perangkat Anda tidak dihapus.</p>','info');showToast('Data CSV impor direset.');switchPerformanceView('import');
}

// Start only after CSV helpers/constants are initialized, so saved imports render correctly.
boot();
