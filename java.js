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
let isVIPLoggedIn = false; 
let currentUserRole = "User"; // Admin, Teacher, Student
let selectedLessonFiles = []; 
let filterSelectedSubject = "";
let filterSelectedStage = "";
let filterSelectedType = "";
let filterSelectedGrade = "";
let globalLessonContext = "لا يوجد درس مرفوع حالياً";
let globalTeacherStyle = "";
let isTeacherRecording = false;

// ============================================================================
// 1. نظام الشاشة المنفصلة تماماً لتسجيل الدخول (Login Overlay)
// ============================================================================
function createAuthScreen() {
    if (document.getElementById('auth-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:#f0f2f5; z-index:999999; display:none; flex-direction:column; align-items:center; justify-content:center; direction:rtl; overflow-y:auto; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;';
    
    overlay.innerHTML = `
        <div style="width:100%; max-width:400px; padding:20px; box-sizing:border-box;">
            <h1 style="color:#1877f2; font-size:3rem; text-align:center; font-weight:bold; margin-bottom:5px; margin-top:0;">BrainSync</h1>
            <p style="text-align:center; font-size:1.1rem; margin-bottom:25px; color:#1c1e21;">سجل دخولك للتواصل مع أذكى منصة تعليمية.</p>
            
            <!-- قسم المستخدم العادي (طالب/معلم) -->
            <div id="auth-user-card" style="background:#fff; padding:25px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.1); text-align:center;">
                <input type="tel" id="auth-phone" placeholder="رقم الموبايل (لتسجيل الدخول)" style="width:100%; padding:14px; font-size:1.1rem; border:1px solid #dddfe2; border-radius:6px; margin-bottom:15px; box-sizing:border-box; direction:rtl;">
                <button id="auth-login-btn" style="width:100%; background:#1877f2; color:white; border:none; padding:12px; font-size:1.3rem; border-radius:6px; font-weight:bold; cursor:pointer;">تسجيل الدخول</button>
                <div style="border-bottom:1px solid #dadde1; margin:20px 0;"></div>
                <button id="auth-show-admin-btn" style="width:100%; background:#42b72a; color:white; border:none; padding:10px; font-size:1.1rem; border-radius:6px; font-weight:bold; cursor:pointer; margin-bottom:10px;">دخول الإدارة (VIP)</button>
                <button id="auth-close-btn" style="width:100%; background:#e4e6eb; color:#4b4f56; border:none; padding:10px; font-size:1rem; border-radius:6px; font-weight:bold; cursor:pointer;">العودة للمنصة</button>
            </div>

            <!-- قسم تفعيل الدفع -->
            <div id="auth-payment-card" style="background:#fff; padding:25px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.1); text-align:center; display:none;">
                <h3 style="color:#b45309; margin-top:0;"><i class="fas fa-crown"></i> تفعيل الحساب</h3>
                <p style="color:#606770; margin-bottom:15px;">الاشتراك المطلوب: <span id="auth-price-text" style="font-weight:bold; color:#1c1e21; font-size:1.2rem;"></span> جنيه مصري</p>
                <p style="font-size:0.9rem; line-height:1.6;">برجاء التحويل لفودافون كاش على الرقم <strong>01067479440</strong> ورفع صورة الإيصال ليتم فتح جميع مميزات المنصة فوراً.</p>
                <input type="file" id="auth-receipt" accept="image/*" style="display:none;">
                <button id="auth-upload-btn" style="width:100%; background:#42b72a; color:white; border:none; padding:12px; font-size:1.1rem; border-radius:6px; font-weight:bold; cursor:pointer; margin-bottom:10px;"><i class="fas fa-camera"></i> إرفاق الإيصال للتفعيل</button>
                <button id="auth-back-btn" style="width:100%; background:#e4e6eb; color:#4b4f56; border:none; padding:10px; font-size:1rem; border-radius:6px; font-weight:bold; cursor:pointer;">رجوع</button>
            </div>

            <!-- قسم الإدارة -->
            <div id="auth-admin-card" style="background:#fff; padding:25px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.1); text-align:center; display:none;">
                <h3 style="color:#1877f2; margin-top:0;"><i class="fas fa-user-shield"></i> الإدارة المعتمدة</h3>
                <input type="email" id="auth-admin-email" placeholder="البريد الإلكتروني المعتمد" value="admin1@brainsync.com" style="width:100%; padding:14px; font-size:1rem; border:1px solid #dddfe2; border-radius:6px; margin-bottom:10px; box-sizing:border-box; direction:ltr;">
                <input type="password" id="auth-admin-pass" placeholder="كلمة المرور الموحدة" value="BrainSync2026" style="width:100%; padding:14px; font-size:1rem; border:1px solid #dddfe2; border-radius:6px; margin-bottom:10px; box-sizing:border-box; direction:ltr;">
                <input type="tel" id="auth-admin-phone" placeholder="أدخل رقم موبايلك لربط الحساب" style="width:100%; padding:14px; font-size:1.1rem; border:1px solid #dddfe2; border-radius:6px; margin-bottom:15px; box-sizing:border-box; direction:rtl;">
                <button id="auth-admin-login-btn" style="width:100%; background:#42b72a; color:white; border:none; padding:12px; font-size:1.2rem; border-radius:6px; font-weight:bold; cursor:pointer;">دخول المسؤول</button>
                <div style="border-bottom:1px solid #dadde1; margin:20px 0;"></div>
                <button id="auth-admin-back-btn" style="width:100%; background:#e4e6eb; color:#4b4f56; border:none; padding:10px; font-size:1rem; border-radius:6px; font-weight:bold; cursor:pointer;">الرجوع للطلاب</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // ربط الأزرار
    document.getElementById('auth-close-btn').addEventListener('click', () => overlay.style.display = 'none');
    
    document.getElementById('auth-show-admin-btn').addEventListener('click', () => {
        document.getElementById('auth-user-card').style.display = 'none';
        document.getElementById('auth-admin-card').style.display = 'block';
    });

    document.getElementById('auth-admin-back-btn').addEventListener('click', () => {
        document.getElementById('auth-admin-card').style.display = 'none';
        document.getElementById('auth-user-card').style.display = 'block';
    });

    document.getElementById('auth-back-btn').addEventListener('click', () => {
        document.getElementById('auth-payment-card').style.display = 'none';
        document.getElementById('auth-user-card').style.display = 'block';
    });

    document.getElementById('auth-login-btn').addEventListener('click', handleUserLogin);
    document.getElementById('auth-admin-login-btn').addEventListener('click', handleAdminLogin);
    
    document.getElementById('auth-upload-btn').addEventListener('click', () => {
        document.getElementById('auth-receipt').click();
    });
    
    document.getElementById('auth-receipt').addEventListener('change', handleReceiptUpload);
}

function showAuthScreen(type = 'user') {
    createAuthScreen();
    document.getElementById('auth-user-card').style.display = (type === 'user') ? 'block' : 'none';
    document.getElementById('auth-admin-card').style.display = (type === 'admin') ? 'block' : 'none';
    document.getElementById('auth-payment-card').style.display = 'none';
    document.getElementById('auth-overlay').style.display = 'flex';
}

// ============================================================================
// منطق تسجيل الدخول والتفعيل
// ============================================================================
async function fetchDeviceIP() {
    try { const res = await fetch('https://api.ipify.org?format=json'); const data = await res.json(); return data.ip; } 
    catch (error) { return "IP_UNKNOWN"; }
}

async function handleUserLogin() {
    const phone = document.getElementById('auth-phone').value.trim();
    if (phone.length < 10) { alert("برجاء إدخال رقم موبايل صحيح."); return; }
    
    const btn = document.getElementById('auth-login-btn');
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
                loginSuccess(phone, teacherData.role || "User");
                btn.innerHTML = 'تسجيل الدخول';
                return;
            }
        } else {
            teacherData = { name: "User_" + phone, phone: phone, registeredDeviceFingerprint: deviceFingerprint, monthsSubscribed: 0, status: "Free", role: "User" };
            await teacherRef.set(teacherData);
        }

        await teacherRef.update({ lastKnownIP: currentIP });
        const reqAmount = 50 + ((teacherData.monthsSubscribed || 0) * 50);
        document.getElementById('auth-price-text').innerText = reqAmount;
        
        document.getElementById('auth-user-card').style.display = 'none';
        document.getElementById('auth-payment-card').style.display = 'block';
        btn.innerHTML = 'تسجيل الدخول';
        
    } catch (e) {
        alert("خطأ: " + e.message);
        btn.innerHTML = 'تسجيل الدخول';
    }
}

async function handleAdminLogin() {
    const email = document.getElementById('auth-admin-email').value.trim().toLowerCase();
    const pass = document.getElementById('auth-admin-pass').value;
    const phone = document.getElementById('auth-admin-phone').value.trim();
    
    if (pass !== "BrainSync2026") { alert("كلمة المرور غير صحيحة!"); return; }
    if (!["admin1@brainsync.com", "admin2@brainsync.com", "admin3@brainsync.com"].includes(email)) { alert("غير مصرح لك!"); return; }
    if (phone.length < 10) { alert("أدخل رقم الموبايل الخاص بك لربط الحساب."); return; }

    const btn = document.getElementById('auth-admin-login-btn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التفعيل...';
    currentTeacherId = phone;

    try {
        const teacherRef = db.collection("teachers").doc(currentTeacherId);
        await teacherRef.set({
            name: "Admin VIP", email: email, phone: phone, status: "VIP_Active", role: "Admin",
            subscriptionStart: new Date(), subscriptionEnd: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) 
        }, { merge: true });
        
        loginSuccess(phone, 'Admin');
        btn.innerHTML = 'دخول المسؤول';
    } catch (e) {
        alert("خطأ قاعدة البيانات: " + e.message);
        btn.innerHTML = 'دخول المسؤول';
    }
}

async function handleReceiptUpload(event) {
    const file = event.target.files[0];
    if (!file || !currentTeacherId) return;

    const btn = document.getElementById('auth-upload-btn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع والتفعيل...';
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

        loginSuccess(currentTeacherId, doc.data().role || "User");
    } catch (err) {
        alert("حدث خطأ أثناء الرفع: " + err.message);
        btn.innerHTML = '<i class="fas fa-camera"></i> إرفاق صورة الإيصال';
        btn.style.pointerEvents = "auto";
    }
}

// ============================================================================
// رسالة النجاح المنبثقة، وتفعيل واجهة ما بعد تسجيل الدخول
// ============================================================================
function showToast(message, bgColor = "#059669") {
    let toast = document.getElementById('sys-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'sys-toast';
        toast.style.cssText = `position:fixed; top:-100px; left:50%; transform:translateX(-50%); background:${bgColor}; color:white; padding:15px 30px; border-radius:8px; font-weight:bold; font-size:1.1rem; z-index:9999999; box-shadow:0 4px 15px rgba(0,0,0,0.2); transition:top 0.4s ease; text-align:center;`;
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    toast.style.background = bgColor;
    setTimeout(() => { toast.style.top = '20px'; }, 100);
    setTimeout(() => { toast.style.top = '-100px'; }, 3000);
}

function loginSuccess(phone, role) {
    isVIPLoggedIn = true;
    currentUserRole = role;
    document.getElementById('auth-overlay').style.display = 'none';
    
    // إخفاء القطاع القديم للمعلم في HTML
    const oldTeacherSec = document.querySelector('.teacher-section');
    if (oldTeacherSec) oldTeacherSec.style.display = 'none';

    showToast("تم تسجيل الدخول بنجاح!");
    buildDynamicUserMenu(phone, role);
}

function logout() {
    isVIPLoggedIn = false;
    currentTeacherId = null;
    currentUserRole = "User";
    
    // إرجاع قسم التسجيل القديم للواجهة
    const oldTeacherSec = document.querySelector('.teacher-section');
    if (oldTeacherSec) oldTeacherSec.style.display = 'block';
    
    const menu = document.getElementById('dynamic-user-menu');
    if (menu) menu.remove();

    showToast("تم تسجيل الخروج", "#ef4444");
}

function buildDynamicUserMenu(phone, role) {
    if (document.getElementById('dynamic-user-menu')) return;
    
    const menu = document.createElement('div');
    menu.id = 'dynamic-user-menu';
    menu.style.cssText = 'background:#f8fafc; padding:20px; border-radius:10px; border:2px solid #3b82f6; margin-top:20px; margin-bottom:20px; text-align:center; box-shadow: 0 4px 6px rgba(0,0,0,0.05);';
    
    let html = `
        <h3 style="color:#0f172a; margin-top:0;"><i class="fas fa-user-check"></i> الحساب مفعل (VIP)</h3>
        <p style="color:#64748b; font-weight:bold; margin-bottom:15px;">الرقم: <span dir="ltr">${phone}</span></p>
    `;
    
    html += `<button id="btn-dyn-record" class="btn action-btn" style="background:#8b5cf6; margin-bottom:10px; width:100%;"><i class="fas fa-microphone-alt"></i> أداة تسجيل أسلوب المعلم</button>`;
    
    if (role === 'Admin') {
        html += `<button id="btn-dyn-dash" class="btn action-btn" style="background:#1e293b; margin-bottom:10px; width:100%;"><i class="fas fa-users-cog"></i> الداش بورد (Dashboard)</button>`;
    }
    
    html += `<button id="btn-dyn-logout" class="btn" style="background:#ef4444; color:white; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer; width:100%; margin-top:10px;"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</button>`;
    
    menu.innerHTML = html;
    
    const processBtn = document.getElementById('process-btn');
    if (processBtn && processBtn.parentNode) {
        processBtn.parentNode.insertBefore(menu, processBtn);
    }

    document.getElementById('btn-dyn-logout').addEventListener('click', logout);
    document.getElementById('btn-dyn-record').addEventListener('click', startTeacherRecordingAction);
    
    if (role === 'Admin') {
        document.getElementById('btn-dyn-dash').addEventListener('click', loadAndShowDashboard);
    }
}

// ============================================================================
// نظام جلب وعرض الداش بورد للأدمن
// ============================================================================
async function loadAndShowDashboard() {
    let container = document.createElement('div');
    container.style.position = "fixed"; container.style.top = "5%"; container.style.left = "50%";
    container.style.transform = "translateX(-50%)"; container.style.width = "95%"; container.style.maxWidth = "800px";
    container.style.height = "90%"; container.style.backgroundColor = "#ffffff"; container.style.zIndex = "999999";
    container.style.borderRadius = "15px"; container.style.boxShadow = "0 15px 40px rgba(0,0,0,0.5)";
    container.style.padding = "20px"; container.style.overflowY = "auto"; container.style.direction = "rtl";

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #3b82f6; padding-bottom:10px; margin-bottom:15px;">
            <h2 style="color:#0f172a; margin:0;"><i class="fas fa-chart-line"></i> لوحة تحكم الحسابات (VIP)</h2>
            <button id="close-dash-btn" style="background:#ef4444; color:white; border:none; padding:8px 15px; border-radius:8px; font-weight:bold; cursor:pointer;">إغلاق X</button>
        </div>
        <div id="dash-content" style="text-align:center;"><i class="fas fa-spinner fa-spin fa-2x"></i> جاري جلب الأرقام من الفايربيز...</div>
    `;

    document.body.appendChild(container);
    document.getElementById('close-dash-btn').addEventListener('click', () => { container.remove(); });

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
            let roleName = data.role === "Admin" ? "إدارة" : "طالب/معلم";
            let subDate = data.subscriptionStart ? new Date(data.subscriptionStart.seconds * 1000 || data.subscriptionStart).toLocaleDateString('ar-EG') : "غير محدد";
            html += `<tr><td style="padding:10px; font-weight:bold;" dir="ltr">${doc.id}</td><td style="padding:10px;">${roleName}</td><td style="padding:10px; color:${statusColor}; font-weight:bold;">${data.status}</td><td style="padding:10px;">${subDate}</td></tr>`;
        });
        html += `</table><p style="margin-top:15px; color:#64748b; font-weight:bold;">إجمالي الأرقام المسجلة في المنصة: ${count}</p>`;
        document.getElementById('dash-content').innerHTML = html;
    } catch (e) {
        document.getElementById('dash-content').innerHTML = `<p style="color:red;">حدث خطأ في جلب البيانات: ${e.message}</p>`;
    }
}

// ============================================================================
// نظام عداد المحاولات المجانية وتوجيه الدفع
// ============================================================================
function checkAttempts() {
    let attempts = parseInt(localStorage.getItem('user_attempts') || 0);
    if (attempts >= 3) {
        alert("عفواً، انتهت محاولاتك المجانية في التلخيص. سيتم توجيهك لصفحة تسجيل الدخول.");
        showAuthScreen('user');
        return false;
    }
    return true;
}

function incrementAttempt() {
    let attempts = parseInt(localStorage.getItem('user_attempts') || 0) + 1;
    localStorage.setItem('user_attempts', attempts);
}

function checkChatAttempts() {
    let chatAttempts = parseInt(localStorage.getItem('chat_attempts') || 0);
    if (chatAttempts >= 3) {
        alert("عفواً، انتهت محاولات التحدث المجانية. سيتم توجيهك لصفحة تسجيل الدخول.");
        showAuthScreen('user');
        return false;
    }
    return true;
}

function incrementChatAttempt() {
    let chatAttempts = parseInt(localStorage.getItem('chat_attempts') || 0) + 1;
    localStorage.setItem('chat_attempts', chatAttempts);
    let remaining = 3 - chatAttempts;
    if (remaining > 0) alert("تم استهلاك محاولة مجانية للتحدث. متبقي لك: " + remaining + " محاولات مجانية.");
}

// ============================================================================
// تحميل المستند وقاعدة بيانات المواد، وربط كافة عناصر الـ UI
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    createAuthScreen();

    // ربط الزرار القديم في الواجهة عشان يفتح الشاشة الجديدة المنفصلة
    const oldTeacherToggle = document.getElementById('teacher-mode');
    if (oldTeacherToggle) {
        oldTeacherToggle.addEventListener('click', (e) => {
            e.preventDefault(); 
            if (!isVIPLoggedIn) {
                showAuthScreen('user');
            }
        });
    }

    // ربط الدخول السري للأدمن على كلمة BrainSync القديمة (دبل كليك)
    const secretTrigger = document.getElementById('secret-trigger');
    if (secretTrigger) {
        const newTrigger = secretTrigger.cloneNode(true);
        secretTrigger.parentNode.replaceChild(newTrigger, secretTrigger);
        newTrigger.addEventListener('dblclick', () => {
            showAuthScreen('admin');
        });
    }

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

    // ==========================================
    // إرجاع أحداث البحث والقوائم بكامل وظائفها
    // ==========================================
    ui.searchInput.addEventListener('input', (event) => {
        const query = normalizeText(event.target.value.trim());
        ui.searchResults.innerHTML = '';
        hideElement(ui.filterContainer);
        
        if (query.length < 2) { 
            ui.searchResults.style.display = 'none'; 
            return; 
        }
        
        let matchedSubjects = [];
        for (const [pathKey, subjects] of Object.entries(subjectsDB)) {
            subjects.forEach((subject) => {
                if (normalizeText(subject).includes(query) && !matchedSubjects.includes(subject)) {
                    matchedSubjects.push(subject);
                }
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
            hideElement(ui.subjectContainer); 
            hideElement(ui.extractionSettings); 
            hideElement(ui.studentUploadSection); 
            if (ui.pathDisplay) ui.pathDisplay.style.display = 'none'; 
        }
    });

    ui.subjectSelect.addEventListener('change', (event) => {
        if (event.target.value) { 
            showElement(ui.studentUploadSection); 
            showElement(ui.extractionSettings); 
            updatePathDisplay(); 
        } else { 
            hideElement(ui.extractionSettings); 
            hideElement(ui.studentUploadSection); 
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
        hideElement(ui.subjectContainer); 
        hideElement(ui.studentUploadSection);
    }
    
    function populateSubjects(path) {
        const subjects = subjectsDB[path] || []; 
        let html = '<option value="">-- اختر المادة العلمية --</option>';
        subjects.forEach((sub) => { 
            html += '<option value="' + sub + '">' + sub + '</option>'; 
        });
        ui.subjectSelect.innerHTML = html;
    }
    
    function showElement(el) { 
        if (!el) return; 
        el.classList.remove('hidden-section'); 
        el.classList.add('show-anim'); 
    }
    
    function hideElement(el) { 
        if (!el) return; 
        el.classList.remove('show-anim'); 
        el.classList.add('hidden-section'); 
    }
    
    function hideAllChildSections(keepSub = false) { 
        if (!keepSub) {
            hideElement(ui.subStageContainer); 
        }
        hideElement(ui.yearStageContainer); 
        hideElement(ui.subjectContainer); 
        hideElement(ui.extractionSettings); 
        hideElement(ui.studentUploadSection);
        if (ui.pathDisplay) {
            ui.pathDisplay.style.display = 'none'; 
        }
    }

    function autoFillDropdowns(pathKey, yearIndex, subject) {
        const parts = pathKey.split('_');
        
        if (parts[0] === 'high') {
            ui.mainStage.value = parts[0] + '_' + parts[1];
        } else {
            ui.mainStage.value = parts[0];
        }
        
        ui.mainStage.dispatchEvent(new Event('change'));
        
        if (parts[0] === 'high' && parts.length > 2) {
            ui.subStage.value = parts.slice(2).join('_');
        } else if (parts.length > 1) {
            ui.subStage.value = parts.slice(1).join('_');
        }
        
        ui.subStage.dispatchEvent(new Event('change'));
        
        ui.yearStage.value = yearIndex;
        ui.yearStage.dispatchEvent(new Event('change'));
        ui.subjectSelect.value = subject;
        ui.subjectSelect.dispatchEvent(new Event('change'));
    }

    // =========================================================
    // التعديل 1: رفع الحد الأقصى إلى 100 صورة
    // =========================================================
    const lessonUploadBox = document.getElementById('lesson-upload-box');
    const lessonImageInput = document.getElementById('lesson-image');
    
    lessonUploadBox.addEventListener('click', () => { 
        lessonImageInput.click(); 
    });

    lessonImageInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            // الحد الأقصى 100 صورة
            if (event.target.files.length > 100) {
                alert("عفواً، أقصى عدد مسموح به هو 100 صورة في المرة الواحدة.");
                event.target.value = ""; 
                return;
            }

            for(let i=0; i < event.target.files.length; i++){
                if (!event.target.files[i].type.includes('image')) {
                    alert("عفواً، مسموح برفع الصور فقط.");
                    event.target.value = ""; 
                    return;
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
    // إرسال الطلب للسيرفر والتلخيص
    // ============================================================================
    const processBtn = document.getElementById('process-btn');
    
    if (processBtn) {
        processBtn.addEventListener('click', async () => {
            
            if (!isVIPLoggedIn) {
                if (!checkAttempts()) return;
            }
            
            const subject = ui.subjectSelect.value;
            let yearText = "";
            if (ui.yearStage.options[ui.yearStage.selectedIndex]) {
                yearText = ui.yearStage.options[ui.yearStage.selectedIndex].text;
            }
            
            if (!subject || !yearText) { 
                alert("يرجى إكمال تحديد المرحلة، الصف الدراسي، والمادة العلمية أولاً."); 
                return; 
            }
            
            if (selectedLessonFiles.length === 0) { 
                alert("يرجى تصوير أو إرفاق صورة أولاً."); 
                return; 
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
                        await styleRef.delete(); 
                        globalTeacherStyle = "";
                    } else {
                        globalTeacherStyle = sData.styleText;
                    }
                } else {
                    globalTeacherStyle = "";
                }

                const newImageHash = await generateFileHash(selectedLessonFiles[0]) + "_" + selectedLessonFiles.length;
                const summaryRef = db.collection("summaries").doc(summaryDocId);
                const docSnap = await summaryRef.get();

                let needNewUploadAndAPI = true;
                let finalServerResponse = null;
                let existingData = {};
                
                if (docSnap.exists) {
                    existingData = docSnap.data();
                }

                if (existingData.archived_version && existingData.archived_version.archived_at) {
                    let archivedTime = existingData.archived_version.archived_at.toDate ? existingData.archived_version.archived_at.toDate().getTime() : existingData.archived_version.archived_at.getTime();
                    if ((Date.now() - archivedTime) > (18 * 30 * 24 * 60 * 60 * 1000)) {
                        delete existingData.archived_version;
                    }
                }

                if (existingData.current_version && existingData.current_version.imageHash === newImageHash) {
                    needNewUploadAndAPI = false; 
                    finalServerResponse = existingData.current_version.aiData;
                } 
                
                if (needNewUploadAndAPI && existingData.archived_version && existingData.archived_version.imageHash === newImageHash) {
                    needNewUploadAndAPI = false; 
                    finalServerResponse = existingData.archived_version.aiData;
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
                                    let width = img.width;
                                    let height = img.height;

                                    if (width > height) {
                                        if (width > MAX_WIDTH) {
                                            height *= MAX_WIDTH / width;
                                            width = MAX_WIDTH;
                                        }
                                    } else {
                                        if (height > MAX_HEIGHT) {
                                            width *= MAX_HEIGHT / height;
                                            height = MAX_HEIGHT;
                                        }
                                    }
                                    
                                    canvas.width = width;
                                    canvas.height = height;
                                    const ctx = canvas.getContext('2d');
                                    ctx.drawImage(img, 0, 0, width, height);
                                    
                                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                                    resolve(dataUrl.split(',')[1]);
                                };
                                img.onerror = reject;
                                img.src = event.target.result;
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
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
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json' 
                        },
                        body: JSON.stringify(serverPayload)
                    });

                    if (!response.ok) {
                        const errData = await response.json().catch(() => ({}));
                        throw new Error(errData.error || "فشل الاتصال بالسيرفر. الكود: " + response.status);
                    }

                    finalServerResponse = await response.json();

                    if (finalServerResponse.error) {
                        throw new Error(finalServerResponse.error);
                    }

                    existingData.current_version = { 
                        imageHash: newImageHash, 
                        aiData: finalServerResponse, 
                        lastUpdated: new Date().toISOString() 
                    };
                    
                    await summaryRef.set(existingData);
                }
                
                btnText.innerHTML = '<i class="fas fa-check"></i> تم إنهاء التحليل بنجاح';
                processBtn.classList.remove('processing');
                
                showOutput(finalServerResponse, subject);
                
                if (finalServerResponse.brief_explanation) {
                    botSpeak(finalServerResponse.brief_explanation);
                }
                
                if (!isVIPLoggedIn) {
                    incrementAttempt();
                }
                
                setTimeout(() => { 
                    btnText.innerHTML = '🚀 تحليل صورة أخرى'; 
                }, 3000);
                
            } catch (error) {
                console.error("خطأ تقني:", error);
                btnText.innerHTML = '<i class="fas fa-exclamation-triangle"></i> حدث خطأ';
                processBtn.classList.remove('processing');
                alert("الخطأ التقني الحقيقي هو: \n" + error.message);
            }
        });
    }

    // ============================================================================
    // دوال عرض المخرجات وتوليد ملفات الـ PDF 
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
        
        document.getElementById('real-download-btn').addEventListener('click', () => { 
            generateRealPDF(serverData); 
        });
        
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
        const originalScrollY = window.scrollY || document.documentElement.scrollTop;
        window.scrollTo(0, 0); 
        
        elementToPrint.style.display = 'block';
        elementToPrint.style.backgroundColor = 'white'; 
        
        const opt = {
            margin: 0.5,
            filename: 'Knowledge_Empire_' + serverData.subjectTitle.replace(/\s+/g, '_') + '_' + Date.now() + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                logging: false, 
                useCORS: true,
                scrollY: 0,
                windowY: 0
            },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } 
        };

        setTimeout(() => {
            html2pdf().set(opt).from(elementToPrint).save().then(() => {
                elementToPrint.style.display = 'none';
                window.scrollTo(0, originalScrollY); 
                
                btn.innerHTML = '<i class="fas fa-check"></i> تم التحميل بنجاح';
                setTimeout(() => { 
                    btn.innerHTML = '<i class="fas fa-file-pdf"></i> تحميل التلخيص كملف PDF احترافي'; 
                }, 3000);
            }).catch(() => {
                elementToPrint.style.display = 'none';
                window.scrollTo(0, originalScrollY);
                btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> حدث خطأ';
            });
        }, 500);
    }

    // ============================================================================
    // برمجة الشات والميكروفون وأداة تسجيل المعلم
    // ============================================================================
    const chatInput = document.getElementById('chat-input-field');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMicBtn = document.getElementById('chat-mic-btn');
    const chatMessagesBox = document.getElementById('chat-messages-box');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'ar-EG'; 
        recognition.continuous = false;
        recognition.interimResults = false;
    }

    // دالة تسجيل أسلوب المعلم (مربوطة بالزرار الديناميكي في قائمة VIP)
    window.startTeacherRecordingAction = function() {
        if (!isVIPLoggedIn) {
            showAuthScreen('user');
            return;
        }
        
        const subject = ui.subjectSelect.value;
        let yearText = ui.yearStage.options[ui.yearStage.selectedIndex] ? ui.yearStage.options[ui.yearStage.selectedIndex].text : "";
        
        if (!subject || !yearText) { 
            alert("يرجى تحديد المرحلة والصف والمادة أولاً من القوائم."); 
            return; 
        }
        
        if (recognition) {
            isTeacherRecording = true;
            try {
                recognition.start();
                const btn = document.getElementById('btn-dyn-record');
                if (btn) btn.innerHTML = '<i class="fas fa-microphone-slash"></i> جاري تسجيل أسلوبك... تحدث الآن';
            } catch (e) {
                console.log("Error starting microphone");
            }
        } else {
            alert("متصفحك لا يدعم تسجيل الصوت.");
        }
    };

    function setRobotState(state) {
        const robotIcon = document.getElementById('robot-icon');
        if (!robotIcon) return;
        
        robotIcon.classList.remove('robot-listening', 'robot-thinking', 'robot-speaking');
        
        if (state === 'listening') {
            robotIcon.classList.add('robot-listening');
        } else if (state === 'thinking') {
            robotIcon.classList.add('robot-thinking');
        } else if (state === 'speaking') {
            robotIcon.classList.add('robot-speaking');
        }
    }

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
        msgDiv.style.padding = "10px 15px"; 
        msgDiv.style.maxWidth = "80%"; 
        msgDiv.style.fontSize = "0.95rem"; 
        msgDiv.style.lineHeight = "1.5";
        
        if (sender === 'user') {
            msgDiv.style.background = "#f1f5f9"; 
            msgDiv.style.color = "#334155"; 
            msgDiv.style.borderRadius = "15px 15px 15px 0";
            msgDiv.style.alignSelf = "flex-end"; 
            msgDiv.innerText = text;
        } else {
            msgDiv.classList.add('bot-msg-3d'); 
            msgDiv.style.background = "#e0f2fe"; 
            msgDiv.style.color = "#0369a1";
            msgDiv.style.borderRadius = "15px 15px 0 15px"; 
            msgDiv.style.alignSelf = "flex-start"; 
            msgDiv.innerHTML = text.replace(/\n/g, '<br>');
        }
        
        if (chatMessagesBox) { 
            chatMessagesBox.appendChild(msgDiv); 
            chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight; 
        }
    }

    async function sendMessageToBot(messageText) {
        if (!messageText) return;
        
        if (!isVIPLoggedIn && !checkChatAttempts()) return;
        
        appendMessage(messageText, 'user');
        
        if (chatInput) chatInput.value = "";
        
        let typingDiv = document.createElement('div');
        typingDiv.style.background = "#e0f2fe"; 
        typingDiv.style.color = "#0369a1"; 
        typingDiv.style.padding = "10px 15px";
        typingDiv.style.borderRadius = "15px 15px 0 15px"; 
        typingDiv.style.alignSelf = "flex-start";
        typingDiv.innerHTML = '<i class="fas fa-ellipsis-h fa-fade"></i> جاري التفكير...';
        typingDiv.id = "typing-indicator";
        
        if (chatMessagesBox) { 
            chatMessagesBox.appendChild(typingDiv); 
            chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight; 
        }
        
        let subjectVal = ui.subjectSelect.value || "مادة عامة";
        let gradeVal = ui.yearStage.options[ui.yearStage.selectedIndex] ? ui.yearStage.options[ui.yearStage.selectedIndex].text : "مرحلة عامة";
        
        setRobotState('thinking');
        
        try {
            const chatServerPayload = {
                action: 'chat',
                subject: subjectVal,
                year: gradeVal,
                teacher_style: globalTeacherStyle,
                lesson_context: globalLessonContext,
                message: messageText
            };

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(chatServerPayload)
            });
            
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "فشل الاتصال بخوادم فيرسل في الشات");
            }
            
            const responseData = await response.json();
            
            if (responseData.error) {
                throw new Error(responseData.error);
            }

            let aiReply = responseData.reply;
            
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
            
            setRobotState('idle');
            appendMessage(aiReply, 'bot');
            botSpeak(aiReply);
            
            if (!isVIPLoggedIn) {
                incrementChatAttempt();
            }
            
        } catch (error) {
            console.error("Chat Error:", error);
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) typingIndicator.remove();
            setRobotState('idle');
            appendMessage("حدث خطأ: " + error.message, 'bot');
        }
    }

    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', () => { 
            let textVal = chatInput ? chatInput.value.trim() : ""; 
            sendMessageToBot(textVal); 
        });
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (event) => { 
            if (event.key === 'Enter') {
                sendMessageToBot(chatInput.value.trim()); 
            }
        });
    }

    if (chatMicBtn) {
        chatMicBtn.addEventListener('click', async () => {
            if (!isVIPLoggedIn && !checkChatAttempts()) return;
            
            if (recognition) {
                try {
                    isTeacherRecording = false; 
                    recognition.start();
                    chatMicBtn.classList.add('recording'); 
                    chatInput.placeholder = "جاري الاستماع... تحدث الآن"; 
                    setRobotState('listening');
                } catch (e) {
                    console.log("Microphone already started");
                }
            } else {
                alert("متصفحك لا يدعم خاصية التعرف على الصوت.");
            }
        });
    }

    if (recognition) {
        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            
            if (isTeacherRecording) {
                isTeacherRecording = false;
                
                const btn = document.getElementById('btn-dyn-record');
                if (btn) btn.innerHTML = '<i class="fas fa-microphone-alt"></i> أداة تسجيل أسلوب المعلم'; 
                
                const subject = ui.subjectSelect.value;
                let yearText = ui.yearStage.options[ui.yearStage.selectedIndex].text;
                const summaryDocId = (subject + '_' + yearText).replace(/\s+/g, '_');
                
                try {
                    await db.collection("teacher_styles").doc(summaryDocId).set({ 
                        styleText: transcript, 
                        createdAt: new Date() 
                    });
                    
                    showToast("تم حفظ بصمة شرحك بنجاح!");
                    globalTeacherStyle = transcript;
                } catch (e) { 
                    console.error("Error saving teacher style:", e); 
                }
                return;
            }
            
            chatInput.value = transcript; 
            chatMicBtn.classList.remove('recording'); 
            chatInput.placeholder = "اكتب سؤالك هنا...";
            setRobotState('idle'); 
            sendMessageToBot(transcript);
        };

        recognition.onerror = (event) => {
            if (isTeacherRecording) {
                isTeacherRecording = false;
                const btn = document.getElementById('btn-dyn-record');
                if (btn) btn.innerHTML = '<i class="fas fa-microphone-alt"></i> أداة تسجيل أسلوب المعلم'; 
            } else {
                chatMicBtn.classList.remove('recording'); 
                chatInput.placeholder = "اكتب سؤالك هنا..."; 
                setRobotState('idle');
            }
        };

        recognition.onend = () => {
            if (isTeacherRecording) {
                isTeacherRecording = false;
                const btn = document.getElementById('btn-dyn-record');
                if (btn) btn.innerHTML = '<i class="fas fa-microphone-alt"></i> أداة تسجيل أسلوب المعلم'; 
            } else { 
                chatMicBtn.classList.remove('recording'); 
                chatInput.placeholder = "اكتب سؤالك هنا..."; 
            }
        };
    }

}); // نهاية المستند
