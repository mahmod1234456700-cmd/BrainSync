# ============================================================================
# المحرك الرسمي لمشروع إمبراطورية المعرفة (Backend - Python Flask on Vercel)
# ============================================================================

import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# =========================================================
# الدالة الجديدة كما طلبتها بالضبط
# =========================================================
def get_gemini_url():
    key = os.environ["GEMINI_API_KEY"]
    return (
        "https://generativelanguage.googleapis.com/"
        f"v1beta/models/gemini-2.5-flash:generateContent?key={key}"
    )

@app.route('/api/analyze', methods=['POST', 'OPTIONS'])
@app.route('/analyze', methods=['POST', 'OPTIONS']) # مسار احتياطي لمنع توهان Vercel
def analyze():
    # السماح بطلبات المتصفح المبدئية (CORS) لمنع خطأ فشل الاتصال
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    try:
        data = request.get_json()
        # استقبال قائمة من الصور (حتى 5 صور)
        images_base64 = data.get('images_base64', [])
        # دعم احتياطي لو الواجهة بعتت صورة واحدة
        if not images_base64 and data.get('image_base64'):
            images_base64 = [data.get('image_base64')]
            
        subject_title = data.get('subject')
        grade_year = data.get('year')
        mime_type = data.get('mime_type', 'image/jpeg')

        # هندسة البرومبتات الصارمة + طلب شرح مبسط للروبوت
        prompt = "أنت الآن 'رئيس لجنة وضع الامتحانات' و'خبير المناهج التعليمية الأول' في منصة إمبراطورية المعرفة.\n"
        prompt += "الهدف: تحليل محتوى الصور المرفوعة بدقة متناهية واستخراج أسئلة بنسبة توقع 90% للامتحانات النهائية، مع كتابة شرح مبسط جداً للدرس ليقوم الروبوت بقراءته للطالب.\n\n"
        prompt += "يجب تطبيق الخوارزميات التالية بصرامة شديدة وعدم الخروج عنها أبداً:\n"
        prompt += "1. خوارزمية تحليل المحتوى الأساسية: اقرأ الصور وصنف النص بداخلها.\n"
        prompt += "2. خوارزمية استخراج الأسئلة: استخدم صيغ 'عرف'، 'بم تفسر'، 'ما النتائج'، 'قارن'.\n"
        prompt += "3. خوارزمية هرم بلوم: 90% تذكر وتطبيق، 10% ذكاء وتحليل.\n"
        prompt += "4. خوارزمية الشرح المبسط: اكتب فقرة واحدة (من 3 إلى 4 أسطر كحد أقصى) تلخص أهم ما جاء في الدرس بأسلوب مشوق وسهل ليتم تحويله لصوت.\n\n"
        prompt += "تنبيه أمني: إياك أن تخترع معلومات من خارج الصور. التزم بالنص الموجود فيها فقط.\n\n"
        prompt += "يجب أن يكون الرد مصفوفة (JSON Object) متوافقة تماماً مع هذا التنسيق وبدون أي نصوص إضافية:\n"
        prompt += "{\n"
        prompt += "  \"brief_explanation\": \"اكتب الشرح المبسط هنا لكي ينطقه الروبوت\",\n"
        prompt += "  \"qa_list\": [\n"
        prompt += "    {\"q\": \"السؤال بأسلوب الامتحان هنا\", \"a\": \"الإجابة النموذجية الدقيقة هنا\"}\n"
        prompt += "  ]\n"
        prompt += "}\n\n"
        prompt += f"المادة: {subject_title}\n"
        prompt += f"الصف: {grade_year}"

        # إضافة كل الصور إلى الطلب الموجه لجوجل
        parts = [{"text": prompt}]
        for img_b64 in images_base64:
            parts.append({"inlineData": {"mimeType": mime_type, "data": img_b64}})

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {"responseMimeType": "application/json"}
        }

        response = requests.post(get_gemini_url(), headers={'Content-Type': 'application/json'}, json=payload)
        response_data = response.json()
        
        if 'candidates' not in response_data:
             return jsonify({"error": f"خطأ من جوجل: {str(response_data)}"}), 500
             
        ai_response_text = response_data['candidates'][0]['content']['parts'][0]['text']
        clean_json = ai_response_text.replace("```json", "").replace("```", "").strip()
        
        result_json = json.loads(clean_json)
        qa_array = result_json.get("qa_list", [])
        brief_explanation = result_json.get("brief_explanation", "تم تحليل الدرس بنجاح.")

        return jsonify({
            "subjectTitle": subject_title, 
            "grade": grade_year, 
            "qa_data": qa_array,
            "brief_explanation": brief_explanation
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/chat', methods=['POST', 'OPTIONS'])
@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    try:
        data = request.get_json()
        subject = data.get('subject')
        year = data.get('year')
        teacher_style = data.get('teacher_style', '')
        lesson_context = data.get('lesson_context', '')
        message = data.get('message')

        chat_prompt = "أنت مساعد تعليم ذكي بمنصة إمبراطورية المعرفة.\n"
        chat_prompt += f"المادة: {subject}\nالصف: {year}\n"
        if teacher_style:
            chat_prompt += f"أسلوب المعلم في الشرح: {teacher_style}\n"
        chat_prompt += f"محتوى الدرس المرفوع: {lesson_context}\n"
        chat_prompt += "تنبيه هام: أجب على سؤال الطالب بناءً على محتوى الدرس المرفوع فقط ولا تضف معلومات من خارج المنهج.\n"
        chat_prompt += f"سؤال الطالب: {message}"

        payload = {
            "contents": [{"parts": [{"text": chat_prompt}]}]
        }

        response = requests.post(get_gemini_url(), headers={'Content-Type': 'application/json'}, json=payload)
        response_data = response.json()
        
        if 'candidates' not in response_data:
             return jsonify({"error": f"خطأ من جوجل: {str(response_data)}"}), 500
             
        ai_reply = response_data['candidates'][0]['content']['parts'][0]['text']

        return jsonify({"reply": ai_reply}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
@app.route('/api', methods=['GET'])
def health():
    return jsonify({"status": "سيرفر إمبراطورية المعرفة يعمل بنجاح 🚀"}), 200

if __name__ == '__main__':
    app.run()
    
