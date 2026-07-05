// ============================================================================
// ملف الجافاسكريبت الرئيسي (java.js) - مشروع إمبراطورية المعرفة
// النسخة الخاصة بالاتصال المباشر والمؤمن بسيرفر البايثون الخلفي + نظام ضغط الصور
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
    
    const unifiedPass = "BrainSync2026"; 
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
    
    currentTeacherId = email.replace(/[@.]/g, '_'); 
    
    try {
        const teacherRef = db.collection("teachers").doc(currentTeacherId);
        
        await teacherRef.set({
            name: "VIP User",
            email: email,
            status: "VIP_Active",
            subscriptionStart: new Date(),
            subscriptionEnd: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) 
        }, { merge: true });
        
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

function setRobotState(state) {
    const robotIcon = document.getElementById('robot-icon');
    
    if (!robotIcon) {
        return;
    }
    
    robotIcon.classList.remove('robot-listening', 'robot-thinking', 'robot-speaking');
    
    if (state === 'listening') {
        robotIcon.classList.add('robot-listening');
    } else if (state === 'thinking') {
        robotIcon.classList.add('robot-thinking');
    } else if (state === 'speaking') {
        robotIcon.classList.add('robot-speaking');
    }
}

// ============================================================================
// نظام عداد المحاولات المجانية
// ============================================================================
function checkAttempts() {
    let attempts = parseInt(localStorage.getItem('user_attempts') || 0);
    if (attempts >= 3) {
        alert("عفواً، لقد انتهت محاولاتك المجانية (3/3) في التلخيص. يرجى تفعيل اشتراكك لتتمكن من المواصلة.");
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
        alert("عفواً، لقد استنفدت محاولاتك المجانية (2/2) لتسجيل بصمة الشرح. يرجى تفعيل اشتراكك كمعلم.");
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
        alert("عفواً! لقد استنفدت محاولاتك الثلاث المجانية للتحدث مع الروبوت.");
        return false;
    }
    return true;
}

function incrementChatAttempt() {
    let chatAttempts = parseInt(localStorage.getItem('chat_attempts') || 0) + 1;
    localStorage.setItem('chat_attempts', chatAttempts);
    
    let remaining = 3 - chatAttempts;
    if (remaining > 0) {
        alert("تم استهلاك محاولة مجانية للتحدث. متبقي لك: " + remaining + " محاولات مجانية.");
    } else {
        alert("انتهت محاولاتك المجانية الثلاث للتحدث.");
    }
}

// ============================================================================
// تحميل المستند وقاعدة البيانات
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    const subjectsDB = {
        primary_general: [
            "اللغة العربية", "الرياضيات", "اللغة الإنجليزية (Connect)", "التربية الدينية الإسلامية", 
            "التربية الدينية المسيحية", "القيم واحترام الآخر", "العلوم", "الدراسات الاجتماعية", 
            "تكنولوجيا المعلومات والاتصالات (ICT)", "المهارات المهنية", "التربية الفنية", 
            "التربية الموسيقية", "التربية البدنية", "التوكاتسو"
        ],
        primary_azhar: [
            "القرآن الكريم", "التربية الإسلامية", "اللغة العربية", "الرياضيات", 
            "اللغة الإنجليزية", "العلوم", "الدراسات الاجتماعية", "تكنولوجيا المعلومات والاتصالات", 
            "المهارات المهنية"
        ],
        prep_general: [
            "اللغة العربية", "الرياضيات (جبر وإحصاء)", "الرياضيات (هندسة)", "العلوم", 
            "الدراسات الاجتماعية", "اللغة الإنجليزية", "التربية الدينية الإسلامية", 
            "التربية الدينية المسيحية", "الحاسب الآلي وتكنولوجيا المعلومات", "التربية الفنية"
        ],
        prep_azhar: [
            "القرآن الكريم", "الفقه", "أصول الدين (تفسير)", "أصول الدين (حديث)", 
            "أصول الدين (توحيد)", "أصول الدين (سيرة نبوية)", "النحو", "الصرف", 
            "المطالعة والنصوص", "الإنشاء", "الإملاء والخط", "الرياضيات (جبر وإحصاء)", 
            "الرياضيات (هندسة)", "العلوم", "الدراسات الاجتماعية", "اللغة الإنجليزية", 
            "الحاسب الآلي", "التربية الفنية"
        ],
        high_general_sci_biology: [
            "اللغة العربية", "اللغة الإنجليزية", "اللغة الفرنسية", "اللغة الألمانية", 
            "اللغة الإيطالية", "اللغة الإسبانية", "الفيزياء", "الكيمياء", "الأحياء", 
            "الجيولوجيا وعلوم البيئة", "التربية الدينية", "التربية الوطنية", "الاقتصاد والإحصاء"
        ],
        high_general_sci_math: [
            "اللغة العربية", "اللغة الإنجليزية", "اللغة الفرنسية", "اللغة الألمانية", 
            "اللغة الإيطالية", "اللغة الإسبانية", "الفيزياء", "الكيمياء", 
            "الرياضيات البحتة (تفاضل وتكامل)", "الرياضيات البحتة (جبر وهندسة فراغية)", 
            "الرياضيات التطبيقية (استاتيكا)", "الرياضيات التطبيقية (ديناميكا)", 
            "التربية الدينية", "التربية الوطنية", "الاقتصاد والإحصاء"
        ],
        high_general_lit: [
            "اللغة العربية", "اللغة الإنجليزية", "اللغة الفرنسية", "اللغة الألمانية", 
            "اللغة الإيطالية", "اللغة الإسبانية", "التاريخ", "الجغرافيا", "علم النفس والاجتماع", 
            "الفلسفة والمنطق", "التربية الدينية", "التربية الوطنية", "الاقتصاد والإحصاء"
        ],
        high_azhar_sci: [
            "القرآن الكريم", "الفقه", "التفسير", "الحديث", "التوحيد", "النحو", "الصرف", 
            "البلاغة", "الأدب والنصوص", "اللغة الإنجليزية", "الفيزياء", "الكيمياء", 
            "الأحياء", "الرياضيات (جبر وهندسة فراغية)", "الرياضيات (تفاضل وتكامل)", 
            "الرياضيات (استاتيكا)", "الرياضيات (ديناميكا)"
        ],
        high_azhar_lit: [
            "القرآن الكريم", "الفقه", "التفسير", "الحديث", "التوحيد", "النحو", "الصرف", 
            "البلاغة", "الأدب والنصوص", "الإنشاء", "اللغة الإنجليزية", "اللغة الفرنسية", 
            "التاريخ", "الجغرافيا", "المنطق"
        ],
        diploma_industrial: [
            "اللغة العربية", "اللغة الإنجليزية", "الرياضيات", "الفيزياء العامة", 
            "الحاسب الآلي", "التربية الدينية", "آلات كهربية", "رسم فني كهربائي", 
            "تخطيط وإدارة إنتاج", "تحكم إلكتروني", "نظم إلكترونية", "دوائر منطقية", 
            "شبكات كهربية", "أجهزة قياس", "اتصالات", "محركات سيارات", "تكنولوجيا اللحام", 
            "صيانة وإصلاح", "رسم فني ميكانيكي", "تكنولوجيا الخراطة", "تكنولوجيا التبريد", 
            "تكييف الهواء", "رسم فني تبريد وتكييف", "تكنولوجيا النجارة", "تكنولوجيا الملابس الجاهزة", 
            "رسم فني معماري", "مقايسات عامة"
        ],
        diploma_commercial: [
            "اللغة العربية", "اللغة الإنجليزية", "اللغة الأجنبية الثانية (فرنسي)", 
            "الحاسب الآلي", "التربية الدينية", "إدارة أعمال", "إدارة مشتريات", 
            "سكرتارية عربية", "سكرتارية إفرنجية", "اقتصاد", "إحصاء", "تسويق", 
            "أعمال وساطة", "تأمينات أشخاص", "تأمينات هندسية", "رياضة مالية", 
            "محاسبة مالية", "محاسبة شركات", "محاسبة ضرائب", "محاسبة حكومية", 
            "قانون تجاري", "قانون عقوبات", "قانون مدني", "قانون مرافعات", "قانون عمل"
        ],
        diploma_agricultural: [
            "اللغة العربية", "اللغة الإنجليزية", "الرياضيات", "الحاسب الآلي", 
            "التربية الدينية", "الكيمياء الزراعية", "الفيزياء الزراعية", "الأحياء", 
            "محاصيل الحقل", "تربية الحيوان والدواجن", "أمراض النبات", "حشرات اقتصادية", 
            "الألبان", "الصناعات الزراعية", "الآفات", "استصلاح أراضي", "هندسة زراعية"
        ],
        diploma_tourism: [
            "اللغة العربية", "اللغة الإنجليزية", "اللغة الأجنبية الثانية (فرنسي/ألماني/إيطالي)", 
            "الحاسب الآلي", "التربية الدينية", "أصول فن الطهو", "خدمة المطاعم", 
            "الإشراف الداخلي", "شركات السياحة", "اقتصاديات السياحة", "محاسبة فندقية", "أمن صناعي"
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
                if (normalizeText(subject).includes(query)) {
                    if (!matchedSubjects.includes(subject)) {
                        matchedSubjects.push(subject);
                    }
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
        ui.filterTitle.innerHTML = 'اختر المرحلة الدراسية لمادة: ' + subject;
        
        ui.filterStage.appendChild(createFilterButton('المرحلة الابتدائية', () => selectFilterStage('primary')));
        ui.filterStage.appendChild(createFilterButton('المرحلة الإعدادية', () => selectFilterStage('prep')));
        ui.filterStage.appendChild(createFilterButton('المرحلة الثانوية', () => selectFilterStage('high')));
        ui.filterStage.appendChild(createFilterButton('الدبلومات الفنية', () => selectFilterStage('diploma')));
    }

    function selectFilterStage(stage) {
        filterSelectedStage = stage;
        ui.filterType.innerHTML = ''; 
        ui.filterGrade.innerHTML = '';
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
        if (!ui.pathDisplay) {
            return; 
        }
        try {
            let stage = ui.mainStage.options[ui.mainStage.selectedIndex] ? ui.mainStage.options[ui.mainStage.selectedIndex].text : "";
            let sub = ui.subStage.options[ui.subStage.selectedIndex] ? ui.subStage.options[ui.subStage.selectedIndex].text : "";
            let year = ui.yearStage.options[ui.yearStage.selectedIndex] ? ui.yearStage.options[ui.yearStage.selectedIndex].text : "";
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
            
            ui.pathDisplay.innerHTML = '<i class="fas fa-map-marker-alt"></i> مسار المادة المحدد: <br> ' + path;
            ui.pathDisplay.style.display = 'block';
        } catch (error) {
            console.log("Error in updatePathDisplay");
        }
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

    ui.subjectSelect.addEventListener('change', (event) => {
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
            html += '<option value="' + i + '">الصف ' + getOrdinal(i);
            if (stageType === 'primary') {
                html += ' الابتدائي';
            } else if (stageType === 'prep') {
                html += ' الإعدادي';
            } else if (stageType === 'high') {
                html += ' الثانوي';
            } else if (stageType === 'diploma') {
                html += ' (دبلوم)';
            }
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
                if (previewImg) {
                    previewImg.src = e.target.result;
                    showElement(document.getElementById('image-preview-container'));
                }
            };
            
            reader.readAsDataURL(fileCheck);
            
            document.getElementById('lesson-upload-text').innerHTML = '<i class="fas fa-check-circle"></i> تم إرفاق الصورة بنجاح: ' + selectedLessonFile.name;
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
    // 8. التحقق والدفع للمعلم والطالب 
    // ============================================================================
    const teacherModeBtn = document.getElementById('teacher-mode');
    
    if (teacherModeBtn) {
        teacherModeBtn.addEventListener('change', (event) => {
            if (event.target.checked) {
                showElement(document.getElementById('teacher-name-group'));
            } else { 
                hideElement(document.getElementById('teacher-name-group')); 
                hideElement(document.getElementById('subscription-box')); 
                currentTeacherId = null; 
            }
        });
    }

    async function fetchDeviceIP() {
        try { 
            const res = await fetch('https://api.ipify.org?format=json'); 
            const data = await res.json(); 
            return data.ip; 
        } catch (error) { 
            return "IP_UNKNOWN"; 
        }
    }

    const verifyBtn = document.getElementById('verify-teacher-btn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const fullName = document.getElementById('teacher-full-name').value.trim();
            
            if (fullName.split(" ").length < 4) { 
                alert("برجاء إدخال الاسم الرباعي بشكل صحيح."); 
                return; 
            }
            
            verifyBtn.innerText = "جاري الاتصال بالخوادم للتحقق...";
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
                        verifyBtn.innerText = "تحقق من الحساب"; 
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

                await teacherRef.update({ lastKnownIP: currentIP });
                
                const requiredAmount = 50 + ((teacherData.monthsSubscribed || 0) * 50);
                document.getElementById('price-display').innerText = 'مبلغ الاشتراك المطلوب منك هذا الشهر هو: ' + requiredAmount + ' جنيه مصري';
                showElement(document.getElementById('subscription-box'));
                verifyBtn.innerText = "تم التحقق من الحساب بنجاح"; 
                verifyBtn.style.backgroundColor = "var(--success-color)";
                
            } catch (error) {
                alert("حدث خطأ في الاتصال."); 
                verifyBtn.innerText = "تحقق من الحساب";
            }
        });
    }

    const uploadTriggerBtn = document.getElementById('upload-trigger-btn');
    const receiptUpload = document.getElementById('receipt-upload');
    
    if (uploadTriggerBtn && receiptUpload) {
        uploadTriggerBtn.addEventListener('click', () => {
            receiptUpload.click();
        });
        
        receiptUpload.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file || !currentTeacherId) {
                return;
            }

            uploadTriggerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري رفع الإيصال...';
            uploadTriggerBtn.style.pointerEvents = "none";

            try {
                let storagePath = 'receipts/' + currentTeacherId + '_' + Date.now() + '_' + file.name;
                const storageRef = storage.ref(storagePath);
                const snapshot = await storageRef.put(file);
                const downloadURL = await snapshot.ref.getDownloadURL();

                const teacherRef = db.collection("teachers").doc(currentTeacherId);
                const doc = await teacherRef.get();
                const currentMonths = doc.data().monthsSubscribed || 0;

                const paymentDate = new Date();
                const expirationDate = new Date(paymentDate.getTime() + (30 * 24 * 60 * 60 * 1000)); 

                await teacherRef.update({
                    status: "VIP_Active", 
                    subscriptionStart: paymentDate, 
                    subscriptionEnd: expirationDate,
                    lastPaymentReceipt: downloadURL, 
                    monthsSubscribed: currentMonths + 1 
                });

                uploadTriggerBtn.innerHTML = '<i class="fas fa-check"></i> تم استلام الإيصال وتفعيل الحساب!';
                uploadTriggerBtn.style.backgroundColor = "var(--success-color)";
                alert("تم التفعيل التلقائي بنجاح لمدة 30 يوماً.");
                
            } catch (error) {
                alert("حدث خطأ أثناء معالجة رفع الإيصال.");
                uploadTriggerBtn.innerHTML = '<i class="fas fa-upload"></i> رفع الإيصال وتفعيل الاشتراك مرة أخرى';
                uploadTriggerBtn.style.pointerEvents = "auto";
            }
        });
    }

    // ============================================================================
    // 9. إرسال الطلب للسيرفر الخلفي (البايثون) + نظام ضغط الصور (Image Compression)
    // ============================================================================
    const processBtn = document.getElementById('process-btn');
    
    if (processBtn) {
        processBtn.addEventListener('click', async () => {
            
            if (!ui.teacherMode.checked && !checkAttempts()) {
                return;
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
            processBtn.classList.add('processing');
            btnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري ضغط الصورة ومعالجتها...';
            
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

                const newImageHash = await generateFileHash(selectedLessonFile);
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
                    btnText.innerHTML = '<i class="fas fa-compress"></i> جاري إرسال الصورة للسيرفر الخلفي...';

                    if (existingData.current_version) {
                        existingData.archived_version = { ...existingData.current_version, archived_at: new Date() };
                    }

                    // ==========================================
                    // نظام ضغط الصور لتفادي خطأ 413 (Payload Too Large)
                    // ==========================================
                    const imageBase64 = await new Promise((resolve, reject) => {
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
                                
                                // ضغط الصورة بنسبة جودة 0.7 لتقليل مساحتها
                                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                                resolve(dataUrl.split(',')[1]);
                            };
                            img.onerror = reject;
                            img.src = event.target.result;
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(selectedLessonFile);
                    });

                    // ==========================================
                    // الاتصال بسيرفر البايثون
                    // ==========================================
                    const serverPayload = {
                        action: 'analyze',
                        image_base64: imageBase64,
                        subject: subject,
                        year: yearText,
                        mime_type: 'image/jpeg'
                    };

                    // -- تم تعديل المسار هنا إلى /api/analyze --
                    const response = await fetch('/api/analyze', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json' 
                        },
                        body: JSON.stringify(serverPayload)
                    });

                    if (!response.ok) {
                        throw new Error("فشل الاتصال بالسيرفر الخلفي على فيرسل");
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
                
                if (!ui.teacherMode.checked) {
                    incrementAttempt();
                }
                
                setTimeout(() => { 
                    btnText.innerHTML = '🚀 تحليل صورة أخرى'; 
                }, 3000);
                
            } catch (error) {
                console.error("خطأ تقني:", error);
                btnText.innerHTML = '<i class="fas fa-exclamation-triangle"></i> خطأ في المعالجة';
                processBtn.classList.remove('processing');
                alert("الخطأ التقني: " + error.message);
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
            qaHtml += '<div style="margin-bottom: 15px; background: #f8fafc; padding: 10px; border-radius: 5px; border-right: 4px solid #10b981;">';
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
        elementToPrint.style.display = 'block';
        
        const opt = {
            margin: 0.5,
            filename: 'Knowledge_Empire_' + serverData.subjectTitle.replace(/\s+/g, '_') + '_' + Date.now() + '.pdf',
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, logging: false },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait', compress: true } 
        };

        html2pdf().set(opt).from(elementToPrint).save().then(() => {
            elementToPrint.style.display = 'none';
            btn.innerHTML = '<i class="fas fa-check"></i> تم التحميل بنجاح';
            
            setTimeout(() => { 
                btn.innerHTML = '<i class="fas fa-file-pdf"></i> تحميل التلخيص كملف PDF احترافي'; 
            }, 3000);
        });
    }

    // ============================================================================
    // 11. برمجة الروبوت التفاعلي والشات
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

    const teacherRecordBtn = document.getElementById('teacher-record-btn');
    
    if (teacherRecordBtn) {
        teacherRecordBtn.addEventListener('click', () => {
            if (!currentTeacherId && !checkTeacherAttempts()) {
                return;
            }
            
            const subject = ui.subjectSelect.value;
            let yearText = ui.yearStage.options[ui.yearStage.selectedIndex] ? ui.yearStage.options[ui.yearStage.selectedIndex].text : "";
            
            if (!subject || !yearText) { 
                alert("يرجى تحديد المرحلة والصف والمادة أولاً."); 
                return; 
            }
            
            if (recognition) {
                isTeacherRecording = true;
                try {
                    recognition.start();
                    teacherRecordBtn.classList.add('teacher-recording');
                    teacherRecordBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> جاري تسجيل أسلوبك...';
                } catch (e) {
                    console.log("Error starting microphone");
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
            msgDiv.innerHTML = text.replace(/\n/g, '<br>');
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
        
        if (!currentTeacherId && !checkChatAttempts()) {
            return;
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
            // ==========================================
            // الشات هنا بيكلم سيرفر البايثون
            // ==========================================
            const chatServerPayload = {
                action: 'chat',
                subject: subjectVal,
                year: gradeVal,
                teacher_style: globalTeacherStyle,
                lesson_context: globalLessonContext,
                message: messageText
            };

            // -- تم تعديل المسار هنا إلى /api/chat --
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(chatServerPayload)
            });
            
            if (!response.ok) {
                throw new Error("فشل الاتصال بخوادم فيرسل في الشات");
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
            appendMessage("حدث خطأ في الاتصال بالسيرفر، يرجى المحاولة مرة أخرى.", 'bot');
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
            if (!currentTeacherId && !checkChatAttempts()) {
                return;
            }
            
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
                
                if (teacherRecordBtn) { 
                    teacherRecordBtn.classList.remove('teacher-recording'); 
                    teacherRecordBtn.innerHTML = '<i class="fas fa-microphone-alt"></i> تسجيل المعلم'; 
                }
                
                const subject = ui.subjectSelect.value;
                let yearText = ui.yearStage.options[ui.yearStage.selectedIndex].text;
                const summaryDocId = (subject + '_' + yearText).replace(/\s+/g, '_');
                
                try {
                    await db.collection("teacher_styles").doc(summaryDocId).set({ 
                        styleText: transcript, 
                        createdAt: new Date() 
                    });
                    
                    alert("تم حفظ بصمة شرحك بنجاح! سيتم دمجها مع الأنظمة العالمية للطلاب وتُحذف بعد 6 أشهر.");
                    globalTeacherStyle = transcript;
                    
                    if (!currentTeacherId) {
                        incrementTeacherAttempt();
                    }
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

}); // نهاية المستند
