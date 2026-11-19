function source(s){const a=node('a',s.title+' ↗','source');if(/^https?:\/\//i.test(s.url)){a.href=s.url;a.target='_blank';a.rel='noopener noreferrer'}return a}
function field(parent,label,value){const f=node('div','','field');f.append(node('b',label),node('p',value));parent.append(f)}
let activeReport=null,activeId=null;
function render(report,id,scroll=true){activeReport=report;activeId=id;sessionStorage.setItem("reportId",id);$('summary').replaceChildren(node('h2','What the research uncovered'),node('p',report.research_summary),node('p','Research limitations: '+report.limitations,'muted'));$('ideas').replaceChildren();report.ideas.forEach((i,n)=>{const card=node('article','','panel idea');card.append(node('div',`IDEA / ${String(n+1).padStart(2,'0')}`,'eyebrow accent'),node('h3',i.title),node('p',i.hook,'hook'));[['Audience insight','audience_insight'],['Why this idea works','why_selected'],['How your offer helps','service_solution'],['Recommended format','format'],['Content outline','outline'],['Call to action','cta'],['Evidence context','evidence_note']].forEach(([label,k])=>field(card,label,i[k]));const sources=node('div','','field');sources.append(node('b','Where we found it'));i.sources.forEach(s=>sources.append(source(s)));card.append(sources);$('ideas').append(card)});$('brief').textContent=report.research_brief;$('catalog').replaceChildren(...report.source_catalog.map(source));$('export').href='/oauth/google/'+encodeURIComponent(id);$('results').hidden=false;if(scroll)$('results').scrollIntoView({behavior:'smooth'});$('noexport').onclick=()=>{$('exportnote').textContent='No problem — your ideas are still available on this page.'};}
const yes=$('newsletter-yes'),no=$('newsletter-no'),email=$('email-nistha');
function updateMail(){const body="Hi Nistha, Send me the quote for social content that converts implementation.\n\nOpt into newsletter? I share insights on my own data experiments on content, what converts and why and I'd be an honor to get your thougths on it, if it's useful to you\n"+(yes.checked?'[x] Yes\n[ ] No\nFull name: '+$('newsletter-name').value+'\nEmail: '+$('newsletter-email').value:'[ ] Yes\n[x] No');email.href='mailto:nisthagautam0@gmail.com?subject='+encodeURIComponent('Quote for social content implementation')+'&body='+encodeURIComponent(body)}
function updateNewsletter(){ $('newsletter-details').hidden=!yes.checked;updateMail(); }
async function preference(){if(!activeId)return;const status=$('newsletter-status');const name=$('newsletter-name').value.trim(),address=$('newsletter-email').value.trim();if(yes.checked&&(!name||!address||!$('newsletter-email').checkValidity())){status.textContent='Enter your full name and a valid email to save your opt-in.';return}try{await post('/api/preference',{id:activeId,opt_in:yes.checked,name:yes.checked?name:'',email:yes.checked?address:''});status.textContent=yes.checked?'Newsletter opt-in saved.':'Newsletter preference saved: No.'}catch(e){status.textContent=e.message}}
yes.onchange=()=>{no.checked=!yes.checked;updateNewsletter();if(!yes.checked)preference()};no.onchange=()=>{if(no.checked)yes.checked=false;else no.checked=true;updateNewsletter();preference()};$('newsletter-name').oninput=updateMail;$('newsletter-email').oninput=updateMail;$('save-newsletter').onclick=preference;email.onclick=()=>{updateMail();track('email_click')};updateNewsletter();$('export').addEventListener('click',()=>track('export_click'));
// The full-screen splash lasts at most 1.5 seconds. Research continues safely
// on the results page until the API actually returns; we never fabricate results.
const splashMs=1500;
let splashStarted=performance.now(), splashTimer=null, splashDismissed=false;
function dismissSplash(){
  if(splashDismissed)return;
  splashDismissed=true;
  $('loading').hidden=true;
  if(!activeReport)$('research-progress').hidden=false;
}
function finishProgress(){
  clearTimeout(splashTimer);
  dismissSplash();
  $('research-progress').hidden=true;
}
async function load(){
  const phases=['Searching…','Thinking…','Generating…'];
  let n=0;
  splashStarted=performance.now();splashDismissed=false;
  $('loading').hidden=false;
  $('research-progress').hidden=true;
  $('retry').hidden=true;
  $('progress-retry').hidden=true;
  $('load-error').textContent='';
  $('research-progress-error').textContent='';
  $('phase').textContent=phases[0];
  splashTimer=setTimeout(dismissSplash,splashMs);
  const phaseTimer=setInterval(()=>{
    const phase=phases[++n%phases.length];
    $('phase').textContent=phase;
    $('research-progress-copy').textContent=phase.replace('…','')+' real community signals and turning them into six useful content ideas. Your results will appear here when ready.';
  },900);
  try{
    const raw=sessionStorage.getItem('profile'),id=sessionStorage.getItem('reportId');
    let d;
    if(raw){
      d=await post('/api/research',JSON.parse(raw));
      sessionStorage.setItem('lastProfile',raw);
      sessionStorage.removeItem('profile');
      track('generated');
    }else if(id){
      d=await post('/api/report',{id});
      if(d.preference){
        yes.checked=!!d.preference.opt_in;no.checked=!yes.checked;
        $('newsletter-name').value=d.preference.name||'';
        $('newsletter-email').value=d.preference.email||'';
        updateNewsletter();
      }
    }else throw Error('Please enter your business information first.');
    // Give the splash a brief, predictable appearance if the API finishes instantly.
    const remaining=Math.max(0,1100-(performance.now()-splashStarted));
    if(remaining)await new Promise(resolve=>setTimeout(resolve,remaining));
    finishProgress();
    render(d.report,d.id,false);
    window.scrollTo(0,0);
  }catch(e){
    finishProgress();
    $('research-progress').hidden=false;
    $('research-progress-error').textContent=e.message;
    $('research-progress-copy').textContent='Your research couldn’t be completed. You can try again or return to your inputs.';
    $('progress-retry').hidden=!sessionStorage.getItem('profile');
    $('phase').textContent='Research unavailable.';
  }finally{clearInterval(phaseTimer)}
}
$('retry').onclick=load;
$('progress-retry').onclick=load;
load();
$('delivery').onsubmit=async e=>{e.preventDefault();const b=$('send-doc');b.disabled=true;$('exportnote').textContent='Creating and sharing your private document…';try{const d=await post('/api/delivery',{id:activeId,email:$('delivery-email').value});$('exportnote').textContent=d.message;track('export_click')}catch(e){$('exportnote').textContent=e.message}finally{b.disabled=false}};
