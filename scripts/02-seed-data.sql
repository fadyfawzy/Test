-- Insert sample admin user
INSERT INTO users (email, name, role) VALUES 
('admin@example.com', 'مدير النظام', 'admin'),
('leader@example.com', 'قائد الفريق', 'leader'),
('student@example.com', 'طالب تجريبي', 'student')
ON CONFLICT (email) DO NOTHING;

-- Insert sample questions
INSERT INTO questions (question_text, question_type, options, correct_answer, points, category, difficulty) VALUES 
(
  'ما هي عاصمة المملكة العربية السعودية؟',
  'multiple_choice',
  '["الرياض", "جدة", "الدمام", "مكة المكرمة"]',
  'الرياض',
  1,
  'جغرافيا',
  'easy'
),
(
  'كم عدد أركان الإسلام؟',
  'multiple_choice',
  '["3", "4", "5", "6"]',
  '5',
  1,
  'دين',
  'easy'
),
(
  'من هو مؤلف كتاب "الأسود يليق بك"؟',
  'multiple_choice',
  '["أحلام مستغانمي", "غادة السمان", "نوال السعداوي", "فاطمة المرنيسي"]',
  'أحلام مستغانمي',
  2,
  'أدب',
  'medium'
),
(
  'الشمس نجم.',
  'true_false',
  '["صحيح", "خطأ"]',
  'صحيح',
  1,
  'علوم',
  'easy'
),
(
  'اكتب مقالاً قصيراً عن أهمية التعليم في المجتمع.',
  'essay',
  null,
  null,
  5,
  'تعبير',
  'hard'
)
ON CONFLICT DO NOTHING;

-- Insert sample exam
INSERT INTO exams (title, description, duration_minutes, passing_score) VALUES 
('اختبار المعرفة العامة', 'اختبار شامل في المعرفة العامة والثقافة', 30, 70)
ON CONFLICT DO NOTHING;
