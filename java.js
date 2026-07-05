// ============================================================================
// ملف الجافاسكريبت الرئيسي (java.js) - مشروع إمبراطورية المعرفة
// ============================================================================

const firebaseConfig = {
    apiKey: "AIzaSyAEQVZGXAhPCLpgFZhKkFfi5TOxP7BFGvU",
    authDomain: "brainsync-fd83f.firebaseapp.com",
    databaseURL: "https://brainsync-fd83f-default-rtdb.firebaseio.com",
    projectId: "brainsync-fd83f",
    storageBucket: "brainsync-fd83f.firebasestorage.app",
    messagingSenderId: "297207509009",
    appId: "1:297207509009:web:4d01cd48da789b60b301b0",
    measurementId: "G-LM6D9W3L0Y"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const storage = firebase.storage();

let currentTeacherId = null;
let isVIPLoggedIn = false; // المتغير الجديد للتحكم في الصلاحيات
let selectedLessonFiles = []; 
let filterSelectedSubject = "";
let filterSelectedStage = "";
let filterSelectedType = "";
let filterSelectedGrade = "";
let globalLessonContext = "لا يوجد درس مرفوع حالياً";
let globalTeacherStyle = "";
let isTeacherRecording = false;

// ============================================================================
// بناء نظام تسجيل دخول "فيس بوك" ديناميكياً (بدون تعديل HTML)
// ============================================================================
function buildFacebookLogin() {
    const tSec = document.querySelector('.teacher-section');
    if (!tSec) return;

    // إضافة الستايل الخاص بالفيس بوك
    const style = document.createElement('style');
    style.innerHTML = `
        .fb-login-container { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; background-color: #f0f2f5; padding: 40px 20px; border-radius: 10px; margin: 20px 0; gap: 40px; text-align: right; direction: rtl; border: 1px solid #dddfe2;}
        .fb-left { max-width: 400px; }
        .fb-logo { color: #1877f2; font-size: 3.5rem; margin: 0; font-family: Helvetica, Arial, sans-serif; font-weight: bold; letter-spacing: -1.5px; }
        .fb-subtitle { font-size: 1.4rem; color: #1c1e21; margin-top: 10px; line-height: 1.4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .fb-right { flex: 1; min-width: 300px; max-width: 400px; }
        .fb-card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); text-align: center; }
        .fb-input { width: 100%; padding: 14px 16px; font-size: 1.1rem; border: 1px solid #dddfe2; border-radius: 6px; margin-bottom: 15px; box-sizing: border-box; direction: rtl; background: #fff; color:#1c1e21;}
        .fb-input:focus { border-color: #1877f2; outline: none; box-shadow: 0 0 0 2px #e7f3ff; }
        .fb-btn-primary { width: 100%; background-color: #1877f2; color: white; border: none; border-radius: 6px; font-size: 1.3rem; font-weight: bold; padding: 12px; cursor: pointer; transition: 0.2s; font-family: inherit;}
        .fb-btn-primary:hover { background-color: #166fe5; }
        .fb-btn-success { width: 70%; background-color: #42b72a; color: white; border: none; border-radius: 6px; font-size: 1.1rem; font-weight: bold; padding: 12px; cursor: pointer; transition: 0.2s; margin-top:10px; font-family: inherit;}
        .fb-btn-success:hover { background-color: #36a420; }
        .fb-btn-secondary { width: auto; background-color: #e4e6eb; color: #4b4f56; border: none; border-radius: 6px; font-size: 1rem; font-weight: bold; padding: 10px 20px; cursor: pointer; font-family: inherit;}
        .fb-divider { border-bottom: 1px solid #dadde1; margin: 20px 0; }
        #logged-in-state { text-align: center; padding: 30px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin:20px 0; border-top: 4px solid #1877f2;}
    `;
    document.head.appendChild(style);

    // إزالة المحتوى القديم ووضع كروت الفيس بوك
    tSec.innerHTML = `
        <div class="fb-login-container" id="fb-main-container">
            <div class="fb-left">
                <h1 class="fb-logo">BrainSync</h1>
                <p class="fb-subtitle">سجل دخولك الآن للتواصل مع أذكى منصة تعليمية للتلخيص وإنشاء الامتحانات في مصر.</p>
            </div>
            <div class="fb-right">
                
                <!-- كارت تسجيل دخول الطالب/المعلم -->
                <div class="fb-card" id="fb-user-card">
                    <input type="tel" id="fb-phone-input" class="fb-input" placeholder="رقم الموبايل (لتسجيل الدخول كطالب/معلم)">
                    <button class="fb-btn-primary" id="fb-login-btn">تسجيل الدخول</button>
                    <div class="fb-divider"></div>
                    <button class="fb-btn-success" id="fb-show-admin">تسجيل دخول كمسؤول</button>
                </div>

                <!-- كارت تسجيل دخول الإدارة -->
                <div class="fb-card" id="fb-admin-card" style="display:none;">
                    <h3 style="margin-top:0; color:#1877f2;">دخول الإدارة (VIP)</h3>
                    <input type="email" id="fb-admin-email" class="fb-input" placeholder="البريد الإلكتروني المعتمد">
                    <input type="password" id="fb-admin-pass" class="fb-input" placeholder="كلمة المرور الموحدة">
                    <input type="tel" id="fb-admin-phone" class="fb-input" placeholder="رقم موبايلك (لربط حسابك بالمنصة)">
                    <button class="fb-btn-primary" id="fb-admin-btn" style="background-color:#42b72a;">دخول</button>
                    <div class="fb-divider"></div>
                    <button class="fb-btn-secondary" id="fb-show-user">رجوع لصفحة الطلاب</button>
                </div>

                <!-- كارت الدفع والإيصال -->
                <div class="fb-card" id="fb-payment-card" style="display:none;">
                    <div style="text-align:center; margin-bottom:10px; color:#b45309; font-weight:bold;"><i class="fas fa-crown"></i> تفعيل الحساب (VIP)</div>
                    <h3 id="fb-price-text" style="color:#1c1e21; margin:10px 0;"></h3>
                    <p style="font-size:0.95rem; color:#606770; line-height:1.5;">عذراً، حسابك غير مفعل. برجاء تحويل المبلغ عبر فودافون كاش لرقم <strong>01067479440</strong> ورفع صورة الإيصال ليتم تفعيله فوراً.</p>
                    <input type="file" id="fb-receipt-file" accept="image/*" style="display: none;">
                    <button class="fb-btn-primary" id="fb-trigger-upload-btn" style="margin-top:10px;"><i class="fas fa-camera"></i> إرفاق إيصال الدفع</button>
                </div>
            </div>
        </div>

        <!-- حالة ما بعد تسجيل الدخول بنجاح -->
        <div id="logged-in-state" style="display:none;">
            <h2 style="color:#1877f2; margin-top:0;"><i class="fas fa-check-circle"></i> تم تسجيل الدخول بنجاح!</h2>
            <p style="font-size:1.2rem; color:#1c1e21;">أهلاً بك، حسابك مفعل (VIP) على الرقم: <span id="logged-in-phone" style="font-weight:bold; color:#059669;" dir="ltr"></span></p>
            
            <div id="admin-tools" style="display:none; margin-top:20px; padding-top:20px; border-top:1px solid #dddfe2;">
                <button class="fb-btn-primary" id="open-dash-btn-fb" style="background:#1e293b; width:100%; max-width:400px;"><i class="fas fa-users-cog"></i> لوحة تحكم الاشتراكات والأرقام (Dashboard)</button>
            </div>
            
            <div style="margin-top:20px;">
                <button class="fb-btn-primary" id="fb-teacher-record-btn" style="background:#8b5cf6; width:100%; max-width:400px;"><i class="fas fa-microphone-alt"></i> أداة تسجيل أسلوب المعلم</button>
            </div>
        </div>
    `;

    // -----------------------------------------------------
    // برمجة أزرار التبديل والتسجيل
    // -----------------------------------------------------
    document.getElementById('fb-show-admin').onclick = () => {
        document.getElementById('fb-user-card').style.display = 'none';
        document.getElementById('fb-admin-card').style.display = 'block';
    };
    document.getElementById('fb-show-user').onclick = () => {
        document.getElementById('fb-admin-card').style.display = 'none';
        document.getElementById('fb-user-card').style.display = 'block';
    };

    // تسجيل الطالب / المعلم برقم الموبايل فقط
    document.getElementById('fb-login-btn').onclick = async () => {
        const phone = document.getElementById('fb-phone-input').value.trim();
        if(phone.length < 10) { alert("برجاء إدخال رقم موبايل صحيح."); return; }
        
        const btn = document.getElementById('fb-login-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';
        
        currentTeacherId = phone;
        const currentIP = await fetchDeviceIP();
        let deviceFingerprint = localStorage.getItem("device_fingerprint") || ("DEV_" + Math.random().toString(36).substring(2, 15));
        localStorage.setItem("device_fingerprint", deviceFingerprint);

        try {
            const teacherRef = db.collection("teachers").doc(currentTeacherId);
            const doc = await teacherRef.get();
            let teacherData = {};

            if (doc.exists) {
                teacherData = doc.data();
                if (teacherData.status === "VIP_Active") {
                    activateLoggedInState(phone, teacherData.role === "Admin");
                    return;
                }
            } else {
                teacherData = { name: "User_" + phone, phone: phone, registeredDeviceFingerprint: deviceFingerprint, monthsSubscribed: 0, status: "Free" };
                await teacherRef.set(teacherData);
            }

            await teacherRef.update({ lastKnownIP: currentIP });
            
            // إظهار كارت الدفع
            const reqAmount = 50 + ((teacherData.monthsSubscribed || 0) * 50);
            document.getElementById('fb-price-text').innerText = 'مطلوب ' + reqAmount + ' جنيه مصري';
            document.getElementById('fb-user-card').style.display = 'none';
            document.getElementById('fb-payment-card').style.display = 'block';
            
        } catch (err) {
            alert("خطأ قاعدة البيانات: " + err.message);
            btn.innerHTML = 'تسجيل الدخول';
        }
    };

    // تسجيل الإدارة بالبريد الافتراضي ورقم الموبايل
    document.getElementById('fb-admin-btn').onclick = async () => {
        const email = document.getElementById('fb-admin-email').value.trim().toLowerCase();
        const pass = document.getElementById('fb-admin-pass').value;
        const phone = document.getElementById('fb-admin-phone').value.trim();
        
        if(pass !== "BrainSync2026") { alert("كلمة المرور غير صحيحة!"); return; }
        if(!["admin1@brainsync.com", "admin2@brainsync.com", "admin3@brainsync.com"].includes(email)) { alert("هذا البريد غير مصرح له كإدارة!"); return; }
        if(phone.length < 10) { alert("أدخل رقم الموبايل لربط حسابك بالمنصة لتفعيله."); return; }

        const btn = document.getElementById('fb-admin-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التفعيل...';

        currentTeacherId = phone;
        try {
            const teacherRef = db.collection("teachers").doc(currentTeacherId);
            await teacherRef.set({
                name: "Admin VIP", email: email, phone: phone, status: "VIP_Active", role: "Admin",
                subscriptionStart: new Date(), subscriptionEnd: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) 
            }, { merge: true });
            
            activateLoggedInState(phone, true);
        } catch(err) {
            alert("خطأ قاعدة البيانات: " + err.message);
            btn.innerHTML = 'دخول';
        }
    };

    // رفع الإيصال للتفعيل
    document.getElementById('fb-trigger-upload-btn').onclick = () => document.getElementById('fb-receipt-file').click();
    document.getElementById('fb-receipt-file').onchange = async (e) => {
        const file = e.target.files[0];
        if(!file || !currentTeacherId) return;

        const btn = document.getElementById('fb-trigger-upload-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري رفع الإيصال...';
        btn.style.pointerEvents = "none";

        try {
            const storageRef = storage.ref('receipts/' + currentTeacherId + '_' + Date.now() + '_' + file.name);
            const snapshot = await storageRef.put(file);
            const url = await snapshot.ref.getDownloadURL();

            const teacherRef = db.collection("teachers").doc(currentTeacherId);
            const doc = await teacherRef.get();
            const currentMonths = doc.data().monthsSubscribed || 0;

            await teacherRef.update({
                status: "VIP_Active", subscriptionStart: new Date(), 
                subscriptionEnd: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
                lastPaymentReceipt: url, monthsSubscribed: currentMonths + 1 
            });

            alert("تم التفعيل كـ VIP بنجاح!");
            activateLoggedInState(currentTeacherId, false);
        } catch(err) {
            alert("حدث خطأ أثناء الرفع: " + err.message);
            btn.innerHTML = '<i class="fas fa-camera"></i> إرفاق إيصال الدفع';
            btn.style.pointerEvents = "auto";
        }
    };

    // ربط المايك وأدوات الإدارة
    document.getElementById('fb-teacher-record-btn').onclick = startTeacherRecording;
    document.getElementById('open-dash-btn-fb').onclick = loadAndShowDashboard;
}

// التوجيه وتفعيل الواجهة بعد الدخول
function activateLoggedInState(phone, isAdmin) {
    isVIPLoggedIn = true;
    document.getElementById('fb-main-container').style.display = 'none';
    document.getElementById('logged-in-state').style.display = 'block';
    document.getElementById('logged-in-phone').innerText = phone;
    if(isAdmin) {
        document.getElementById('admin-tools').style.display = 'block';
    }
}

// دالة توجيه المستخدم لصفحة الفيس بوك (التسجيل) إجبارياً لو خلص محاولاته
function forceScrollToLogin() {
    const loginSection = document.getElementById('fb-main-container');
    if (loginSection) {
        loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { document.getElementById('fb-phone-input').focus(); }, 500);
    }
}

// ============================================================================
// نظام جلب وعرض الداش بورد للأدمن
// ============================================================================
async function loadAndShowDashboard() {
    let container = document.createElement('div');
    container.style.position = "fixed";
    container.style.top = "5%";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    container.style.width = "95%";
    container.style.maxWidth = "800px";
    container.style.height = "90%";
    container.style.backgroundColor = "#ffffff";
    container.style.zIndex = "999999";
    container.style.borderRadius = "15px";
    container.style.boxShadow = "0 15px 40px rgba(0,0,0,0.5)";
    container.style.padding = "20px";
    container.style.overflowY = "auto";
    container.style.direction = "rtl";

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #3b82f6; padding-bottom:10px; margin-bottom:15px;">
            <h2 style="color:#0f172a; margin:0;"><i class="fas fa-chart-line"></i> لوحة تحكم الحسابات (VIP)</h2>
            <button id="close-dash-btn" style="background:#ef4444; color:white; border:none; padding:8px 15px; border-radius:8px; font-weight:bold; cursor:pointer;">إغلاق X</button>
        </div>
        <div id="dash-content" style="text-align:center;"><i class="fas fa-spinner fa-spin fa-2x"></i> جاري جلب الأرقام من الفايربيز...</div>
    `;

    document.body.appendChild(container);
    
    document.getElementById('close-dash-btn').onclick = () => {
        container.remove();
    };

    try {
        const snapshot = await db.collection("teachers").get();
        let html = `
            <table style="width:100%; border-collapse: collapse; text-align:right;" border="1">
                <tr style="background-color:#f1f5f9; color:#334155;">
                    <th style="padding:10px;">رقم الموبايل</th>
                    <th style="padding:10px;">النوع</th>
                    <th style="padding:10px;">حالة الحساب</th>
                    <th style="padding:10px;">تاريخ التفعيل</th>
                </tr>
        `;
        
        let count = 0;
        snapshot.forEach(doc => {
            count++;
            let data = doc.data();
            let statusColor = data.status === "VIP_Active" ? "#059669" : "#ef4444";
            let role = data.role === "Admin" ? "أدمن إدارة" : "طالب/مدرس";
            let subDate = data.subscriptionStart ? new Date(data.subscriptionStart.seconds * 1000 || data.subscriptionStart).toLocaleDateString('ar-EG') : "لم يشترك بعد";
            
            html += `
                <tr>
                    <td style="padding:10px; font-weight:bold;" dir="ltr">${doc.id}</td>
                    <td style="padding:10px;">${role}</td>
                    <td style="padding:10px; color:${statusColor}; font-weight:bold;">${data.status}</td>
                    <td style="padding:10px;">${subDate}</td>
                </tr>
            `;
        });
        
        html += `</table><p style="margin-top:15px; color:#64748b; font-weight:bold;">إجمالي الأرقام المسجلة في المنصة: ${count}</p>`;
        document.getElementById('dash-content').innerHTML = html;
        
    } catch (e) {
        document.getElementById('dash-content').innerHTML = `<p style="color:red;">حدث خطأ في جلب البيانات: ${e.message}</p>`;
    }
}

// دالة المساعدة في كشف الـ IP
async function fetchDeviceIP() {
    try { 
        const res = await fetch('https://api.ipify.org?format=json'); 
        const data = await res.json(); return data.ip; 
    } catch (error) { return "IP_UNKNOWN"; }
}

// ============================================================================
// نظام العدادات والقيود المجانية
// ============================================================================
function checkAttempts() {
    let attempts = parseInt(localStorage.getItem('user_attempts') || 0);
    if (attempts >= 3) {
        alert("عفواً، لقد انتهت محاولاتك المجانية في التلخيص. سيتم توجيهك لتفعيل اشتراكك.");
        forceScrollToLogin();
        return false;
    }
    return true;
}
function incrementAttempt() {
    let attempts = parseInt(localStorage.getItem('user_attempts') || 0) + 1;
    localStorage.setItem('user_attempts', attempts);
}
function checkTeacherAttempts() {
    let tAttempts = parseInt(localStorage.getItem('teacher_attempts') || 0);
    if (tAttempts >= 2) {
        alert("عفواً، لقد استنفدت محاولاتك المجانية. سيتم توجيهك لتفعيل اشتراكك.");
        forceScrollToLogin();
        return false;
    }
    return true;
}
function incrementTeacherAttempt() {
    let tAttempts = parseInt(localStorage.getItem('teacher_attempts') || 0) + 1;
    localStorage.setItem('teacher_attempts', tAttempts);
}
function checkChatAttempts() {
    let chatAttempts = parseInt(localStorage.getItem('chat_attempts') || 0);
    if (chatAttempts >= 3) {
        alert("انتهت محاولات التحدث المجانية. سيتم توجيهك لتفعيل الحساب.");
        forceScrollToLogin();
        return false;
    }
    return true;
}
function incrementChatAttempt() {
    let chatAttempts = parseInt(localStorage.getItem('chat_attempts') || 0) + 1;
    localStorage.setItem('chat_attempts', chatAttempts);
    let remaining = 3 - chatAttempts;
    if (remaining > 0) alert("تم استهلاك محاولة مجانية للتحدث. متبقي لك: " + remaining);
}

// ============================================================================
// تحميل المستند وقاعدة البيانات الأساسية
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // بناء واجهة الفيس بوك فوراً
    buildFacebookLogin();

    const subjectsDB = {
        primary_general: ["اللغة العربية", "الرياضيات", "اللغة الإنجليزية", "العلوم", "الدراسات الاجتماعية", "تكنولوجيا المعلومات", "التربية الدينية"],
        primary_azhar: ["القرآن الكريم", "التربية الإسلامية", "اللغة العربية", "الرياضيات", "اللغة الإنجليزية", "العلوم", "الدراسات الاجتماعية"],
        prep_general: ["اللغة العربية", "الرياضيات (جبر وإحصاء)", "الرياضيات (هندسة)", "العلوم", "الدراسات الاجتماعية", "اللغة الإنجليزية"],
        prep_azhar: ["القرآن الكريم", "الفقه", "أصول الدين", "النحو", "الصرف", "الرياضيات", "العلوم", "الدراسات الاجتماعية", "اللغة الإنجليزية"],
        high_general_sci_biology: ["اللغة العربية", "اللغة الإنجليزية", "الفيزياء", "الكيمياء", "الأحياء", "الجيولوجيا", "اللغة الأجنبية الثانية"],
        high_general_sci_math: ["اللغة العربية", "اللغة الإنجليزية", "الفيزياء", "الكيمياء", "الرياضيات البحتة", "الرياضيات التطبيقية"],
        high_general_lit: ["اللغة العربية", "اللغة الإنجليزية", "التاريخ", "الجغرافيا", "علم النفس", "الفلسفة والمنطق", "اللغة الأجنبية الثانية"],
        high_azhar_sci: ["القرآن الكريم", "الفقه", "الحديث", "النحو", "الصرف", "الفيزياء", "الكيمياء", "الأحياء", "الرياضيات", "اللغة الإنجليزية"],
        high_azhar_lit: ["القرآن الكريم", "الفقه", "الحديث", "النحو", "الصرف", "التاريخ", "الجغرافيا", "المنطق", "اللغة الإنجليزية"],
        diploma_industrial: ["اللغة العربية", "اللغة الإنجليزية", "الرياضيات", "الفيزياء العامة", "تخصصات صناعية متعددة"],
        diploma_commercial: ["اللغة العربية", "اللغة الإنجليزية", "إدارة أعمال", "محاسبة مالية", "سكرتارية", "اقتصاد وإحصاء"],
        diploma_agricultural: ["اللغة العربية", "اللغة الإنجليزية", "الرياضيات", "محاصيل الحقل", "أمراض النبات", "صناعات زراعية"],
        diploma_tourism: ["اللغة العربية", "اللغة الإنجليزية", "أصول فن الطهو", "خدمة المطاعم", "شركات السياحة", "محاسبة فندقية"]
    };

    function getOrdinal(i) {
        const ordinals = ["", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];
        return ordinals[i];
    }

    const ui = {
        searchInput: document.getElementById('stage-search'),
        searchResults: document.getElementById('search-results'),
        filterContainer: document.getElementById('search-filter-container'),
        filterTitle: document.getElementById('filter-title'),
        filterStage: document.getElementById('filter-stage-step'),
        filterType: document.getElementById('filter-type-step'),
        filterGrade: document.getElementById('filter-grade-step'),
        mainStage: document.getElementById('main-stage'),
        subStage: document.getElementById('sub-stage'),
        subStageContainer: document.getElementById('sub-stage-container'),
        yearStage: document.getElementById('year-stage'),
        yearStageContainer: document.getElementById('year-stage-container'),
        subjectSelect: document.getElementById('subject-select'),
        subjectContainer: document.getElementById('subject-container'),
        pathDisplay: document.getElementById('selected-path-display'),
        studentUploadSection: document.getElementById('student-upload-section'),
        extractionSettings: document.getElementById('extraction-settings')
    };

    function normalizeText(text) { 
        let normalized = text.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
        return normalized.toLowerCase(); 
    }

    ui.searchInput.addEventListener('input', (event) => {
        const query = normalizeText(event.target.value.trim());
        ui.searchResults.innerHTML = '';
        hideElement(ui.filterContainer);
        if (query.length < 2) { ui.searchResults.style.display = 'none'; return; }
        
        let matchedSubjects = [];
        for (const [pathKey, subjects] of Object.entries(subjectsDB)) {
            subjects.forEach((subject) => {
                if (normalizeText(subject).includes(query) && !matchedSubjects.includes(subject)) matchedSubjects.push(subject);
            });
        }

        if (matchedSubjects.length > 0) {
            ui.searchResults.style.display = 'block';
            matchedSubjects.slice(0, 10).forEach((sub) => { 
                let li = document.createElement('li');
                li.innerHTML = '<i class="fas fa-book-open"></i> ' + sub;
                li.onclick = () => {
                    ui.searchInput.value = sub;
                    ui.searchResults.style.display = 'none';
                    filterSelectedSubject = sub;
                    startFilterProcess(sub);
                };
                ui.searchResults.appendChild(li);
            });
        } else {
            ui.searchResults.style.display = 'none';
        }
    });

    function createFilterButton(text, onClickFunction) {
        let btn = document.createElement('button');
        btn.style.padding = "8px 15px"; 
        btn.style.border = "1px solid var(--primary-color)";
        btn.style.borderRadius = "5px"; 
        btn.style.background = "white";
        btn.style.color = "var(--primary-dark)"; 
        btn.style.cursor = "pointer";
        btn.style.fontWeight = "bold"; 
        btn.innerHTML = text;
        btn.onmouseover = () => { btn.style.background = "var(--primary-light)"; };
        btn.onmouseout = () => { btn.style.background = "white"; };
        btn.onclick = onClickFunction;
        return btn;
    }

    function startFilterProcess(subject) {
        showElement(ui.filterContainer);
        ui.filterStage.innerHTML = ''; ui.filterType.innerHTML = ''; ui.filterGrade.innerHTML = '';
        ui.filterTitle.innerHTML = 'اختر المرحلة الدراسية لمادة: ' + subject;
        ui.filterStage.appendChild(createFilterButton('المرحلة الابتدائية', () => selectFilterStage('primary')));
        ui.filterStage.appendChild(createFilterButton('المرحلة الإعدادية', () => selectFilterStage('prep')));
        ui.filterStage.appendChild(createFilterButton('المرحلة الثانوية', () => selectFilterStage('high')));
        ui.filterStage.appendChild(createFilterButton('الدبلومات الفنية', () => selectFilterStage('diploma')));
    }

    function selectFilterStage(stage) {
        filterSelectedStage = stage;
        ui.filterType.innerHTML = ''; ui.filterGrade.innerHTML = '';
        ui.filterTitle.innerHTML = 'اختر نوع التعليم:';
        if (stage === 'primary' || stage === 'prep') {
            ui.filterType.appendChild(createFilterButton('تربية وتعليم (عام)', () => selectFilterType('general')));
            ui.filterType.appendChild(createFilterButton('أزهري', () => selectFilterType('azhar')));
        } else if (stage === 'high') {
            ui.filterType.appendChild(createFilterButton('عام - علمي علوم', () => selectFilterType('general_sci_biology')));
            ui.filterType.appendChild(createFilterButton('عام - علمي رياضة', () => selectFilterType('general_sci_math')));
            ui.filterType.appendChild(createFilterButton('عام - أدبي', () => selectFilterType('general_lit')));
            ui.filterType.appendChild(createFilterButton('أزهري - علمي', () => selectFilterType('azhar_sci')));
            ui.filterType.appendChild(createFilterButton('أزهري - أدبي', () => selectFilterType('azhar_lit')));
        } else if (stage === 'diploma') {
            ui.filterType.appendChild(createFilterButton('دبلوم صناعي', () => selectFilterType('industrial')));
            ui.filterType.appendChild(createFilterButton('دبلوم تجاري', () => selectFilterType('commercial')));
            ui.filterType.appendChild(createFilterButton('دبلوم زراعي', () => selectFilterType('agricultural')));
            ui.filterType.appendChild(createFilterButton('دبلوم سياحة', () => selectFilterType('tourism')));
        }
    }

    function selectFilterType(type) {
        filterSelectedType = type;
        ui.filterGrade.innerHTML = '';
        ui.filterTitle.innerHTML = 'اختر الصف الدراسي:';
        let startGrade = 1;
        let endGrade = (filterSelectedStage === 'primary') ? 6 : 3;
        for (let i = startGrade; i <= endGrade; i++) {
            ui.filterGrade.appendChild(createFilterButton('الصف ' + getOrdinal(i), () => finishFiltering(i)));
        }
    }

    function finishFiltering(grade) {
        filterSelectedGrade = grade;
        hideElement(ui.filterContainer);
        let finalPath = "";
        if (filterSelectedStage === 'primary' || filterSelectedStage === 'prep') {
            finalPath = filterSelectedStage + '_' + filterSelectedType;
        } else if (filterSelectedStage === 'high') {
            finalPath = 'high_' + filterSelectedType;
        } else if (filterSelectedStage === 'diploma') {
            finalPath = 'diploma_' + filterSelectedType;
        }
        autoFillDropdowns(finalPath, filterSelectedGrade, filterSelectedSubject);
    }

    function updatePathDisplay() {
        if (!ui.pathDisplay) return; 
        try {
            let stage = ui.mainStage.options[ui.mainStage.selectedIndex] ? ui.mainStage.options[ui.mainStage.selectedIndex].text : "";
            let sub = ui.subStage.options[ui.subStage.selectedIndex] ? ui.subStage.options[ui.subStage.selectedIndex].text : "";
            let year = ui.yearStage.options[ui.yearStage.selectedIndex] ? ui.yearStage.options[ui.yearStage.selectedIndex].text : "";
            const subject = ui.subjectSelect.value;
            let path = stage;
            if (sub && !sub.includes('--')) path += ` > ${sub}`;
            if (year && !year.includes('--')) path += ` > ${year}`;
            if (subject) path += ` > ${subject}`;
            
            ui.pathDisplay.innerHTML = '<i class="fas fa-map-marker-alt"></i> مسار المادة المحدد: <br> ' + path;
            ui.pathDisplay.style.display = 'block';
        } catch (error) {}
    }

    ui.mainStage.addEventListener('change', (event) => {
        const val = event.target.value; 
        hideAllChildSections();
        if (val === 'primary' || val === 'prep') { 
            ui.subStage.innerHTML = '<option value="">-- حدد نوع التعليم --</option><option value="general">تربية وتعليم (عام)</option><option value="azhar">أزهري</option>';
            showElement(ui.subStageContainer); 
        } else if (val === 'high_general') { 
            ui.subStage.innerHTML = '<option value="">-- حدد الشعبة --</option><option value="sci_biology">علمي علوم</option><option value="sci_math">علمي رياضة</option><option value="lit">أدبي</option>';
            showElement(ui.subStageContainer); 
        } else if (val === 'high_azhar') { 
            ui.subStage.innerHTML = '<option value="">-- حدد الشعبة --</option><option value="sci">علمي</option><option value="lit">أدبي</option>';
            showElement(ui.subStageContainer); 
        } else if (val === 'diploma') { 
            ui.subStage.innerHTML = '<option value="">-- حدد التخصص --</option><option value="industrial">صناعي</option><option value="commercial">تجاري</option><option value="agricultural">زراعي</option><option value="tourism">سياحة وفنادق</option>';
            showElement(ui.subStageContainer); 
        }
    });

    ui.subStage.addEventListener('change', (event) => {
        if (event.target.value) {
            currentTrackPath = ui.mainStage.value;
            if (!currentTrackPath.includes('high_') && currentTrackPath !== 'diploma') currentTrackPath += '_';
            else if (currentTrackPath === 'diploma') currentTrackPath += '_';
            
            if (ui.mainStage.value.includes('high')) currentTrackPath = ui.mainStage.value + '_' + event.target.value;
            else currentTrackPath += event.target.value;
            
            let limit = (ui.mainStage.value === 'primary') ? 6 : 3;
            populateYears(1, limit, ui.mainStage.value.split('_')[0]);
            showElement(ui.yearStageContainer);
        } else {
            hideAllChildSections(true);
        }
    });

    ui.yearStage.addEventListener('change', (event) => {
        if (event.target.value) { 
            populateSubjects(currentTrackPath); 
            showElement(ui.subjectContainer); 
            if (ui.pathDisplay) ui.pathDisplay.style.display = 'none'; 
        } else { 
            hideElement(ui.subjectContainer); hideElement(ui.extractionSettings); hideElement(ui.studentUploadSection); 
            if (ui.pathDisplay) ui.pathDisplay.style.display = 'none'; 
        }
    });

    ui.subjectSelect.addEventListener('change', (event) => {
        if (event.target.value) { 
            showElement(ui.studentUploadSection); showElement(ui.extractionSettings); updatePathDisplay(); 
        } else { 
            hideElement(ui.extractionSettings); hideElement(ui.studentUploadSection); 
            if (ui.pathDisplay) ui.pathDisplay.style.display = 'none'; 
        }
    });

    function populateYears(start, end, stageType) {
        let html = '<option value="">-- اختر الصف الدراسي --</option>';
        for (let i = start; i <= end; i++) { 
            html += '<option value="' + i + '">الصف ' + getOrdinal(i);
            if (stageType === 'primary') html += ' الابتدائي';
            else if (stageType === 'prep') html += ' الإعدادي';
            else if (stageType === 'high') html += ' الثانوي';
            else if (stageType === 'diploma') html += ' (دبلوم)';
            html += '</option>';
        }
        ui.yearStage.innerHTML = html; 
        hideElement(ui.subjectContainer); hideElement(ui.studentUploadSection);
    }
    
    function populateSubjects(path) {
        const subjects = subjectsDB[path] || []; 
        let html = '<option value="">-- اختر المادة العلمية --</option>';
        subjects.forEach((sub) => { html += '<option value="' + sub + '">' + sub + '</option>'; });
        ui.subjectSelect.innerHTML = html;
    }
    
    function showElement(el) { if (!el) return; el.classList.remove('hidden-section'); el.classList.add('show-anim'); }
    function hideElement(el) { if (!el) return; el.classList.remove('show-anim'); el.classList.add('hidden-section'); }
    function hideAllChildSections(keepSub = false) { 
        if (!keepSub) hideElement(ui.subStageContainer); 
        hideElement(ui.yearStageContainer); hideElement(ui.subjectContainer); hideElement(ui.extractionSettings); hideElement(ui.studentUploadSection);
        if (ui.pathDisplay) ui.pathDisplay.style.display = 'none'; 
    }

    function autoFillDropdowns(pathKey, yearIndex, subject) {
        const parts = pathKey.split('_');
        if (parts[0] === 'high') ui.mainStage.value = parts[0] + '_' + parts[1];
        else ui.mainStage.value = parts[0];
        
        ui.mainStage.dispatchEvent(new Event('change'));
        if (parts[0] === 'high' && parts.length > 2) ui.subStage.value = parts.slice(2).join('_');
        else if (parts.length > 1) ui.subStage.value = parts.slice(1).join('_');
        
        ui.subStage.dispatchEvent(new Event('change'));
        ui.yearStage.value = yearIndex; ui.yearStage.dispatchEvent(new Event('change'));
        ui.subjectSelect.value = subject; ui.subjectSelect.dispatchEvent(new Event('change'));
    }

    const lessonUploadBox = document.getElementById('lesson-upload-box');
    const lessonImageInput = document.getElementById('lesson-image');
    
    lessonUploadBox.addEventListener('click', () => { lessonImageInput.click(); });

    lessonImageInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            if (event.target.files.length > 5) {
                alert("عفواً، أقصى عدد مسموح به هو 5 صور في المرة الواحدة لحماية سرعة الإنترنت.");
                event.target.value = ""; return;
            }
            for(let i=0; i < event.target.files.length; i++){
                if (!event.target.files[i].type.includes('image')) {
                    alert("عفواً، مسموح برفع الصور فقط.");
                    event.target.value = ""; return;
                }
            }
            selectedLessonFiles = Array.from(event.target.files);
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewImg = document.getElementById('image-preview');
                if (previewImg) {
                    previewImg.src = e.target.result;
                    showElement(document.getElementById('image-preview-container'));
                }
            };
            reader.readAsDataURL(selectedLessonFiles[0]);
            
            document.getElementById('lesson-upload-text').innerHTML = '<i class="fas fa-check-circle"></i> تم إرفاق ' + selectedLessonFiles.length + ' صور بنجاح';
            lessonUploadBox.style.borderColor = "var(--success-color)";
            lessonUploadBox.style.backgroundColor = "#ecfdf5";
        }
    });

    async function generateFileHash(file) {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // ============================================================================
    // 9. إرسال الطلب للسيرفر الخلفي (البايثون)
    // ============================================================================
    const processBtn = document.getElementById('process-btn');
    
    if (processBtn) {
        processBtn.addEventListener('click', async () => {
            
            if (!isVIPLoggedIn) {
                if (!checkAttempts()) return;
            } else {
                const doc = await db.collection("teachers").doc(currentTeacherId).get();
                if (doc.data().status !== "VIP_Active") { 
                    alert("عفواً، يجب تفعيل اشتراكك أولاً."); 
                    forceScrollToLogin();
                    return; 
                }
            }
            
            const subject = ui.subjectSelect.value;
            let yearText = "";
            if (ui.yearStage.options[ui.yearStage.selectedIndex]) {
                yearText = ui.yearStage.options[ui.yearStage.selectedIndex].text;
            }
            
            if (!subject || !yearText) { 
                alert("يرجى إكمال تحديد المرحلة، الصف الدراسي، والمادة العلمية أولاً."); return; 
            }
            if (selectedLessonFiles.length === 0) { 
                alert("يرجى تصوير أو إرفاق صورة أولاً."); return; 
            }

            const btnText = document.getElementById('btn-text');
            processBtn.classList.add('processing');
            btnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري ضغط الصور ومعالجتها...';
            
            try {
                let summaryIdStr = subject + '_' + yearText;
                const summaryDocId = summaryIdStr.replace(/\s+/g, '_');
                
                const styleRef = db.collection("teacher_styles").doc(summaryDocId);
                const styleSnap = await styleRef.get();
                if (styleSnap.exists) {
                    let sData = styleSnap.data();
                    let sTime = sData.createdAt.toDate ? sData.createdAt.toDate().getTime() : sData.createdAt;
                    if (Date.now() - sTime > (6 * 30 * 24 * 60 * 60 * 1000)) {
                        await styleRef.delete(); globalTeacherStyle = "";
                    } else { globalTeacherStyle = sData.styleText; }
                } else { globalTeacherStyle = ""; }

                const newImageHash = await generateFileHash(selectedLessonFiles[0]) + "_" + selectedLessonFiles.length;
                const summaryRef = db.collection("summaries").doc(summaryDocId);
                const docSnap = await summaryRef.get();

                let needNewUploadAndAPI = true;
                let finalServerResponse = null;
                let existingData = {};
                
                if (docSnap.exists) existingData = docSnap.data();

                if (existingData.archived_version && existingData.archived_version.archived_at) {
                    let archivedTime = existingData.archived_version.archived_at.toDate ? existingData.archived_version.archived_at.toDate().getTime() : existingData.archived_version.archived_at.getTime();
                    if ((Date.now() - archivedTime) > (18 * 30 * 24 * 60 * 60 * 1000)) {
                        delete existingData.archived_version;
                    }
                }

                if (existingData.current_version && existingData.current_version.imageHash === newImageHash) {
                    needNewUploadAndAPI = false; finalServerResponse = existingData.current_version.aiData;
                } 
                if (needNewUploadAndAPI && existingData.archived_version && existingData.archived_version.imageHash === newImageHash) {
                    needNewUploadAndAPI = false; finalServerResponse = existingData.archived_version.aiData;
                }

                if (needNewUploadAndAPI) {
                    btnText.innerHTML = '<i class="fas fa-compress"></i> جاري الإرسال للسيرفر الخلفي...';
                    if (existingData.current_version) {
                        existingData.archived_version = { ...existingData.current_version, archived_at: new Date() };
                    }

                    const imagesBase64List = [];
                    for (let file of selectedLessonFiles) {
                        const base64 = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = function(event) {
                                const img = new Image();
                                img.onload = function() {
                                    const canvas = document.createElement('canvas');
                                    const MAX_WIDTH = 1200;
                                    const MAX_HEIGHT = 1200;
                                    let width = img.width; let height = img.height;
                                    if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
                                    else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                                    canvas.width = width; canvas.height = height;
                                    const ctx = canvas.getContext('2d');
                                    ctx.drawImage(img, 0, 0, width, height);
                                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                                    resolve(dataUrl.split(',')[1]);
                                };
                                img.onerror = reject; img.src = event.target.result;
                            };
                            reader.onerror = reject; reader.readAsDataURL(file);
                        });
                        imagesBase64List.push(base64);
                    }

                    const serverPayload = {
                        action: 'analyze',
                        images_base64: imagesBase64List,
                        subject: subject,
                        year: yearText,
                        mime_type: 'image/jpeg'
                    };

                    const response = await fetch('/api/analyze', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(serverPayload)
                    });

                    if (!response.ok) {
                        const errData = await response.json().catch(() => ({}));
                        throw new Error(errData.error || "فشل الاتصال بالسيرفر. الكود: " + response.status);
                    }

                    finalServerResponse = await response.json();
                    if (finalServerResponse.error) throw new Error(finalServerResponse.error);

                    existingData.current_version = { imageHash: newImageHash, aiData: finalServerResponse, lastUpdated: new Date().toISOString() };
                    await summaryRef.set(existingData);
                }
                
                btnText.innerHTML = '<i class="fas fa-check"></i> تم إنهاء التحليل بنجاح';
                processBtn.classList.remove('processing');
                
                showOutput(finalServerResponse, subject);
                
                if (finalServerResponse.brief_explanation) {
                    botSpeak(finalServerResponse.brief_explanation);
                }
                
                if (!isVIPLoggedIn) incrementAttempt();
                
                setTimeout(() => { btnText.innerHTML = '🚀 تحليل صورة أخرى'; }, 3000);
                
            } catch (error) {
                console.error("خطأ تقني:", error);
                btnText.innerHTML = '<i class="fas fa-exclamation-triangle"></i> حدث خطأ';
                processBtn.classList.remove('processing');
                alert("الخطأ التقني الحقيقي هو: \n" + error.message);
            }
        });
    }

    // ============================================================================
    // 10. دوال عرض المخرجات وتوليد ملفات الطباعة
    // ============================================================================
    function showOutput(serverData, subjectName) {
        document.getElementById('ai-output-container').style.display = 'block';
        
        let creationDateObj = new Date(serverData.lastUpdated || Date.now());
        document.getElementById('ai-meta-info').innerHTML = '<i class="fas fa-cloud-download-alt"></i> تاريخ الإنشاء: ' + creationDateObj.toLocaleDateString('ar-EG') + ' | المادة: ' + serverData.subjectTitle;
        
        let resultHtml = '<div style="background: #ffffff; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; margin-top: 15px;">';
        resultHtml += '<h4 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #3b82f6; display: inline-block; padding-bottom: 5px;">إمبراطورية المعرفة - تحليل المادة لـ: ' + serverData.grade + ' - ' + subjectName + '</h4>';
        resultHtml += '<p style="color: #475569; line-height: 1.6;">تم تحليل المحتوى وتوليد الأسئلة وترتيبها من الأسهل للأصعب بنجاح.</p>';
        
        if(serverData.brief_explanation) {
            resultHtml += '<div style="background: #fdf6e3; padding: 15px; border-right: 4px solid #f59e0b; margin-bottom: 15px; border-radius: 5px;">';
            resultHtml += '<strong style="color: #b45309;"><i class="fas fa-robot"></i> روبوت إمبراطورية المعرفة يقول:</strong><br>';
            resultHtml += '<span style="color: #334155;">' + serverData.brief_explanation + '</span></div>';
        }
        
        resultHtml += '<button id="real-download-btn" class="download-pdf-btn"><i class="fas fa-file-pdf"></i> تحميل التلخيص كملف PDF احترافي</button></div>';
        
        document.getElementById('ai-response-text').innerHTML = resultHtml;
        globalLessonContext = JSON.stringify(serverData.qa_data);
        
        document.getElementById('real-download-btn').addEventListener('click', () => { generateRealPDF(serverData); });
        document.getElementById('ai-output-container').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function generateRealPDF(serverData) {
        const btn = document.getElementById('real-download-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري بناء ملف الـ PDF...';
        
        let qaHtml = '';
        let questionCount = 0;
        
        serverData.qa_data.forEach((item, index) => {
            questionCount++;
            qaHtml += '<div style="margin-bottom: 15px; background: #f8fafc; padding: 10px; border-radius: 5px; border-right: 4px solid #10b981; direction: rtl; text-align: right;">';
            qaHtml += '<p style="color: #059669; margin: 0 0 5px 0; font-size: 14px;"><strong>س ' + questionCount + ': ' + item.q + '</strong></p>';
            qaHtml += '<p style="margin: 0; line-height: 1.8; font-size: 13px;"><strong>الإجابة:</strong><br>' + item.a.replace(/\n/g, '<br>') + '</p></div>';
        });

        document.getElementById('pdf-qa-content').innerHTML = qaHtml;
        document.getElementById('pdf-header-title').innerText = 'ملف إمبراطورية المعرفة | ' + serverData.subjectTitle + ' | ' + serverData.grade;
        
        let pdfCreationDate = new Date(serverData.lastUpdated || Date.now()).toLocaleDateString('ar-EG');
        let footerElement = document.querySelector('#pdf-template > div > div:last-child');
        if (footerElement) {
            footerElement.innerHTML = 'تاريخ الإنشاء: ' + pdfCreationDate + ' | عدد الأسئلة المستخرجة: ' + questionCount + '<br>تم التوليد بواسطة منصة إمبراطورية المعرفة للذكاء الاصطناعي © 2026';
        }

        const elementToPrint = document.getElementById('pdf-template');
        const htmlContent = elementToPrint.innerHTML;

        const opt = {
            margin: 0.5,
            filename: 'Knowledge_Empire_' + serverData.subjectTitle.replace(/\s+/g, '_') + '_' + Date.now() + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, logging: false, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } 
        };

        html2pdf().set(opt).from(htmlContent).save().then(() => {
            btn.innerHTML = '<i class="fas fa-check"></i> تم التحميل بنجاح';
            setTimeout(() => { btn.innerHTML = '<i class="fas fa-file-pdf"></i> تحميل التلخيص كملف PDF احترافي'; }, 3000);
        });
    }

    // ============================================================================
    // 11. برمجة الروبوت التفاعلي والشات مع أدوات المعلم
    // ============================================================================
    const chatInput = document.getElementById('chat-input-field');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMicBtn = document.getElementById('chat-mic-btn');
    const chatMessagesBox = document.getElementById('chat-messages-box');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'ar-EG'; recognition.continuous = false; recognition.interimResults = false;
    }

    // دالة تسجيل أسلوب المعلم (مربوطة بالزرار الجديد في الداش بورد)
    window.startTeacherRecording = function() {
        if (!isVIPLoggedIn) {
            forceScrollToLogin();
            return;
        }
        const subject = ui.subjectSelect.value;
        let yearText = ui.yearStage.options[ui.yearStage.selectedIndex] ? ui.yearStage.options[ui.yearStage.selectedIndex].text : "";
        if (!subject || !yearText) { alert("يرجى تحديد المرحلة والصف والمادة أولاً قبل بدء التسجيل."); return; }
        
        if (recognition) {
            isTeacherRecording = true;
            try {
                recognition.start();
                const btn = document.getElementById('fb-teacher-record-btn');
                if(btn) btn.innerHTML = '<i class="fas fa-microphone-slash"></i> جاري تسجيل أسلوبك...';
            } catch (e) { console.log("Error starting microphone"); }
        } else { alert("متصفحك لا يدعم تسجيل الصوت."); }
    };

    function botSpeak(textToSpeak) {
        if ('speechSynthesis' in window) {
            let cleanText = textToSpeak.replace(/<[^>]*>?/gm, '');
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'ar-EG';
            utterance.onstart = () => { setRobotState('speaking'); };
            utterance.onend = () => { setRobotState('idle'); };
            window.speechSynthesis.speak(utterance);
        }
    }

    function appendMessage(text, sender) {
        let msgDiv = document.createElement('div');
        msgDiv.style.padding = "10px 15px"; msgDiv.style.maxWidth = "80%"; msgDiv.style.fontSize = "0.95rem"; msgDiv.style.lineHeight = "1.5";
        if (sender === 'user') {
            msgDiv.style.background = "#f1f5f9"; msgDiv.style.color = "#334155"; msgDiv.style.borderRadius = "15px 15px 15px 0";
            msgDiv.style.alignSelf = "flex-end"; msgDiv.innerText = text;
        } else {
            msgDiv.classList.add('bot-msg-3d'); msgDiv.style.background = "#e0f2fe"; msgDiv.style.color = "#0369a1";
            msgDiv.style.borderRadius = "15px 15px 0 15px"; msgDiv.style.alignSelf = "flex-start"; msgDiv.innerHTML = text.replace(/\n/g, '<br>');
        }
        if (chatMessagesBox) { chatMessagesBox.appendChild(msgDiv); chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight; }
    }

    async function sendMessageToBot(messageText) {
        if (!messageText) return;
        if (!isVIPLoggedIn && !checkChatAttempts()) return;
        
        appendMessage(messageText, 'user');
        if (chatInput) chatInput.value = "";
        
        let typingDiv = document.createElement('div');
        typingDiv.style.background = "#e0f2fe"; typingDiv.style.color = "#0369a1"; typingDiv.style.padding = "10px 15px";
        typingDiv.style.borderRadius = "15px 15px 0 15px"; typingDiv.style.alignSelf = "flex-start";
        typingDiv.innerHTML = '<i class="fas fa-ellipsis-h fa-fade"></i> جاري التفكير...';
        typingDiv.id = "typing-indicator";
        
        if (chatMessagesBox) { chatMessagesBox.appendChild(typingDiv); chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight; }
        
        let subjectVal = ui.subjectSelect.value || "مادة عامة";
        let gradeVal = ui.yearStage.options[ui.yearStage.selectedIndex] ? ui.yearStage.options[ui.yearStage.selectedIndex].text : "مرحلة عامة";
        setRobotState('thinking');
        
        try {
            const chatServerPayload = {
                action: 'chat', subject: subjectVal, year: gradeVal, teacher_style: globalTeacherStyle,
                lesson_context: globalLessonContext, message: messageText
            };
            const response = await fetch('/api/chat', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(chatServerPayload)
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "فشل الاتصال بخوادم فيرسل في الشات");
            }
            const responseData = await response.json();
            if (responseData.error) throw new Error(responseData.error);

            let aiReply = responseData.reply;
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) typingIndicator.remove();
            
            setRobotState('idle'); appendMessage(aiReply, 'bot'); botSpeak(aiReply);
            if (!isVIPLoggedIn) incrementChatAttempt();
            
        } catch (error) {
            console.error("Chat Error:", error);
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) typingIndicator.remove();
            setRobotState('idle'); appendMessage("حدث خطأ: " + error.message, 'bot');
        }
    }

    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', () => { let textVal = chatInput ? chatInput.value.trim() : ""; sendMessageToBot(textVal); });
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') { sendMessageToBot(chatInput.value.trim()); } });
    }

    if (chatMicBtn) {
        chatMicBtn.addEventListener('click', async () => {
            if (!isVIPLoggedIn && !checkChatAttempts()) return;
            if (recognition) {
                try {
                    isTeacherRecording = false; recognition.start();
                    chatMicBtn.classList.add('recording'); chatInput.placeholder = "جاري الاستماع... تحدث الآن"; setRobotState('listening');
                } catch (e) { console.log("Microphone already started"); }
            } else { alert("متصفحك لا يدعم خاصية التعرف على الصوت."); }
        });
    }

    if (recognition) {
        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            if (isTeacherRecording) {
                isTeacherRecording = false;
                const btn = document.getElementById('fb-teacher-record-btn');
                if(btn) btn.innerHTML = '<i class="fas fa-microphone-alt"></i> أداة تسجيل أسلوب المعلم'; 
                
                const subject = ui.subjectSelect.value;
                let yearText = ui.yearStage.options[ui.yearStage.selectedIndex].text;
                const summaryDocId = (subject + '_' + yearText).replace(/\s+/g, '_');
                try {
                    await db.collection("teacher_styles").doc(summaryDocId).set({ styleText: transcript, createdAt: new Date() });
                    alert("تم حفظ بصمة شرحك بنجاح! سيتم دمجها مع الأنظمة العالمية للطلاب وتُحذف بعد 6 أشهر.");
                    globalTeacherStyle = transcript;
                } catch (e) { console.error("Error saving teacher style:", e); }
                return;
            }
            chatInput.value = transcript; chatMicBtn.classList.remove('recording'); chatInput.placeholder = "اكتب سؤالك هنا...";
            setRobotState('idle'); sendMessageToBot(transcript);
        };
        recognition.onerror = (event) => {
            if (isTeacherRecording) {
                isTeacherRecording = false;
                const btn = document.getElementById('fb-teacher-record-btn');
                if(btn) btn.innerHTML = '<i class="fas fa-microphone-alt"></i> أداة تسجيل أسلوب المعلم';
            } else {
                chatMicBtn.classList.remove('recording'); chatInput.placeholder = "اكتب سؤالك هنا..."; setRobotState('idle');
            }
        };
        recognition.onend = () => {
            if (isTeacherRecording) {
                isTeacherRecording = false;
                const btn = document.getElementById('fb-teacher-record-btn');
                if(btn) btn.innerHTML = '<i class="fas fa-microphone-alt"></i> أداة تسجيل أسلوب المعلم';
            } else { chatMicBtn.classList.remove('recording'); chatInput.placeholder = "اكتب سؤالك هنا..."; }
        };
    }

}); // نهاية المستند
