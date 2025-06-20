import { Translation } from '../types';

const translations: Translation = {
  common: {
    welcome: 'أهلاً وسهلاً',
    language: 'اللغة',
    mockApi: 'واجهة برمجة تطبيقات وهمية',
    enableMockApi: 'تفعيل واجهة برمجة التطبيقات الوهمية',
    disableMockApi: 'إلغاء واجهة برمجة التطبيقات الوهمية',
    newChat: 'محادثة جديدة',
    deleteChat: 'حذف المحادثة',
    edit: 'تحرير',
    delete: 'حذف',
    share: 'مشاركة',
    refresh: 'تحديث',
    send: 'إرسال',
    stop: 'إيقاف',
    discard: 'إلغاء',
    loading: 'جاري التحميل...',
    copy: 'نسخ',
    copied: 'تم النسخ!',
    more: 'المزيد',
    like: 'إعجاب',
    dislike: 'عدم إعجاب',
    rawKeys: 'المفاتيح الخام',
    thinking: 'يفكر...',
  },
  header: {
    title: 'iAgent',
    subtitle: 'شريكك الذكي في المحادثة',
    changeLanguage: 'تغيير اللغة',
  },
  errors: {
    loading: 'خطأ في تحميل الترجمات',
    unsupported: 'لغة غير مدعومة',
    failedToLoad: 'فشل في تحميل المحتوى',
    tryAgain: 'يرجى المحاولة مرة أخرى',
    general: 'حدث خطأ',
    network: 'خطأ في الشبكة',
    streaming: 'خطأ في التدفق: {{error}}',
    chatError: 'عذراً، واجهت خطأ. يرجى المحاولة مرة أخرى.',
  },
  chat: {
    placeholder: 'رسالة إلى iAgent...',
    emptyState: 'ستظهر محادثاتك هنا',
    emptyStateSuggestion1: 'كيف يمكنك مساعدتي؟',
    emptyStateSuggestion2: 'أخبرني عن نفسك',
    thinking: 'يفكر...',
    error: 'عذراً، واجهت خطأ. يرجى المحاولة مرة أخرى.',
    shareTitle: 'رسالة المحادثة',
    copySuccess: 'تم نسخ الرسالة إلى الحافظة',
    copyError: 'فشل في نسخ الرسالة',
    deleteConfirm: 'هل أنت متأكد من أنك تريد حذف هذه الرسالة؟',
    editConfirm: 'هل أنت متأكد من أنك تريد تحرير هذه الرسالة؟',
    shareSuccess: 'تم مشاركة الرسالة بنجاح',
    shareError: 'فشل في مشاركة الرسالة',
    suggestions: {
      title: 'ابدأ محادثة',
      items: [
        'اشرح الحوسبة الكمية',
        'اكتب قصة إبداعية',
        'ساعد في البرمجة',
        'خطط لرحلة'
      ]
    },
    welcome: {
      title: 'مرحباً بك في iAgent',
      subtitle: 'كيف يمكنني مساعدتك اليوم؟',
      description: 'يمكنني مساعدتك في الأسئلة والكتابة والتحليل والبرمجة والمشاريع الإبداعية.',
    },
    disclaimer: 'قد يرتكب الذكاء الاصطناعي أخطاء. تحقق من المعلومات المهمة.',
    typing: 'الذكاء الاصطناعي يكتب...',
  },
  theme: {
    light: 'الوضع الفاتح',
    dark: 'الوضع الداكن',
  },
  message: {
    user: 'أنت',
    assistant: 'iAgent',
    streaming: 'يتدفق...',
    copy: 'نسخ الرسالة',
    copied: 'تم النسخ!',
    refresh: 'تحديث الرسالة',
    edit: 'تحرير الرسالة',
    delete: 'حذف الرسالة',
    share: 'مشاركة الرسالة',
    more: 'المزيد من الإجراءات',
    like: 'إعجاب',
    dislike: 'عدم إعجاب',
    removeLike: 'إزالة الإعجاب',
    removeDislike: 'إزالة عدم الإعجاب',
    goodResponse: 'استجابة جيدة',
    badResponse: 'استجابة سيئة',
    regenerateResponse: 'إعادة توليد الاستجابة',
  },
  sidebar: {
    newChat: 'محادثة جديدة',
    newChatTitle: 'محادثة جديدة',
    conversations: 'المحادثات',
    emptyState: 'ستظهر محادثاتك هنا',
    deleteConversation: 'حذف المحادثة',
    renameConversation: 'إعادة تسمية المحادثة',
    editTitle: 'تحرير العنوان',
    saveTitle: 'حفظ',
    cancelEdit: 'إلغاء',
  },
  input: {
    placeholder: 'رسالة إلى iAgent...',
    disclaimer: 'الذكاء الاصطناعي قد يخطئ. تحقق من المعلومات المهمة.',
    send: 'إرسال رسالة',
    stop: 'إيقاف التوليد',
    clear: 'مسح الإدخال',
    voice: 'إدخال صوتي',
    attachment: 'إرفاق ملف',
    selectCountries: 'اختر البلدان',
    examples: [
      'كيف يمكنك مساعدتي؟',
      'اشرح الحاسوب الكمي ببساطة',
      'اكتب قصة قصيرة إبداعية',
      'ساعدني في إصلاح هذا الكود',
      'خطط لرحلة نهاية أسبوع إلى باريس',
      'أنشئ روتين تمارين',
      'اشرح مفاهيم تعلم الآلة',
      'اكتب بريد إلكتروني مهني',
      'ساعد في واجبات الرياضيات',
      'أنشئ أفكار إبداعية لـ...'
    ],
  },
  actions: {
    toggleSidebar: 'تبديل الشريط الجانبي',
    toggleTheme: 'تبديل المظهر',
    newConversation: 'محادثة جديدة',
    deleteConversation: 'حذف المحادثة',
    shareConversation: 'مشاركة المحادثة',
    exportConversation: 'تصدير المحادثة',
  },
  mock: {
    greeting: `مرحباً! أنا مساعد ذكي اصطناعي من إنتاج Anthropic. أنا هنا لمساعدتك في مجموعة واسعة من المهام بما في ذلك:

- **الإجابة على الأسئلة** في مواضيع مثل العلوم والتاريخ والأحداث الجارية وغيرها
- **المساعدة في الكتابة** بما في ذلك المقالات والكتابة الإبداعية والتواصل المهني
- **التحليل والبحث** لمساعدتك في فهم المواضيع المعقدة
- **المساعدة في البرمجة** مع أسئلة الكود وإصلاح الأخطاء
- **الرياضيات والحسابات** من الحساب الأساسي إلى المفاهيم المتقدمة
- **المشاريع الإبداعية** مثل العصف الذهني ورواية القصص وتوليد الأفكار

أسعى لأن أكون مفيداً وغير ضار وصادق في جميع تفاعلاتي. يمكنني إجراء محادثات معقدة مع كوني مباشراً عند الحاجة.

ما الذي تود استكشافه معاً اليوم؟`,
    technical: `يمكنني بالتأكيد مساعدتك في المواضيع التقنية! إليك بعض المجالات التي أتفوق فيها:

## البرمجة والتطوير
- **اللغات**: Python, JavaScript, TypeScript, Java, C++, Rust وغيرها الكثير
- **تطوير الويب**: React, Vue, Angular, Node.js, Express, Next.js
- **الخادم الخلفي**: واجهات برمجة التطبيقات، قواعد البيانات، الخدمات المصغرة، البنية بدون خادم
- **DevOps**: Docker, Kubernetes, CI/CD, منصات السحابة (AWS, Azure, GCP)

## تصميم الأنظمة والبنية
- أنماط تصميم الأنظمة القابلة للتوسع
- تصميم وتحسين قواعد البيانات
- ضبط الأداء والمراقبة
- أفضل ممارسات الأمان

## البيانات والذكاء الاصطناعي
- أساسيات التعلم الآلي
- تحليل البيانات والتصور
- SQL وتحسين قواعد البيانات
- الإحصاء ومفاهيم علم البيانات

يمكنني المساعدة في مراجعة الكود وإصلاح الأخطاء وقرارات البنية أو شرح المفاهيم التقنية المعقدة. ما التحدي التقني المحدد الذي تعمل عليه؟`,
    explanation: `سؤال ممتاز! دعني أوضح هذا بطريقة واضحة وشاملة:

## فهم المفهوم

عندما نتعامل مع مواضيع معقدة، من المفيد التعامل معها بشكل منهجي. إليك كيف أنظم التفسيرات عادة:

### 1. **المبادئ الأساسية**
أولاً، أحدد المفاهيم الأساسية التي تقوم عليها الموضوع. هذه هي اللبنات الأساسية التي يُبنى عليها كل شيء آخر.

### 2. **السياق والخلفية**
فهم من أين يأتي شيء ما ولماذا يوجد يساعد في إنشاء إطار ذهني للتعلم.

### 3. **التطبيقات العملية**
الأمثلة من العالم الحقيقي تجعل المفاهيم المجردة ملموسة ولا تُنسى.

### 4. **المفاهيم الخاطئة الشائعة**
معالجة سوء الفهم المتكرر يساعد في تجنب الالتباس وبناء فهم أعمق.

## الفوائد الرئيسية لهذا النهج

- **الوضوح**: تفكيك الأشياء يجعل الأفكار المعقدة في متناول الجميع
- **الاحتفاظ**: التعلم المنظم يحسن الذاكرة طويلة المدى
- **التطبيق**: فهم المبادئ يمكّن من حل المشاكل الإبداعي

هل تود أن أطبق هذا الإطار على موضوع محدد تشعر بالفضول حوله؟ أنا هنا لمساعدتك في توضيح أي مفهوم!`,
    creative: `سأكون سعيداً لمساعدتك في مشروعك الإبداعي! الإبداع هو أحد المجالات المفضلة لدي للاستكشاف. إليك بعض الطرق التي يمكنني المساعدة بها:

## الكتابة ورواية القصص
- **النثر**: تطوير الشخصيات، هياكل الحبكة، كتابة الحوار
- **الشعر**: أشكال مختلفة، الوزن، الصور، وألعاب الكلمات
- **كتابة السيناريو**: بناء المشاهد، أقواس الشخصيات، التنسيق
- **النثر الإبداعي غير الخيالي**: المقالات الشخصية، المذكرات، كتابة السفر

## العصف الذهني وتوليد الأفكار
- **تطوير المفاهيم**: تحويل الأفكار الغامضة إلى خطط ملموسة
- **بناء العوالم**: إنشاء أكوان خيالية غنية ومتسقة
- **حل المشاكل**: إيجاد زوايا فريدة ووجهات نظر جديدة
- **التمارين الإبداعية**: المحفزات والتقنيات لإثارة الإلهام

## إنشاء المحتوى
- **منشورات المدونة والمقالات**: محتوى جذاب ومفيد
- **النسخ التسويقية**: رسائل مقنعة تلقى صدى
- **وسائل التواصل الاجتماعي**: منشورات إبداعية تجذب الانتباه
- **العروض التقديمية**: جعل المعلومات المعقدة جذابة

## التعاون الإبداعي

يمكنني أن أعمل كشريك إبداعي، وأقدم:
- وجهات نظر جديدة حول أفكارك الحالية
- ملاحظات بناءة على المسودات والمفاهيم
- نهج بديلة عندما تكون عالقاً
- التشجيع والدافع طوال العملية

ما نوع المشروع الإبداعي الذي تعمل عليه؟ أنا متحمس لمساعدتك في تحقيق رؤيتك!`,
    default: `أفهم أنك تسأل عن "{input}". دعني أقدم استجابة شاملة تغطي الجوانب الرئيسية لهذا الموضوع.

## النقاط الرئيسية للنظر فيها

عند التعامل مع هذا الموضوع، هناك عدة عوامل مهمة يجب وضعها في الاعتبار:

- **السياق مهم**: فهم الصورة الأكبر يساعد في تأطير التفاصيل المحددة
- **وجهات نظر متعددة**: وجهات النظر المختلفة يمكن أن توفر رؤى قيمة
- **الآثار العملية**: كيف ينطبق هذا على المواقف في العالم الحقيقي
- **المفاهيم ذات الصلة**: الروابط مع الأفكار الأخرى التي قد تكون ذات صلة

## التحليل المفصل

بناءً على سؤالك، أرى أن هذا يتطرق إلى عدة مجالات مثيرة للاهتمام. العلاقات بين العناصر المختلفة هنا معقدة جداً، ومن المفيد استكشاف كيف تؤثر على بعضها البعض.

هناك اعتبارات فورية وآثار طويلة المدى للتفكير فيها. الجوانب الفورية تشمل فهم التأثيرات والاستجابات المباشرة، بينما النظرة طويلة المدى تساعدنا في رؤية الأنماط والاتجاهات التي قد لا تكون واضحة في النظرة الأولى.

## المضي قدماً

سأكون سعيداً للتعمق أكثر في أي جانب محدد من هذا الموضوع يثير اهتمامك أكثر. سواء كنت تبحث عن:
- تفسيرات أكثر تفصيلاً لمفاهيم معينة
- أمثلة عملية وتطبيقات
- مواضيع ذات صلة قد تكون مفيدة للاستكشاف
- نهج مختلفة للتفكير في هذا الموضوع

فقط أخبرني أي اتجاه تود أن نأخذ هذه المحادثة إليه، وسأقوم بتخصيص استجابتي وفقاً لذلك!`,
  },
  countries: {
    palestine: 'فلسطين',
    lebanon: 'لبنان',
    saudi_arabia: 'السعودية',
    iraq: 'العراق',
    syria: 'سوريا',
    jordan: 'الأردن',
    egypt: 'مصر',
    israel: 'إسرائيل',
  },
  tools: {
    toolX: 'أداة X',
    toolY: 'أداة Y',
    toolZ: 'أداة Z',
  },
  dateRange: {
    minutes: 'دقائق',
    hours: 'ساعات',
    days: 'أيام',
    weeks: 'أسابيع',
    months: 'أشهر',
    years: 'سنوات',
    ago: 'مضت',
    customRange: 'نطاق مخصص',
    datePicker: 'منتقي التاريخ',
    customRangeTitle: 'تعيين نطاق زمني مخصص',
    datePickerTitle: 'اختر نطاق التاريخ',
    startDate: 'تاريخ البداية',
    endDate: 'تاريخ النهاية',
    apply: 'تطبيق',
    reset: 'إعادة تعيين',
  },
};

export default translations; 