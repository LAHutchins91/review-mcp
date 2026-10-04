import { landingConnectLead } from "./connect-page.js";

export function landingPage(appBaseUrl: string, supabaseUrl: string, supabaseAnonKey: string) {
  const supabaseUrlJson = JSON.stringify(supabaseUrl);
  const supabaseAnonKeyJson = JSON.stringify(supabaseAnonKey);
  const appBaseUrlJson = JSON.stringify(appBaseUrl);
  const connectLead = landingConnectLead(appBaseUrl);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Review</title>
  <link rel="icon" href="/icon.svg">
  <style>
    :root{color-scheme:dark;--bg:#141210;--line:#3a322c;--text:#f6f1ea;--muted:#c4b8aa;--accent:#e0a15a;--ink:#211c18}
    *{box-sizing:border-box} body{margin:0;background:radial-gradient(circle at 80% -10%,#3a2a18 0,transparent 32%),var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,sans-serif}
    .shell{max-width:980px;margin:0 auto;padding:28px 20px 72px}.nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:48px}.brand{font-weight:800;letter-spacing:-.04em;font-size:22px}
    h1{font-size:clamp(44px,7vw,76px);line-height:.95;letter-spacing:-.05em;margin:12px 0} p{color:var(--muted);font-size:18px;line-height:1.6}
    .card{background:linear-gradient(180deg,#241e19,#161310);border:1px solid var(--line);border-radius:22px;padding:22px}
    .actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}.btn{appearance:none;border:0;border-radius:12px;padding:12px 16px;font-weight:750;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
    .primary{background:var(--accent);color:#2a1c0c}.secondary{background:var(--ink);color:var(--text);border:1px solid var(--line)}
    .plans{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px}.plan{border:1px solid var(--line);border-radius:20px;padding:22px;background:#161310}.plan ul{padding-left:18px;color:var(--text)}
    .account{display:none;margin-top:18px}.account.show{display:block}.error,.notice{display:none;margin-top:14px;padding:12px;border-radius:12px}.error.show{display:block;background:#3a1c1c;color:#ffd0d0}.notice.show{display:block;background:#3a2a18;color:#f6e4c8}
    label{display:block;margin:12px 0 6px;color:var(--muted)} input,textarea,select{width:100%;padding:11px;border-radius:10px;border:1px solid var(--line);background:#100e0c;color:var(--text);font:inherit} textarea{min-height:90px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.footer{margin-top:56px;display:flex;gap:16px;flex-wrap:wrap;color:#9a8d80}
    [hidden]{display:none!important} pre{white-space:pre-wrap;overflow-wrap:anywhere} @media(max-width:760px){.plans,.grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <main class="shell">
    <nav class="nav"><div class="brand">Review</div><span id="servicePill">Approved replies</span></nav>
    <section>
      <p class="eyebrow">Public replies, stored wording only</p>
      <h1 id="heroTitle">Do not invent the reply.</h1>
      <p id="heroDescription">Review stores the public replies a business allows an assistant to send, plus any refund, replacement, or timeline saved for that case, then checks the outgoing reply before it can add one.</p>
      ${connectLead}
      <div class="actions" id="signedOutActions"><button class="btn primary" id="googleBtn" type="button">Continue with Google</button><a class="btn secondary" href="#plans">See plans</a></div>
      <div class="card account" id="accountCard"><div id="userEmail"></div><div id="subscriptionStatus">Checking account…</div><div class="actions"><button class="btn secondary" id="signOutBtn" type="button">Sign out</button></div></div>
      <div class="actions" id="proActions" hidden><a class="btn primary" href="/app">Open reply workspace</a></div>
      <button class="btn secondary" id="refreshAccount" type="button" hidden>Refresh subscription status</button>
      <div class="notice" id="notice" role="status"></div>
      <div class="error" id="error" role="alert"></div>
    </section>
    <section id="plans">
      <h2>Start with a 14-day trial</h2>
      <p>Then continue on Pro. Secure checkout and subscription billing are handled by Stripe.</p>
      <div class="plans">
        <article class="plan"><h3>Monthly</h3><p>Pro, billed each month after the trial.</p><ul><li>Approved public replies</li><li>Saved refund wording</li><li>Saved replacement wording</li><li>Saved timeline wording</li><li>Outgoing reply checks</li></ul><button class="btn secondary checkout" type="button" data-plan="monthly">Start monthly trial</button></article>
        <article class="plan"><h3>Yearly</h3><p>Pro, billed once a year after the same 14-day trial.</p><ul><li>Everything in Monthly</li><li>One annual billing cycle</li><li>ChatGPT, Claude, Gemini, Grok, and Cursor</li><li>Any Streamable HTTP OAuth client</li></ul><button class="btn primary checkout" type="button" data-plan="annual">Start yearly trial</button></article>
      </div>
    </section>
    <section id="workspace" hidden>
      <h2>Reply workspace</h2>
      <p>Save cases here, or ask a connected assistant to save them. The check uses the same rules as the Review tool.</p>
      <div class="grid">
        <form class="card" id="businessForm"><h3>New business</h3><label for="businessName">Name</label><input id="businessName" required minlength="2" maxlength="200"><button class="btn primary" type="submit">Create business</button></form>
        <div class="card"><h3>Your businesses</h3><label for="businessSelect">Open</label><select id="businessSelect"><option value="">Choose a business</option></select><p id="workspaceMessage" role="status"></p></div>
      </div>
      <div id="editor" hidden>
        <form class="card" id="caseForm"><h3>Case</h3>
          <label for="reviewerName">Reviewer name, optional</label><input id="reviewerName" maxlength="120">
          <label for="platform">Platform, optional</label><input id="platform" maxlength="40" placeholder="Google">
          <label for="reviewText">Customer review</label><textarea id="reviewText" required maxlength="8000"></textarea>
          <label for="approvedReplies">Approved replies, one reply per block, separated by a blank line</label><textarea id="approvedReplies" maxlength="40000" placeholder="Thank you for your review."></textarea>
          <label for="refundWording">Refund wording, leave blank when no refund is saved</label><input id="refundWording" maxlength="500">
          <label for="replacementWording">Replacement wording, leave blank when no replacement is saved</label><input id="replacementWording" maxlength="500">
          <label for="timelineWording">Timeline wording, leave blank when no timeline is saved</label><input id="timelineWording" maxlength="500">
          <label for="caseStatus">Status</label><select id="caseStatus"><option>OPEN</option><option>CLOSED</option></select>
          <button class="btn primary" type="submit">Save case</button>
        </form>
        <form class="card" id="checkForm"><h3>Check an outgoing reply</h3>
          <label for="caseSelect">Case</label><select id="caseSelect"><option value="">Choose a case</option></select>
          <label for="reply">Outgoing public reply</label><textarea id="reply" required maxlength="4000"></textarea>
          <button class="btn primary" type="submit">Check reply</button><pre id="checkResult"></pre>
        </form>
        <section class="card"><h3>Saved cases</h3><pre id="guide"></pre></section>
      </div>
    </section>
    <footer class="footer"><a href="/connect">Connect an assistant</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Support</a><a href="/data">Your data</a><a href="/health">System health</a></footer>
  </main>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/dist/umd/supabase.js"></script>
  <script>
  (function(){
    var SUPABASE_URL=${supabaseUrlJson};
    var SUPABASE_ANON_KEY=${supabaseAnonKeyJson};
    var APP_BASE_URL=${appBaseUrlJson};
    var token='', current=null, isPro=false, profileReady=false, businesses=[], selected='', cases=[];
    function el(id){return document.getElementById(id)}
    function showError(msg){el('error').textContent=msg; el('error').classList.add('show')}
    function clearError(){el('error').classList.remove('show')}
    function renderAccess(pro, ready){
      isPro=pro; profileReady=ready;
      el('plans').hidden=pro;
      el('proActions').hidden=!pro || location.pathname==='/app';
      el('workspace').hidden=!(pro && location.pathname==='/app');
      el('heroTitle').textContent=pro?'Your replies are ready.':'Do not invent the reply.';
      document.querySelectorAll('.checkout').forEach(function(btn){btn.disabled=!ready||pro});
    }
    function setSignedOut(){token=''; current=null; renderAccess(false,true); el('refreshAccount').hidden=true; el('signedOutActions').hidden=false; el('accountCard').classList.remove('show')}
    function setSignedIn(session){
      current=session; token=session.access_token||'';
      if(!token){setSignedOut(); return}
      el('userEmail').textContent=session.user.email||'Signed in';
      el('signedOutActions').hidden=true; el('accountCard').classList.add('show');
    }
    async function api(path, options){
      var opts=options||{}; opts.headers=Object.assign({apikey:SUPABASE_ANON_KEY}, opts.headers||{});
      if(token) opts.headers.Authorization='Bearer '+token;
      var response=await fetch(SUPABASE_URL+path, opts);
      var body=await response.text();
      if(!response.ok) throw Error('Request failed');
      return body?JSON.parse(body):null;
    }
    async function loadProfile(session){
      el('refreshAccount').hidden=false;
      try{
        var rows=await api('/rest/v1/profiles?id=eq.'+encodeURIComponent(session.user.id)+'&select=subscription_status');
        var status=rows&&rows[0]&&rows[0].subscription_status;
        var pro=status==='trialing'||status==='active';
        renderAccess(pro, true);
        el('subscriptionStatus').textContent=pro?(status==='trialing'?'Review Pro · 14-day trial in progress':'Review Pro · Active'):'Signed in · start a 14-day trial below';
        if(pro && location.pathname==='/app') await loadBusinesses();
      }catch(e){renderAccess(false,false); el('subscriptionStatus').textContent='Unable to confirm the subscription. Refresh and retry.'}
    }
    function say(message){el('workspaceMessage').textContent=message}
    async function loadBusinesses(preferred){
      var rows=await api('/rest/v1/review_businesses?select=id,name&order=updated_at.desc&limit=50');
      businesses=rows||[];
      el('businessSelect').replaceChildren(new Option('Choose a business',''));
      businesses.forEach(function(business){el('businessSelect').add(new Option(business.name, business.id))});
      selected=businesses.some(function(business){return business.id===preferred})?preferred:'';
      el('businessSelect').value=selected;
      await loadGuide();
    }
    function fillCases(){
      el('caseSelect').replaceChildren(new Option('Choose a case',''));
      cases.forEach(function(item){
        var label=(item.reviewer_name||'Review')+' · '+(item.review_text||'').slice(0,48);
        el('caseSelect').add(new Option(label, item.id));
      });
    }
    async function loadGuide(){
      el('editor').hidden=!selected;
      el('guide').textContent='';
      cases=[];
      fillCases();
      if(!selected) return;
      var id=encodeURIComponent(selected);
      var guide={
        business:(await api('/rest/v1/review_businesses?id=eq.'+id+'&select=id,name'))[0],
        cases:await api('/rest/v1/review_cases?business_id=eq.'+id+'&select=id,reviewer_name,platform,review_text,approved_replies,refund_wording,replacement_wording,timeline_wording,status,revision&order=updated_at.desc')
      };
      cases=guide.cases||[];
      fillCases();
      el('guide').textContent=JSON.stringify(guide,null,2);
    }
    function parseReplies(text){
      return text.split(/\\n\\s*\\n/).map(function(block){return block.replace(/\\s+/g,' ').trim()}).filter(Boolean);
    }
    el('businessSelect').onchange=function(){selected=this.value; loadGuide().catch(function(){say('Could not load that business.')})};
    el('businessForm').onsubmit=function(event){
      event.preventDefault();
      var name=el('businessName').value.trim(); if(!name||!current) return;
      var form=this;
      say('Saving…');
      api('/rest/v1/review_businesses',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({owner_id:current.user.id,name:name})})
        .then(function(rows){form.reset(); return loadBusinesses(rows[0].id)}).then(function(){say('Business created.')})
        .catch(function(){say('Could not save. Your text is still here.')});
    };
    el('caseForm').onsubmit=function(event){
      event.preventDefault();
      if(!selected||!current) return;
      var form=this;
      say('Saving…');
      try{
        var payload={
          business_id:selected,
          reviewer_name:el('reviewerName').value.trim()||null,
          platform:el('platform').value.trim()||null,
          review_text:el('reviewText').value.trim(),
          approved_replies:parseReplies(el('approvedReplies').value),
          refund_wording:el('refundWording').value.trim()||null,
          replacement_wording:el('replacementWording').value.trim()||null,
          timeline_wording:el('timelineWording').value.trim()||null,
          status:el('caseStatus').value
        };
        if(!payload.review_text) throw Error('Enter the customer review.');
        api('/rest/v1/review_cases',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload)})
          .then(function(){form.reset(); el('caseStatus').value='OPEN'; return loadGuide()})
          .then(function(){say('Case saved.')})
          .catch(function(){say('Could not save. Your text is still here.')});
      }catch(error){say(error.message||'Could not save. Your text is still here.')}
    };
    el('checkForm').onsubmit=async function(event){
      event.preventDefault();
      el('checkResult').textContent='Checking…';
      try{
        var response=await fetch('/api/check',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({businessId:selected,caseId:el('caseSelect').value,reply:el('reply').value})});
        var body=await response.json();
        el('checkResult').textContent=body.error||JSON.stringify(body,null,2);
      }catch(error){el('checkResult').textContent=error.message||'Could not check this reply.'}
    };
    function resumePlugin(){
      try{
        var saved=sessionStorage.getItem('reviewPluginReturn'); if(!saved) return false;
        sessionStorage.removeItem('reviewPluginReturn');
        var pending=JSON.parse(saved);
        if(!pending||Date.now()-pending.createdAt>600000) return false;
        location.assign(pending.id?'/oauth/consent?authorization_id='+encodeURIComponent(pending.id):'/connections');
        return true;
      }catch(e){return false}
    }
    var client=null;
    async function init(){
      if(!SUPABASE_URL||!SUPABASE_ANON_KEY||!window.supabase){setSignedOut(); showError('Google sign-in is not configured yet.'); return}
      client=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{flowType:'implicit',persistSession:true,detectSessionInUrl:true,autoRefreshToken:true}});
      var result=await client.auth.getSession();
      var session=result.data&&result.data.session;
      if(session){ if(resumePlugin()) return; setSignedIn(session); await loadProfile(session); }
      else setSignedOut();
      client.auth.onAuthStateChange(function(_event, session){
        if(session){setSignedIn(session); loadProfile(session)} else setSignedOut();
      });
    }
    el('googleBtn').onclick=async function(){
      clearError(); if(!client){showError('Google sign-in is still loading.'); return}
      this.disabled=true;
      var result=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:APP_BASE_URL+'/'}});
      if(result.error){this.disabled=false; showError(result.error.message||'Google sign-in failed.')}
    };
    el('signOutBtn').onclick=async function(){ if(client) await client.auth.signOut(); setSignedOut(); location.href='/'; };
    el('refreshAccount').onclick=function(){ if(current) loadProfile(current); };
    document.querySelectorAll('.checkout').forEach(function(btn){
      btn.onclick=async function(){
        clearError();
        if(!token){showError('Sign in with Google first.'); return}
        btn.disabled=true;
        try{
          var response=await fetch('/billing/checkout',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({plan:btn.getAttribute('data-plan')})});
          var data=await response.json();
          if(!response.ok) throw Error(data.error||'Unable to start checkout');
          location.href=data.url;
        }catch(error){showError(error.message); btn.disabled=false}
      };
    });
    var checkout=new URLSearchParams(location.search).get('checkout');
    if(checkout==='success'){el('notice').textContent='Checkout completed. Your subscription is being confirmed.'; el('notice').classList.add('show')}
    if(checkout==='cancelled') showError('Checkout was cancelled. No changes were made.');
    init();
  })();
  </script>
</body></html>`;
}
