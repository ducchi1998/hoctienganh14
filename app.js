// Cấu hình Supabase: điền URL và anon key của dự án trong Supabase.
const SUPABASE_URL = "https://kduibehuxmfjmlvkkclh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3YKwb1l674WfoeWIzhjpVA_ZY5OZaq3";

const isConfigured = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("PASTE_") && !SUPABASE_ANON_KEY.includes("PASTE_");
const db = isConfigured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let currentUser = null, currentRole = "student", mode = "login", lessons = [];
const $ = id => document.getElementById(id);
const icons = ["📘","✏️","🧩","🌱","🔎","🎨","🧠","🌟"];
const colors = ["linear-gradient(135deg,#eeeefe,#f8f7ff)","linear-gradient(135deg,#e5f8f1,#f5fffb)","linear-gradient(135deg,#fff0e2,#fffaf5)","linear-gradient(135deg,#e8f4ff,#f8fbff)"];
$("year").textContent = new Date().getFullYear();

function showModal(id){$(id).classList.remove("hidden");}
function hideModal(id){$(id).classList.add("hidden");}
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>hideModal(b.dataset.close)));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)hideModal(m.id)}));
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),3000)}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function setMessage(id,msg,error=false){$(id).textContent=msg;$(id).style.color=error?"#c54d4d":"#5b5ce2"}
function openAuth(){mode="login";updateAuthMode();showModal("auth-modal")}
$("auth-open").onclick=openAuth;$("hero-login").onclick=openAuth;
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;updateAuthMode()});
function updateAuthMode(){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));$("auth-title").textContent=mode==="login"?"Chào mừng bạn!":"Tạo tài khoản học sinh";$("auth-submit").textContent=mode==="login"?"Đăng nhập":"Tạo tài khoản";$("auth-password").autocomplete=mode==="login"?"current-password":"new-password";setMessage("auth-message","")}
$("logout-btn").onclick=async()=>{if(db)await db.auth.signOut();currentUser=null;currentRole="student";updateAccount();renderLessons();toast("Bạn đã đăng xuất.")};
function updateAccount(){const logged=!!currentUser;$("auth-open").classList.toggle("hidden",logged);$("logout-btn").classList.toggle("hidden",!logged);$("user-label").textContent=logged?currentUser.email:"";$("add-open").classList.toggle("hidden",!(logged&&currentRole==="teacher"))}
$("auth-form").addEventListener("submit",async e=>{e.preventDefault();if(!db){setMessage("auth-message","Website chưa kết nối cơ sở dữ liệu. Hãy làm theo hướng dẫn trong README.md.",true);return}
 const email=$("auth-email").value.trim(),password=$("auth-password").value;$("auth-submit").disabled=true;
 try{let result;if(mode==="login")result=await db.auth.signInWithPassword({email,password});else result=await db.auth.signUp({email,password});
 if(result.error)throw result.error;
 if(mode==="signup"&&!result.data.session){setMessage("auth-message","Tài khoản đã tạo. Hãy kiểm tra email để xác nhận rồi đăng nhập.");}
 else{currentUser=result.data.user;await loadRole();updateAccount();hideModal("auth-modal");toast(mode==="login"?"Đăng nhập thành công!":"Tạo tài khoản thành công!");await loadLessons();}
 }catch(err){setMessage("auth-message",friendlyError(err.message),true)}finally{$("auth-submit").disabled=false}
});
function friendlyError(s=""){if(s.includes("Invalid login"))return "Email hoặc mật khẩu chưa đúng.";if(s.includes("already registered"))return "Email này đã được đăng ký.";if(s.includes("Email not confirmed"))return "Bạn cần xác nhận email trước khi đăng nhập.";return s}
async function loadRole(){currentRole="student";if(!db||!currentUser)return;const {data,error}=await db.from("profiles").select("role").eq("id",currentUser.id).maybeSingle();if(!error&&data)currentRole=data.role||"student";updateAccount()}
$("add-open").onclick=()=>{if(!currentUser){openAuth();return}showModal("lesson-modal");setMessage("lesson-message","")};
$("lesson-form").addEventListener("submit",async e=>{e.preventDefault();if(!db||!currentUser||currentRole!=="teacher"){setMessage("lesson-message","Chỉ tài khoản giáo viên mới được đăng bài.",true);return}
 const item={title:$("lesson-title").value.trim(),category:$("lesson-category").value.trim(),grade:$("lesson-grade").value.trim(),description:$("lesson-description").value.trim(),resource_url:$("lesson-resource").value.trim()||null,video_url:$("lesson-video").value.trim()||null,created_by:currentUser.id};
 $("lesson-submit").disabled=true;try{const {error}=await db.from("lessons").insert(item);if(error)throw error;hideModal("lesson-modal");$("lesson-form").reset();toast("Đã đăng bài học!");await loadLessons()}catch(err){setMessage("lesson-message",err.message,true)}finally{$("lesson-submit").disabled=false}
});
async function loadLessons(){if(!db){lessons=[];renderLessons();$("status").textContent="Bản mẫu đã sẵn sàng. Để đăng bài và đăng nhập thật, hãy cấu hình Supabase theo README.md.";return}
 $("status").textContent="Đang tải bài học...";const {data,error}=await db.from("lessons").select("*").order("created_at",{ascending:false});if(error){$("status").textContent="Không tải được bài học. Hãy kiểm tra cấu hình Supabase và chính sách SQL.";lessons=[]}else{lessons=data||[];$("status").textContent=lessons.length?"":"Chưa có bài học nào. Giáo viên đăng nhập để thêm bài đầu tiên."}renderLessons()}
function renderLessons(){const q=$("search").value.toLowerCase().trim(),cat=$("category-filter").value;const shown=lessons.filter(l=>(!cat||l.category===cat)&&[l.title,l.category,l.grade,l.description].join(" ").toLowerCase().includes(q));const categories=[...new Set(lessons.map(l=>l.category).filter(Boolean))].sort();const old=$("category-filter").value;$("category-filter").innerHTML='<option value="">Tất cả danh mục</option>'+categories.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");if(categories.includes(old))$("category-filter").value=old;
 $("lesson-grid").innerHTML=shown.map((l,i)=>`<article class="lesson-card"><div class="lesson-cover" style="background:${colors[i%colors.length]}"><span class="cover-icon">${icons[i%icons.length]}</span><span class="category-pill">${escapeHtml(l.category||"Bài học")}</span></div><div class="lesson-body"><h3>${escapeHtml(l.title)}</h3><p>${escapeHtml(l.description||"Mở bài học để xem mô tả và tài liệu đính kèm.")}</p><div class="lesson-meta"><span>${escapeHtml(l.grade||"Tài liệu học tập")}</span><button data-detail="${escapeHtml(l.id)}">Xem bài học →</button></div></div></article>`).join("");
 if(!shown.length&&lessons.length)$("lesson-grid").innerHTML='<div class="empty-state">Không tìm thấy bài học phù hợp.</div>';if(!shown.length&&!lessons.length&&$("status").textContent==="")$("status").textContent="Chưa có bài học nào.";
 document.querySelectorAll("[data-detail]").forEach(b=>b.onclick=()=>openDetail(b.dataset.detail))}
$("search").addEventListener("input",renderLessons);$("category-filter").addEventListener("change",renderLessons);
function youtubeId(url=""){try{const u=new URL(url);if(u.hostname.includes("youtu.be"))return u.pathname.slice(1);if(u.hostname.includes("youtube.com"))return u.searchParams.get("v")||u.pathname.split("/").pop()}catch{}return null}
function openDetail(id){const l=lessons.find(x=>String(x.id)===String(id));if(!l)return;const video=youtubeId(l.video_url||"");$("detail-content").innerHTML=`<span class="eyebrow">GÓC HỌC TẬP</span><span class="detail-category">${escapeHtml(l.category||"Bài học")}${l.grade?" · "+escapeHtml(l.grade):""}</span><h2 id="detail-title">${escapeHtml(l.title)}</h2><p class="detail-description">${escapeHtml(l.description||"Chưa có mô tả cho bài học này.")}</p><div class="detail-actions">${l.resource_url?`<a class="btn btn-primary" href="${escapeHtml(l.resource_url)}" target="_blank" rel="noopener">↗ Mở tài liệu</a>`:""}${l.video_url?`<a class="btn btn-soft" href="${escapeHtml(l.video_url)}" target="_blank" rel="noopener">▶ Mở video</a>`:""}${currentRole==="teacher"?`<button class="btn delete-btn" id="delete-lesson">Xóa bài học</button>`:""}</div>${video?`<iframe class="video-frame" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(video)}" title="Video bài học" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`:""}${!l.resource_url&&!l.video_url?'<p class="form-message">Giáo viên chưa thêm link tài liệu hoặc video cho bài học này.</p>':""}`;
 if(currentRole==="teacher")$("delete-lesson").onclick=async()=>{if(!confirm("Bạn có chắc muốn xóa bài học này?"))return;const {error}=await db.from("lessons").delete().eq("id",l.id);if(error){toast("Không thể xóa: "+error.message);return}hideModal("detail-modal");toast("Đã xóa bài học.");await loadLessons()};showModal("detail-modal")}
async function init(){if(!isConfigured){updateAccount();await loadLessons();return}const {data:{session}}=await db.auth.getSession();if(session){currentUser=session.user;await loadRole()}db.auth.onAuthStateChange(async(_event,session)=>{currentUser=session?.user||null;if(currentUser)await loadRole();else{currentRole="student";updateAccount()}await loadLessons()});await loadLessons()}
init();
