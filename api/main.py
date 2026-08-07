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

def get_gemini_url():
    key = os.environ["GEMINI_API_KEY"]
    return (
        "https://generativelanguage.googleapis.com/"
        f"v1beta/models/gemini-2.5-flash:generateContent?key={key}"
    )

@app.route('/api/analyze', methods=['POST', 'OPTIONS'])
@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    try:
        data = request.get_json()
        images_base64 = data.get('images_base64', [])
        if not images_base64 and data.get('image_base64'):
            images_base64 = [data.get('image_base64')]
            
        subject_title = data.get('subject')
        grade_year = data.get('year')
        mime_type = data.get('mime_type', 'image/jpeg')

        # هندسة البرومبت الصارم لفرض أعداد الأسئلة الآمنة (10-15 لكل قسم = 30-45 إجمالي) لمنع قطع الـ JSON
        prompt = "أنت الآن 'رئيس لجنة وضع الامتحانات' و'خبير المناهج التعليمية الأول' في منصة BrainSync.\n"
        prompt += "الهدف: تحليل محتوى الصور المرفوعة بدقة متناهية واستخراج بنك أسئلة شامل ومتدرج الصعوبة لتدريب الطالب، مع كتابة شرح مبسط للدرس.\n\n"
        prompt += "قواعد وأوامر صارمة وإجبارية لا تقبل الاستثناء أو الاختصار أبداً:\n"
        prompt += "1. قسم الاختيار من متعدد (MCQ): يجب استخراج من 10 إلى 15 سؤالاً. التوزيع الإجباري للصعوبة داخل هذا القسم: أسئلة (سهلة)، ثم أسئلة (متوسطة)، ثم بقية الأسئلة (معقدة وتتطلب تفكيراً علياً). كل سؤال يحتوي على 4 اختيارات في options، والإجابة الصحيحة في a، والشرح العلمي الوافي والتفصيلي في reason.\n"
        prompt += "2. قسم الصح والخطأ (TF): يجب استخراج من 10 إلى 15 سؤالاً. التوزيع الإجباري للصعوبة داخل هذا القسم: أسئلة (سهلة)، ثم أسئلة (متوسطة)، ثم بقية الأسئلة (معقدة). كتابة العبارة في q، والحكم عليها (صحيحة / خطأ) في a، والتفسير العلمي الوافي والتفصيلي لسبب الصح أو الخطأ في reason.\n"
        prompt += "3. قسم الأسئلة المقالية (Essay): يجب استخراج من 10 إلى 15 سؤالاً. التوزيع الإجباري للصعوبة داخل هذا القسم: أسئلة (سهلة)، ثم أسئلة (متوسطة)، ثم بقية الأسئلة (معقدة). تقديم إجابة نموذجية وافية ومفصلة جداً تناسب امتحانات الثانوية العامة في a، وشرح إضافي وافٍ في reason.\n"
        prompt += "4. الحد الأدنى الإجمالي للأسئلة في الملف هو 30 سؤالاً على الأقل (10 لكل قسم)، والحد الأقصى 45 سؤالاً (15 لكل قسم). إياك أن تختصر أو تقدم عدداً أقل، وتأكد من إغلاق تنسيق الـ JSON بشكل صحيح بالكامل.\n"
        prompt += "5. اكتب فقرة واحدة (من 3 إلى 4 أسطر) في brief_explanation تلخص الدرس بأسلوب مشوق للروبوت.\n\n"
        prompt += "يجب أن يكون الرد مصفوفة (JSON Object) متوافقة تماماً مع هذا التنسيق وبدون أي نصوص إضافية:\n"
        prompt += "{\n"
        prompt += "  \"brief_explanation\": \"اكتب الشرح المبسط هنا\",\n"
        prompt += "  \"qa_list\": [\n"
        prompt += "    {\"type\": \"MCQ\", \"q\": \"نص السؤال\", \"options\": [\"أ\", \"ب\", \"ج\", \"د\"], \"a\": \"الإجابة الصحيحة\", \"reason\": \"الشرح العلمي الوافي والتفصيلي\"},\n"
        prompt += "    {\"type\": \"TF\", \"q\": \"نص العبارة\", \"a\": \"صحيحة أو خطأ\", \"reason\": \"الشرح العلمي الوافي والتفصيلي\"},\n"
        prompt += "    {\"type\": \"Essay\", \"q\": \"نص السؤال\", \"a\": \"الإجابة النموذجية المفصلة\", \"reason\": \"الشرح العلمي الوافي والتفصيلي\"}\n"
        prompt += "  ]\n"
        prompt += "}\n\n"
        prompt += f"المادة: {subject_title}\n"
        prompt += f"الصف: {grade_year}"

        parts = [{"text": prompt}]
        for img_b64 in images_base64:
            parts.append({"inlineData": {"mimeType": mime_type, "data": img_b64}})

        # رفع سقف التوكينز للحد الأقصى لضمان عدم قطع الإجابة أثناء توليد العدد الكبير من الأسئلة
        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "maxOutputTokens": 8192,
                "temperature": 0.4
            }
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
