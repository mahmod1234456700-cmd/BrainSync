// ============================================================================
// ملف الجافاسكريبت الرئيسي (java.js) - مشروع إمبراطورية المعرفة (BrainSync)
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

// قائمة الأرقام المعتمدة والمسموح لها فقط برؤية وفتح الداش بورد
const AUTHORIZED_ADMIN_PHONES = [
    "01067479440",
    "01000000000" // يمكنك إضافة أي رقم آخر متفق عليه هنا
];

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
// 1. نظام شاشة تسجيل الدخول برقم VIP الموحد (بدون قسم دخول مسؤولين منفصل)
// ============================================================================
function createAuthScreen() {
    if (document.getElementById('auth-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:#f0f2f5; z-index:999999; display:none; flex-direction:column; align-items:center; justify-content:center; direction:rtl; overflow-y:auto; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;';
    
    overlay.innerHTML = `
        <div style="width:100%; max-width:420px; padding:20px; box-sizing:border-box;">
            <h1 style="color:#1877f2; font-size:3rem; text-align:center; font-weight:bold; margin-bottom:5px; margin-top:0;">BrainSync</h1>
            <p style="text-align:center; font-size:1.1rem; margin-bottom:25px; color:#1c1e21;">سجل دخولك برقم الـ VIP للوصول إلى كافة مميزات المنصة.</p>
            
            <!-- قسم الدخول الموحد برقم الـ VIP -->
            <div id="auth-user-card" style="background:#fff; padding:25px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.1); text-align:center;">
                <h3 style="color:#1e293b; margin-top:0; margin-bottom:15px;"><i class="fas fa-crown" style="color:#f59e0b;"></i> تسجيل الدخول (VIP)</h3>
                <input type="tel" id="auth-phone" placeholder="أدخل رقم الموبايل (VIP)" style="width:100%; padding:14px; font-size:1.1rem; border:1px solid #dddfe2; border-radius:8px; margin-bottom:15px; box-sizing:border-box; direction:rtl;">
                <button id="auth-login-btn" style="width:100%; background:#1877f2; color:white; border:none; padding:14px; font-size:1.2rem; border-radius:8px; font-weight:bold; cursor:pointer; transition:0.3s;"><i class="fas fa-sign-in-alt"></i> دخول للمنصة</button>
                <div style="border-bottom:1px solid #dadde1; margin:20px 0;"></div>
                <button id="auth-close-btn" style="width:100%; background:#e4e6eb; color:#4b4f56; border:none; padding:12px; font-size:1rem; border-radius:8px; font-weight:bold; cursor:pointer;">العودة للمنصة</button>
            </div>

            <!-- قسم تفعيل الدفع في حال عدم تفعيل الاشتراك -->
            <div id="auth-payment-card" style="background:#fff; padding:25px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.1); text-align:center; display:none;">
                <h3 style="color:#b45309; margin-top:0;"><i class="fas fa-crown"></i> تفعيل حساب الـ VIP</h3>
                <p style="color:#606770; margin-bottom:15px;">الاشتراك المطلوب: <span id="auth-price-text" style="font-weight:bold; color:#1c1e21; font-size:1.2rem;"></span> جنيه مصري</p>
                <p style="font-size:0.95rem; line-height:1.7;">برجاء التحويل لفودافون كاش على الرقم <strong>01067479440</strong> ورفع صورة الإيصال ليتم فتح جميع مميزات المنصة فوراً.</p>
                <input type="file" id="auth-receipt" accept="image/*" style="display:none;">
                <button id="auth-upload-btn" style="width:100%; background:#10b981; color:white; border:none; padding:14px; font-size:1.1rem; border-radius:8px; font-weight:bold; cursor:pointer; margin-bottom:10px;"><i class="fas fa-camera"></i> إرفاق الإيصال للتفعيل</button>
                <button id="auth-back-btn" style="width:100%; background:#e4e6eb; color:#4b4f56; border:none; padding:12px; font-size:1rem; border-radius:8px; font-weight:bold; cursor:pointer;">رجوع</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('auth-close-btn').addEventListener('click', () => {
        overlay.style.display = 'none';
    });
    
    document.getElementById('auth-back-btn').addEventListener('click', () => {
        document.getElementById('auth-payment-card').style.display = 'none';
        document.getElementById('auth-user-card').style.display = 'block';
    });

    document.getElementById('auth-login-btn').addEventListener('click', handleUserLogin);
    
    document.getElementById('auth-upload-btn').addEventListener('click', () => {
        document.getElementById('auth-receipt').click();
    });
    
    document.getElementById('auth-receipt').addEventListener('change', handleReceiptUpload);
}

function showAuthScreen() {
    createAuthScreen();
    document.getElementById('auth-user-card').style.display = 'block';
    document.getElementById('auth-payment-card').style.display = 'none';
    document.getElementById('auth-overlay').style.display = 'flex';
}

// ============================================================================
// 2. منطق تسجيل الدخول والتفعيل برقم الـ VIP
// ============================================================================
async function fetchDeviceIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch (error) {
        return "IP_UNKNOWN";
    }
}

async function handleUserLogin() {
    const phone = document.getElementById('auth-phone').value.trim();
    if (phone.length < 10) {
        alert("برجاء إدخال رقم موبايل صحيح.");
        return;
    }
    
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

        // فحص ما إذا كان الرقم ضمن الأرقام المعتمدة للإدارة (لتحديد الصلاحية تلقائياً)
        let isAuthorizedAdmin = AUTHORIZED_ADMIN_PHONES.includes(phone);
        let assignedRole = isAuthorizedAdmin ? "Admin" : "User";

        if (doc.exists) {
            teacherData = doc.data();
            if (teacherData.status === "VIP_Active" || isAuthorizedAdmin) {
                loginSuccess(phone, assignedRole);
                btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> دخول للمنصة';
                return;
            }
        } else {
            teacherData = {
                name: "VIP_" + phone,
                phone: phone,
                registeredDeviceFingerprint: deviceFingerprint,
                monthsSubscribed: 0,
                status: isAuthorizedAdmin ? "VIP_Active" : "Free",
                role: assignedRole
            };
            await teacherRef.set(teacherData);
            if (isAuthorizedAdmin) {
                loginSuccess(phone, "Admin");
                btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> دخول للمنصة';
                return;
            }
        }

        await teacherRef.update({ lastKnownIP: currentIP, role: assignedRole });
        const reqAmount = 50 + ((teacherData.monthsSubscribed || 0) * 50);
        document.getElementById('auth-price-text').innerText = reqAmount;
        
        document.getElementById('auth-user-card').style.display = 'none';
        document.getElementById('auth-payment-card').style.display = 'block';
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> دخول للمنصة';
        
    } catch (e) {
        alert("خطأ: " + e.message);
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> دخول للمنصة';
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
        let isAuthorizedAdmin = AUTHORIZED_ADMIN_PHONES.includes(currentTeacherId);

        await teacherRef.update({
            status: "VIP_Active",
            subscriptionStart: new Date(), 
            subscriptionEnd: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
            lastPaymentReceipt: url,
            monthsSubscribed: currentMonths + 1,
            role: isAuthorizedAdmin ? "Admin" : "User"
        });

        loginSuccess(currentTeacherId, isAuthorizedAdmin ? "Admin" : "User");
    } catch (err) {
        alert("حدث خطأ أثناء الرفع: " + err.message);
        btn.innerHTML = '<i class="fas fa-camera"></i> إرفاق صورة الإيصال';
        btn.style.pointerEvents = "auto";
    }
}

// ============================================================================
// 3. رسائل النجاح، وبناء واجهة ما بعد الدخول
// ============================================================================
function showToast(message, bgColor = "#10b981") {
    let toast = document.getElementById('sys-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'sys-toast';
        toast.style.cssText = `position:fixed; top:-100px; left:50%; transform:translateX(-50%); background:${bgColor}; color:white; padding:16px 32px; border-radius:10px; font-weight:bold; font-size:1.1rem; z-index:9999999; box-shadow:0 4px 15px rgba(0,0,0,0.2); transition:top 0.4s ease; text-align:center;`;
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
    
    const oldTeacherSec = document.querySelector('.teacher-section');
    if (oldTeacherSec) oldTeacherSec.style.display = 'none';

    showToast("تم تسجيل الدخول بنجاح!");
    buildDynamicUserMenu(phone, role);
}

function logout() {
    isVIPLoggedIn = false;
    currentTeacherId = null;
    currentUserRole = "User";
    
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
    menu.style.cssText = 'background:#f8fafc; padding:20px; border-radius:12px; border:2px solid #3b82f6; margin-top:20px; margin-bottom:20px; text-align:center; box-shadow: 0 4px 10px rgba(0,0,0,0.05);';
    
    let html = `
        <h3 style="color:#0f172a; margin-top:0;"><i class="fas fa-user-check"></i> الحساب مفعل (VIP)</h3>
        <p style="color:#64748b; font-weight:bold; margin-bottom:15px;">رقم الحساب: <span dir="ltr">${phone}</span></p>
    `;
    
    html += `<button id="btn-dyn-record" class="btn action-btn" style="background:#8b5cf6; margin-bottom:10px; width:100%;"><i class="fas fa-microphone-alt"></i> أداة تسجيل أسلوب المعلم</button>`;
    
    // يظهر زر الداش بورد فقط للأرقام المعتمدة في الإدارة
    if (role === 'Admin' && AUTHORIZED_ADMIN_PHONES.includes(phone)) {
        html += `<button id="btn-dyn-dash" class="btn action-btn" style="background:#0b194f; color:#ffffff; margin-bottom:10px; width:100%;"><i class="fas fa-chart-line"></i> لوحة التحكم (Dashboard)</button>`;
    }
    
    html += `<button id="btn-dyn-logout" class="btn" style="background:#ef4444; color:white; border:none; padding:14px; border-radius:8px; font-weight:bold; cursor:pointer; width:100%; margin-top:10px;"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</button>`;
    
    menu.innerHTML = html;
    
    const processBtn = document.getElementById('process-btn');
    if (processBtn && processBtn.parentNode) {
        processBtn.parentNode.insertBefore(menu, processBtn);
    }

    document.getElementById('btn-dyn-logout').addEventListener('click', logout);
    document.getElementById('btn-dyn-record').addEventListener('click', startTeacherRecordingAction);
    
    if (role === 'Admin' && AUTHORIZED_ADMIN_PHONES.includes(phone)) {
        document.getElementById('btn-dyn-dash').addEventListener('click', loadAndShowDashboard);
    }
}

// ============================================================================
// 4. نظام الداش بورد المطابق للصور المرفقة (شريط جانبي كحلي RTL + جداول)
//    مع حماية مخصصة للأشخاص المتفق عليهم فقط
// ============================================================================
async function loadAndShowDashboard() {
    if (!AUTHORIZED_ADMIN_PHONES.includes(currentTeacherId)) {
        alert("غير مصرح لك بالوصول إلى لوحة التحكم.");
        return;
    }

    let container = document.createElement('div');
    container.id = "custom-admin-dashboard-container";
    container.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: #f1f5f9; z-index: 9999999; display: flex;
        direction: rtl; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    container.innerHTML = `
        <!-- الشريط الجانبي الأيمن (Navy Blue RTL Sidebar) -->
        <div style="width: 270px; background: linear-gradient(180deg, #0b194f 0%, #060e2b 100%); color: #ffffff; display: flex; flex-direction: column; flex-shrink: 0; box-shadow: -4px 0 15px rgba(0,0,0,0.2);">
            <div style="padding: 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 12px;">
                <div style="width: 42px; height: 42px; background: #2563eb; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: bold;">P</div>
                <div>
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: bold;">أكاديمية بيك سكيل</h3>
                    <span style="font-size: 0.75rem; color: #94a3b8;">Peak Skill Academy</span>
                </div>
            </div>

            <div style="padding: 15px 10px; overflow-y: auto; flex: 1;">
                <div style="font-size: 0.75rem; color: #64748b; padding: 5px 15px; font-weight: bold;">القائمة الرئيسية</div>
                <a href="javascript:void(0)" class="dash-nav-item active" data-tab="users" style="display: flex; align-items: center; gap: 12px; padding: 12px 15px; color: #ffffff; text-decoration: none; border-radius: 8px; background: rgba(37, 99, 235, 0.25); border-right: 4px solid #3b82f6; margin-bottom: 5px; font-weight: bold;"><i class="fas fa-users"></i> إدارة المستخدمين</a>
                <a href="javascript:void(0)" class="dash-nav-item" data-tab="courses" style="display: flex; align-items: center; gap: 12px; padding: 12px 15px; color: #cbd5e1; text-decoration: none; border-radius: 8px; margin-bottom: 5px;"><i class="fas fa-book"></i> الدورات والملخصات</a>
                <a href="javascript:void(0)" class="dash-nav-item" data-tab="categories" style="display: flex; align-items: center; gap: 12px; padding: 12px 15px; color: #cbd5e1; text-decoration: none; border-radius: 8px; margin-bottom: 5px;"><i class="fas fa-sitemap"></i> إدارة التصنيفات</a>
                
                <div style="font-size: 0.75rem; color: #64748b; padding: 15px 15px 5px; font-weight: bold;">المالية والطلبات</div>
                <a href="javascript:void(0)" class="dash-nav-item" data-tab="orders" style="display: flex; align-items: center; gap: 12px; padding: 12px 15px; color: #cbd5e1; text-decoration: none; border-radius: 8px; margin-bottom: 5px;"><i class="fas fa-shopping-cart"></i> الطلبات</a>
                <a href="javascript:void(0)" class="dash-nav-item" data-tab="payments" style="display: flex; align-items: center; gap: 12px; padding: 12px 15px; color: #cbd5e1; text-decoration: none; border-radius: 8px; margin-bottom: 5px;"><i class="fas fa-wallet"></i> المدفوعات</a>

                <div style="font-size: 0.75rem; color: #64748b; padding: 15px 15px 5px; font-weight: bold;">المحتوى</div>
                <a href="javascript:void(0)" class="dash-nav-item" data-tab="reviews" style="display: flex; align-items: center; gap: 12px; padding: 12px 15px; color: #cbd5e1; text-decoration: none; border-radius: 8px; margin-bottom: 5px;"><i class="fas fa-star"></i> التقييمات</a>
                <a href="javascript:void(0)" class="dash-nav-item" data-tab="settings" style="display: flex; align-items: center; gap: 12px; padding: 12px 15px; color: #cbd5e1; text-decoration: none; border-radius: 8px; margin-bottom: 5px;"><i class="fas fa-cog"></i> الإعدادات</a>
            </div>

            <div style="padding: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                <button id="dash-close-full-btn" style="width: 100%; background: #ef4444; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;"><i class="fas fa-times"></i> إغلاق لوحة التحكم</button>
            </div>
        </div>

        <!-- المنطقة الرئيسية اليسرى (Main Content Area) -->
        <div style="flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #f8fafc;">
            <!-- الشريط العلوي (Top Navbar) -->
            <div style="background: #ffffff; padding: 18px 30px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="margin: 0; color: #0f172a; font-size: 1.5rem; font-weight: bold;">إدارة المستخدمين</h2>
                    <span style="color: #64748b; font-size: 0.9rem;">إدارة كافة الحسابات والصلاحيات وحالات الدفع</span>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <button id="dash-refresh-btn" style="background: #e0f2fe; color: #0369a1; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer;"><i class="fas fa-sync-alt"></i> تحديث</button>
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: #0b194f; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">VIP</div>
                </div>
            </div>

            <!-- منطقة الفلاتر والبحث -->
            <div style="padding: 25px 30px;">
                <div style="background: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 25px; display: flex; gap: 15px; flex-wrap: wrap; align-items: center;">
                    <div style="flex: 1; min-width: 250px; position: relative;">
                        <input type="text" id="dash-search-input" placeholder="بحث بالاسم أو رقم الموبايل..." style="width: 100%; padding: 12px 15px 12px 40px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;">
                        <i class="fas fa-search" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                    </div>
                    <select id="dash-filter-role" style="padding: 12px 18px; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; min-width: 160px;">
                        <option value="ALL">كل الأدوار</option>
                        <option value="Admin">الإدارة</option>
                        <option value="User">مستخدم / طالب</option>
                    </select>
                    <select id="dash-filter-status" style="padding: 12px 18px; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; min-width: 160px;">
                        <option value="ALL">كل الحالات</option>
                        <option value="VIP_Active">نشط (VIP)</option>
                        <option value="Free">مجاني / غير نشط</option>
                    </select>
                </div>

                <!-- جدول العرض -->
                <div style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse; text-align: right;">
                        <thead>
                            <tr style="background: #f1f5f9; color: #334155; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 16px 20px;">#</th>
                                <th style="padding: 16px 20px;">الصورة</th>
                                <th style="padding: 16px 20px;">الاسم / الحساب</th>
                                <th style="padding: 16px 20px;">رقم الموبايل</th>
                                <th style="padding: 16px 20px;">الدور</th>
                                <th style="padding: 16px 20px;">الحالة</th>
                                <th style="padding: 16px 20px;">تاريخ التفعيل</th>
                                <th style="padding: 16px 20px;">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="dash-table-body">
                            <tr>
                                <td colspan="8" style="padding: 40px; text-align: center; color: #64748b;">
                                    <i class="fas fa-spinner fa-spin fa-2x"></i><br>جاري جلب البيانات من قاعدة الفايربيز...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    document.getElementById('dash-close-full-btn').addEventListener('click', () => {
        container.remove();
    });

    document.getElementById('dash-refresh-btn').addEventListener('click', () => {
        loadDashboardTableData();
    });

    document.getElementById('dash-search-input').addEventListener('input', () => {
        loadDashboardTableData();
    });

    document.getElementById('dash-filter-role').addEventListener('change', () => {
        loadDashboardTableData();
    });

    document.getElementById('dash-filter-status').addEventListener('change', () => {
        loadDashboardTableData();
    });

    loadDashboardTableData();
}

async function loadDashboardTableData() {
    const tableBody = document.getElementById('dash-table-body');
    if (!tableBody) return;

    const searchTerm = (document.getElementById('dash-search-input')?.value || "").trim().toLowerCase();
    const filterRole = document.getElementById('dash-filter-role')?.value || "ALL";
    const filterStatus = document.getElementById('dash-filter-status')?.value || "ALL";

    try {
        const snapshot = await db.collection("teachers").get();
        let rowsHtml = "";
        let count = 0;

        snapshot.forEach(doc => {
            let data = doc.data();
            let phone = doc.id;
            let name = data.name || ("حساب " + phone);
            let role = data.role || "User";
            let status = data.status || "Free";

            // تطبيق فلاتر البحث والدور والحالة
            if (searchTerm && !phone.includes(searchTerm) && !name.toLowerCase().includes(searchTerm)) return;
            if (filterRole !== "ALL" && role !== filterRole) return;
            if (filterStatus !== "ALL" && status !== filterStatus) return;

            count++;
            let firstLetter = name.charAt(0).toUpperCase();
            let statusBadge = status === "VIP_Active" 
                ? `<span style="background: #d1fae5; color: #065f46; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 0.85rem;">نشط VIP</span>`
                : `<span style="background: #fee2e2; color: #991b1b; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 0.85rem;">مجاني</span>`;
            
            let roleBadge = role === "Admin"
                ? `<span style="background: #e0f2fe; color: #0369a1; padding: 5px 12px; border-radius: 6px; font-weight: bold;">إدارة</span>`
                : `<span style="background: #f1f5f9; color: #475569; padding: 5px 12px; border-radius: 6px;">مستخدم</span>`;

            let subDate = data.subscriptionStart 
                ? new Date(data.subscriptionStart.seconds * 1000 || data.subscriptionStart).toLocaleDateString('ar-EG') 
                : "---";

            rowsHtml += `
                <tr style="border-bottom: 1px solid #f1f5f9; transition: 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#ffffff'">
                    <td style="padding: 16px 20px; color: #64748b;">${count}</td>
                    <td style="padding: 16px 20px;">
                        <div style="width: 38px; height: 38px; border-radius: 50%; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1rem;">${firstLetter}</div>
                    </td>
                    <td style="padding: 16px 20px; font-weight: bold; color: #0f172a;">${name}</td>
                    <td style="padding: 16px 20px; font-family: monospace; font-size: 1rem;" dir="ltr">${phone}</td>
                    <td style="padding: 16px 20px;">${roleBadge}</td>
                    <td style="padding: 16px 20px;">${statusBadge}</td>
                    <td style="padding: 16px 20px; color: #64748b;">${subDate}</td>
                    <td style="padding: 16px 20px;">
                        <button onclick="toggleUserVIPStatus('${phone}', '${status}')" style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; cursor: pointer; color: #1e293b; font-weight: bold;">تعديل الحالة</button>
                    </td>
                </tr>
            `;
        });

        if (count === 0) {
            rowsHtml = `<tr><td colspan="8" style="padding: 30px; text-align: center; color: #64748b;">لا توجد حسابات مطابقة للفلاتر الحالية.</td></tr>`;
        }

        tableBody.innerHTML = rowsHtml;
    } catch (e) {
        tableBody.innerHTML = `<tr><td colspan="8" style="padding: 30px; text-align: center; color: red;">حدث خطأ أثناء جلب الحسابات: ${e.message}</td></tr>`;
    }
}

window.toggleUserVIPStatus = async function(phone, currentStatus) {
    if (!AUTHORIZED_ADMIN_PHONES.includes(currentTeacherId)) return;
    let newStatus = currentStatus === "VIP_Active" ? "Free" : "VIP_Active";
    try {
        await db.collection("teachers").doc(phone).update({
            status: newStatus,
            lastUpdatedByAdmin: new Date()
        });
        showToast("تم تحديث حالة الحساب: " + phone);
        loadDashboardTableData();
    } catch (e) {
        alert("خطأ في التعديل: " + e.message);
    }
};

// ============================================================================
// 5. نظام عداد المحاولات المجانية وتوجيه الدفع
// ============================================================================
function checkAttempts() {
    let attempts = parseInt(localStorage.getItem('user_attempts') || 0);
    if (attempts >= 3) {
        alert("عفواً، انتهت محاولاتك المجانية في التلخيص. سيتم توجيهك لصفحة تسجيل الدخول.");
        showAuthScreen();
        return false;
    }
    return true;
}

function incrementAttempt() {
    let attempts = parseInt(localStorage.getItem('user_attempts') || 0) + 1;
    localStorage.setItem('user_attempts', attempts);
}

// ============================================================================
// 6. تحميل المستند وقاعدة بيانات المواد، وربط كافة عناصر الـ UI
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    createAuthScreen();

    const oldTeacherToggle = document.getElementById('teacher-mode');
    if (oldTeacherToggle) {
        oldTeacherToggle.addEventListener('click', (e) => {
            e.preventDefault(); 
            if (!isVIPLoggedIn) {
                showAuthScreen();
            }
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
        btn.style.padding = "10px 18px"; 
        btn.style.border = "1px solid var(--primary-color)";
        btn.style.borderRadius = "8px"; 
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
            let currentTrackPath = ui.mainStage.value;
            if (!currentTrackPath.includes('high_') && currentTrackPath !== 'diploma') currentTrackPath += '_';
            else if (currentTrackPath === 'diploma') currentTrackPath += '_';
            
            if (ui.mainStage.value.includes('high')) currentTrackPath = ui.mainStage.value + '_' + event.target.value;
            else currentTrackPath += event.target.value;
            
            let limit = (ui.mainStage.value === 'primary') ? 6 : 3;
            populateYears(1, limit, ui.mainStage.value.split('_')[0], currentTrackPath);
            
            showElement(ui.yearStageContainer);
        } else {
            hideAllChildSections(true);
        }
    });

    ui.yearStage.addEventListener('change', (event) => {
        if (event.target.value) { 
            populateSubjects(ui.yearStage.getAttribute('data-current-path')); 
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

    function populateYears(start, end, stageType, trackPath) {
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
        ui.yearStage.setAttribute('data-current-path', trackPath);
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

    const lessonUploadBox = document.getElementById('lesson-upload-box');
    const lessonImageInput = document.getElementById('lesson-image');
    
    lessonUploadBox.addEventListener('click', () => { 
        lessonImageInput.click(); 
    });

    lessonImageInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            if (event.target.files.length > 100) {
                alert("عفواً، أقصى عدد مسموح به هو 100 صورة في المرة الواحدة.");
                event.target.value = ""; 
                return;
            }

            for(let i = 0; i < event.target.files.length; i++) {
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
    // 7. إرسال الطلب للسيرفر والتلخيص (مع الشروط المطلوبة: نفس اللغة، معطيات الرياضيات،
    //    شرح وافي، أسئلة اختيار من متعدد، وأسئلة صح وخطأ مع ذكر الأسباب)
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

                    // إرسال تعليمات واضحة في الـ Payload لضمان تنفيذ كافة شروط الطالب
                    const serverPayload = {
                        action: 'analyze',
                        images_base64: imagesBase64List,
                        subject: subject,
                        year: yearText,
                        mime_type: 'image/jpeg',
                        output_language: 'same_as_source', // التلخيص بنفس لغة النص الأصلي حول العالم
                        detailed_answers: true,            // إجابات مفصلة وشاملة لامتحانات الثانوية
                        preserve_math_givens: true,        // الحفاظ على جميع معطيات وقوانين الرياضيات
                        include_mcq_with_reasons: true,    // أسئلة اختيار من متعدد مع ذكر الإجابة والسبب
                        include_tf_with_reasons: true      // أسئلة صح وخطأ مع ذكر الإجابة والسبب
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
    // 8. عرض المخرجات وتوليد ملف PDF شامل (أسئلة مقالية مفصلة + اختيار من متعدد + صح وخطأ مع الأسباب)
    // ============================================================================
    function showOutput(serverData, subjectName) {
        document.getElementById('ai-output-container').style.display = 'block';
        
        let creationDateObj = new Date(serverData.lastUpdated || Date.now());
        document.getElementById('ai-meta-info').innerHTML = '<i class="fas fa-cloud-download-alt"></i> تاريخ الإنشاء: ' + creationDateObj.toLocaleDateString('ar-EG') + ' | المادة: ' + (serverData.subjectTitle || subjectName);
        
        let resultHtml = '<div style="background: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 15px;">';
        resultHtml += '<h4 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #3b82f6; display: inline-block; padding-bottom: 5px;">إمبراطورية المعرفة - تحليل شامل لـ: ' + (serverData.grade || "") + ' - ' + subjectName + '</h4>';
        resultHtml += '<p style="color: #475569; line-height: 1.7; font-weight: bold;">تم تلخيص المحتوى واستخراج كافة الأسئلة (المقالية المفصلة، الاختيار من متعدد، والصح والخطأ مع ذكر أسباب الإجابة) بنفس لغة النص الأصلي.</p>';
        
        // عرض معاينة للأسئلة على الشاشة
        if (serverData.qa_data && serverData.qa_data.length > 0) {
            resultHtml += '<div style="margin-top: 20px;">';
            serverData.qa_data.forEach((item, index) => {
                let typeBadge = "";
                if (item.type === "MCQ") {
                    typeBadge = '<span style="background:#e0f2fe; color:#0369a1; padding:3px 10px; border-radius:5px; font-size:0.8rem; margin-right:8px;">اختيار من متعدد</span>';
                } else if (item.type === "TF") {
                    typeBadge = '<span style="background:#fef3c7; color:#b45309; padding:3px 10px; border-radius:5px; font-size:0.8rem; margin-right:8px;">صح أو خطأ</span>';
                } else {
                    typeBadge = '<span style="background:#d1fae5; color:#065f46; padding:3px 10px; border-radius:5px; font-size:0.8rem; margin-right:8px;">سؤال مقالي مفصل</span>';
                }

                resultHtml += `<div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-right: 4px solid #3b82f6; margin-bottom: 15px;">`;
                resultHtml += `<p style="color: #0f172a; margin: 0 0 8px 0; font-weight: bold; font-size: 1.05rem;">س ${index + 1}: ${item.q} ${typeBadge}</p>`;
                
                if (item.options && Array.isArray(item.options) && item.options.length > 0) {
                    resultHtml += `<div style="margin: 8px 0; padding: 8px 12px; background: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0;">`;
                    item.options.forEach((opt, idx) => {
                        resultHtml += `<div style="margin-bottom: 4px; color: #334155;">- ${opt}</div>`;
                    });
                    resultHtml += `</div>`;
                }

                resultHtml += `<p style="margin: 8px 0 0 0; line-height: 1.8; color: #059669; font-weight: bold;">الإجابة الصحيحة:</p>`;
                resultHtml += `<div style="color: #1e293b; line-height: 1.8; margin-top: 4px;">${item.a.replace(/\n/g, '<br>')}</div>`;
                
                if (item.reason) {
                    resultHtml += `<p style="margin: 8px 0 0 0; color: #b45309; font-weight: bold;">السبب والتفسير الوافي:</p>`;
                    resultHtml += `<div style="color: #475569; line-height: 1.8; margin-top: 4px;">${item.reason.replace(/\n/g, '<br>')}</div>`;
                }
                
                resultHtml += `</div>`;
            });
            resultHtml += '</div>';
        }

        resultHtml += '<button id="real-download-btn" class="download-pdf-btn"><i class="fas fa-file-pdf"></i> تحميل التلخيص والأسئلة كملف PDF احترافي</button></div>';
        
        document.getElementById('ai-response-text').innerHTML = resultHtml;
        globalLessonContext = JSON.stringify(serverData.qa_data);
        
        document.getElementById('real-download-btn').addEventListener('click', () => { 
            generateRealPDF(serverData, subjectName); 
        });
        
        document.getElementById('ai-output-container').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function generateRealPDF(serverData, subjectName) {
        const btn = document.getElementById('real-download-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري بناء ملف الـ PDF...';
        
        let qaHtml = '';
        let questionCount = 0;
        
        serverData.qa_data.forEach((item, index) => {
            questionCount++;
            let typeTitle = "";
            if (item.type === "MCQ") typeTitle = " (سؤال اختيار من متعدد)";
            else if (item.type === "TF") typeTitle = " (سؤال صح أو خطأ)";
            else typeTitle = " (سؤال إجابة مفصلة)";

            qaHtml += '<div style="margin-bottom: 18px; background: #f8fafc; padding: 14px; border-radius: 8px; border-right: 4px solid #10b981; direction: rtl; text-align: right;">';
            qaHtml += '<p style="color: #059669; margin: 0 0 8px 0; font-size: 15px;"><strong>س ' + questionCount + ': ' + item.q + typeTitle + '</strong></p>';
            
            if (item.options && Array.isArray(item.options) && item.options.length > 0) {
                qaHtml += '<div style="margin: 8px 0; padding: 8px; background: #ffffff; border-radius: 6px; border: 1px solid #cbd5e1;">';
                item.options.forEach((opt) => {
                    qaHtml += '<div style="margin-bottom: 4px; color: #1e293b; font-size: 13px;">• ' + opt + '</div>';
                });
                qaHtml += '</div>';
            }

            qaHtml += '<p style="margin: 0; line-height: 1.8; font-size: 13px;"><strong>الإجابة الصحيحة:</strong><br>' + item.a.replace(/\n/g, '<br>') + '</p>';
            
            if (item.reason) {
                qaHtml += '<p style="margin: 8px 0 0 0; line-height: 1.8; font-size: 13px; color: #b45309;"><strong>سبب اختيار الإجابة / الشرح الوافي:</strong><br>' + item.reason.replace(/\n/g, '<br>') + '</p>';
            }
            
            qaHtml += '</div>';
        });

        document.getElementById('pdf-qa-content').innerHTML = qaHtml;
        document.getElementById('pdf-header-title').innerText = 'ملف إمبراطورية المعرفة | ' + (serverData.subjectTitle || subjectName) + ' | ' + (serverData.grade || "");
        
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
            filename: 'Knowledge_Empire_' + (serverData.subjectTitle || subjectName).replace(/\s+/g, '_') + '_' + Date.now() + '.pdf',
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
                    btn.innerHTML = '<i class="fas fa-file-pdf"></i> تحميل التلخيص والأسئلة كملف PDF احترافي'; 
                }, 3000);
            }).catch(() => {
                elementToPrint.style.display = 'none';
                window.scrollTo(0, originalScrollY);
                btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> حدث خطأ';
            });
        }, 500);
    }

    // ============================================================================
    // 9. أداة تسجيل أسلوب المعلم (بصمة الشرح المعتمدة)
    // ============================================================================
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'ar-EG'; 
        recognition.continuous = false;
        recognition.interimResults = false;
    }

    window.startTeacherRecordingAction = function() {
        if (!isVIPLoggedIn) {
            showAuthScreen();
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
            }
        };

        recognition.onerror = () => {
            if (isTeacherRecording) {
                isTeacherRecording = false;
                const btn = document.getElementById('btn-dyn-record');
                if (btn) btn.innerHTML = '<i class="fas fa-microphone-alt"></i> أداة تسجيل أسلوب المعلم'; 
            }
        };

        recognition.onend = () => {
            if (isTeacherRecording) {
                isTeacherRecording = false;
                const btn = document.getElementById('btn-dyn-record');
                if (btn) btn.innerHTML = '<i class="fas fa-microphone-alt"></i> أداة تسجيل أسلوب المعلم'; 
            }
        };
    }

}); // نهاية المستند
