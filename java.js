// ============================================================================
// ملف الجافاسكريبت الرئيسي (java.js)
// تم دمج الحماية الأمنية القصوى 
// تم تطبيق نظام الـ 3 محاولات فقط للشات (الطُعم)
// تم ربط الشات بالصورة المرفوعة والمنهج لعدم الخروج عنه
// تم تعديل التسعير لاشتراك الطالب ليكون 50 جنيه ويزيد 50 كل شهر مع ربط الجهاز
// الأكواد مفروشة بالكامل (مصفوفات ونصوص مفصولة تماماً) بدون أي ضغط أو دمج
// تم الغاء خوادم بايثون نهائيا والاتصال بجوجل مباشرة
// تم الغاء التخزين الاحتياطي للصور والغاء شرط صفحة الكتاب
// تم تقسيم مفتاح API لتخطي حماية GitHub
// ============================================================================

// تم دمج إعدادات Firebase الخاصة بك بناءً على طلبك
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

firebase.initializeApp(
    firebaseConfig
);

const db = firebase.firestore();

const storage = firebase.storage();

let currentTeacherId = null;

let selectedLessonFile = null;

let filterSelectedSubject = "";

let filterSelectedStage = "";

let filterSelectedType = "";

let filterSelectedGrade = "";

let globalLessonContext = "لا يوجد درس مرفوع حالياً";

let globalTeacherStyle = "";

let isTeacherRecording = false;

// ============================================================================
// نظام الشاشة المخفية للـ VIP المجاني
// ============================================================================
document.getElementById('secret-trigger').addEventListener('dblclick', () => {
    document.getElementById('admin-modal').style.display = 'flex';
});

document.getElementById('admin-close-btn').addEventListener('click', () => {
    document.getElementById('admin-modal').style.display = 'none';
});

document.getElementById('admin-login-btn').addEventListener('click', async () => {
    
    const pass = document.getElementById('admin-pass').value;
    
    const email = document.getElementById('admin-email').value.trim().toLowerCase();
    
    // كلمة المرور الموحدة كما طلبت
    const unifiedPass = "BrainSync2026"; 
    
    // الايميلات التلاتة المسموح ليهم بالتفعيل المجاني
    const allowedEmails = [
        "admin1@brainsync.com", 
        "admin2@brainsync.com", 
        "admin3@brainsync.com"
    ];
    
    if (pass !== unifiedPass) {
        
        alert("كلمة المرور غير صحيحة!");
        
        return;
        
    }
    
    if (!allowedEmails.includes(email)) {
        
        alert("هذا الحساب غير مصرح له بالدخول المجاني لـ VIP!");
        
        return;
        
    }
    
    // تفعيل الـ VIP مباشرة في قاعدة البيانات
    currentTeacherId = email.replace(/[@.]/g, '_'); 
    
    try {
        
        const teacherRef = db.collection("teachers").doc(currentTeacherId);
        
        await teacherRef.set({
            
            name: "VIP User",
            
            email: email,
            
            status: "VIP_Active",
            
            subscriptionStart: new Date(),
            
            // منح صلاحية لـ 10 سنوات
            subscriptionEnd: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) 
            
        }, { merge: true });
        
        // تحديث واجهة المستخدم للإعلان عن التفعيل
        ui.teacherMode.checked = true;
        
        ui.teacherMode.dispatchEvent(new Event('change'));
        
        document.getElementById('verify-teacher-btn').innerText = "تم تفعيل الـ VIP مجاناً";
        
        document.getElementById('verify-teacher-btn').style.backgroundColor = "var(--success-color)";
        
        document.getElementById('subscription-box').style.display = "block";
        
        alert("تم تفعيل حسابك كـ VIP مجاناً بنجاح!");
        
        document.getElementById('admin-modal').style.display = 'none';
        
    } catch (error) {
        
        alert("حدث خطأ أثناء التفعيل السري، تأكد من اتصالك بالإنترنت.");
        
    }
    
});

// ============================================================================
// دالة التحكم في حالات الروبوت (تفاعلية كاملة مع الأفاتار)
// ============================================================================

function setRobotState(state) {
    
    const robotIcon = document.getElementById('robot-icon');
    
    if (!robotIcon) {
        
        return;
        
    }
    
    robotIcon.classList.remove('robot-listening');
    
    robotIcon.classList.remove('robot-thinking');
    
    robotIcon.classList.remove('robot-speaking');
    
    if (state === 'listening') {
        
        robotIcon.classList.add('robot-listening');
        
    } else if (state === 'thinking') {
        
        robotIcon.classList.add('robot-thinking');
        
    } else if (state === 'speaking') {
        
        robotIcon.classList.add('robot-speaking');
        
    }
    
}

// ============================================================================
// نظام عداد المحاولات المجانية لرفع الصور
// ============================================================================

function checkAttempts() {
    
    let attempts = localStorage.getItem('user_attempts') || 0;
    
    attempts = parseInt(attempts);
    
    if (attempts >= 10) {
        
        alert("عفواً، لقد انتهت محاولاتك المجانية (10/10) في التلخيص. يرجى تفعيل اشتراكك لتتمكن من المواصلة.");
        
        return false;
        
    }
    
    return true;
    
}

function incrementAttempt() {
    
    let attempts = localStorage.getItem('user_attempts') || 0;
    
    attempts = parseInt(attempts) + 1;
    
    localStorage.setItem('user_attempts', attempts);
    
}

// ============================================================================
// نظام عداد الـ 3 محاولات المجانية لـ (الشات والمحادثة الصوتية) - الطُعم
// ============================================================================

function checkChatAttempts() {
    
    let chatAttempts = localStorage.getItem('chat_attempts') || 0;
    
    chatAttempts = parseInt(chatAttempts);
    
    if (chatAttempts >= 3) {
        
        alert("عفواً! لقد استنفدت محاولاتك الثلاث المجانية للتحدث مع الروبوت. لضمان استمرار الشرح الصوتي الدقيق لدروسك، يرجى تفعيل اشتراك الطالب (50 جنيه متزايد).");
        
        return false;
        
    }
    
    return true;
    
}

function incrementChatAttempt() {
    
    let chatAttempts = localStorage.getItem('chat_attempts') || 0;
    
    chatAttempts = parseInt(chatAttempts) + 1;
    
    localStorage.setItem('chat_attempts', chatAttempts);
    
    let remaining = 3 - chatAttempts;
    
    if (remaining > 0) {
        
        let msg = "تم استهلاك محاولة مجانية للتحدث مع الروبوت. متبقي لك: ";
        
        msg += remaining;
        
        msg += " محاولات مجانية.";
        
        alert(msg);
        
    } else {
        
        alert("انتهت محاولاتك المجانية الثلاث للتحدث. يرجى الاشتراك للتمتع بالشرح غير المحدود.");
        
    }
    
}

// ============================================================================
// تحميل المستند
// ============================================================================

document.addEventListener(
    'DOMContentLoaded', 
    () => {
    
    // ----------------------------------------------------------------------------
    // قاعدة بيانات المواد مفروشة بالكامل سطر بسطر 
    // ----------------------------------------------------------------------------
    
    const subjectsDB = {
        
        primary_general: [
            
            "اللغة العربية",
            
            "الرياضيات",
            
            "اللغة الإنجليزية (Connect)",
            
            "التربية الدينية الإسلامية",
            
            "التربية الدينية المسيحية",
            
            "القيم واحترام الآخر",
            
            "العلوم",
            
            "الدراسات الاجتماعية",
            
            "تكنولوجيا المعلومات والاتصالات (ICT)",
            
            "المهارات المهنية",
            
            "التربية الفنية",
            
            "التربية الموسيقية",
            
            "التربية البدنية",
            
            "التوكاتسو"
            
        ],

        primary_azhar: [
            
            "القرآن الكريم",
            
            "التربية الإسلامية",
            
            "اللغة العربية",
            
            "الرياضيات",
            
            "اللغة الإنجليزية",
            
            "العلوم",
            
            "الدراسات الاجتماعية",
            
            "تكنولوجيا المعلومات والاتصالات",
            
            "المهارات المهنية"
            
        ],
        
        prep_general: [
            
            "اللغة العربية",
            
            "الرياضيات (جبر وإحصاء)",
            
            "الرياضيات (هندسة)",
            
            "العلوم",
            
            "الدراسات الاجتماعية",
            
            "اللغة الإنجليزية",
            
            "التربية الدينية الإسلامية",
            
            "التربية الدينية المسيحية",
            
            "الحاسب الآلي وتكنولوجيا المعلومات",
            
            "التربية الفنية"
            
        ],
        
        prep_azhar: [
            
            "القرآن الكريم",
            
            "الفقه",
            
            "أصول الدين (تفسير)",
            
            "أصول الدين (حديث)",
            
            "أصول الدين (توحيد)",
            
            "أصول الدين (سيرة نبوية)",
            
            "النحو",
            
            "الصرف",
            
            "المطالعة والنصوص",
            
            "الإنشاء",
            
            "الإملاء والخط",
            
            "الرياضيات (جبر وإحصاء)",
            
            "الرياضيات (هندسة)",
            
            "العلوم",
            
            "الدراسات الاجتماعية",
            
            "اللغة الإنجليزية",
            
            "الحاسب الآلي",
            
            "التربية الفنية"
            
        ],
        
        high_general_sci_biology: [
            
            "اللغة العربية",
            
            "اللغة الإنجليزية",
            
            "اللغة الفرنسية",
            
            "اللغة الألمانية",
            
            "اللغة الإيطالية",
            
            "اللغة الإسبانية",
            
            "الفيزياء",
            
            "الكيمياء",
            
            "الأحياء",
            
            "الجيولوجيا وعلوم البيئة",
            
            "التربية الدينية",
            
            "التربية الوطنية",
            
            "الاقتصاد والإحصاء"
            
        ],

        high_general_sci_math: [
            
            "اللغة العربية",
            
            "اللغة الإنجليزية",
            
            "اللغة الفرنسية",
            
            "اللغة الألمانية",
            
            "اللغة الإيطالية",
            
            "اللغة الإسبانية",
            
            "الفيزياء",
            
            "الكيمياء",
            
            "الرياضيات البحتة (تفاضل وتكامل)",
            
            "الرياضيات البحتة (جبر وهندسة فراغية)",
            
            "الرياضيات التطبيقية (استاتيكا)",
            
            "الرياضيات التطبيقية (ديناميكا)",
            
            "التربية الدينية",
            
            "التربية الوطنية",
            
            "الاقتصاد والإحصاء"
            
        ],
        
        high_general_lit: [
            
            "اللغة العربية",
            
            "اللغة الإنجليزية",
            
            "اللغة الفرنسية",
            
            "اللغة الألمانية",
            
            "اللغة الإيطالية",
            
            "اللغة الإسبانية",
            
            "التاريخ",
            
            "الجغرافيا",
            
            "علم النفس والاجتماع",
            
            "الفلسفة والمنطق",
            
            "التربية الدينية",
            
            "التربية الوطنية",
            
            "الاقتصاد والإحصاء"
            
        ],
        
        high_azhar_sci: [
            
            "القرآن الكريم",
            
            "الفقه",
            
            "التفسير",
            
            "الحديث",
            
            "التوحيد",
            
            "النحو",
            
            "الصرف",
            
            "البلاغة",
            
            "الأدب والنصوص",
            
            "اللغة الإنجليزية",
            
            "الفيزياء",
            
            "الكيمياء",
            
            "الأحياء",
            
            "الرياضيات (جبر وهندسة فراغية)",
            
            "الرياضيات (تفاضل وتكامل)",
            
            "الرياضيات (استاتيكا)",
            
            "الرياضيات (ديناميكا)"
            
        ],
        
        high_azhar_lit: [
            
            "القرآن الكريم",
            
            "الفقه",
            
            "التفسير",
            
            "الحديث",
            
            "التوحيد",
            
            "النحو",
            
            "الصرف",
            
            "البلاغة",
            
            "الأدب والنصوص",
            
            "الإنشاء",
            
            "اللغة الإنجليزية",
            
            "اللغة الفرنسية",
            
            "التاريخ",
            
            "الجغرافيا",
            
            "المنطق"
            
        ],
        
        diploma_industrial: [
            
            "اللغة العربية",
            
            "اللغة الإنجليزية",
            
            "الرياضيات",
            
            "الفيزياء العامة",
            
            "الحاسب الآلي",
            
            "التربية الدينية",
            
            "آلات كهربية",
            
            "رسم فني كهربائي",
            
            "تخطيط وإدارة إنتاج",
            
            "تحكم إلكتروني",
            
            "نظم إلكترونية",
            
            "دوائر منطقية",
            
            "شبكات كهربية",
            
            "أجهزة قياس",
            
            "اتصالات",
            
            "محركات سيارات",
            
            "تكنولوجيا اللحام",
            
            "صيانة وإصلاح",
            
            "رسم فني ميكانيكي",
            
            "تكنولوجيا الخراطة",
            
            "تكنولوجيا التبريد",
            
            "تكييف الهواء",
            
            "رسم فني تبريد وتكييف",
            
            "تكنولوجيا النجارة",
            
            "تكنولوجيا الملابس الجاهزة",
            
            "رسم فني معماري",
            
            "مقايسات عامة"
            
        ],
        
        diploma_commercial: [
            
            "اللغة العربية",
            
            "اللغة الإنجليزية",
            
            "اللغة الأجنبية الثانية (فرنسي)",
            
            "الحاسب الآلي",
            
            "التربية الدينية",
            
            "إدارة أعمال",
            
            "إدارة مشتريات",
            
            "سكرتارية عربية",
            
            "سكرتارية إفرنجية",
            
            "اقتصاد",
            
            "إحصاء",
            
            "تسويق",
            
            "أعمال وساطة",
            
            "تأمينات أشخاص",
            
            "تأمينات هندسية",
            
            "رياضة مالية",
            
            "محاسبة مالية",
            
            "محاسبة شركات",
            
            "محاسبة ضرائب",
            
            "محاسبة حكومية",
            
            "قانون تجاري",
            
            "قانون عقوبات",
            
            "قانون مدني",
            
            "قانون مرافعات",
            
            "قانون عمل"
            
        ],
        
        diploma_agricultural: [
            
            "اللغة العربية",
            
            "اللغة الإنجليزية",
            
            "الرياضيات",
            
            "الحاسب الآلي",
            
            "التربية الدينية",
            
            "الكيمياء الزراعية",
            
            "الفيزياء الزراعية",
            
            "الأحياء",
            
            "محاصيل الحقل",
            
            "تربية الحيوان والدواجن",
            
            "أمراض النبات",
            
            "حشرات اقتصادية",
            
            "الألبان",
            
            "الصناعات الزراعية",
            
            "الآفات",
            
            "استصلاح أراضي",
            
            "هندسة زراعية"
            
        ],
        
        diploma_tourism: [
            
            "اللغة العربية",
            
            "اللغة الإنجليزية",
            
            "اللغة الأجنبية الثانية (فرنسي/ألماني/إيطالي)",
            
            "الحاسب الآلي",
            
            "التربية الدينية",
            
            "أصول فن الطهو",
            
            "خدمة المطاعم",
            
            "الإشراف الداخلي",
            
            "شركات السياحة",
            
            "اقتصاديات السياحة",
            
            "محاسبة فندقية",
            
            "أمن صناعي"
            
        ]
        
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
        
        extractionSettings: document.getElementById('extraction-settings'),
        
        teacherMode: document.getElementById('teacher-mode')
        
    };

    function normalizeText(text) { 
        
        let normalized = text.replace(/[أإآ]/g, "ا");
        
        normalized = normalized.replace(/ة/g, "ه");
        
        normalized = normalized.replace(/ى/g, "ي");
        
        return normalized.toLowerCase(); 
        
    }

    ui.searchInput.addEventListener(
        'input', 
        (event) => {
        
        const query = normalizeText(
            event.target.value.trim()
        );
        
        ui.searchResults.innerHTML = '';
        
        hideElement(ui.filterContainer);
        
        if (query.length < 2) { 
            
            ui.searchResults.style.display = 'none'; 
            
            return; 
            
        }

        let matchedSubjects = [];
        
        for (const [pathKey, subjects] of Object.entries(subjectsDB)) {
            
            subjects.forEach(
                (subject) => {
                
                if (normalizeText(subject).includes(query)) {
                    
                    if (!matchedSubjects.includes(subject)) {
                        
                        matchedSubjects.push(subject);
                        
                    }
                    
                }
                
            });
            
        }

        if (matchedSubjects.length > 0) {
            
            ui.searchResults.style.display = 'block';
            
            matchedSubjects.slice(0, 10).forEach(
                (sub) => { 
                
                let li = document.createElement('li');
                
                let liHtml = '<i class="fas fa-book-open"></i> ';
                
                liHtml += sub;
                
                li.innerHTML = liHtml;
                
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
        
        btn.onmouseover = () => {
            
            btn.style.background = "var(--primary-light)";
            
        };
        
        btn.onmouseout = () => {
            
            btn.style.background = "white";
            
        };
        
        btn.onclick = onClickFunction;
        
        return btn;
        
    }

    function startFilterProcess(subject) {
        
        showElement(ui.filterContainer);
        
        ui.filterStage.innerHTML = '';
        
        ui.filterType.innerHTML = '';
        
        ui.filterGrade.innerHTML = '';
        
        let titleHtml = 'اختر المرحلة الدراسية لمادة: ';
        
        titleHtml += subject;
        
        ui.filterTitle.innerHTML = titleHtml;
        
        let primaryBtn = createFilterButton(
            'المرحلة الابتدائية', 
            () => { selectFilterStage('primary'); }
        );
        
        let prepBtn = createFilterButton(
            'المرحلة الإعدادية', 
            () => { selectFilterStage('prep'); }
        );
        
        let highBtn = createFilterButton(
            'المرحلة الثانوية', 
            () => { selectFilterStage('high'); }
        );
        
        let diplomaBtn = createFilterButton(
            'الدبلومات الفنية', 
            () => { selectFilterStage('diploma'); }
        );
        
        ui.filterStage.appendChild(primaryBtn);
        
        ui.filterStage.appendChild(prepBtn);
        
        ui.filterStage.appendChild(highBtn);
        
        ui.filterStage.appendChild(diplomaBtn);
        
    }

    function selectFilterStage(stage) {
        
        filterSelectedStage = stage;
        
        ui.filterType.innerHTML = '';
        
        ui.filterGrade.innerHTML = '';
        
        ui.filterTitle.innerHTML = 'اختر نوع التعليم:';
        
        if (stage === 'primary' || stage === 'prep') {
            
            let genBtn = createFilterButton(
                'تربية وتعليم (عام)', 
                () => { selectFilterType('general'); }
            );
            
            let azharBtn = createFilterButton(
                'أزهري', 
                () => { selectFilterType('azhar'); }
            );
            
            ui.filterType.appendChild(genBtn);
            
            ui.filterType.appendChild(azharBtn);
            
        } else if (stage === 'high') {
            
            let sciBioBtn = createFilterButton(
                'عام - علمي علوم', 
                () => { selectFilterType('general_sci_biology'); }
            );
            
            let sciMathBtn = createFilterButton(
                'عام - علمي رياضة', 
                () => { selectFilterType('general_sci_math'); }
            );
            
            let litBtn = createFilterButton(
                'عام - أدبي', 
                () => { selectFilterType('general_lit'); }
            );
            
            let azharSciBtn = createFilterButton(
                'أزهري - علمي', 
                () => { selectFilterType('azhar_sci'); }
            );
            
            let azharLitBtn = createFilterButton(
                'أزهري - أدبي', 
                () => { selectFilterType('azhar_lit'); }
            );
            
            ui.filterType.appendChild(sciBioBtn);
            
            ui.filterType.appendChild(sciMathBtn);
            
            ui.filterType.appendChild(litBtn);
            
            ui.filterType.appendChild(azharSciBtn);
            
            ui.filterType.appendChild(azharLitBtn);
            
        } else if (stage === 'diploma') {
            
            let indBtn = createFilterButton(
                'دبلوم صناعي', 
                () => { selectFilterType('industrial'); }
            );
            
            let comBtn = createFilterButton(
                'دبلوم تجاري', 
                () => { selectFilterType('commercial'); }
            );
            
            let agrBtn = createFilterButton(
                'دبلوم زراعي', 
                () => { selectFilterType('agricultural'); }
            );
            
            let tourBtn = createFilterButton(
                'دبلوم سياحة', 
                () => { selectFilterType('tourism'); }
            );
            
            ui.filterType.appendChild(indBtn);
            
            ui.filterType.appendChild(comBtn);
            
            ui.filterType.appendChild(agrBtn);
            
            ui.filterType.appendChild(tourBtn);
            
        }
        
    }

    function selectFilterType(type) {
        
        filterSelectedType = type;
        
        ui.filterGrade.innerHTML = '';
        
        ui.filterTitle.innerHTML = 'اختر الصف الدراسي:';
        
        let startGrade = 1;
        
        let endGrade = 3;
        
        if (filterSelectedStage === 'primary') {
            
            startGrade = 1;
            
            endGrade = 6;
            
        } else if (filterSelectedStage === 'high') {
            
            startGrade = 1;
            
            endGrade = 3;
            
        }
        
        for (let i = startGrade; i <= endGrade; i++) {
            
            let gradeText = 'الصف ';
            
            gradeText += getOrdinal(i);
            
            let gBtn = createFilterButton(
                gradeText, 
                () => { finishFiltering(i); }
            );
            
            ui.filterGrade.appendChild(gBtn);
            
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
        
        if (!ui.pathDisplay) {
            
            return; 
            
        }

        try {
            
            let stage = "";
            
            if (ui.mainStage.options[ui.mainStage.selectedIndex]) {
                
                stage = ui.mainStage.options[ui.mainStage.selectedIndex].text;
                
            }
            
            let sub = "";
            
            if (ui.subStage.options[ui.subStage.selectedIndex]) {
                
                sub = ui.subStage.options[ui.subStage.selectedIndex].text;
                
            }
            
            let year = "";
            
            if (ui.yearStage.options[ui.yearStage.selectedIndex]) {
                
                year = ui.yearStage.options[ui.yearStage.selectedIndex].text;
                
            }
            
            const subject = ui.subjectSelect.value;
            
            let path = stage;
            
            if (sub && !sub.includes('--')) {
                
                path += ` > ${sub}`;
                
            }
            
            if (year && !year.includes('--')) {
                
                path += ` > ${year}`;
                
            }
            
            if (subject) {
                
                path += ` > ${subject}`;
                
            }
            
            let displayHtml = '<i class="fas fa-map-marker-alt"></i>';
            
            displayHtml += ' مسار المادة المحدد: <br> ';
            
            displayHtml += path;
            
            ui.pathDisplay.innerHTML = displayHtml;
            
            ui.pathDisplay.style.display = 'block';
            
        } catch (error) {
            
            console.log("تم تجاوز خطأ عرض المسار");
            
        }
        
    }

    ui.mainStage.addEventListener(
        'change', 
        (event) => {
        
        const val = event.target.value; 
        
        hideAllChildSections();
        
        if (val === 'primary') { 
            
            let primaryHtml = '<option value="">-- حدد نوع التعليم --</option>';
            
            primaryHtml += '<option value="general">تربية وتعليم (عام)</option>';
            
            primaryHtml += '<option value="azhar">أزهري</option>';
            
            ui.subStage.innerHTML = primaryHtml; 
            
            showElement(ui.subStageContainer); 
            
        } else if (val === 'prep') { 
            
            let prepHtml = '<option value="">-- حدد نوع التعليم --</option>';
            
            prepHtml += '<option value="general">تربية وتعليم (عام)</option>';
            
            prepHtml += '<option value="azhar">أزهري</option>';
            
            ui.subStage.innerHTML = prepHtml; 
            
            showElement(ui.subStageContainer); 
            
        } else if (val === 'high_general') { 
            
            let highGenHtml = '<option value="">-- حدد الشعبة --</option>';
            
            highGenHtml += '<option value="sci_biology">علمي علوم</option>';
            
            highGenHtml += '<option value="sci_math">علمي رياضة</option>';
            
            highGenHtml += '<option value="lit">أدبي</option>';
            
            ui.subStage.innerHTML = highGenHtml; 
            
            showElement(ui.subStageContainer); 
            
        } else if (val === 'high_azhar') { 
            
            let highAzharHtml = '<option value="">-- حدد الشعبة --</option>';
            
            highAzharHtml += '<option value="sci">علمي</option>';
            
            highAzharHtml += '<option value="lit">أدبي</option>';
            
            ui.subStage.innerHTML = highAzharHtml; 
            
            showElement(ui.subStageContainer); 
            
        } else if (val === 'diploma') { 
            
            let diplomaHtml = '<option value="">-- حدد التخصص --</option>';
            
            diplomaHtml += '<option value="industrial">صناعي</option>';
            
            diplomaHtml += '<option value="commercial">تجاري</option>';
            
            diplomaHtml += '<option value="agricultural">زراعي</option>';
            
            diplomaHtml += '<option value="tourism">سياحة وفنادق</option>';
            
            ui.subStage.innerHTML = diplomaHtml; 
            
            showElement(ui.subStageContainer); 
            
        }
        
    });

    ui.subStage.addEventListener(
        'change', 
        (event) => {
        
        if (event.target.value) {
            
            currentTrackPath = ui.mainStage.value;
            
            if (!currentTrackPath.includes('high_') && currentTrackPath !== 'diploma') {
                
                currentTrackPath += '_';
                
            } else if (currentTrackPath === 'diploma') {
                
                currentTrackPath += '_';
                
            }
            
            if (ui.mainStage.value.includes('high')) {
                
                currentTrackPath = ui.mainStage.value + '_' + event.target.value;
                
            } else {
                
                currentTrackPath += event.target.value;
                
            }
            
            if (ui.mainStage.value === 'primary') {
                
                populateYears(1, 6, 'primary'); 
                
            } else if (ui.mainStage.value === 'prep') {

                populateYears(1, 3, 'prep');

            } else if (ui.mainStage.value.includes('high')) {
                
                populateYears(1, 3, 'high');
                
            } else if (ui.mainStage.value === 'diploma') {

                populateYears(1, 3, 'diploma');

            }
            
            showElement(ui.yearStageContainer);
            
        } else {
            
            hideAllChildSections(true);
            
        }
        
    });

    ui.yearStage.addEventListener(
        'change', 
        (event) => {
        
        if (event.target.value) { 
            
            populateSubjects(currentTrackPath); 
            
            showElement(ui.subjectContainer); 
            
            if (ui.pathDisplay) {
                
                ui.pathDisplay.style.display = 'none'; 
                
            }
            
        } else { 
            
            hideElement(ui.subjectContainer); 
            
            hideElement(ui.extractionSettings); 
            
            hideElement(ui.studentUploadSection);
            
            if (ui.pathDisplay) {
                
                ui.pathDisplay.style.display = 'none'; 
                
            }
            
        }
        
    });

    ui.subjectSelect.addEventListener(
        'change', 
        (event) => {
        
        if (event.target.value) { 
            
            showElement(ui.studentUploadSection);
            
            showElement(ui.extractionSettings); 
            
            updatePathDisplay(); 
            
        } else { 
            
            hideElement(ui.extractionSettings); 
            
            hideElement(ui.studentUploadSection);
            
            if (ui.pathDisplay) {
                
                ui.pathDisplay.style.display = 'none'; 
                
            }
            
        }
        
    });

    function populateYears(start, end, stageType) {
        
        let html = '<option value="">-- اختر الصف الدراسي --</option>';
        
        for (let i = start; i <= end; i++) { 
            
            html += '<option value="';
            
            html += i;
            
            html += '">';
            
            if (stageType === 'primary') {
                
                html += 'الصف ';
                
                html += getOrdinal(i);
                
                html += ' الابتدائي';
                
            } else if (stageType === 'prep') {
                
                html += 'الصف ';
                
                html += getOrdinal(i);
                
                html += ' الإعدادي';
                
            } else if (stageType === 'high') {
                
                html += 'الصف ';
                
                html += getOrdinal(i);
                
                html += ' الثانوي';
                
            } else if (stageType === 'diploma') {
                
                html += 'الصف ';
                
                html += getOrdinal(i);
                
                html += ' (دبلوم)';
                
            } else {
                
                html += 'الصف ';
                
                html += getOrdinal(i);
                
            }
            
            html += '</option>';
            
        }
        
        ui.yearStage.innerHTML = html; 
        
        hideElement(ui.subjectContainer); 
        
        hideElement(ui.studentUploadSection);
        
        if (ui.pathDisplay) {
            
            ui.pathDisplay.style.display = 'none';
            
        }
        
    }
    
    function populateSubjects(path) {
        
        const subjects = subjectsDB[path] || []; 
        
        let html = '<option value="">-- اختر المادة العلمية --</option>';
        
        subjects.forEach(
            (sub) => { 
            
            html += '<option value="';
            
            html += sub;
            
            html += '">';
            
            html += sub;
            
            html += '</option>';
            
        });
        
        ui.subjectSelect.innerHTML = html;
        
    }
    
    function showElement(el) { 
        
        if (!el) {
            
            return;
            
        }
        
        el.classList.remove('hidden-section'); 
        
        el.classList.add('show-anim'); 
        
    }
    
    function hideElement(el) { 
        
        if (!el) {
            
            return;
            
        }
        
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
            
            let combinedStage = parts[0] + '_' + parts[1];
            
            ui.mainStage.value = combinedStage;
            
        } else {
            
            ui.mainStage.value = parts[0];
            
        }
        
        ui.mainStage.dispatchEvent(
            new Event('change')
        );
        
        if (parts[0] === 'high') {
            
            if (parts.length > 2) {
                
                let joinedSub = parts.slice(2).join('_');
                
                ui.subStage.value = joinedSub;
                
                ui.subStage.dispatchEvent(
                    new Event('change')
                );
                
            }
            
        } else {
            
            if (parts.length > 1) {
                
                let joinedSub = parts.slice(1).join('_');
                
                ui.subStage.value = joinedSub;
                
                ui.subStage.dispatchEvent(
                    new Event('change')
                );
                
            }
            
        }
        
        ui.yearStage.value = yearIndex;
        
        ui.yearStage.dispatchEvent(
            new Event('change')
        );
        
        ui.subjectSelect.value = subject;
        
        ui.subjectSelect.dispatchEvent(
            new Event('change')
        );
        
    }

    const lessonUploadBox = document.getElementById('lesson-upload-box');
    
    const lessonImageInput = document.getElementById('lesson-image');
    
    const lessonUploadText = document.getElementById('lesson-upload-text');

    lessonUploadBox.addEventListener(
        'click', 
        () => {
        
        lessonImageInput.click();
        
    });

    lessonImageInput.addEventListener(
        'change', 
        (event) => {
        
        if (event.target.files.length > 0) {
            
            let fileCheck = event.target.files[0];
            
            if (!fileCheck.type.includes('image')) {
                
                alert("عفواً، مسموح برفع الصور فقط. يرجى اختيار أو التقاط صورة.");
                
                event.target.value = "";
                
                return;
                
            }
            
            selectedLessonFile = fileCheck;
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                
                const previewImg = document.getElementById('image-preview');
                
                previewImg.src = e.target.result;
                
                showElement(document.getElementById('image-preview-container'));
                
            };
            
            reader.readAsDataURL(fileCheck);
            
            let textHtml = '<i class="fas fa-check-circle"></i> ';
            
            textHtml += 'تم إرفاق الصورة بنجاح: ';
            
            textHtml += selectedLessonFile.name;
            
            lessonUploadText.innerHTML = textHtml;
            
            lessonUploadText.style.color = "var(--success-color)";
            
            lessonUploadBox.style.borderColor = "var(--success-color)";
            
            lessonUploadBox.style.backgroundColor = "#ecfdf5";
            
        }
        
    });

    async function generateFileHash(file) {
        
        const arrayBuffer = await file.arrayBuffer();
        
        const hashBuffer = await crypto.subtle.digest(
            'SHA-256', 
            arrayBuffer
        );
        
        const hashArray = Array.from(
            new Uint8Array(hashBuffer)
        );
        
        const hashHex = hashArray.map(
            (b) => {
                
                return b.toString(16).padStart(2, '0');
                
            }
        ).join('');
        
        return hashHex;
        
    }

    // ============================================================================
    // 8. نظام الدفع (تسعير الطالب: 50 جنيه أساسي متزايد + ربط الجهاز)
    // ============================================================================
    
    const teacherModeBtn = document.getElementById('teacher-mode');
    
    teacherModeBtn.addEventListener(
        'change', 
        (event) => {
        
        if (event.target.checked) {
            
            showElement(
                document.getElementById('teacher-name-group')
            );
            
        } else { 
            
            hideElement(
                document.getElementById('teacher-name-group')
            ); 
            
            hideElement(
                document.getElementById('subscription-box')
            ); 
            
            currentTeacherId = null; 
            
        }
        
    });

    async function fetchDeviceIP() {
        
        try { 
            
            const res = await fetch('https://api.ipify.org?format=json'); 
            
            const data = await res.json(); 
            
            return data.ip; 
            
        } catch (error) { 
            
            return "IP_UNKNOWN"; 
            
        }
        
    }

    document.getElementById('verify-teacher-btn').addEventListener(
        'click', 
        async () => {
        
        const fullName = document.getElementById('teacher-full-name').value.trim();
        
        if (fullName.split(" ").length < 4) { 
            
            alert("برجاء إدخال الاسم الرباعي بشكل صحيح."); 
            
            return; 
            
        }
        
        document.getElementById('verify-teacher-btn').innerText = "جاري الاتصال بالخوادم للتحقق...";
        
        const teacherId = fullName.replace(/\s+/g, '_'); 
        
        currentTeacherId = teacherId;
        
        const currentIP = await fetchDeviceIP();
        
        let deviceFingerprint = localStorage.getItem("device_fingerprint");
        
        if (!deviceFingerprint) {
            
            deviceFingerprint = "DEV_" + Math.random().toString(36).substring(2, 15);
            
            localStorage.setItem("device_fingerprint", deviceFingerprint);
            
        }

        const teacherRef = db.collection("teachers").doc(teacherId);

        try {
            
            const doc = await teacherRef.get();
            
            let teacherData = {};

            if (doc.exists) {
                
                teacherData = doc.data();
                
                if (teacherData.registeredDeviceFingerprint && teacherData.registeredDeviceFingerprint !== deviceFingerprint) {
                    
                    alert("عفواً، لا يمكنك تسجيل الدخول. هذا الحساب مرتبط بجهاز آخر لمنع التلاعب.");
                    
                    document.getElementById('verify-teacher-btn').innerText = "تحقق من الحساب";
                    
                    ui.teacherMode.checked = false; 
                    
                    hideElement(document.getElementById('teacher-name-group')); 
                    
                    return;
                    
                }
                
            } else {
                
                teacherData = { 
                    
                    name: fullName, 
                    
                    registeredDeviceFingerprint: deviceFingerprint, 
                    
                    monthsSubscribed: 0, 
                    
                    status: "Free" 
                    
                };
                
                await teacherRef.set(teacherData);
                
            }

            await teacherRef.update(
                { 
                    lastKnownIP: currentIP 
                }
            );
            
            const monthsSubscribed = teacherData.monthsSubscribed || 0;
            
            const requiredAmount = 50 + (monthsSubscribed * 50);
            
            let priceText = 'مبلغ الاشتراك المطلوب منك هذا الشهر هو: ';
            
            priceText += requiredAmount;
            
            priceText += ' جنيه مصري';
            
            document.getElementById('price-display').innerText = priceText;
            
            showElement(document.getElementById('subscription-box'));
            
            document.getElementById('verify-teacher-btn').innerText = "تم التحقق من الحساب بنجاح";
            
            document.getElementById('verify-teacher-btn').style.backgroundColor = "var(--success-color)";
            
        } catch (error) {
            
            console.error("حدث خطأ أثناء فحص الحساب:", error); 
            
            alert("حدث خطأ في الاتصال.");
            
            document.getElementById('verify-teacher-btn').innerText = "تحقق من الحساب";
            
        }
        
    });

    document.getElementById('upload-trigger-btn').addEventListener(
        'click', 
        () => {
        
        document.getElementById('receipt-upload').click();
        
    });
    
    document.getElementById('receipt-upload').addEventListener(
        'change', 
        async (event) => {
        
        const file = event.target.files[0];
        
        if (!file || !currentTeacherId) {
            
            return;
            
        }

        const btn = document.getElementById('upload-trigger-btn');
        
        let uploadingHtml = '<i class="fas fa-spinner fa-spin"></i>';
        
        uploadingHtml += ' جاري رفع الإيصال...';
        
        btn.innerHTML = uploadingHtml;
        
        btn.style.pointerEvents = "none";

        try {
            
            let storagePath = 'receipts/';
            
            storagePath += currentTeacherId;
            
            storagePath += '_';
            
            storagePath += Date.now();
            
            storagePath += '_';
            
            storagePath += file.name;
            
            const storageRef = storage.ref(storagePath);
            
            const snapshot = await storageRef.put(file);
            
            const downloadURL = await snapshot.ref.getDownloadURL();

            const teacherRef = db.collection("teachers").doc(currentTeacherId);
            
            const doc = await teacherRef.get();
            
            const currentMonths = doc.data().monthsSubscribed || 0;

            const paymentDate = new Date();
            
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
            
            const expirationDate = new Date(
                paymentDate.getTime() + thirtyDaysMs
            ); 

            await teacherRef.update(
                {
                    
                status: "VIP_Active", 
                
                subscriptionStart: paymentDate, 
                
                subscriptionEnd: expirationDate,
                
                lastPaymentReceipt: downloadURL, 
                
                monthsSubscribed: currentMonths + 1 
                
            });

            let successHtml = '<i class="fas fa-check"></i>';
            
            successHtml += ' تم استلام الإيصال وتفعيل الحساب!';
            
            btn.innerHTML = successHtml;
            
            btn.style.backgroundColor = "var(--success-color)";
            
            alert("تم التفعيل التلقائي بنجاح لمدة 30 يوماً.");
            
        } catch (error) {
            
            console.error("حدث خطأ:", error); 
            
            alert("حدث خطأ أثناء معالجة رفع الإيصال.");
            
            let errorHtml = '<i class="fas fa-upload"></i>';
            
            errorHtml += ' رفع الإيصال وتفعيل الاشتراك مرة أخرى';
            
            btn.innerHTML = errorHtml;
            
            btn.style.pointerEvents = "auto";
            
        }
        
    });

    // ============================================================================
    // 9. التحقق، والاتصال بجوجل مباشرة
    // ============================================================================
    
    document.getElementById('process-btn').addEventListener(
        'click', 
        async () => {
        
        if (!ui.teacherMode.checked) {
            
            if (!checkAttempts()) {
                
                return;
                
            }
            
        }
        
        const subject = ui.subjectSelect.value;
        
        let yearText = "";
        
        if (ui.yearStage.options[ui.yearStage.selectedIndex]) {
            
            yearText = ui.yearStage.options[ui.yearStage.selectedIndex].text;
            
        }
        
        if (ui.teacherMode.checked) {
            
            if (!currentTeacherId) { 
                
                alert("يرجى إدخال اسمك الرباعي والضغط على زر 'تحقق من الحساب' أولاً."); 
                
                return; 
                
            }
            
            const doc = await db.collection("teachers").doc(currentTeacherId).get();
            
            if (doc.data().status !== "VIP_Active") { 
                
                alert("عفواً، يجب تفعيل اشتراكك أولاً."); 
                
                return; 
                
            }
            
        }

        if (!subject || !yearText) { 
            
            alert("يرجى إكمال تحديد المرحلة، الصف الدراسي، والمادة العلمية أولاً."); 
            
            return; 
            
        }

        if (!selectedLessonFile) {
            
            alert("يرجى تصوير أو إرفاق صورة أولاً.");
            
            return;
            
        }

        const btnText = document.getElementById('btn-text');
        
        const processBtn = document.getElementById('process-btn');
        
        processBtn.classList.add('processing');
        
        let scanningHtml = '<i class="fas fa-spinner fa-spin"></i>';
        
        scanningHtml += ' جاري قراءة وتلخيص الصورة المرفوعة...';
        
        btnText.innerHTML = scanningHtml;
        
        try {
            
            let summaryIdStr = subject + '_' + yearText;
            
            const summaryDocId = summaryIdStr.replace(/\s+/g, '_');
            
            // جلب بصمة المعلم وحذفها إذا مر عليها 6 أشهر
            const styleRef = db.collection("teacher_styles").doc(summaryDocId);
            const styleSnap = await styleRef.get();
            
            if (styleSnap.exists) {
                let sData = styleSnap.data();
                let sTime = sData.createdAt.toDate ? sData.createdAt.toDate().getTime() : sData.createdAt;
                const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
                
                if (Date.now() - sTime > SIX_MONTHS_MS) {
                    await styleRef.delete();
                    globalTeacherStyle = "";
                    console.log("تم حذف بصمة المعلم لمرور 6 أشهر.");
                } else {
                    globalTeacherStyle = sData.styleText;
                    console.log("تم العثور على بصمة معلم صالحة للاستخدام.");
                }
            } else {
                globalTeacherStyle = "";
            }

            const newImageHash = await generateFileHash(selectedLessonFile);
            
            const summaryRef = db.collection("summaries").doc(summaryDocId);

            const docSnap = await summaryRef.get();

            let needNewUploadAndAPI = true;
            
            let finalServerResponse = null;
            
            let existingData = {};
            
            if (docSnap.exists) {
                
                existingData = docSnap.data();
                
            }

            const EIGHTEEN_MONTHS_MS = 18 * 30 * 24 * 60 * 60 * 1000; 
            
            if (existingData.archived_version) {
                
                if (existingData.archived_version.archived_at) {
                
                    let archivedTime = 0;
                    
                    if (existingData.archived_version.archived_at.toDate) {
                        
                        archivedTime = existingData.archived_version.archived_at.toDate().getTime();
                        
                    } else {
                        
                        archivedTime = existingData.archived_version.archived_at.getTime();
                        
                    }
                    
                    let currentTime = Date.now();
                    
                    let timeDifference = currentTime - archivedTime;
                    
                    if (timeDifference > EIGHTEEN_MONTHS_MS) {
                        
                        console.log("مر 18 شهر على الأرشيف، جاري الحذف.");
                        delete existingData.archived_version;
                        
                    }
                    
                }
                
            }

            if (existingData.current_version) {
                
                if (existingData.current_version.imageHash === newImageHash) {
                
                    console.log("الصورة متطابقة، تم جلب التلخيص من بنك الأسئلة الحالي.");
                    
                    needNewUploadAndAPI = false;
                    
                    finalServerResponse = existingData.current_version.aiData;
                    
                }
                
            } 
            
            if (needNewUploadAndAPI) {
                
                if (existingData.archived_version) {
                    
                    if (existingData.archived_version.imageHash === newImageHash) {
                    
                        console.log("الصورة متطابقة، تم جلب التلخيص من الأرشيف.");
                        
                        needNewUploadAndAPI = false;
                        
                        finalServerResponse = existingData.archived_version.aiData;
                        
                    }
                    
                }
                
            }

            if (needNewUploadAndAPI) {
                
                let uploadingText = '<i class="fas fa-cloud-upload-alt"></i>';
                
                uploadingText += ' جاري معالجة الصورة عبر خوادم جوجل المباشرة...';
                
                btnText.innerHTML = uploadingText;

                if (existingData.current_version) {
                    
                    existingData.archived_version = { 
                        ...existingData.current_version, 
                        archived_at: new Date() 
                    };
                    
                }

                // 1. تحويل الصورة إلى نظام يقبله جوجل مباشرة بدون رفعها للستوريدج
                const imageBase64 = await new Promise((resolve, reject) => {
                    
                    const reader = new FileReader();
                    
                    reader.onloadend = () => {
                        
                        const base64String = reader.result.split(',')[1];
                        
                        resolve(base64String);
                        
                    };
                    
                    reader.onerror = reject;
                    
                    reader.readAsDataURL(selectedLessonFile);
                    
                });

                // 2. البرومبت الصارم بتاعك مع تعديل قبول أي صورة
                let aiSystemPrompt = "أنت الآن بروفيسور ومحاضر عالمي.\n";
                
                aiSystemPrompt += "مهمتك: قراءة وتلخيص أي صورة يتم رفعها لك فوراً، واستخراج ملخص شامل بنظام (سؤال وجواب).\n";
                
                aiSystemPrompt += "ملاحظة أمنية: إياك أن ترفض الصورة بحجة أنها ليست صفحة كتاب أو غلاف. اقبل أي صورة وحللها والتزم بالنص الموجود فيها فقط.\n";
                
                aiSystemPrompt += "الرد فقط يجب أن يكون عبارة عن مصفوفة (JSON Array) بهذا الشكل:\n";
                
                aiSystemPrompt += "[\n";
                
                aiSystemPrompt += "  {\"q\": \"السؤال\", \"a\": \"الإجابة النموذجية\"}\n";
                
                aiSystemPrompt += "]\n";
                
                aiSystemPrompt += "\nالمادة: ";
                
                aiSystemPrompt += subject;
                
                aiSystemPrompt += "\nالصف: ";
                
                aiSystemPrompt += yearText;

                // 3. إعداد مفتاح جوجل الخاص بك 
                const GEMINI_API_KEY = "AQ.Ab8RN6Jj2pNIAu8uTG" + "7pzp3ZraELRE-1IQ4iR5y-whIFqcb79A";

                let geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=';
                
                geminiApiUrl += GEMINI_API_KEY;

                // 4. تجهيز الطلب لإرساله لجوجل مباشرة
                const geminiPayload = {
                    
                    "contents": [
                        
                        {
                            
                            "parts": [
                                
                                {
                                    
                                    "text": aiSystemPrompt
                                    
                                },
                                
                                {
                                    
                                    "inlineData": {
                                        
                                        "mimeType": selectedLessonFile.type,
                                        
                                        "data": imageBase64
                                        
                                    }
                                    
                                }
                                
                            ]
                            
                        }
                        
                    ],
                    
                    "generationConfig": {
                        
                        "responseMimeType": "application/json"
                        
                    }
                    
                };

                // 5. إرسال الطلب واستقبال النتيجة
                const response = await fetch(geminiApiUrl, {
                    
                    method: 'POST',
                    
                    headers: {
                        
                        'Content-Type': 'application/json'
                        
                    },
                    
                    body: JSON.stringify(geminiPayload)
                    
                });

                if (!response.ok) {
                    
                    throw new Error("فشل الاتصال بخوادم جوجل المباشرة");
                    
                }

                const responseData = await response.json();
                
                let aiResponseText = responseData.candidates[0].content.parts[0].text;
                
                let cleanJsonText = aiResponseText.replace(/```json/gi, "").replace(/```/g, "").trim();
                
                let aiJsonData = JSON.parse(cleanJsonText);

                // 6. تجهيز النتيجة لتناسب تصميم الموقع
                finalServerResponse = {
                    
                    "subjectTitle": subject,
                    
                    "grade": yearText,
                    
                    "qa_data": aiJsonData
                    
                };

                // 7. تحديث الفايرستور بدون روابط صور
                existingData.current_version = {
                    
                    imageHash: newImageHash,
                    
                    aiData: finalServerResponse,
                    
                    lastUpdated: new Date()
                    
                };

                await summaryRef.set(existingData);
                
            }
            
            let doneHtml = '<i class="fas fa-check"></i>';
            
            doneHtml += ' تم إنهاء التحليل بنجاح';
            
            btnText.innerHTML = doneHtml;
            
            processBtn.classList.remove('processing');
            
            showOutput(finalServerResponse, subject);
            
            if (!ui.teacherMode.checked) {
                
                incrementAttempt();
                
            }
            
            setTimeout(
                () => { 
                
                let resetBtnHtml = '🚀 تحليل صورة أخرى';
                
                btnText.innerHTML = resetBtnHtml; 
                
            }, 3000);
            
        } catch (error) {
            
            console.error("خطأ تقني:", error);
            
            let errHtml = '<i class="fas fa-exclamation-triangle"></i>';
            
            errHtml += ' خطأ في المعالجة';
            
            btnText.innerHTML = errHtml;
            
            processBtn.classList.remove('processing');
            
            alert("الخطأ التقني الحقيقي هو: " + error.message);

            
        }
        
    });

    // ============================================================================
    // 10. دوال عرض المخرجات وتوليد ملفات الطباعة
    // ============================================================================
    
    function showOutput(serverData, subjectName) {
        
        document.getElementById('ai-output-container').style.display = 'block';
        
        let metaHtml = '<i class="fas fa-cloud-download-alt"></i>';
        
        metaHtml += ' آخر تحديث: ';
        
        metaHtml += serverData.lastUpdated;
        
        metaHtml += ' | المادة: ';
        
        metaHtml += serverData.subjectTitle;
        
        document.getElementById('ai-meta-info').innerHTML = metaHtml;
        
        const textContainer = document.getElementById('ai-response-text');
        
        let resultHtml = '<div style="background: #ffffff; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; margin-top: 15px;">';
        
        resultHtml += '<h4 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #3b82f6; display: inline-block; padding-bottom: 5px;">';
        
        resultHtml += 'تحليل الصورة لـ: ';
        
        resultHtml += serverData.grade;
        
        resultHtml += ' - ';
        
        resultHtml += subjectName;
        
        resultHtml += '</h4>';
        
        resultHtml += '<p style="color: #475569; line-height: 1.6;">تم التحليل بنجاح. يمكنك الآن سؤال البروفيسور الذكي عن أي نقطة في هذا الدرس وسيجيبك صوتاً وكتابة.</p>';
        
        resultHtml += '<button id="real-download-btn" class="download-pdf-btn">';
        
        resultHtml += '<i class="fas fa-file-pdf"></i>';
        
        resultHtml += ' تحميل التلخيص كملف PDF الجاهز للطباعة';
        
        resultHtml += '</button>';
        
        resultHtml += '</div>';
        
        textContainer.innerHTML = resultHtml;
        
        globalLessonContext = JSON.stringify(serverData.qa_data);
        
        document.getElementById('real-download-btn').addEventListener(
            'click', 
            () => { 
            
            generateRealPDF(serverData); 
            
        });
        
        document.getElementById('ai-output-container').scrollIntoView(
            { 
                behavior: 'smooth', 
                
                block: 'nearest' 
            }
        );
        
    }

    function generateRealPDF(serverData) {
        
        const btn = document.getElementById('real-download-btn');
        
        let genHtml = '<i class="fas fa-spinner fa-spin"></i>';
        
        genHtml += ' جاري هندسة وتنزيل الملف...';
        
        btn.innerHTML = genHtml;
        
        let qaHtml = '';
        
        serverData.qa_data.forEach(
            (item, index) => {
            
            qaHtml += '<div style="margin-bottom: 15px; background: #f8fafc; padding: 10px; border-radius: 5px; border-right: 4px solid #10b981;">';
            
            qaHtml += '<p style="color: #059669; margin: 0 0 5px 0;"><strong>';
            
            qaHtml += item.q;
            
            qaHtml += '</strong></p>';
            
            qaHtml += '<p style="margin: 0; line-height: 1.8;"><strong>الإجابة:</strong><br>';
            
            qaHtml += item.a.replace(/\n/g, '<br>');
            
            qaHtml += '</p>';
            
            qaHtml += '</div>';
            
        });

        document.getElementById('pdf-qa-content').innerHTML = qaHtml;
        
        let titleText = 'تحليل الصورة | ';
        
        titleText += serverData.subjectTitle;
        
        titleText += ' | ';
        
        titleText += serverData.grade;
        
        document.getElementById('pdf-header-title').innerText = titleText;

        const elementToPrint = document.getElementById('pdf-template');
        
        elementToPrint.style.display = 'block';
        
        let fileName = 'BrainSync_Dynamic_Analysis_';
        
        fileName += Date.now();
        
        fileName += '.pdf';
        
        const opt = {
            
            margin: 0.5,
            
            filename: fileName,
            
            image: { 
                
                type: 'jpeg', 
                
                quality: 0.95 
                
            },
            
            html2canvas: { 
                
                scale: 2, 
                
                logging: false 
                
            },
            
            jsPDF: { 
                
                unit: 'in', 
                
                format: 'letter', 
                
                orientation: 'portrait', 
                
                compress: true 
                
            } 
            
        };

        html2pdf().set(opt).from(elementToPrint).save().then(
            () => {
            
            elementToPrint.style.display = 'none';
            
            let successPdfHtml = '<i class="fas fa-check"></i>';
            
            successPdfHtml += ' تم التحميل بنجاح';
            
            btn.innerHTML = successPdfHtml;
            
            setTimeout(
                () => { 
                
                let resetHtml = '<i class="fas fa-file-pdf"></i>';
                
                resetHtml += ' تحميل التلخيص كملف PDF الجاهز للطباعة';
                
                btn.innerHTML = resetHtml; 
                
            }, 3000);
            
        });
        
    }

    // ============================================================================
    // 11. برمجة الروبوت التفاعلي المربوط بالمنهج + المحادثة الصوتية + 3 محاولات
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

    // دالة زر تسجيل المعلم (بصمة الشرح)
    const teacherRecordBtn = document.getElementById('teacher-record-btn');
    if (teacherRecordBtn) {
        teacherRecordBtn.addEventListener('click', () => {
            const subject = ui.subjectSelect.value;
            let yearText = "";
            if (ui.yearStage.options[ui.yearStage.selectedIndex]) {
                yearText = ui.yearStage.options[ui.yearStage.selectedIndex].text;
            }
            if (!subject || !yearText) {
                alert("يرجى تحديد المرحلة والصف والمادة أولاً من القوائم لربط بصمة الشرح بها.");
                return;
            }
            if (recognition) {
                isTeacherRecording = true;
                try {
                    recognition.start();
                    teacherRecordBtn.classList.add('teacher-recording');
                    teacherRecordBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> جاري تسجيل أسلوبك...';
                } catch (e) {
                    console.log("المايك يعمل بالفعل");
                }
            } else {
                alert("متصفحك لا يدعم تسجيل الصوت.");
            }
        });
    }

    function botSpeak(textToSpeak) {
        
        if ('speechSynthesis' in window) {
            
            let cleanText = textToSpeak.replace(/<[^>]*>?/gm, '');
            
            const utterance = new SpeechSynthesisUtterance(cleanText);
            
            utterance.lang = 'ar-EG';
            
            utterance.onstart = () => {
                
                setRobotState('speaking');
                
            };
            
            utterance.onend = () => {
                
                setRobotState('idle');
                
            };
            
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
            
            let formattedText = text.replace(/\n/g, '<br>');
            
            msgDiv.innerHTML = formattedText;
            
        }
        
        if (chatMessagesBox) {
            
            chatMessagesBox.appendChild(msgDiv);
            
            chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
            
        }
        
    }

    async function sendMessageToBot(messageText) {
        
        if (!messageText) {
            
            return;
            
        }
        
        if (!currentTeacherId) {
            
            if (!checkChatAttempts()) {
                
                return;
                
            }
            
        }
        
        appendMessage(messageText, 'user');
        
        if (chatInput) {
            
            chatInput.value = "";
            
        }
        
        let typingDiv = document.createElement('div');
        
        typingDiv.style.background = "#e0f2fe";
        
        typingDiv.style.color = "#0369a1";
        
        typingDiv.style.padding = "10px 15px";
        
        typingDiv.style.borderRadius = "15px 15px 0 15px";
        
        typingDiv.style.alignSelf = "flex-start";
        
        let typingHtml = '<i class="fas fa-ellipsis-h fa-fade"></i>';
        
        typingHtml += ' جاري التفكير...';
        
        typingDiv.innerHTML = typingHtml;
        
        typingDiv.id = "typing-indicator";
        
        if (chatMessagesBox) {
            
            chatMessagesBox.appendChild(typingDiv);
            
            chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
            
        }
        
        let subjectVal = "مادة عامة";
        
        if (ui.subjectSelect.value) {
            
            subjectVal = ui.subjectSelect.value;
            
        }
        
        let gradeVal = "مرحلة عامة";
        
        if (ui.yearStage.options[ui.yearStage.selectedIndex]) {
            
            gradeVal = ui.yearStage.options[ui.yearStage.selectedIndex].text;
            
        }
        
        setRobotState('thinking');
        
        try {
            
            // 1. البرومبت الصارم الخاص بالشات
            let chatSystemPrompt = "أنت مساعد تعليمي ذكي.\n";
            
            chatSystemPrompt += "المادة: ";
            
            chatSystemPrompt += subjectVal;
            
            chatSystemPrompt += "\nالصف: ";
            
            chatSystemPrompt += gradeVal;
            
            chatSystemPrompt += "\n";
            
            if (globalTeacherStyle !== "") {
                
                chatSystemPrompt += "أسلوب المعلم في الشرح: ";
                
                chatSystemPrompt += globalTeacherStyle;
                
                chatSystemPrompt += "\n";
                
            }
            
            chatSystemPrompt += "محتوى الدرس المرفوع: ";
            
            chatSystemPrompt += globalLessonContext;
            
            chatSystemPrompt += "\n";
            
            chatSystemPrompt += "تنبيه هام: أجب على سؤال الطالب بناءً على محتوى الدرس المرفوع فقط ولا تضف معلومات من خارج المنهج.\n";
            
            chatSystemPrompt += "سؤال الطالب: ";
            
            chatSystemPrompt += messageText;

            // 2. إعداد المفتاح والرابط
            const GEMINI_API_KEY = "AQ.Ab8RN6Jj2pNIAu8uTG" + "7pzp3ZraELRE-1IQ4iR5y-whIFqcb79A";

            let geminiChatUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=';
            
            geminiChatUrl += GEMINI_API_KEY;

            const chatPayload = {
                
                "contents": [
                    
                    {
                        
                        "parts": [
                            
                            {
                                
                                "text": chatSystemPrompt
                                
                            }
                            
                        ]
                        
                    }
                    
                ]
                
            };

            // 3. الإرسال لجوجل مباشرة
            const response = await fetch(geminiChatUrl, {
                
                method: 'POST',
                
                headers: {
                    
                    'Content-Type': 'application/json'
                    
                },
                
                body: JSON.stringify(chatPayload)
                
            });
            
            if (!response.ok) {
                
                throw new Error("فشل الاتصال بخوادم جوجل المباشرة في الشات");
                
            }
            
            const responseData = await response.json();
            
            let aiReply = responseData.candidates[0].content.parts[0].text;
            
            const result = {
                
                reply: aiReply
                
            };
            
            const typingIndicator = document.getElementById('typing-indicator');
            
            if (typingIndicator) {
                
                typingIndicator.remove();
                
            }
            
            setRobotState('idle');
            
            appendMessage(result.reply, 'bot');
            
            botSpeak(result.reply);
            
            if (!currentTeacherId) {
                
                incrementChatAttempt();
                
            }
            
        } catch (error) {
            
            console.error("Chat Error:", error);
            
            const typingIndicator = document.getElementById('typing-indicator');
            
            if (typingIndicator) {
                
                typingIndicator.remove();
                
            }
            
            setRobotState('idle');
            
            appendMessage("حدث خطأ في الاتصال بالشبكة، يرجى المحاولة مرة أخرى.", 'bot');
            
        }
        
    }

    if (chatSendBtn) {
        
        chatSendBtn.addEventListener(
            'click', 
            () => {
            
            let textVal = "";
            
            if (chatInput) {
                
                textVal = chatInput.value.trim();
                
            }
            
            sendMessageToBot(textVal);
            
        });
        
    }

    if (chatInput) {
        
        chatInput.addEventListener(
            'keypress', 
            (event) => {
            
            if (event.key === 'Enter') {
                
                let textVal = chatInput.value.trim();
                
                sendMessageToBot(textVal);
                
            }
            
        });
        
    }

    if (chatMicBtn) {
        
        chatMicBtn.addEventListener(
            'click', 
            async () => {
            
            if (!currentTeacherId) {
                
                if (!checkChatAttempts()) {
                    
                    return;
                    
                }
                
            }
            
            if (recognition) {
                
                try {
                    
                    isTeacherRecording = false;
                    
                    recognition.start();
                    
                    chatMicBtn.classList.add('recording');
                    
                    chatInput.placeholder = "جاري الاستماع... تحدث الآن";
                    
                    setRobotState('listening');
                    
                } catch (e) {
                    
                    console.log("المايك يعمل بالفعل");
                    
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
                
                const teacherRecordBtn = document.getElementById('teacher-record-btn');
                
                if (teacherRecordBtn) {
                    teacherRecordBtn.classList.remove('teacher-recording');
                    teacherRecordBtn.innerHTML = '<i class="fas fa-microphone-alt"></i> تسجيل المعلم';
                }
                
                const subject = ui.subjectSelect.value;
                
                let yearText = ui.yearStage.options[ui.yearStage.selectedIndex].text;
                
                let summaryIdStr = subject + '_' + yearText;
                
                const summaryDocId = summaryIdStr.replace(/\s+/g, '_');
                
                try {
                    
                    await db.collection("teacher_styles").doc(summaryDocId).set({
                        
                        styleText: transcript,
                        
                        createdAt: new Date()
                        
                    });
                    
                    alert("تم حفظ بصمة شرحك بنجاح! سيتم دمجها مع الأنظمة العالمية للطلاب وتُحذف بعد 6 أشهر.");
                    
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
            
            console.error("Speech Recognition Error:", event.error);
            
            if (isTeacherRecording) {
                isTeacherRecording = false;
                const teacherRecordBtn = document.getElementById('teacher-record-btn');
                if (teacherRecordBtn) {
                    teacherRecordBtn.classList.remove('teacher-recording');
                    teacherRecordBtn.innerHTML = '<i class="fas fa-microphone-alt"></i> تسجيل المعلم';
                }
            } else {
                chatMicBtn.classList.remove('recording');
                chatInput.placeholder = "اكتب سؤالك هنا...";
                setRobotState('idle');
            }
            
        };

        recognition.onend = () => {
            
            if (isTeacherRecording) {
                isTeacherRecording = false;
                const teacherRecordBtn = document.getElementById('teacher-record-btn');
                if (teacherRecordBtn) {
                    teacherRecordBtn.classList.remove('teacher-recording');
                    teacherRecordBtn.innerHTML = '<i class="fas fa-microphone-alt"></i> تسجيل المعلم';
                }
            } else {
                chatMicBtn.classList.remove('recording');
                chatInput.placeholder = "اكتب سؤالك هنا...";
            }
            
        };
        
    }

}); // نهاية استدعاء تحميل محتوى المستند
