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

function stopModalMedia(modal){
 if(!modal)return;
 modal.querySelectorAll("video").forEach(video=>{try{video.pause();video.currentTime=0;}catch(_){}});
 modal.querySelectorAll("iframe").forEach(frame=>{try{frame.src="about:blank";}catch(_){}});
}
function showModal(id){
 document.querySelectorAll(".modal").forEach(modal=>{
  if(modal.id!==id){stopModalMedia(modal);modal.classList.add("hidden");}
 });
 const target=$(id);if(target){target.classList.remove("hidden");target.setAttribute("aria-hidden","false");}
}
function hideModal(id){
 const target=$(id);if(target){stopModalMedia(target);target.classList.add("hidden");target.setAttribute("aria-hidden","true");}
}
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>hideModal(b.dataset.close)));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)hideModal(m.id)}));
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),3000)}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function setMessage(id,msg,error=false){$(id).textContent=msg;$(id).style.color=error?"#c54d4d":"#5b5ce2"}
function openAuth(){mode="login";updateAuthMode();showModal("auth-modal")}
$("auth-open").onclick=openAuth;$("hero-login").onclick=openAuth;
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;updateAuthMode()});
$("forgot-password-open").onclick=()=>{const email=$("auth-email").value.trim();if(email)$("forgot-email").value=email;$("auth-form").classList.add("hidden");$("forgot-password-form").classList.remove("hidden");setMessage("forgot-message","")};
$("forgot-back").onclick=()=>{$("forgot-password-form").classList.add("hidden");$("auth-form").classList.remove("hidden");setMessage("forgot-message","")};
$("forgot-password-form").addEventListener("submit",async e=>{e.preventDefault();if(!db){setMessage("forgot-message","Website chưa kết nối Supabase nên chưa thể gửi email khôi phục.",true);return}const email=$("forgot-email").value.trim();const button=$("forgot-submit");button.disabled=true;try{const redirectTo=`${window.location.origin}/reset-password.html`;const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo});if(error)throw error;setMessage("forgot-message","Nếu email này đã đăng ký, hệ thống sẽ gửi liên kết khôi phục. Vui lòng kiểm tra hộp thư và thư rác.")}catch(err){setMessage("forgot-message",friendlyError(err.message),true)}finally{button.disabled=false}});
function updateAuthMode(){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));$("auth-title").textContent=mode==="login"?"Chào mừng bạn!":"Tạo tài khoản học sinh";$("auth-submit").textContent=mode==="login"?"Đăng nhập":"Tạo tài khoản";$("auth-password").autocomplete=mode==="login"?"current-password":"new-password";$("forgot-password-open").classList.toggle("hidden",mode!=="login");$("auth-form").classList.remove("hidden");$("forgot-password-form").classList.add("hidden");setMessage("auth-message","");setMessage("forgot-message","")}
$("logout-btn").onclick=async()=>{if(db)await db.auth.signOut();currentUser=null;currentRole="student";updateAccount();renderLessons();toast("Bạn đã đăng xuất.")};
function updateAccount(){const logged=!!currentUser,teacher=logged&&currentRole==="teacher";$("auth-open").classList.toggle("hidden",logged);$("logout-btn").classList.toggle("hidden",!logged);$("user-label").textContent=logged?currentUser.email:"";$("add-open").classList.toggle("hidden",!teacher);$("teacher-dashboard-open").classList.toggle("hidden",!teacher);if(!teacher)$("teacher-dashboard").classList.add("hidden");}
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
$("lesson-form").addEventListener("submit",async e=>{
 e.preventDefault();
 if(!db||!currentUser||currentRole!=="teacher"){setMessage("lesson-message","Chỉ tài khoản giáo viên mới được đăng bài.",true);return}
 const file=$("lesson-mp4").files[0]||null;
 if(file&&(file.type!=="video/mp4"||file.size>500*1024*1024)){setMessage("lesson-message","Chỉ nhận tệp MP4 tối đa 500 MiB.",true);return}
 const item={title:$("lesson-title").value.trim(),category:$("lesson-category").value.trim(),grade:$("lesson-grade").value.trim(),description:$("lesson-description").value.trim(),resource_url:$("lesson-resource").value.trim()||null,video_url:$("lesson-video").value.trim()||null,video_path:null,created_by:currentUser.id};
 const button=$("lesson-submit"),progress=$("upload-progress");button.disabled=true;
 try{
  if(file){
   const path=currentUser.id+"/"+crypto.randomUUID()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
   const {data:{session}}=await db.auth.getSession();if(!session)throw new Error("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.");
   if(!window.tus)throw new Error("Chưa tải được bộ tải video lớn. Hãy tải lại trang và thử lại.");
   progress.classList.remove("hidden");progress.value=0;
   await new Promise((resolve,reject)=>{
    const upload=new tus.Upload(file,{endpoint:SUPABASE_URL.replace(".supabase.co",".storage.supabase.co")+"/storage/v1/upload/resumable",uploadDataDuringCreation:true,removeFingerprintOnSuccess:true,headers:{authorization:"Bearer "+session.access_token,apikey:SUPABASE_ANON_KEY,"x-upsert":"false"},metadata:{bucketName:"lesson-videos",objectName:path,contentType:"video/mp4",cacheControl:"3600"},chunkSize:6*1024*1024,retryDelays:[0,3000,5000,10000,20000],
     onProgress:(sent,total)=>{progress.value=Math.round(sent/total*100);setMessage("lesson-message","Đang tải video: "+progress.value+"% (không đóng trang trong khi tải)...")},onError:reject,onSuccess:resolve});upload.findPreviousUploads().then(previous=>{if(previous.length)upload.resumeFromPreviousUpload(previous[0]);upload.start()}).catch(reject);
   });
   item.video_path=path;
  }
  const {error}=await db.from("lessons").insert(item);
  if(error){if(item.video_path)await db.storage.from("lesson-videos").remove([item.video_path]);throw error}
  hideModal("lesson-modal");$("lesson-form").reset();progress.classList.add("hidden");setMessage("lesson-message","");toast("Đã đăng bài học!");await loadLessons();
 }catch(err){setMessage("lesson-message",err.message||"Không thể đăng bài học.",true)}
 finally{button.disabled=false}
});

function formatDate(value){if(!value)return "Chưa rõ ngày đăng";const d=new Date(value);return Number.isNaN(d.getTime())?"Chưa rõ ngày đăng":d.toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"})}
function openTeacherDashboard(){if(!currentUser||currentRole!=="teacher"){toast("Khu vực này chỉ dành cho giáo viên.");return}const panel=$("teacher-dashboard");panel.classList.toggle("hidden");if(!panel.classList.contains("hidden")){renderTeacherDashboard();panel.scrollIntoView({behavior:"smooth",block:"start"})}}
$("teacher-dashboard-open").onclick=openTeacherDashboard;
$("dashboard-refresh").onclick=async()=>{await loadLessons();renderTeacherDashboard();toast("Đã làm mới danh sách bài học.")};
$("dashboard-search").addEventListener("input",renderTeacherDashboard);
function renderTeacherDashboard(){
 if(!$("dashboard-list"))return;
 if(!currentUser||currentRole!=="teacher"){$("teacher-dashboard").classList.add("hidden");return}
 const q=$("dashboard-search").value.toLowerCase().trim();
 $("dashboard-total").textContent=lessons.length;
 $("dashboard-videos").textContent=lessons.filter(l=>l.video_path||l.video_url).length;
 $("dashboard-docs").textContent=lessons.filter(l=>l.resource_url).length;
 const shown=lessons.filter(l=>[l.title,l.category,l.grade,l.description].join(" ").toLowerCase().includes(q));
 $("dashboard-count").textContent=shown.length+" bài học";
 if(!shown.length){$("dashboard-list").innerHTML='<div class="dashboard-empty">'+(lessons.length?'Không tìm thấy nội dung phù hợp.':'Chưa có bài học nào được đăng.')+'</div>';return}
 $("dashboard-list").innerHTML=shown.map(l=>'<article class="dashboard-item"><div class="dashboard-item-icon">'+(l.video_path||l.video_url?'🎬':'📘')+'</div><div class="dashboard-item-main"><h3>'+escapeHtml(l.title)+'</h3><p>'+escapeHtml(l.category||"Chưa phân loại")+(l.grade?' · '+escapeHtml(l.grade):'')+'</p><div class="dashboard-tags"><span>'+((l.video_path||l.video_url)?'▶ Có video':'○ Chưa có video')+'</span><span>'+(l.resource_url?'📎 Có tài liệu':'○ Chưa có tài liệu')+'</span><span>Đăng '+formatDate(l.created_at)+'</span></div></div><div class="dashboard-item-actions"><button class="btn btn-soft" data-dashboard-view="'+escapeHtml(l.id)+'">Xem</button><button class="btn btn-outline" data-dashboard-edit="'+escapeHtml(l.id)+'">Sửa</button><button class="btn btn-soft" data-dashboard-quiz="'+escapeHtml(l.id)+'">Trắc nghiệm</button><button class="btn btn-danger-soft" data-dashboard-delete="'+escapeHtml(l.id)+'">Xóa</button></div></article>').join("");
 document.querySelectorAll("[data-dashboard-view]").forEach(b=>b.onclick=()=>openDetail(b.dataset.dashboardView));
 document.querySelectorAll("[data-dashboard-edit]").forEach(b=>b.onclick=()=>openEditLesson(b.dataset.dashboardEdit));
 document.querySelectorAll("[data-dashboard-quiz]").forEach(b=>b.onclick=()=>openQuizEditor(b.dataset.dashboardQuiz));
 document.querySelectorAll("[data-dashboard-delete]").forEach(b=>b.onclick=()=>deleteLesson(b.dataset.dashboardDelete));
}
function openEditLesson(id){
 if(!currentUser||currentRole!=="teacher"){toast("Chỉ giáo viên mới được chỉnh sửa bài học.");return}
 const l=lessons.find(x=>String(x.id)===String(id));if(!l)return;
 $("edit-lesson-id").value=l.id;$("edit-lesson-name").value=l.title||"";$("edit-lesson-category").value=l.category||"";$("edit-lesson-grade").value=l.grade||"";$("edit-lesson-description").value=l.description||"";$("edit-lesson-resource").value=l.resource_url||"";$("edit-lesson-video").value=l.video_url||"";$("edit-lesson-mp4").value="";$("edit-upload-progress").classList.add("hidden");
 $("edit-current-video").textContent=l.video_path?"Video MP4 hiện có: đã tải lên kho riêng tư.":(l.video_url?"Đang dùng video liên kết.":"Chưa có video MP4.");setMessage("edit-lesson-message","");showModal("edit-lesson-modal");
}
async function uploadTeacherMp4(file,progress,messageId){
 if(!db||!currentUser)throw new Error("Vui lòng đăng nhập lại.");
 if(file.type!=="video/mp4"||file.size>500*1024*1024)throw new Error("Chỉ nhận tệp MP4 tối đa 500 MiB.");
 const {data:{session}}=await db.auth.getSession();if(!session)throw new Error("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.");
 if(!window.tus)throw new Error("Chưa tải được bộ tải video. Hãy tải lại trang và thử lại.");
 const path=currentUser.id+"/"+crypto.randomUUID()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
 progress.classList.remove("hidden");progress.value=0;
 await new Promise((resolve,reject)=>{
  const upload=new tus.Upload(file,{endpoint:SUPABASE_URL.replace(".supabase.co",".storage.supabase.co")+"/storage/v1/upload/resumable",uploadDataDuringCreation:true,removeFingerprintOnSuccess:true,headers:{authorization:"Bearer "+session.access_token,apikey:SUPABASE_ANON_KEY,"x-upsert":"false"},metadata:{bucketName:"lesson-videos",objectName:path,contentType:"video/mp4",cacheControl:"3600"},chunkSize:6*1024*1024,retryDelays:[0,3000,5000,10000,20000],onProgress:(sent,total)=>{progress.value=Math.round(sent/total*100);setMessage(messageId,"Đang tải video: "+progress.value+"% (không đóng trang trong khi tải)...")},onError:reject,onSuccess:resolve});
  upload.findPreviousUploads().then(previous=>{if(previous.length)upload.resumeFromPreviousUpload(previous[0]);upload.start()}).catch(reject);
 });
 return path;
}
$("edit-lesson-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!db||!currentUser||currentRole!=="teacher"){setMessage("edit-lesson-message","Chỉ giáo viên mới được sửa bài học.",true);return}
 const id=$("edit-lesson-id").value,l=lessons.find(x=>String(x.id)===String(id));if(!l){setMessage("edit-lesson-message","Không tìm thấy bài học cần sửa.",true);return}
 const file=$("edit-lesson-mp4").files[0]||null,button=$("edit-lesson-submit"),progress=$("edit-upload-progress");button.disabled=true;
 let newVideoPath=null;
 try{
  if(file)newVideoPath=await uploadTeacherMp4(file,progress,"edit-lesson-message");
  const patch={title:$("edit-lesson-name").value.trim(),category:$("edit-lesson-category").value.trim(),grade:$("edit-lesson-grade").value.trim()||null,description:$("edit-lesson-description").value.trim()||null,resource_url:$("edit-lesson-resource").value.trim()||null,video_url:$("edit-lesson-video").value.trim()||null};
  if(newVideoPath)patch.video_path=newVideoPath;
  const {error}=await db.from("lessons").update(patch).eq("id",id);if(error)throw error;
  if(newVideoPath&&l.video_path){const {error:removeError}=await db.storage.from("lesson-videos").remove([l.video_path]);if(removeError)toast("Đã cập nhật bài học nhưng chưa xóa được video cũ.");}
  hideModal("edit-lesson-modal");$("edit-lesson-form").reset();progress.classList.add("hidden");toast("Đã cập nhật bài học.");await loadLessons();renderTeacherDashboard();
 }catch(err){if(newVideoPath)await db.storage.from("lesson-videos").remove([newVideoPath]);setMessage("edit-lesson-message",err.message||"Không thể lưu thay đổi.",true)}
 finally{button.disabled=false}
});
async function deleteLesson(id){
 if(!currentUser||currentRole!=="teacher"){toast("Chỉ giáo viên mới được xóa bài học.");return}
 const l=lessons.find(x=>String(x.id)===String(id));if(!l)return;
 if(!confirm('Bạn có chắc muốn xóa bài học "'+l.title+'"? Hành động này không thể hoàn tác.'))return;
 if(l.video_path){const {error:storageError}=await db.storage.from("lesson-videos").remove([l.video_path]);if(storageError){toast("Không thể xóa video: "+storageError.message);return}}
 const {error}=await db.from("lessons").delete().eq("id",l.id);if(error){toast("Không thể xóa bài học: "+error.message);return}
 if($("detail-modal")&&!$("detail-modal").classList.contains("hidden"))hideModal("detail-modal");
 toast("Đã xóa bài học.");await loadLessons();renderTeacherDashboard();
}

function addQuizQuestion(data={text:"",options:["","","",""],correct:0}){const container=$("quiz-question-list"),index=container.children.length,options=[0,1,2,3].map(i=>data.options?.[i]||""),el=document.createElement("fieldset");el.className="quiz-question";el.dataset.index=String(index);el.innerHTML='<div class="quiz-question-head"><legend>Câu hỏi '+(index+1)+'</legend><button type="button" class="quiz-remove-question btn-danger-soft">Xóa câu</button></div><label>Nội dung câu hỏi *<textarea class="quiz-question-text" rows="2" required maxlength="700" placeholder="Nhập câu hỏi...">'+escapeHtml(data.text||"")+'</textarea></label><div class="quiz-options-grid">'+options.map((v,i)=>'<label class="quiz-option-input"><span><input type="radio" name="quiz-correct-'+index+'" value="'+i+'" '+(Number(data.correct)===i?"checked":"")+' required> Đáp án '+String.fromCharCode(65+i)+'</span><input class="quiz-option-text" required maxlength="300" value="'+escapeHtml(v)+'" placeholder="Lựa chọn '+String.fromCharCode(65+i)+'"></label>').join("")+'</div>';el.querySelector(".quiz-remove-question").onclick=()=>{if(container.children.length<=1){toast("Bài trắc nghiệm cần ít nhất một câu hỏi.");return}el.remove();renumberQuizQuestions()};container.appendChild(el);renumberQuizQuestions()}
function renumberQuizQuestions(){[...$("quiz-question-list").children].forEach((el,i)=>{el.dataset.index=String(i);el.querySelector("legend").textContent="Câu hỏi "+(i+1);el.querySelectorAll('input[type="radio"]').forEach(r=>r.name="quiz-correct-"+i)})}
async function openQuizEditor(lessonId){if(!db||!currentUser||currentRole!=="teacher"){toast("Chỉ giáo viên mới được quản lý trắc nghiệm.");return}const lesson=lessons.find(l=>String(l.id)===String(lessonId));if(!lesson)return;$("quiz-editor-lesson-id").value=lesson.id;$("quiz-title").value="";$("quiz-question-list").innerHTML="";$("quiz-editor-title").textContent="Trắc nghiệm: "+lesson.title;$("quiz-editor-subtitle").textContent="Tạo câu hỏi cho bài học này. Đáp án đúng chỉ được dùng để chấm điểm ở máy chủ.";setMessage("quiz-editor-message","");const {data,error}=await db.from("lesson_quizzes").select("*").eq("lesson_id",lesson.id).maybeSingle();if(error){setMessage("quiz-editor-message","Không thể tải bài trắc nghiệm: "+error.message,true);return}if(data){$("quiz-title").value=data.title||"";(data.questions||[]).forEach(q=>addQuizQuestion(q))}if(!$("quiz-question-list").children.length)addQuizQuestion();await loadQuizAttempts(lesson.id);showModal("quiz-editor-modal")}
async function loadQuizAttempts(lessonId){const box=$("quiz-attempts-admin");if(!box)return;const {data,error}=await db.from("quiz_attempts").select("user_id,score,total_questions,created_at").eq("lesson_id",lessonId).order("created_at",{ascending:false}).limit(30);if(error){box.innerHTML='<p class="form-message">Không tải được kết quả: '+escapeHtml(error.message)+'</p>';return}box.innerHTML='<h3>Kết quả học sinh</h3>'+(data?.length?'<div class="quiz-attempt-list">'+data.map(a=>'<div class="quiz-attempt-row"><span>Học sinh <b>'+escapeHtml(String(a.user_id).slice(0,8))+'…</b><small>'+formatDate(a.created_at)+'</small></span><strong>'+a.score+'/'+a.total_questions+' · '+(a.total_questions?Math.round(a.score/a.total_questions*100):0)+'%</strong></div>').join("")+'</div>':'<p class="dashboard-empty">Chưa có học sinh nào nộp bài.</p>')}
$("quiz-add-question").onclick=()=>addQuizQuestion();
$("quiz-editor-form").addEventListener("submit",async e=>{e.preventDefault();if(!currentUser||currentRole!=="teacher"){setMessage("quiz-editor-message","Chỉ giáo viên mới được lưu bài trắc nghiệm.",true);return}const lessonId=Number($("quiz-editor-lesson-id").value),title=$("quiz-title").value.trim(),questions=[];for(const el of [...$("quiz-question-list").children]){const textValue=el.querySelector(".quiz-question-text").value.trim(),opts=[...el.querySelectorAll(".quiz-option-text")].map(x=>x.value.trim()),correct=el.querySelector('input[type="radio"]:checked');if(!textValue||opts.length!==4||opts.some(x=>!x)||!correct){setMessage("quiz-editor-message","Hãy điền câu hỏi, đủ 4 phương án và chọn đáp án đúng.",true);return}questions.push({text:textValue,options:opts,correct:Number(correct.value)})}if(!questions.length){setMessage("quiz-editor-message","Cần ít nhất một câu hỏi.",true);return}const btn=$("quiz-save");btn.disabled=true;try{const {error}=await db.from("lesson_quizzes").upsert({lesson_id:lessonId,title,questions,created_by:currentUser.id,updated_at:new Date().toISOString()},{onConflict:"lesson_id"});if(error)throw error;setMessage("quiz-editor-message","Đã lưu bài trắc nghiệm và "+questions.length+" câu hỏi.");toast("Đã lưu bài trắc nghiệm.");await loadQuizAttempts(lessonId)}catch(err){setMessage("quiz-editor-message",err.message||"Không thể lưu bài trắc nghiệm.",true)}finally{btn.disabled=false}});
async function openStudentQuiz(lessonId){if(!db||!currentUser){toast("Hãy đăng nhập để làm bài trắc nghiệm.");openAuth();return}hideModal("detail-modal");hideModal("quiz-editor-modal");$("student-quiz-title").textContent="Bài trắc nghiệm";$("student-quiz-subtitle").textContent="Chọn đáp án đúng cho từng câu hỏi.";$("student-quiz-questions").innerHTML="";$("student-quiz-result").classList.add("hidden");$("student-quiz-result").innerHTML="";$("student-quiz-history").innerHTML="";$("student-quiz-submit").classList.remove("hidden");const {data,error}=await db.rpc("get_lesson_quiz",{p_lesson_id:Number(lessonId)});if(error){toast("Không thể tải trắc nghiệm: "+error.message);return}if(!data){toast("Bài học này chưa có bài trắc nghiệm.");return}$("student-quiz-title").textContent=data.title||"Bài trắc nghiệm";$("student-quiz-subtitle").textContent=(data.questions||[]).length+" câu hỏi · Mỗi câu đúng được 1 điểm."; $("student-quiz-questions").innerHTML=(data.questions||[]).map((q,i)=>'<fieldset class="student-quiz-question"><legend><span>Câu '+(i+1)+'</span> '+escapeHtml(q.text)+'</legend><div class="student-quiz-options">'+(q.options||[]).map((opt,j)=>'<label><input type="radio" name="student-answer-'+i+'" value="'+j+'"> <span><b>'+String.fromCharCode(65+j)+'.</b> '+escapeHtml(opt)+'</span></label>').join("")+'</div></fieldset>').join("");$("student-quiz-form").dataset.lessonId=String(lessonId);$("student-quiz-form").dataset.total=String((data.questions||[]).length);const {data:history}=await db.from("quiz_attempts").select("score,total_questions,created_at").eq("lesson_id",lessonId).eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(5);if(history?.length)$("student-quiz-history").innerHTML='<h3>Lần làm gần đây</h3>'+history.map(a=>'<div class="quiz-attempt-row"><span>'+formatDate(a.created_at)+'</span><strong>'+a.score+'/'+a.total_questions+' · '+(a.total_questions?Math.round(a.score/a.total_questions*100):0)+'%</strong></div>').join("");showModal("student-quiz-modal")}
$("student-quiz-form").addEventListener("submit",async e=>{e.preventDefault();if(!currentUser){toast("Hãy đăng nhập để nộp bài.");return}const lessonId=Number(e.currentTarget.dataset.lessonId),total=Number(e.currentTarget.dataset.total),answers={};for(let i=0;i<total;i++){const chosen=e.currentTarget.querySelector('input[name="student-answer-'+i+'"]:checked');if(chosen)answers[String(i)]=Number(chosen.value)}if(Object.keys(answers).length<total&&!confirm("Bạn chưa trả lời đủ câu hỏi. Bạn có muốn nộp bài không?"))return;const btn=$("student-quiz-submit");btn.disabled=true;try{const {data,error}=await db.rpc("submit_lesson_quiz",{p_lesson_id:lessonId,p_answers:answers});if(error)throw error;$("student-quiz-result").innerHTML='<div class="quiz-result-score">'+data.score+'/'+data.total+'</div><h3>'+(data.percent>=80?"Làm tốt lắm!":data.percent>=50?"Khá tốt, hãy cố gắng thêm!":"Đừng nản lòng, hãy ôn tập và thử lại nhé!")+'</h3><p>Em trả lời đúng <b>'+data.score+'</b> trên <b>'+data.total+'</b> câu.</p><div class="quiz-result-track"><span style="width:'+data.percent+'%"></span></div><strong>'+data.percent+'%</strong>';$("student-quiz-result").classList.remove("hidden");$("student-quiz-submit").classList.add("hidden");await openStudentQuizHistoryOnly(lessonId)}catch(err){toast("Không thể chấm điểm: "+err.message)}finally{btn.disabled=false}});
async function openStudentQuizHistoryOnly(lessonId){const {data}=await db.from("quiz_attempts").select("score,total_questions,created_at").eq("lesson_id",lessonId).eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(5);$("student-quiz-history").innerHTML=(data?.length?'<h3>Lịch sử làm bài</h3>'+data.map(a=>'<div class="quiz-attempt-row"><span>'+formatDate(a.created_at)+'</span><strong>'+a.score+'/'+a.total_questions+' · '+(a.total_questions?Math.round(a.score/a.total_questions*100):0)+'%</strong></div>').join(""):"")}
async function loadLessons(){if(!db){lessons=[];renderLessons();$("status").textContent="Bản mẫu đã sẵn sàng. Để đăng bài và đăng nhập thật, hãy cấu hình Supabase theo README.md.";return}
 $("status").textContent="Đang tải bài học...";const {data,error}=await db.from("lessons").select("*").order("created_at",{ascending:false});if(error){$("status").textContent="Không tải được bài học. Hãy kiểm tra cấu hình Supabase và chính sách SQL.";lessons=[]}else{lessons=data||[];$("status").textContent=lessons.length?"":"Chưa có bài học nào. Giáo viên đăng nhập để thêm bài đầu tiên."}renderLessons();renderTeacherDashboard()}
function renderLessons(){const q=$("search").value.toLowerCase().trim(),cat=$("category-filter").value;const shown=lessons.filter(l=>(!cat||l.category===cat)&&[l.title,l.category,l.grade,l.description].join(" ").toLowerCase().includes(q));const categories=[...new Set(lessons.map(l=>l.category).filter(Boolean))].sort();const old=$("category-filter").value;$("category-filter").innerHTML='<option value="">Tất cả danh mục</option>'+categories.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");if(categories.includes(old))$("category-filter").value=old;
 $("lesson-grid").innerHTML=shown.map((l,i)=>`<article class="lesson-card"><div class="lesson-cover" style="background:${colors[i%colors.length]}"><span class="cover-icon">${icons[i%icons.length]}</span><span class="category-pill">${escapeHtml(l.category||"Bài học")}</span></div><div class="lesson-body"><h3>${escapeHtml(l.title)}</h3><p>${escapeHtml(l.description||"Mở bài học để xem mô tả và tài liệu đính kèm.")}</p><div class="lesson-meta"><span>${escapeHtml(l.grade||"Tài liệu học tập")}</span><button data-detail="${escapeHtml(l.id)}">Xem bài học →</button></div></div></article>`).join("");
 if(!shown.length&&lessons.length)$("lesson-grid").innerHTML='<div class="empty-state">Không tìm thấy bài học phù hợp.</div>';if(!shown.length&&!lessons.length&&$("status").textContent==="")$("status").textContent="Chưa có bài học nào.";
 document.querySelectorAll("[data-detail]").forEach(b=>b.onclick=()=>openDetail(b.dataset.detail))}
$("search").addEventListener("input",renderLessons);$("category-filter").addEventListener("change",renderLessons);
function youtubeId(url=""){try{const u=new URL(url);if(u.hostname.includes("youtu.be"))return u.pathname.slice(1);if(u.hostname.includes("youtube.com"))return u.searchParams.get("v")||u.pathname.split("/").pop()}catch{}return null}
async function openDetail(id){
 const l=lessons.find(x=>String(x.id)===String(id));if(!l)return;
 const video=youtubeId(l.video_url||"");let mp4Url=null;
 if(l.video_path&&currentUser){const {data,error}=await db.storage.from("lesson-videos").createSignedUrl(l.video_path,3600);if(error){toast("Không thể mở video MP4: "+error.message)}else mp4Url=data.signedUrl}
 let body='<span class="eyebrow">GÓC HỌC TẬP</span><span class="detail-category">'+escapeHtml(l.category||"Bài học")+(l.grade?" · "+escapeHtml(l.grade):"")+'</span><h2 id="detail-title">'+escapeHtml(l.title)+'</h2><p class="detail-description">'+escapeHtml(l.description||"Chưa có mô tả cho bài học này.")+'</p><div class="detail-actions">';
 if(l.resource_url)body+='<a class="btn btn-primary" href="'+escapeHtml(l.resource_url)+'" target="_blank" rel="noopener">↗ Mở tài liệu</a>';
 if(l.video_url)body+='<a class="btn btn-soft" href="'+escapeHtml(l.video_url)+'" target="_blank" rel="noopener">▶ Mở video</a>';
 if(currentUser)body+='<button class="btn btn-soft" id="open-lesson-quiz">✎ Làm bài trắc nghiệm</button>';
 if(currentRole==="teacher")body+='<button class="btn delete-btn" id="delete-lesson">Xóa bài học</button>';
 body+='</div>';
 if(mp4Url)body+='<video class="video-player" controls playsinline preload="metadata" src="'+escapeHtml(mp4Url)+'"></video>';
 if(video)body+='<iframe class="video-frame" src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(video)+'" title="Video bài học" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
 if(!l.resource_url&&!l.video_url&&!l.video_path)body+='<p class="form-message">Giáo viên chưa thêm link tài liệu hoặc video cho bài học này.</p>';
 $("detail-content").innerHTML=body;
 if(currentUser)$("open-lesson-quiz").onclick=()=>openStudentQuiz(l.id);
 if(currentRole==="teacher")$("delete-lesson").onclick=async()=>{if(!confirm("Bạn có chắc muốn xóa bài học này?"))return;if(l.video_path){const {error:storageError}=await db.storage.from("lesson-videos").remove([l.video_path]);if(storageError){toast("Không thể xóa video: "+storageError.message);return}}const {error}=await db.from("lessons").delete().eq("id",l.id);if(error){toast("Không thể xóa: "+error.message);return}hideModal("detail-modal");toast("Đã xóa bài học.");await loadLessons()};
 showModal("detail-modal")
}
async function init(){if(!isConfigured){updateAccount();await loadLessons();return}const {data:{session}}=await db.auth.getSession();if(session){currentUser=session.user;await loadRole()}db.auth.onAuthStateChange(async(_event,session)=>{currentUser=session?.user||null;if(currentUser)await loadRole();else{currentRole="student";updateAccount()}await loadLessons()});await loadLessons()}
init();
