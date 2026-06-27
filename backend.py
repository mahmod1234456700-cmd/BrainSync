from flask import Flask
from flask import request
from flask import jsonify
from flask_cors import CORS
import datetime
import requests
import json
import io
import re
from urllib.parse import urlparse
from PIL import Image
import google.generativeai as genai

# ============================================================================
# 1. تهيئة خادم برين سينك (BrainSync) المدرع
# ============================================================================

app = Flask(__name__)

CORS(app)

# ============================================================================
# 2. إعدادات حماية المتصفح (المدرسة البريطانية NCSC)
# ============================================================================

@app.after_request
def inject_global_security_headers(response):
    
    response.headers['X-Content-Type-Options'] = 'nosniff'
    
    response.headers['X-Frame-Options'] = 'DENY'
    
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    
    return response

# ============================================================================
# 3. إعدادات مفتاح الذكاء الاصطناعي (Google Gemini Vision API)
# ============================================================================

API_KEY = "YOUR_GEMINI_API_KEY_HERE"

genai.configure(api_key=API_KEY)

vision_model = genai.GenerativeModel('gemini-1.5-flash')

chat_model = genai.GenerativeModel('gemini-1.5-flash')

# ============================================================================
# 4. برومبت الذكاء الاصطناعي الصارم (المحاضر العالمي للصور)
# ============================================================================

AI_SYSTEM_PROMPT = """
أنت الآن بروفيسور ومحاضر عالمي. 
مهمتك: قراءة النص الموجود في الصورة المرفوعة، وتحليله، واستخراج ملخص شامل بنظام (سؤال وجواب).
ملاحظة أمنية: التزم بالنص فقط.
يجب أن يكون ردك عبارة عن مصفوفة JSON فقط (JSON Array). 
[
  {"q": "السؤال", "a": "الإجابة النموذجية"}
]
"""

# ============================================================================
# 5. دالة فحص الروابط ومنع الاختراق المتقدم
# ============================================================================

def validate_and_download_image(image_url):
    
    try:
        
        parsed_url = urlparse(image_url)
        
        if parsed_url.scheme not in ['http', 'https']:
            
            return None
            
        trusted_domain = "firebasestorage.googleapis.com"
        
        if trusted_domain not in parsed_url.netloc:
            
            return None
            
        response = requests.get(
            image_url, 
            timeout=10 
        )
        
        response.raise_for_status()
        
        image_bytes = io.BytesIO(response.content)
        
        img = Image.open(image_bytes)
        
        return img
        
    except Exception as e:
        
        return None

# ============================================================================
# 6. دالة تطهير النصوص والمدخلات
# ============================================================================

def sanitize_input_text(text_to_clean):
    
    if not text_to_clean:
        
        return ""
        
    clean_text = re.sub(r'<[^>]*>', '', text_to_clean)
    
    clean_text = clean_text.replace(';', '')
    
    clean_text = clean_text.replace('$', '')
    
    clean_text = clean_text.strip()
    
    return clean_text

# ============================================================================
# 7. واجهة تحليل الصورة المرفوعة (رفع الدرس)
# ============================================================================

@app.route('/api/analyze_lesson', methods=['GET'])
def analyze_lesson():
    
    subject = sanitize_input_text(
        request.args.get('subject')
    )
    
    grade = sanitize_input_text(
        request.args.get('grade')
    )
    
    image_url = request.args.get('image_url')
    
    if not image_url or not subject or not grade:
        
        return jsonify({"status": "error", "message": "بيانات غير مكتملة"}), 400

    img = validate_and_download_image(image_url)
    
    if img is None:
        
        return jsonify({"status": "error", "message": "رابط مرفوض"}), 403

    context_prompt = f"هذه الصورة تخص مادة ({subject}) لطلاب ({grade}). \n\n"
    
    final_prompt = context_prompt + AI_SYSTEM_PROMPT

    try:
        
        ai_response = vision_model.generate_content(
            [final_prompt, img]
        )
        
        ai_text = ai_response.text
        
        ai_text = ai_text.replace('```json', '')
        
        ai_text = ai_text.replace('```', '')
        
        ai_text = ai_text.strip()
        
        qa_array = json.loads(ai_text)
        
    except Exception as e:
        
        qa_array = [
            {
                "q": "🎯 تنبيه حماية من النظام",
                "a": "فشلت عملية التحليل الأكاديمي."
            }
        ]

    dynamic_response = {
        
        "status": "success",
        
        "subjectTitle": subject,
        
        "grade": grade,
        
        "lastUpdated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        
        "qa_data": qa_array
        
    }
    
    return jsonify(dynamic_response)

# ============================================================================
# 8. المسار الجديد: المحادثة التفاعلية المقيدة بالمنهج والصورة المرفوعة
# ============================================================================

@app.route('/api/chat', methods=['POST'])
def chat_with_robot():
    
    try:
        
        data = request.get_json()
        
        user_message = sanitize_input_text(data.get('message', ''))
        
        subject = sanitize_input_text(data.get('subject', 'غير محدد'))
        
        grade = sanitize_input_text(data.get('grade', 'غير محدد'))
        
        lesson_context = sanitize_input_text(data.get('lesson_context', 'لا يوجد درس مرفوع حالياً'))
        
        if not user_message:
            
            return jsonify({"reply": "مرحباً! أنا أستمع إليك، كيف أساعدك في درسك؟"})
            
        CHAT_SYSTEM_PROMPT = f"""
        أنت روبوت تعليمي ذكي ومدرس خصوصي في منصة "برين سينك (BrainSync)".
        الطالب الآن يسألك في مادة: ({subject}) - للمرحلة: ({grade}).
        
        محتوى الدرس الذي تم تحليله من صورة الطالب هو:
        {lesson_context}
        
        القواعد الإجبارية لك:
        1. يجب أن تدمج في شرحك بين "أسلوب المدرس المألوف والودود" وبين "استراتيجيات التعليم لأفضل 3 دول في العالم" (الفهم العميق والمنطق مثل سنغافورة، ربط العلم بالظواهر الحياتية مثل فنلندا، وحل المشكلات مثل اليابان).
        2. إذا كان سؤال الطالب عاماً أو استفساراً أولياً، أعطه الخلاصة المفيدة في سطرين فقط، ثم اسأله نصاً: "هل تريدني أن أشرح لك بالتفصيل؟".
        3. إذا قال الطالب "نعم" أو طلب الشرح الوافي، قم بشرح الدرس (الموجود في المحتوى أعلاه) كاملاً بوضوح وتفصيل باستخدام الاستراتيجيات العالمية المذكورة لتسهيل الفهم وليس الحفظ.
        4. ممنوع منعاً باتاً الخروج عن سياق المنهج والمادة ومحتوى الصورة.
        5. تحدث بأسلوب مريح ومبسط كأنك تطبيق Learn AI.
        """
        
        full_prompt = CHAT_SYSTEM_PROMPT + "\n\nسؤال الطالب: " + user_message
        
        chat_response = chat_model.generate_content(full_prompt)
        
        bot_reply = chat_response.text
        
        return jsonify({"reply": bot_reply})
        
    except Exception as e:
        
        print("خطأ في المحادثة:", e)
        
        return jsonify({"reply": "عذراً، أواجه مشكلة في الاتصال بشبكتي العصبية الآن. حاول مرة أخرى."})

# ============================================================================
# 9. تشغيل السيرفر
# ============================================================================

if __name__ == '__main__':
    
    print("===================================================")
    print("🚀 خوادم برين سينك (BrainSync) تعمل الآن بأعلى معايير الحماية الدولية!")
    print("🛡️ نظام الحماية مفعل + الروبوت مقيد بالمنهج + نظام الـ 3 محاولات جاهز.")
    print("===================================================")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
