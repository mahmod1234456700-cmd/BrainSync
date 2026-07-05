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

# دالة لسحب المفتاح وقت الطلب لضمان قراءته بنجاح في بيئة Vercel
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
        image_base64 = data.get('image_base64')
        subject_title = data.get('subject')
        grade_year = data.get('year')
        mime_type = data.get('mime_type', 'image/jpeg')

        # هندسة البرومبتات الصارمة (90/10) - هرم بلوم (كما كتبتها أنت بالضبط)
        prompt = "أنت الآن 'رئيس لجنة وضع الامتحانات' و'خبير المناهج التعليمية الأول' في منصة إمبراطورية المعرفة.\n"
        prompt += "الهدف: تحليل محتوى الصورة المرفوعة بدقة متناهية واستخراج أسئلة بنسبة توقع 90% للامتحانات النهائية، مع ترك 10% لأسئلة الذكاء والربط التي تعتمد على فهم الطالب لشرح المدرس.\n\n"
        prompt += "يجب تطبيق الخوارزميات التالية بصرامة شديدة وعدم الخروج عنها أبداً:\n\n"
        prompt += "1. خوارزمية تحليل المحتوى الأساسية: اقرأ الصورة وصنف النص بداخلها إلى (تعريفات، قوانين، معادلات، أسباب، نتائج، مقارنات، خطوات، أمثلة، مصطلحات).\n"
        prompt += "2. خوارزمية استخراج الأسئلة: \n"
        prompt += "   - للتعريفات والمصطلحات: استخدم صيغة 'عرف...' أو 'ما المقصود بـ...'\n"
        prompt += "   - للأسباب: استخدم صيغة 'بم تفسر...' أو 'علل...'\n"
        prompt += "   - للنتائج: استخدم صيغة 'ما النتائج المترتبة على...'\n"
        prompt += "   - للخطوات: استخدم صيغة 'اذكر خطوات...'\n"
        prompt += "   - للمقارنات: استخدم صيغة 'قارن بين...'\n\n"
        prompt += "3. خوارزمية هرم بلوم (Bloom's Taxonomy) وصياغة الوزارة:\n"
        prompt += "   - 90% من الأسئلة يجب أن تكون (تذكر وتطبيق ومباشرة من النص) وتصاغ بأسلوب 'نموذج إجابة الوزارة الرسمي'.\n"
        prompt += "   - 10% من الأسئلة يجب أن تكون (تحليل وذكاء) تستخدم صيغ مثل 'ماذا يحدث إذا'، 'استنتج'، لتمييز الطالب الفاهم لشرح المدرس.\n\n"
        prompt += "4. خوارزمية ترتيب الأسئلة: قم بترتيب الأسئلة الناتجة من الأسهل (المباشر)، ثم المتوسط، ثم الأصعب (التفكير النقدي).\n"
        prompt += "5. خوارزمية مراجعة الجودة: تأكد من عدم تكرار أي سؤال أو إجابة، وأن الإجابة قاطعة ودقيقة وبدون أي حشو لغوي.\n\n"
        prompt += "تنبيه أمني صارم: إياك أن تخترع معلومات من خارج الصورة المرفوعة. التزم بالنص الموجود فيها فقط.\n\n"
        prompt += "يجب أن يكون الرد مصفوفة (JSON Array) فقط، متوافقة تماماً مع هذا التنسيق وبدون أي نصوص إضافية:\n"
        prompt += "[\n"
        prompt += "  {\"q\": \"السؤال بأسلوب الامتحان هنا\", \"a\": \"الإجابة النموذجية الدقيقة هنا\"}\n"
        prompt += "]\n\n"
        prompt += f"المادة: {subject_title}\n"
        prompt += f"الصف: {grade_year}"

        payload = {
            "contents": [{"parts": [{"text": prompt}, {"inlineData": {"mimeType": mime_type, "data": image_base64}}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }

        response = requests.post(get_gemini_url(), headers={'Content-Type': 'application/json'}, json=payload)
        response_data = response.json()
        
        # حماية إضافية: لو المفتاح غلط، السيرفر يرجعلك الخطأ الحقيقي بدل ما يقع
        if 'candidates' not in response_data:
             return jsonify({"error": f"خطأ من جوجل: {str(response_data)}"}), 500
             
        ai_response_text = response_data['candidates'][0]['content']['parts'][0]['text']
        clean_json = ai_response_text.replace("```json", "").replace("```", "").strip()
        qa_array = json.loads(clean_json)

        return jsonify({"subjectTitle": subject_title, "grade": grade_year, "qa_data": qa_array}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/chat', methods=['POST', 'OPTIONS'])
@app.route('/chat', methods=['POST', 'OPTIONS']) # مسار احتياطي
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

# نقطة فحص للسيرفر
@app.route('/', methods=['GET'])
@app.route('/api', methods=['GET'])
def health():
    return jsonify({"status": "سيرفر إمبراطورية المعرفة يعمل بنجاح 🚀"}), 200

if __name__ == '__main__':
    app.run()
