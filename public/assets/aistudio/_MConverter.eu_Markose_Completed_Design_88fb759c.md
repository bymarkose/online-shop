# Markose --- وثيقة تصميم المرحلة 1 {#markose-وثيقة-تصميم-المرحلة-1}

[النسخة 1.0 · 28 أكتوبر 2026 · الحالة: للمراجعة قبل بدء المرحلة 2]{dir="rtl"}

## [0. حدود هذه الوثيقة]{dir="rtl"} {#حدود-هذه-الوثيقة}

[هذه مخرجات «المرحلة 1: التحليل والتصميم» من خطة التنفيذ، وهي تصميم قابل للمراجعة قبل كتابة أي كود.]{dir="rtl"}

- [لم يُنشأ كود ولا قاعدة بيانات ولا نشر بعد. كل ما هنا تصميم لم يُختبر.]{dir="rtl"}

- [لا أثبّت إصدارات المكتبات هنا. تبدأ المرحلة 2 بفحص التوافق الفعلي بين Node.js وNext.js وPrisma من الوثائق الرسمية، ثم تُثبَّت الإصدارات مع توثيق السبب.]{dir="rtl"}

- [ما أضفته أو غيّرته عن المواصفة موسوم بـ \[تعديل مقترح\]، وهو مجمّع في القسم 16 لتوافق عليه أو ترفضه.]{dir="rtl"}

- [أسماء الجداول والحقول والحالات بالإنجليزية كما في المواصفة، والرسائل الموجّهة للمستخدم بالعربية.]{dir="rtl"}

## [1. القرارات المعمارية الرئيسية]{dir="rtl"} {#القرارات-المعمارية-الرئيسية}

| \# | [القرار]{dir="rtl"} | [الاختيار]{dir="rtl"} | [السبب]{dir="rtl"} |
|----|----|----|----|
| 1 | [شكل التطبيق]{dir="rtl"} | [تطبيق Next.js واحد (monolith) بطبقات مفصولة]{dir="rtl"} | [مستخدم واحد؛ لا مبرر لخدمات منفصلة]{dir="rtl"} |
| 2 | [وقت التشغيل]{dir="rtl"} | Node.js runtime لكل Route Handlers | Prisma والتشفير وأقفال PostgreSQL تحتاجه |
| 3 | [الأموال]{dir="rtl"} | NUMERIC(12,2) في القاعدة، وحساب عشري دقيق في الكود، وسلاسل نصية في JSON | [لا floating point إطلاقًا]{dir="rtl"} |
| 4 | [الوقت]{dir="rtl"} | TIMESTAMPTZ (UTC)، والعرض والتقارير بتوقيت Africa/Cairo | [حدود «اليوم» في التقارير يجب أن تطابق يوم العمل الفعلي]{dir="rtl"} |
| 5 | [الجلسات]{dir="rtl"} | [جلسات في قاعدة البيانات + Cookie من نوع HttpOnly]{dir="rtl"} | [تسجيل الخروج يُبطل الجلسة فعليًا]{dir="rtl"} |
| 6 | [منع التكرار]{dir="rtl"} | [مستويان: Idempotency آلي + طلب محتمل تكراره للمراجعة البشرية]{dir="rtl"} | [إعادة إرسال النموذج ≠ عميل يريد طلبين]{dir="rtl"} |
| 7 | [الحذف]{dir="rtl"} | [لا حذف نهائي للطلبات؛ إلغاء فقط، والتاريخ غير قابل للتعديل]{dir="rtl"} | [تتبع مالي وتشغيلي موثوق]{dir="rtl"} |
| 8 | [التحقق]{dir="rtl"} | [مخططات Zod واحدة تغذي الـ API والواجهة وملف OpenAPI]{dir="rtl"} | [منع انحراف العقد عن الكود]{dir="rtl"} |

## [2. المعمارية المقترحة]{dir="rtl"} {#المعمارية-المقترحة}

flowchart LR\
subgraph APP\[Next.js app - Node runtime\]\
H\[HTTP layer\] \--\> V\[Validation - Zod\]\
V \--\> S\[Services\]\
S \--\> D\[Data access - Prisma\]\
end\
LP\[Landing pages\] \--\>\|POST public orders\| H\
OWN\[Owner browser\] \--\>\|session cookie\| H\
D \--\> PG\[(PostgreSQL)\]

[قواعد الفصل بين الطبقات]{dir="rtl"}

- [طبقة HTTP رقيقة: تقرأ الطلب، وتتحقق بـ Zod، وتستدعي service واحدة، وتحوّل النتيجة أو AppError إلى JSON موحّد.]{dir="rtl"}

- [الـ services لا تستورد شيئًا من next/\* ولا تعرف Request، لذلك تُختبر مباشرة دون تشغيل خادم.]{dir="rtl"}

- [الوصول إلى قاعدة البيانات عبر lib/db فقط، والمعاملات تُفتح داخل الـ service لا داخل الـ handler.]{dir="rtl"}

- [الواجهة: صفحات القراءة (Server Components) تستدعي الـ services مباشرة، أما التعديلات فتمر عبر /api/v1 نفسه الذي تغطيه الاختبارات، فلا يوجد مسار تعديل ثانٍ بلا اختبار.]{dir="rtl"}

- [الأخطاء المتوقعة كلها AppError(code, status, message)؛ أي خطأ آخر يصبح 500 برسالة عامة وrequest_id فقط.]{dir="rtl"}

[هيكل المشروع (يوسّع هيكل المواصفة)]{dir="rtl"}

app/\
(auth)/login\
(admin)/dashboard orders customers products landing-pages\
campaigns tasks reports audit settings\
api/v1/ public/orders auth orders customers products\
landing-pages campaigns dashboard follow-ups settings\
components/ reusable UI: DataTable, FilterBar, StatusBadge \...\
features/ orders customers products landing-pages campaigns\
analytics duplicates shipping\
lib/ auth validation security db services\
errors money phone time\
prisma/ schema.prisma, migrations/, seed.dev.ts\
scripts/ create-admin, backup, restore-test\
tests/ unit, integration, e2e\
docs/ design.md, erd.md, openapi.yaml, runbook.md

[\[تعديل مقترح\] أضفتُ features/duplicates وfeatures/shipping ومجلدات lib الخاصة بالمال والهاتف والوقت والأخطاء، ومجلد scripts/.]{dir="rtl"}

## [3. تدفق استقبال الطلب (صفحة الهبوط ← قاعدة البيانات)]{dir="rtl"} {#تدفق-استقبال-الطلب-صفحة-الهبوط-قاعدة-البيانات}

flowchart TD\
A\[Form submit with Idempotency-Key\] \--\> B\[CORS, body size, rate limit\]\
B \--\> C{Honeypot and CAPTCHA ok}\
C \-- no \--\> X1\[403 or silent discard\]\
C \-- yes \--\> D\[Zod validation and phone normalization\]\
D \-- invalid \--\> X2\[422 VALIDATION_ERROR\]\
D \-- valid \--\> E\[Resolve landing page by public id - active and origin allowed\]\
E \-- fail \--\> X3\[404 or 403\]\
E \-- ok \--\> F\[Load products - active and allowed on this page\]\
F \-- fail \--\> X4\[422 PRODUCT_NOT_AVAILABLE\]\
F \-- ok \--\> G\[Server-side pricing - items, discount, shipping, total\]\
G \--\> T1\[\[BEGIN TRANSACTION\]\]\
T1 \--\> I\[INSERT idempotency record ON CONFLICT DO NOTHING\]\
I \-- conflict \--\> J{Same request hash}\
J \-- no \--\> X5\[409 IDEMPOTENCY_KEY_REUSED\]\
J \-- yes \--\> K\[Return stored response with Idempotent-Replay header\]\
I \-- inserted \--\> L\[Advisory lock on normalized phone\]\
L \--\> M\[Find or create customer\]\
M \--\> N\[Detect repeat customer or possible duplicate\]\
N \--\> O\[Allocate order_number from yearly counter\]\
O \--\> P\[INSERT order, items, status history NEW, audit\]\
P \--\> Q\[Store response in idempotency record\]\
Q \--\> T2\[\[COMMIT\]\]\
T2 \--\> R\[201 with order_number\]

[ملاحظات على التدفق]{dir="rtl"}

1.  [الأسعار تُحسب في الخادم من القاعدة فقط. أي سعر أو خصم أو إجمالي يصل من المتصفح يُتجاهل ولا يُعاد في الاستجابة.]{dir="rtl"}

2.  [الإسناد الإعلاني لا يرفض الطلب أبدًا. كود حملة غير معروف ⇒ campaign_id = NULL مع حفظ UTM كما وصلت؛ الطلب الحقيقي أهم من دقة الإسناد.]{dir="rtl"}

3.  [كل شيء داخل المعاملة أو لا شيء. فشل أي خطوة ⇒ rollback كامل، فلا طلب بلا عناصر ولا عناصر بلا طلب، ولا يبقى سجل Idempotency لطلب لم يُحفظ.]{dir="rtl"}

4.  [الاستجابة لا تكشف شيئًا داخليًا. لا بيانات عملاء آخرين ولا رسائل استثناءات؛ الخطأ برمز ثابت وrequest_id.]{dir="rtl"}

5.  [العميل: يُبحث عنه بـ normalized_phone تحت قفل استشاري على الهاتف (advisory lock) حتى لا يُنشأ عميلان مكرران عند طلبين متزامنين، دون فرض UNIQUE على الهاتف كما تشترط المواصفة.]{dir="rtl"}

## [4. نموذج البيانات]{dir="rtl"} {#نموذج-البيانات}

### [4.1 مخطط ERD]{dir="rtl"} {#مخطط-erd}

[يعرض العلاقات والحقول الأهم فقط؛ التعريف الكامل للأعمدة كما في المواصفة مع الإضافات في 4.2.]{dir="rtl"}

erDiagram\
users \|\|\--o{ sessions : has\
users \|\|\--o{ audit_logs : performs\
products \|\|\--o{ landing_page_products : listed_in\
landing_pages \|\|\--o{ landing_page_products : offers\
landing_pages \|\|\--o{ campaigns : runs\
landing_pages \|\|\--o{ api_credentials : keys\
landing_pages \|\|\--o{ orders : receives\
landing_pages \|\|\--o{ idempotency_records : scopes\
campaigns \|o\--o{ orders : attributes\
customers \|\|\--o{ orders : places\
customers \|\|\--o{ customer_interactions : has\
orders \|\|\--\|{ order_items : contains\
products \|\|\--o{ order_items : snapshotted_in\
orders \|\|\--o{ order_status_history : logs\
orders \|\|\--o{ customer_interactions : about\
orders \|\|\--o{ follow_up_tasks : schedules\
orders \|\|\--o{ shipping_events : tracks\
orders \|\|\--o{ duplicate_flags : flagged_as\
orders {\
uuid id PK\
text order_number UK\
uuid customer_id FK\
uuid landing_page_id FK\
uuid campaign_id FK\
order_status status\
numeric subtotal\
numeric discount_amount\
numeric shipping_fee\
numeric total_amount\
char3 currency\
text ship_governorate\
text ship_address\
text idempotency_key\
text duplicate_review_status\
int version\
boolean is_test\
timestamptz created_at\
timestamptz returned_at\
}\
order_items {\
uuid id PK\
uuid order_id FK\
uuid product_id FK\
text product_name_snapshot\
text sku_snapshot\
numeric unit_price_snapshot\
int quantity\
numeric line_discount\
numeric line_total\
}\
customers {\
uuid id PK\
text full_name\
text phone\
text normalized_phone\
text governorate\
text city\
text address\
}\
landing_pages {\
uuid id PK\
text name\
text slug UK\
text public_id UK\
text_array allowed_origins\
numeric default_shipping_fee\
boolean captcha_required\
boolean is_active\
}\
idempotency_records {\
uuid id PK\
uuid source_id FK\
text idempotency_key\
text request_hash\
int response_status\
jsonb response_body\
timestamptz expires_at\
}\
duplicate_flags {\
uuid id PK\
uuid order_id FK\
uuid matched_order_id FK\
text status\
uuid resolved_by\
timestamptz resolved_at\
}\
order_counters {\
int year PK\
int last_value\
}\
settings {\
text key PK\
jsonb value\
}

### [4.2 الإضافات والتعديلات على جداول المواصفة]{dir="rtl"} {#الإضافات-والتعديلات-على-جداول-المواصفة}

| [التعديل]{dir="rtl"} | [السبب]{dir="rtl"} |
|----|----|
| [جدول landing_page_products (landing_page_id، product_id، price_override، is_default، max_quantity، sort_order) \[تعديل مقترح\]]{dir="rtl"} | [المواصفة تسمح لصفحة بعدة منتجات؛ نحتاجه للتحقق من أن المنتج المطلوب مسموح من هذه الصفحة]{dir="rtl"} |
| [لقطة عنوان التسليم داخل الطلب: orders.ship_name وship_phone وship_alt_phone وship_governorate وship_city وship_address وship_address_details \[تعديل مقترح\]]{dir="rtl"} | [العميل المتكرر قد يغيّر عنوانه؛ تعديل customers يجب ألا يغيّر عنوان تسليم طلب قديم]{dir="rtl"} |
| orders.returned_at وorders.version وorders.is_test **\[تعديل مقترح\]** | returned_at لازم لصافي المبيعات؛ version يمنع تعارض التعديل المتزامن؛ is_test يستبعد الطلبات التجريبية من المؤشرات |
| [جدول duplicate_flags \[تعديل مقترح\]]{dir="rtl"} | [يسجّل قرار المراجعة (ليس مكررًا / مكرر) مع الطلب المطابق، كما تشترط المواصفة]{dir="rtl"} |
| [جدول order_counters (year، last_value) \[تعديل مقترح\]]{dir="rtl"} | [ترقيم ORD-2026-000001 بلا فجوات وبأمان مع التزامن]{dir="rtl"} |
| [جدول sessions \[تعديل مقترح\]]{dir="rtl"} | [جلسات قابلة للإبطال (قد تديره مكتبة المصادقة نفسها)]{dir="rtl"} |
| [جدول settings (key، value jsonb) \[تعديل مقترح\]]{dir="rtl"} | [العملة الافتراضية القابلة للتغيير، نافذة التكرار، حدود المعدل، تأخير المتابعة]{dir="rtl"} |
| landing_pages.allowed_origins (مصفوفة) بدل allowed_origin واحد، وcaptcha_required **\[تعديل مقترح\]** | [نطاق www وبدونه ونطاقات المعاينة؛ وتفعيل CAPTCHA لكل صفحة عند الحاجة فقط]{dir="rtl"} |
| campaigns.public_id **\[تعديل مقترح\]** | [الصفحة ترسل معرّفًا عامًا للحملة لا مفتاحها الأساسي]{dir="rtl"} |
| api_credentials: هاش مفتاح عشوائي بدل توقيع HMAC **\[تعديل مقترح\]** | [التحقق من HMAC يحتاج السر نفسه لا هاشه (انظر 9.3)]{dir="rtl"} |

### [4.3 القيود والفهارس والترقيم]{dir="rtl"} {#القيود-والفهارس-والترقيم}

[القيود]{dir="rtl"}

- CHECK: quantity BETWEEN 1 AND 1000، unit_price_snapshot \>= 0، line_discount بين صفر وقيمة السطر، discount_amount بين صفر وsubtotal، shipping_fee \>= 0، وtotal_amount = subtotal - discount_amount + shipping_fee.

- UNIQUE: orders.order_number، products.sku، landing_pages.slug وpublic_id، campaigns.public_id، api_credentials.public_key_id، landing_page_products(landing_page_id, product_id)، idempotency_records(source_id, idempotency_key).

- [المفاتيح الخارجية ON DELETE RESTRICT في كل ما يخص الطلبات؛ لا يُحذف منتج أو عميل له طلبات، بل يُعطَّل is_active.]{dir="rtl"}

- order_status_history وaudit_logs للإلحاق فقط: محفّز (trigger) يرفض UPDATE وDELETE، فالحماية على مستوى القاعدة لا الواجهة وحدها.

[الفهارس]{dir="rtl"}

orders(status, created_at DESC)، orders(landing_page_id, created_at DESC)، orders(campaign_id)، orders(customer_id)، customers(normalized_phone) (غير فريد)، order_items(order_id)، order_items(product_id)، follow_up_tasks(status, due_at)، order_status_history(order_id, created_at)، audit_logs(entity_type, entity_id, created_at). للبحث النصي بالاسم ورقم الطلب: pg_trgm (GIN)، مع تحسين لاحق لتوحيد الحروف العربية (ا/أ/إ، ة/ه، ى/ي، وإزالة التشكيل).

[ملاحظات تنفيذية]{dir="rtl"}

- [ترقيم الطلبات: يُزاد order_counters بـ INSERT ... ON CONFLICT (year) DO UPDATE ... RETURNING داخل معاملة الطلب نفسها، فيتراجع مع أي فشل (لا فجوات)، ويُحجز في آخر خطوة قبل إدراج الطلب لتقصير زمن القفل. السنة بتوقيت Africa/Cairo.]{dir="rtl"}

- **Prisma:** في الإصدارات التي أعرفها لا يعبّر schema.prisma عن CHECK والمحفزات وفهارس pg_trgm، فتُكتب في ملفات migration SQL يدوية تُراجَع قبل تطبيقها. يُتحقق من ذلك في المرحلة 2 مقابل وثائق الإصدار المختار.

- [بيانات التطوير: prisma/seed.dev.ts يرفض العمل إلا على قاعدة محلية (فحص المضيف وAPP_ENV). المسموح إدخاله آليًا في الإنتاج: الإعدادات الافتراضية وقائمة المحافظات فقط.]{dir="rtl"}

- [قاعدة الاختبار: منفصلة (DATABASE_URL_TEST)، وإعداد الاختبارات يرفض التشغيل إن لم ينتهِ اسم القاعدة بـ \_test.]{dir="rtl"}

### **4.4 تعريف الجداول غير المفصلة \[استكمال مقترح\]** {#تعريف-الجداول-غير-المفصلة-استكمال-مقترح}

يوضح الجدول التالي الحد الأدنى المقترح للحقول التي يشير إليها ERD أو عقد API دون تعريف كامل. هذه تفاصيل تصميم مضافة للمراجعة؛ يجب ترجمتها إلى Prisma/SQL بعد حسم القرارات المفتوحة. أسماء الحقول التقنية تبقى بالإنجليزية.

| **الجدول** | **الحقول والقيود الأساسية المقترحة** |
|---:|----|
| users | id UUID PK؛ email UNIQUE بعد التطبيع إلى lowercase؛ password_hash؛ display_name؛ is_active؛ created_at؛ updated_at؛ last_login_at nullable. الحساب الوحيد في MVP هو المالك. |
| sessions | id UUID PK؛ user_id FK؛ token_hash UNIQUE (لا تخزّن Cookie الخام)؛ created_at؛ expires_at؛ last_seen_at؛ revoked_at nullable. انتهاء الجلسة وإبطالها يتحققان على الخادم. |
| products | id UUID PK؛ name؛ sku UNIQUE؛ description nullable؛ current_price NUMERIC(12,2)؛ currency CHAR(3)؛ is_active؛ created_at؛ updated_at؛ created_by/updated_by nullable. |
| landing_pages | id UUID PK؛ name؛ slug UNIQUE؛ public_id UNIQUE وعشوائي غير متسلسل؛ allowed_origins TEXT\[\]؛ default_shipping_fee NUMERIC(12,2)؛ captcha_required؛ is_active؛ created_at؛ updated_at. |
| landing_page_products | landing_page_id FK + product_id FK بمفتاح مركّب PK؛ price_override NUMERIC(12,2) nullable؛ is_default؛ max_quantity؛ sort_order. CHECK للأسعار غير السالبة والكمية من 1 إلى الحد الأقصى. |
| campaigns | id UUID PK؛ landing_page_id FK؛ public_id UNIQUE؛ name؛ source/medium/campaign/content/term الاختيارية؛ is_active؛ created_at؛ updated_at. لا يُرفض الطلب إذا لم يُعرف campaign_id الوارد. |
| api_credentials | id UUID PK؛ landing_page_id FK؛ public_key_id UNIQUE؛ secret_hash؛ label؛ scopes TEXT\[\]؛ is_active؛ created_at؛ expires_at/revoked_at/last_used_at. السر العشوائي يُعرض مرة واحدة؛ لا يُخزَّن السر الخام. المفاتيح لخدمات موثوقة فقط ولا توضع في المتصفح. |
| customers | id UUID PK؛ full_name؛ phone كما أدخله المستخدم؛ normalized_phone بصيغة E.164؛ governorate؛ city؛ address؛ alternate_phone nullable؛ created_at؛ updated_at. normalized_phone غير فريد حسب المواصفة؛ تنسيق الوصول المتزامن بقفل استشاري. |
| orders | id UUID PK؛ order_number UNIQUE؛ customer_id/landing_page_id FK؛ campaign_id FK nullable؛ status؛ subtotal/discount_amount/shipping_fee/total_amount NUMERIC(12,2)؛ currency CHAR(3)؛ بيانات إسناد UTM وad_click_id؛ customer_notes؛ حقول لقطة الشحن ship_name/ship_phone/ship_alt_phone/ship_governorate/ship_city/ship_address/ship_address_details؛ idempotency_key؛ duplicate_review_status؛ version؛ is_test؛ created_at/updated_at؛ confirmed_at/shipped_at/delivered_at/cancelled_at/returned_at nullable. تُحفظ لقطة العنوان كي لا تغيّر بيانات العميل القديمة. |
| order_items | id UUID PK؛ order_id FK؛ product_id FK مع ON DELETE RESTRICT؛ product_name_snapshot؛ sku_snapshot؛ unit_price_snapshot؛ quantity؛ line_discount؛ line_total. الاسم وSKU والسعر لقطات تاريخية لا تتغير بتغيير المنتج. |
| order_status_history | id UUID PK؛ order_id FK؛ from_status nullable؛ to_status؛ reason nullable باستثناء الحالات التي تتطلب سببًا؛ changed_by FK nullable للطلب العام؛ created_at. Append-only؛ ترفض القاعدة UPDATE وDELETE. |
| customer_interactions | id UUID PK؛ customer_id FK؛ order_id FK nullable؛ user_id FK؛ interaction_type؛ outcome nullable؛ note nullable؛ created_at. تُسجّل المحاولات المتكررة دون تغيير حالة الطلب تلقائيًا. |
| follow_up_tasks | id UUID PK؛ order_id FK؛ assigned_to FK nullable؛ task_type؛ due_at؛ status (OPEN/COMPLETED/CANCELLED)؛ note nullable؛ completed_at nullable؛ created_by؛ created_at؛ updated_at. |
| shipping_events | id UUID PK؛ order_id FK؛ carrier_name؛ tracking_number nullable؛ event_type؛ note nullable؛ event_at؛ created_by. تُحفظ أحداث الشحن كسجل لا يُستبدل، وتُحدّث بيانات الشحن الحالية عبر OrderService فقط. |
| duplicate_flags | id UUID PK؛ order_id FK؛ matched_order_id FK؛ status (PENDING/KEPT/CANCELLED_AS_DUPLICATE)؛ resolved_by FK nullable؛ resolved_at nullable؛ note nullable؛ created_at؛ updated_at. لا دمج ولا حذف تلقائي. |
| idempotency_records | id UUID PK؛ source_id FK إلى landing_pages؛ idempotency_key؛ request_hash SHA-256؛ response_status؛ response_body JSONB دون بيانات العميل؛ expires_at؛ created_at؛ UNIQUE(source_id, idempotency_key). تُدرج في معاملة الطلب نفسها. |
| order_counters | year INT PK وفق Africa/Cairo؛ last_value INT غير سالب. تحديث ذري بـ INSERT \... ON CONFLICT \... RETURNING داخل معاملة الطلب لضمان التزامن والعودة عند rollback. |
| audit_logs | id UUID PK؛ user_id FK nullable؛ action؛ entity_type؛ entity_id؛ old_values/new_values JSONB مع قائمة حقول مسموحة وحجب البيانات الحساسة؛ request_id؛ created_at. Append-only؛ يمنع تسجيل كلمات المرور والرموز والأسرار. |
| settings | key TEXT PK؛ value JSONB؛ updated_at؛ updated_by FK nullable. تُتحقق القيم بنوع وحدود معروفة في Zod، ولا يسمح بتحويل الإعدادات إلى تنفيذ كود. |

ملاحظة مهمة: اتساقًا مع قاعدة القسم 4.3، تستخدم المفاتيح الخارجية المرتبطة بالطلبات ON DELETE RESTRICT. لا يُحذف المنتج المرتبط بطلب؛ يُعطَّل عبر is_active مع الاحتفاظ بالمرجع واللقطات التاريخية.

## [5. دورة حياة الطلب]{dir="rtl"} {#دورة-حياة-الطلب}

| [من]{dir="rtl"} | [إلى (المسموح فقط)]{dir="rtl"} |
|----|----|
| NEW | CONTACT_PENDING، CONTACT_ATTEMPTED، CONFIRMED، CANCELLED |
| CONTACT_PENDING | CONTACT_ATTEMPTED، CONFIRMED، CANCELLED |
| CONTACT_ATTEMPTED | CONTACT_PENDING، CONFIRMED، UNREACHABLE، CANCELLED |
| UNREACHABLE | CONTACT_PENDING، CONFIRMED، CANCELLED |
| CONFIRMED | PREPARING، CANCELLED |
| PREPARING | SHIPPED، CANCELLED |
| SHIPPED | DELIVERED، RETURNED |
| DELIVERED | RETURNED (ضمن نافذة مرتجعات قابلة للضبط) |
| CANCELLED | CONTACT_PENDING (إعادة فتح بسبب إلزامي، وتُسجَّل في audit_logs) |
| RETURNED | [لا شيء (نهائية)]{dir="rtl"} |

[القواعد]{dir="rtl"}

- [محاولة اتصال أخرى لا تغيّر الحالة. تُسجَّل كـ customer_interaction (النتيجة + الملاحظة) ويزيد عداد المحاولات؛ والانتقال إلى UNREACHABLE قرار المالك بعد عدد محاولات قابل للضبط (افتراضيًا 3) لا قرارًا آليًا.]{dir="rtl"}

- [السبب إلزامي عند CANCELLED وUNREACHABLE وRETURNED وإعادة الفتح. وعند SHIPPED مطلوب اسم شركة الشحن (رقم التتبع اختياري، راجع القرار 6 في القسم 16).]{dir="rtl"}

- [الطوابع الزمنية بمعنى «أول مرة»: confirmed_at وshipped_at وdelivered_at وcancelled_at وreturned_at تُضبط عند أول بلوغ للحالة ولا تُمسح عند الرجوع، فيبقى تحليل «مؤكد ثم ملغي» ممكنًا.]{dir="rtl"}

- [كل انتقال معاملة واحدة تشمل: (1) UPDATE ... WHERE id = :id AND status = :expected مع زيادة version (صفر صفوف ⇒ 409 STATE_CONFLICT)، (2) صف في order_status_history، (3) الطوابع، (4) مهمة متابعة: بعد CONTACT_ATTEMPTED خلال 4 ساعات وبعد UNREACHABLE خلال 24 ساعة (قابلة للضبط)، (5) إغلاق المهام المفتوحة عند CONFIRMED وCANCELLED وDELIVERED وRETURNED، (6) سجل في audit_logs للإلغاء وإعادة الفتح والتغييرات المالية.]{dir="rtl"}

- [المبالغ: لا تعديل بعد SHIPPED؛ وقبله للمالك فقط مع تسجيل القيمة القديمة والجديدة.]{dir="rtl"}

- [نقطة تعديل واحدة: لا تُحدَّث الحالة أو المبالغ إلا من OrderService، ولا يُستدعى Prisma لهذا الغرض من أي مكان آخر.]{dir="rtl"}

## [6. قواعد الأسعار والشحن والخصومات]{dir="rtl"} {#قواعد-الأسعار-والشحن-والخصومات}

- [السعر: products.current_price وقت إنشاء الطلب، أو landing_page_products.price_override إن وُجد. يُنسخ مع اسم المنتج وsku إلى order_items كلقطة ثابتة، فتعديل المنتج لاحقًا لا يمس الطلبات القديمة.]{dir="rtl"}

- [التقريب: line_total = unit_price × quantity − line_discount ويُقرَّب لخانتين عشريتين (half up) على مستوى السطر، والإجماليات مجموع قيم مقرَّبة. الحساب بمكتبة Decimal لا بالأعداد العائمة.]{dir="rtl"}

- [الإجمالي الفرعي: subtotal = Σ line_total.]{dir="rtl"}

- [الخصم العام: يساوي 0 في الطلب العام (لا محرك كوبونات في MVP). يُدخله المالك يدويًا من لوحة الإدارة، ولا يتجاوز subtotal، ويُسجَّل في audit_logs.]{dir="rtl"}

- [الشحن: landing_pages.default_shipping_fee (صفر = شحن مجاني). يسمح التصميم بإضافة جدول أسعار شحن حسب المحافظة لاحقًا دون تغيير العقد العام.]{dir="rtl"}

- [الإجمالي المستحق: total_amount = subtotal − discount_amount + shipping_fee، ويفرضه قيد CHECK في القاعدة.]{dir="rtl"}

- [العملة: تُقرأ من settings (الافتراضي EGP) وتُنسخ إلى الطلب؛ لا تحويل بين العملات.]{dir="rtl"}

- [حدود الإدخال (قابلة للضبط): حتى 10 بنود في الطلب، والكمية لكل بند من 1 إلى max_quantity (افتراضيًا 10)، والاسم 2--100 حرف، والعنوان 8--300، والملاحظات حتى 500. تكرار المنتج نفسه في بندين يُدمج في بند واحد.]{dir="rtl"}

## [7. منع التكرار]{dir="rtl"} {#منع-التكرار}

### [7.1 المستوى الأول: Idempotency (إعادة إرسال الطلب نفسه)]{dir="rtl"} {#المستوى-الأول-idempotency-إعادة-إرسال-الطلب-نفسه}

- [المفتاح: الرأس Idempotency-Key (16--128 حرفًا من A-Za-z0-9\_-). تولّد صفحة الهبوط UUID عند عرض النموذج وتحتفظ به حتى نجاح الإرسال، فتعيد المحاولة بالمفتاح نفسه، ثم تولّد مفتاحًا جديدًا بعد النجاح.]{dir="rtl"}

- [النطاق: (landing_page_id, key) بقيد UNIQUE. يُدرج سجل Idempotency مع بيانات الطلب في المعاملة نفسها.]{dir="rtl"}

- [بصمة الطلب request_hash: SHA-256 لجسم الطلب بعد التوحيد (هاتف موحّد، وبنود مرتّبة ومدموجة)، دون رمز CAPTCHA والحقل الفخّ.]{dir="rtl"}

- [الصلاحية: 48 ساعة افتراضيًا (expires_at) مع تنظيف دوري للمنتهي.]{dir="rtl"}

- [الخصوصية: response_body لا يحوي بيانات العميل، فقط ما أُعيد للصفحة (رقم الطلب والحالة والمبلغ).]{dir="rtl"}

| [الحالة]{dir="rtl"} | [النتيجة]{dir="rtl"} |
|----|----|
| [أول إرسال]{dir="rtl"} | [201 مع حفظ الاستجابة]{dir="rtl"} |
| [إعادة بالمفتاح نفسه والجسم نفسه]{dir="rtl"} | [الاستجابة الأصلية نفسها (201) مع الرأس Idempotent-Replay: true، ولا طلب جديد]{dir="rtl"} |
| [المفتاح نفسه وجسم مختلف]{dir="rtl"} | 409 IDEMPOTENCY_KEY_REUSED |
| [إرسالان متزامنان بالمفتاح نفسه]{dir="rtl"} | [الثاني ينتظر عند الإدراج الفريد حتى يلتزم الأول ثم يستلم الاستجابة المحفوظة؛ طلب واحد فقط]{dir="rtl"} |
| [فشل قبل الالتزام]{dir="rtl"} | rollback كامل فلا يبقى سجل، وتصبح إعادة المحاولة آمنة |
| [أخطاء التحقق (4xx)]{dir="rtl"} | [لا تُخزَّن؛ يجوز تصحيح البيانات وإعادة الإرسال بالمفتاح نفسه]{dir="rtl"} |

### [7.2 المستوى الثاني: طلب محتمل التكرار (مراجعة بشرية)]{dir="rtl"} {#المستوى-الثاني-طلب-محتمل-التكرار-مراجعة-بشرية}

[القاعدة (قابلة للضبط من settings): يوجد طلب آخر بالهاتف الموحّد نفسه، ويشترك معه في منتج واحد على الأقل، وأُنشئ خلال آخر 72 ساعة، وحالته ليست CANCELLED أو RETURNED.]{dir="rtl"}

[عند التطابق:]{dir="rtl"}

- [يُحفظ الطلب الجديد بشكل طبيعي بحالة NEW، ويُنشأ سجل duplicate_flags بحالة PENDING ويصبح duplicate_review_status = PENDING_REVIEW.]{dir="rtl"}

- [تظهر شارة تنبيه في لوحة التحكم وقائمة الطلبات وتفاصيل الطلب، مع رابط للطلب المطابق.]{dir="rtl"}

- [لا حذف ولا دمج تلقائي. القرار للمالك: «ليس مكررًا» (KEPT)، أو «مكرر» فيُلغى الطلب الأحدث عبر آلة الحالات بسبب إلزامي (CANCELLED_AS_DUPLICATE). كل قرار يُسجَّل في duplicate_flags (من، ومتى، وملاحظة) وفي order_status_history.]{dir="rtl"}

- [عميل متكرر ≠ طلب مكرر: من لديه طلبات سابقة تظهر له شارة «عميل متكرر» مع عدد طلباته وقيمتها، دون تنبيه تكرار ما لم تنطبق القاعدة أعلاه.]{dir="rtl"}

### [7.3 توحيد رقم الهاتف]{dir="rtl"} {#توحيد-رقم-الهاتف}

1.  [تحويل الأرقام العربية-الهندية (٠١٢...) إلى لاتينية، وإزالة المسافات والشرطات والأقواس.]{dir="rtl"}

2.  [البادئات +20 و0020 و20 تُحوَّل إلى الصيغة المحلية 0....]{dir="rtl"}

3.  [القبول: موبايل مصري يطابق \^01\[0125\]\[0-9\]{8}\$ بعد التوحيد؛ غير ذلك ⇒ 422 INVALID_PHONE.]{dir="rtl"}

4.  [التخزين: phone كما أُدخل، وnormalized_phone بصيغة E.164 (مثل +201012345678).]{dir="rtl"}

5.  [التنفيذ بمكتبة أرقام هواتف موثوقة مع دولة افتراضية قابلة للضبط، فيمكن لاحقًا قبول دول أخرى دون تغيير المخطط.]{dir="rtl"}

## [8. عقد API]{dir="rtl"} {#عقد-api}

### [8.1 المبادئ العامة]{dir="rtl"} {#المبادئ-العامة}

- [المسار الأساسي /api/v1، وJSON بترميز UTF-8، والتواريخ بصيغة ISO 8601 بتوقيت UTC.]{dir="rtl"}

- [المبالغ تُرسل كسلاسل نصية عشرية (مثل القيمة 199.00 بين علامتي اقتباس في JSON) لتفادي أخطاء الفاصلة العائمة.]{dir="rtl"}

- [حقول الجسم بصيغة snake_case، ومعاملات الاستعلام بصيغة camelCase كما في المواصفة.]{dir="rtl"}

- [غلاف موحّد: النجاح { success: true, data, meta? } والفشل { success: false, error: { code, message, details?, request_id } }. تُعاد request_id أيضًا في الرأس X-Request-Id.]{dir="rtl"}

- [الترقيم من قاعدة البيانات مباشرة: page (يبدأ من 1) وpageSize (الافتراضي 25 والأقصى 100)، وmeta فيها page وpage_size وtotal وtotal_pages. الترتيب sortBy بقائمة بيضاء: created_at وupdated_at وtotal_amount وorder_number وstatus.]{dir="rtl"}

- [فلاتر التاريخ dateFrom وdateTo بصيغة YYYY-MM-DD بتوقيت Africa/Cairo: البداية شاملة، والنهاية حتى نهاية اليوم المذكور.]{dir="rtl"}

- [المصادقة: جلسة (Cookie) لكل مسارات الإدارة، والمسار العام بلا جلسة (القسم 9).]{dir="rtl"}

### [8.2 نقاط النهاية]{dir="rtl"} {#نقاط-النهاية}

[كل ما عدا POST /public/orders وتسجيل الدخول و/health يتطلب جلسة صالحة، ولا تُتاح عمليات الإدارة من المسار العام إطلاقًا.]{dir="rtl"}

| [الطريقة]{dir="rtl"} | [المسار]{dir="rtl"} | [الغرض]{dir="rtl"} |
|----|----|----|
| POST | /public/orders | [إنشاء طلب من صفحة هبوط (عام، انظر 8.3)]{dir="rtl"} |
| OPTIONS | /public/orders | CORS preflight |
| POST | /auth/login | [تسجيل الدخول (محدود المعدل)]{dir="rtl"} |
| POST | /auth/logout | [إبطال الجلسة]{dir="rtl"} |
| GET | /auth/me | [الحساب الحالي]{dir="rtl"} |
| GET | /orders | [قائمة + بحث + فلاتر + ترقيم]{dir="rtl"} |
| GET | /orders/export | [تصدير CSV بنفس الفلاتر]{dir="rtl"} |
| GET | /orders/:id | [التفاصيل: العميل والبنود وسجل الحالات والتواصل والشحن]{dir="rtl"} |
| PATCH | /orders/:id/status | [انتقال حالة: status وreason وexpectedStatus]{dir="rtl"} |
| PATCH | /orders/:id | [تعديل الحقول المسموحة فقط]{dir="rtl"} |
| POST | /orders/:id/interactions | [تسجيل مكالمة أو محاولة أو ملاحظة]{dir="rtl"} |
| POST | /orders/:id/follow-ups | [موعد متابعة جديد]{dir="rtl"} |
| POST | /orders/:id/shipping | [شركة الشحن ورقم التتبع وتاريخ الشحن]{dir="rtl"} |
| GET, PATCH | /follow-ups و/follow-ups/:id | [قائمة المهام وإكمالها أو إعادة جدولتها \[تعديل مقترح\]]{dir="rtl"} |
| GET, PATCH | /duplicate-flags و/duplicate-flags/:id | [مراجعة الطلبات المحتمل تكرارها \[تعديل مقترح\]]{dir="rtl"} |
| GET | /customers و/customers/:id | [قائمة العملاء وملف العميل]{dir="rtl"} |
| GET, POST, PATCH | /products و/products/:id | [إدارة المنتجات]{dir="rtl"} |
| GET, POST, PATCH | /landing-pages و/landing-pages/:id | [إدارة الصفحات وربط منتجاتها]{dir="rtl"} |
| POST | /landing-pages/:id/credentials | [إنشاء مفتاح خادم يُعرض مرة واحدة \[تعديل مقترح\]]{dir="rtl"} |
| DELETE | /landing-pages/:id/credentials/:keyId | [إبطال مفتاح \[تعديل مقترح\]]{dir="rtl"} |
| GET, POST | /campaigns | [إدارة الحملات]{dir="rtl"} |
| GET | /dashboard/{summary,sales,campaigns,products,statuses} | [الإحصائيات: dateFrom وdateTo وcompare]{dir="rtl"} |
| GET | /audit-logs | [سجل العمليات \[تعديل مقترح\]]{dir="rtl"} |
| GET, PATCH | /settings | [الإعدادات \[تعديل مقترح\]]{dir="rtl"} |
| GET | /health | [فحص الحياة بلا أسرار (قاعدة البيانات فقط) \[تعديل مقترح\]]{dir="rtl"} |

[التوثيق التفصيلي لكل مسار (الطريقة، المصادقة، المدخلات، الاستجابة، الأخطاء، الأمثلة، قواعد التحقق وحدود المعدل) يعيش في docs/openapi.yaml المولَّد من مخططات Zod.]{dir="rtl"}

### [8.3 العقد التفصيلي: إنشاء طلب من صفحة هبوط]{dir="rtl"} {#العقد-التفصيلي-إنشاء-طلب-من-صفحة-هبوط}

[الترويسات]{dir="rtl"}

- Content-Type: application/json

- Idempotency-Key: \<UUID\> إلزامي، وإلا 400 IDEMPOTENCY_KEY_REQUIRED.

- X-Captcha-Token: \<token\> إلزامي فقط للصفحات التي captcha_required = true.

**CORS:** يُعاد Access-Control-Allow-Origin بالأصل المطلوب نفسه (لا \*) مع Vary: Origin، ويُسمح بالترويسات Content-Type وIdempotency-Key وX-Captcha-Token. طلب OPTIONS لا يحمل معرّف الصفحة، لذلك يُقارن أصله بمجموعة كل allowed_origins للصفحات الفعّالة (مخزّنة مؤقتًا لدقيقة)، ثم يُقارن POST بأصل الصفحة المعنيّة تحديدًا.

[حقول الجسم (الحقول الزائدة تُتجاهل ولا تُقرأ ولا تُعاد)]{dir="rtl"}

| [الحقل]{dir="rtl"} | [إلزامي]{dir="rtl"} | [القاعدة]{dir="rtl"} |
|----|----|----|
| source.landing_page_id | [نعم]{dir="rtl"} | [المعرّف العام public_id للصفحة، لا المفتاح الأساسي]{dir="rtl"} |
| source.campaign_id | [لا]{dir="rtl"} | [المعرّف العام للحملة؛ غير المعروف يُتجاهل ولا يُرفض الطلب بسببه]{dir="rtl"} |
| customer.full_name | [نعم]{dir="rtl"} | [2--100 حرف بعد التنظيف (قص المسافات، حذف المحارف التحكمية)]{dir="rtl"} |
| customer.phone | [نعم]{dir="rtl"} | [موبايل مصري صالح بعد التوحيد (7.3)]{dir="rtl"} |
| customer.alternate_phone | [لا]{dir="rtl"} | [القاعدة نفسها]{dir="rtl"} |
| customer.governorate | [نعم]{dir="rtl"} | [من قائمة المحافظات المعتمدة (قائمة مغلقة؛ تُعرض كقائمة منسدلة في الصفحة)]{dir="rtl"} |
| customer.city | [نعم]{dir="rtl"} | [2--80 حرفًا]{dir="rtl"} |
| customer.address | [نعم]{dir="rtl"} | [8--300 حرف]{dir="rtl"} |
| customer.address_details | [لا]{dir="rtl"} | [حتى 300 حرف]{dir="rtl"} |
| items\[\] | [نعم]{dir="rtl"} | [من 1 إلى 10 بنود؛ يُدمج تكرار المنتج]{dir="rtl"} |
| items\[\].product_id | [نعم]{dir="rtl"} | UUID لمنتج فعّال ومسموح من هذه الصفحة |
| items\[\].quantity | [نعم]{dir="rtl"} | [عدد صحيح من 1 إلى max_quantity]{dir="rtl"} |
| attribution.utm\_\* | [لا]{dir="rtl"} | [نصوص حتى 200 حرف تُحفظ كما وصلت]{dir="rtl"} |
| attribution.ad_click_id | [لا]{dir="rtl"} | [حتى 300 حرف \[تعديل مقترح\] (الحقل موجود في orders في المواصفة)]{dir="rtl"} |
| customer_notes | [لا]{dir="rtl"} | [حتى 500 حرف]{dir="rtl"} |
| website (الحقل الفخّ) | [لا]{dir="rtl"} | [يجب أن يبقى فارغًا، وإلا يُعامَل كروبوت (القسم 9.2)]{dir="rtl"} |

[مثال طلب]{dir="rtl"}

{\
\"source\": { \"landing_page_id\": \"lp_7Hk2mQ9xR4tB\", \"campaign_id\": \"cmp_fb_oct_a\" },\
\"customer\": {\
\"full_name\": \"أحمد محمد\",\
\"phone\": \"01012345678\",\
\"governorate\": \"الدقهلية\",\
\"city\": \"المنصورة\",\
\"address\": \"العنوان بالتفصيل\"\
},\
\"items\": \[ { \"product_id\": \"3f1b8c2e-0000-4000-8000-000000000001\", \"quantity\": 2 } \],\
\"attribution\": {\
\"utm_source\": \"facebook\", \"utm_medium\": \"paid\",\
\"utm_campaign\": \"campaign-example\", \"utm_content\": \"creative-a\",\
\"utm_term\": null, \"ad_click_id\": null\
},\
\"customer_notes\": \"يرجى الاتصال قبل التوصيل\"\
}

[استجابة النجاح (201) وهي نفسها عند الإعادة المطابقة. أضفتُ total_amount وcurrency لتغذية صفحة الشكر وتتبع التحويلات \[تعديل مقترح\]:]{dir="rtl"}

{\
\"success\": true,\
\"data\": {\
\"order_number\": \"ORD-2026-000001\",\
\"status\": \"NEW\",\
\"total_amount\": \"398.00\",\
\"currency\": \"EGP\",\
\"message\": \"تم استلام طلبك بنجاح\"\
}\
}

[مثال خطأ (422)]{dir="rtl"}

{\
\"success\": false,\
\"error\": {\
\"code\": \"VALIDATION_ERROR\",\
\"message\": \"بيانات الطلب غير صالحة\",\
\"details\": \[ { \"field\": \"customer.phone\", \"code\": \"INVALID_PHONE\", \"message\": \"رقم الهاتف غير صالح\" } \],\
\"request_id\": \"req_example\"\
}\
}

[رموز الأخطاء]{dir="rtl"}

| HTTP | [الرمز]{dir="rtl"} | [متى]{dir="rtl"} |
|----|----|----|
| 400 | INVALID_JSON، IDEMPOTENCY_KEY_REQUIRED | [جسم غير مقروء أو لا يوجد مفتاح]{dir="rtl"} |
| 401 | UNAUTHENTICATED | [لا جلسة صالحة (مسارات الإدارة)]{dir="rtl"} |
| 403 | ORIGIN_NOT_ALLOWED، CAPTCHA_FAILED، FORBIDDEN | [أصل غير مسموح أو فشل التحقق]{dir="rtl"} |
| 404 | LANDING_PAGE_NOT_FOUND، NOT_FOUND | [الصفحة غير موجودة أو معطّلة (رد موحّد لمنع التخمين)]{dir="rtl"} |
| 409 | IDEMPOTENCY_KEY_REUSED، STATE_CONFLICT | [تعارض المفتاح أو تعديل متزامن للحالة]{dir="rtl"} |
| 413 | PAYLOAD_TOO_LARGE | [الجسم أكبر من الحد]{dir="rtl"} |
| 422 | VALIDATION_ERROR، INVALID_PHONE، PRODUCT_NOT_AVAILABLE، INVALID_TRANSITION | [بيانات أو منتج أو انتقال غير صالح]{dir="rtl"} |
| 429 | RATE_LIMITED | [تجاوز الحد، مع Retry-After]{dir="rtl"} |
| 500 | INTERNAL_ERROR | [رسالة عامة وrequest_id فقط]{dir="rtl"} |

[مقتطف OpenAPI (الملف الكامل يُولَّد من Zod في المرحلتين 2 و3، ويفحص CI أنه مطابق للمنسوخ في المستودع)]{dir="rtl"}

openapi: 3.1.0\
info: { title: Markose API, version: 1.0.0 }\
servers: \[ { url: /api/v1 } \]\
paths:\
/public/orders:\
post:\
operationId: createPublicOrder\
parameters:\
- { name: Idempotency-Key, in: header, required: true, schema: { type: string, pattern: \'\^\[A-Za-z0-9\_-\]{16,128}\$\' } }\
- { name: X-Captcha-Token, in: header, required: false, schema: { type: string } }\
requestBody:\
required: true\
content: { application/json: { schema: { \$ref: \'#/components/schemas/PublicOrderRequest\' } } }\
responses:\
\'201\': { description: Created or idempotent replay, content: { application/json: { schema: { \$ref: \'#/components/schemas/PublicOrderResponse\' } } } }\
\'400\': { \$ref: \'#/components/responses/Error\' }\
\'403\': { \$ref: \'#/components/responses/Error\' }\
\'409\': { \$ref: \'#/components/responses/Error\' }\
\'413\': { \$ref: \'#/components/responses/Error\' }\
\'422\': { \$ref: \'#/components/responses/Error\' }\
\'429\': { \$ref: \'#/components/responses/Error\' }\
components:\
schemas:\
PublicOrderRequest:\
type: object\
required: \[source, customer, items\]\
properties:\
source: { type: object, required: \[landing_page_id\], properties: { landing_page_id: { type: string }, campaign_id: { type: \[string, \'null\'\] } } }\
customer: { \$ref: \'#/components/schemas/Customer\' }\
items: { type: array, minItems: 1, maxItems: 10, items: { \$ref: \'#/components/schemas/Item\' } }\
attribution: { type: object, additionalProperties: { type: \[string, \'null\'\], maxLength: 300 } }\
customer_notes: { type: string, maxLength: 500 }\
Customer: { type: object, required: \[full_name, phone, governorate, city, address\], properties: { full_name: { type: string, minLength: 2, maxLength: 100 }, phone: { type: string }, alternate_phone: { type: string }, governorate: { type: string }, city: { type: string }, address: { type: string, minLength: 8, maxLength: 300 }, address_details: { type: string } } }\
Item: { type: object, required: \[product_id, quantity\], properties: { product_id: { type: string, format: uuid }, quantity: { type: integer, minimum: 1 } } }\
PublicOrderResponse: { type: object, properties: { success: { const: true }, data: { type: object, properties: { order_number: { type: string }, status: { const: NEW }, total_amount: { type: string }, currency: { type: string }, message: { type: string } } } } }\
responses:\
Error: { description: Error envelope, content: { application/json: { schema: { type: object, properties: { success: { const: false }, error: { type: object, properties: { code: { type: string }, message: { type: string }, details: { type: array, items: { type: object } }, request_id: { type: string } } } } } } } }

# **استكمال الوثيقة --- الأقسام الناقصة والإضافات المقترحة** {#استكمال-الوثيقة-الأقسام-الناقصة-والإضافات-المقترحة}

تحتوي النسخة المستلمة على الأقسام 0--8 فقط، رغم إحالاتها إلى القسم 9 والقسم 16. لذلك أضيفت المواد التالية لتغطية الفجوات التنفيذية. جميع الإضافات أدناه مقترحات للمراجعة وليست ادعاءً بأنها كانت موجودة في الملف الأصلي.

## **8.4 قواعد عقد المسارات الإدارية \[استكمال مقترح\]** {#قواعد-عقد-المسارات-الإدارية-استكمال-مقترح}

كل المسارات الإدارية تتطلب جلسة صالحة، وتعيد غلاف JSON الموحّد المذكور في 8.1، وتتحقق من المدخلات بمخططات Zod.

\`PATCH /orders/:id/status\` يقبل \`status\` و\`expectedStatus\` و\`reason\` وحقول الشحن المطلوبة عند الانتقال إلى \`SHIPPED\`. يرفض الانتقالات غير المذكورة في جدول دورة الحياة، ويعيد \`409 STATE_CONFLICT\` عند تغيّر الحالة بالتزامن.

\`PATCH /orders/:id\` يقبل قائمة حقول صريحة فقط. يمنع تعديل \`order_number\` ولقطات الأسعار التاريخية والحالة والطوابع الزمنية والحقول المحسوبة مباشرة؛ تعديل الحالة حصريًا عبر \`OrderService\`، وتعديل المال قبل الشحن للمالك فقط مع سجل تدقيق.

\`POST /orders/:id/interactions\` ينشئ تفاعلًا/محاولة اتصال؛ و\`POST /orders/:id/follow-ups\` ينشئ مهمة متابعة بتاريخ صالح. لا يغيّر تسجيل التفاعل الحالة تلقائيًا.

\`POST /orders/:id/shipping\` يتحقق من اسم شركة الشحن، ويسجّل حدثًا، وينفّذ الانتقال المصرح به عبر \`OrderService\`. رقم التتبع اختياري ما لم يُعتمد خلاف ذلك.

\`GET /orders\` و\`GET /customers\` و\`GET /follow-ups\` و\`GET /duplicate-flags\` تدعم \`page\` و\`pageSize\` والفلاتر الموثقة، وتطبق allowlist للفرز. لا تُقبل أسماء أعمدة حرة من العميل.

\`GET /orders/export\` يعيد CSV بالفلاتر نفسها، مع ترميز UTF-8 BOM لدعم العربية في برامج الجداول، ويقتصر على الحقول المسموحة. تُعالج قيم CSV لمنع Formula Injection.

لا تُنفّذ عمليات جماعية للحذف أو تغيير الحالة في MVP. كل تعديل مؤثر في المال أو الحالة أو إعدادات الأمان يكتب \`audit_logs\`.

المسار العام الوحيد لإنشاء الطلب هو \`POST /public/orders\`، ولا يعيد معلومات العميل أو بيانات سجل الطلب الداخلي.

## **9. الأمن وحماية المسارات العامة \[استكمال مقترح\]** {#الأمن-وحماية-المسارات-العامة-استكمال-مقترح}

### **9.1 نموذج التهديد والحد الأدنى** {#نموذج-التهديد-والحد-الأدنى}

تُعامل صفحة الهبوط والطلبات القادمة من المتصفح على أنها مدخلات غير موثوقة. لا يعتمد الخادم على السعر أو الخصم أو الصلاحيات أو حالة المنتج المرسلة من العميل. مستخدم MVP هو المالك فقط؛ لا يوجد نظام أدوار متعدد المستخدمين في النسخة الأولى.

### **9.2 منع الإساءة والروبوتات** {#منع-الإساءة-والروبوتات}

حقل website هو honeypot مخفي؛ إذا لم يكن فارغًا يُرفض الطلب أو يُسقط برد عام لا يكشف قاعدة الكشف، مع عدم تسجيل قيمة الحقل.

عند captcha_required=true يتحقق الخادم من رمز CAPTCHA مع المزوّد، ولا يكتفي بتحقق الواجهة. اسم المزوّد ومفاتيحه قرار نشر يُحسم قبل التفعيل؛ تحفظ المفاتيح في متغيرات البيئة.

حد أولي مقترح لحجم جسم POST العام: 32 KiB. يُرفض JSON غير الصالح بـ 400 والجسم الزائد بـ 413 قبل المعالجة المكلفة.

تطبّق حدود معدل قابلة للضبط على الأقل حسب IP وعلى مستوى landing_page_id، وحدود منفصلة لمحاولة تسجيل الدخول. يبدأ الضبط الأولي مثلًا بـ 5 محاولات دخول فاشلة خلال 15 دقيقة لكل IP ومعرّف حساب، وبحد عام للطلبات المنشأة لكل IP/صفحة؛ يُضبط وفق حركة المرور الفعلية ولا يُعد رقمًا نهائيًا قبل الاختبار.

لا يُعتبر CORS وسيلة مصادقة؛ يُتحقق من Origin حسب allowed_origins، مع Vary: Origin وعدم استخدام Access-Control-Allow-Origin: \*. يجب الانتباه إلى أن ترويسة Origin قابلة للتزوير في بعض العملاء غير المتصفحية، لذلك يلزم تحديد المعدل وCAPTCHA عند الحاجة.

### **9.3 مفاتيح API والأسرار** {#مفاتيح-api-والأسرار}

إذا لزم تكامل موثوق من خادم إلى خادم، يُنشأ secret عشوائي قوي ويُعرض مرة واحدة، ويُخزّن hash للتحقق من Bearer token؛ يحتفظ النظام بـ public_key_id وبيانات الإبطال فقط. لا يوضع السر في HTML أو JavaScript للمتصفح أو مستودع Git. إذا اختير HMAC لاحقًا، فذلك يتطلب تصميمًا منفصلًا لتخزين السر/استخدام KMS؛ لا يُخلط بين hash المفتاح وتوقيع HMAC.

يمكن إبطال المفتاح أو وضع تاريخ انتهاء له. تُحدّث last_used_at دون تسجيل قيمة المفتاح نفسها. كل الأسرار تأتي من متغيرات البيئة ولا تظهر في واجهة الإدارة بعد إنشائها.

### **9.4 حماية التطبيق والبيانات** {#حماية-التطبيق-والبيانات}

استخدام HTTPS في أي نشر فعلي، وSecure وHttpOnly وSameSite مناسب على Cookie، ورؤوس حماية المتصفح، وسياسة CSP متوافقة مع الواجهة.

حماية CSRF لعمليات التغيير المعتمدة على Cookie، مع التحقق من Origin/Referer أو رمز CSRF حسب نمط التنفيذ. لا يكفي SameSite وحده لتبرير حذف الاختبارات.

تجزئة كلمات المرور بخوارزمية موثوقة مثل Argon2id عند توافق البيئة؛ لا تُخزن كلمة المرور أو رموز الجلسات بصورة صريحة.

سجلات التطبيق لا تحتوي كلمات مرور أو Cookie أو API secrets أو CAPTCHA tokens أو جسم الطلب الكامل أو الهاتف والعنوان دون ضرورة. يُربط الخطأ بـ request_id وتُحجب الحقول الحساسة.

رسائل الأخطاء العامة لا تعرض stack trace أو SQL أو تفاصيل البنية. الاستثناءات المتوقعة AppError، وأي خطأ غير متوقع يتحول إلى INTERNAL_ERROR مع request_id.

### **9.5 الخصوصية والاحتفاظ** {#الخصوصية-والاحتفاظ}

يُجمع الحد الأدنى من بيانات العميل اللازمة لتنفيذ الطلب. تضع الإعدادات مددًا واضحة لتنظيف idempotency_records المنتهية والسجلات التشغيلية التي لا يلزم الاحتفاظ بها؛ لا تُحذف سجلات الطلبات والتدقيق المطلوبة للتتبع المالي والتشغيلي آليًا. يلزم التحقق القانوني المحلي قبل الإطلاق لتحديد سياسة الخصوصية والاحتفاظ وحقوق أصحاب البيانات؛ هذه الوثيقة ليست رأيًا قانونيًا.

## **10. المصادقة والجلسات وإدارة المالك \[استكمال مقترح\]** {#المصادقة-والجلسات-وإدارة-المالك-استكمال-مقترح}

يوجد حساب مالك واحد في MVP. إنشاء الحساب الأول من أمر CLI آمن \`scripts/create-admin\` أو إجراء provisioning محمي، وليس من مسار تسجيل عام.

تسجيل الدخول عبر البريد/اسم المستخدم وكلمة المرور برسالة فشل عامة لا تكشف هل الحساب موجود. يُطبّق حد معدل، وتُسجّل محاولات النجاح والفشل دون حفظ بيانات اعتماد.

تُصدر Cookie عشوائية قوية، ويُحفظ hash للرمز في sessions. خصائص Cookie المقترحة في الإنتاج: HttpOnly وSecure وSameSite=Lax أو Strict بحسب تدفق الدخول؛ Path=/ وعدم تعيين Domain إلا للحاجة.

مدة جلسة أولية مقترحة: 12 ساعة من الإنشاء مع تمديد خامل محدود، وحد أقصى مطلق قابل للضبط؛ يجب اعتماد السياسة قبل التنفيذ. يدوّر معرّف الجلسة بعد تسجيل الدخول وتغيير كلمة المرور.

\`POST /auth/logout\` يبطل السجل في قاعدة البيانات ثم يمسح Cookie؛ \`GET /auth/me\` يعيد الحد الأدنى من بيانات الحساب. إلغاء الجلسة أو تعطيل الحساب يمنع استخدام الجلسات التابعة له.

لا توجد أدوار وصلاحيات معقدة في MVP؛ تُمرر كل عمليات الإدارة عبر حارس موحد يتحقق من الجلسة وتفعيل المستخدم، ويُضاف RBAC فقط عند اعتماد مستخدمين متعددين.

## **11. الواجهة وتجربة الاستخدام \[استكمال مقترح\]** {#الواجهة-وتجربة-الاستخدام-استكمال-مقترح}

### **11.1 اللغة والتخطيط** {#اللغة-والتخطيط}

الواجهة الإدارية بالعربية واتجاه RTL افتراضيًا، مع إبقاء رموز الحالات وأسماء الحقول التقنية بالإنجليزية في الكود والعقود. تُعرض الأموال بالجنيه المصري وفق EGP وتوقيت العرض Africa/Cairo.

تصميم متجاوب لسطح المكتب والهاتف، مع حالات تحميل وفراغ وخطأ ونجاح واضحة، ورسائل تحقق مرتبطة بالحقل، وتأكيد قبل الإلغاء أو إعادة الفتح أو تعديل قيمة مالية.

استخدام تنسيق موحّد للتواريخ والأرقام وأرقام الطلبات، وعدم الاعتماد على اللون وحده للدلالة على الحالة. تُراعى لوحة المفاتيح والتباين وتسميات الحقول.

### **11.2 الشاشات المطلوبة** {#الشاشات-المطلوبة}

تسجيل الدخول: نموذج بسيط، حالة تحميل، ورسالة فشل عامة.

لوحة التحكم: بطاقات المؤشرات، مخططات المبيعات والحالات، الحملات والمنتجات، وفلاتر الفترة والمقارنة.

الطلبات: جدول قابل للبحث والترشيح حسب الحالة والفترة والمحافظة وصفحة الهبوط والحملة والعميل، مع ترقيم صفحات ثابت وفرز من قائمة بيضاء. يظهر تنبيه التكرار والعميل المتكرر منفصلين.

تفاصيل الطلب: معلومات العميل ولقطة عنوان التسليم والبنود والسعر وسجل الحالة والتفاعلات ومهام المتابعة وأحداث الشحن وسجل مراجعة التكرار.

العملاء: البحث بالاسم أو الهاتف الموحّد، وعدد الطلبات وقيمتها، دون إظهار تنبيه تكرار إلا عند تحقق قاعدة الطلب المحتمل التكرار.

المنتجات وصفحات الهبوط: إنشاء/تعديل/تعطيل، وربط منتجات الصفحة، وسعر override والحد الأقصى للكمية وترتيب العرض ومصادر Origin وCAPTCHA.

الحملات: إنشاء معرّف عام للحملة، ربط الصفحة، وتفعيل/تعطيل الحملة دون تعريض المفتاح الأساسي.

المتابعات والتكرارات: قائمتان منفصلتان؛ إكمال أو إعادة جدولة المهمة، وحسم التكرار بقرار «ليس مكررًا» أو «مكرر» مع ملاحظة وسبب إلزامي عند إلغاء الطلب الأحدث.

التقارير وسجل التدقيق والإعدادات: فلاتر معلنة، وتصدير CSV آمن، وتحرير القيم القابلة للضبط فقط من خلال schema موثوق.

### **11.3 حالات الواجهة** {#حالات-الواجهة}

كل عملية تغيير تعرض نجاحًا أو خطأ مفهومًا بالعربية. إذا أعاد الخادم STATE_CONFLICT تُحدّث الواجهة البيانات وتطلب من المالك مراجعتها بدل الكتابة فوق تغيير أحدث. لا يُعتبر تغيير الحالة ناجحًا قبل تأكيد الخادم.

## **12. المؤشرات والتقارير \[استكمال مقترح\]** {#المؤشرات-والتقارير-استكمال-مقترح}

تعريف المؤشرات هو قرار منتج يجب تثبيته قبل بناء اللوحة. التعريفات التالية مقترحة لـ MVP؛ لا تعني وجود بيانات زيارات أو إنفاق إعلاني إذا لم تُدمج مصادرها.

عدد الطلبات: عدد orders غير التجريبية is_test=false التي يقع created_at لها ضمن الفترة المختارة؛ يعرض التقسيم حسب الحالة منفصلًا، حتى لا تختفي الطلبات الملغاة من تقرير حجم الطلبات.

قيمة الطلبات المنشأة: مجموع total_amount للطلبات المنشأة ضمن الفترة مع عرض استثناءات الحالات بوضوح؛ لا تُسمّى «تحصيلًا نقديًا» إذ لا يوجد في المخطط سجل دفعات.

صافي المبيعات التشغيلي: يُحسب وفق أحداث التسليم والإرجاع (delivered_at كقيمة موجبة وreturned_at كقيمة سالبة) ضمن فترة الحدث، مع استبعاد الطلبات التجريبية. يجب توثيق أي تعديل على هذه السياسة قبل اعتبار التقرير محاسبيًا.

متوسط قيمة الطلب: إجمالي قيمة الطلبات المحددة في تعريف المؤشر مقسومًا على عددها، مع تجنب القسمة على صفر وإظهار العملة.

معدل التأكيد: عدد الطلبات التي وصلت إلى CONFIRMED أو بعدها وفق قائمة حالات معتمدة، مقسومًا على الطلبات المنشأة في الفترة نفسها. توثَّق معالجة الإلغاء والإرجاع والمقامات الزمنية ولا يُخلط بين دفعات تاريخية مختلفة.

أداء الحملات: عدد الطلبات وقيمتها حسب campaign_id وUTM المتاح. لا يُعرض ROAS أو تكلفة الاكتساب ما لم تتوفر بيانات إنفاق إعلاني موثقة.

مقارنة الفترة السابقة: فترة مساوية في المدة للتواريخ المختارة، مع عرض النسبة والفرق المطلق والتعامل مع المقام صفرًا.

تُحسب حدود dateFrom/dateTo على Africa/Cairo: البداية شاملة، والنهاية تشمل اليوم كاملًا، ثم تُحوّل حدود الوقت إلى UTC للاستعلام. تُذكر المنطقة الزمنية بجوار أي اختيار تاريخ.

كل التقارير تستبعد is_test=true افتراضيًا، وتتيح صلاحية واضحة لتضمينها في بيئة الاختبار فقط. يُحظر خلط بيانات التطوير بمؤشرات الإنتاج.

لا تُحسب نسبة تحويل من الزيارة إلى الطلب دون تكامل موثوق لأحداث الزيارات. ولا تُعتبر مبالغ الطلبات أموالًا محصّلة دون تكامل دفع أو سجل تحصيل.

## **13. خطة الاختبارات وضمان الجودة \[استكمال مقترح\]** {#خطة-الاختبارات-وضمان-الجودة-استكمال-مقترح}

### **13.1 اختبارات وحدات** {#اختبارات-وحدات}

money: الجمع والطرح والتقريب half-up والحدود وصيغ السلاسل العشرية، دون floating point.

phone: الأرقام العربية-الهندية، بادئات +20 و0020 و20، المدخلات غير الصالحة، وصيغة E.164.

OrderService: كل انتقال مسموح ومرفوض، الأسباب الإلزامية، منع تعديل الأسعار بعد SHIPPED، والطوابع الزمنية التي لا تمسح عند إعادة الفتح.

duplicate detection: اختلاف المنتج، اختلاف الهاتف، حدود 72 ساعة، الطلبات الملغاة/المرتجعة، وحالة قرار المراجعة.

Zod: الحدود الدنيا والعليا، الحقول الزائدة، UUID، الكميات، المحافظات، وحقول attribution.

### **13.2 اختبارات تكامل PostgreSQL** {#اختبارات-تكامل-postgresql}

تشغيل migrations على قاعدة اختبار جديدة، والتحقق من CHECK وUNIQUE وFK وtriggers وpg_trgm.

إرسال متزامن بالمفتاح نفسه؛ نفس الجسم يعيد الاستجابة المحفوظة، والجسم المختلف يعيد 409، ولا ينتج أكثر من طلب واحد.

طلبان متزامنان للهاتف نفسه لا ينشئان سجلَي عميل، مع بقاء normalized_phone غير فريد كما في المواصفة.

rollback عند فشل خطوة وسط إنشاء الطلب؛ لا سجل طلب/عناصر/تاريخ/Idempotency جزئي.

توليد order_number متزامنًا حسب السنة المحلية، مع تجربة rollback والتحقق من عدم التكرار.

إبطال الجلسات، منع تعديل سجل audit/history، وتسجيل القيمة القديمة والجديدة في تغييرات المال والحالة.

### **13.3 اختبارات API وE2E** {#اختبارات-api-وe2e}

اختبار جميع نقاط النهاية الموثقة: المصادقة، التحقق، CORS، CAPTCHA، حدود المعدل، صلاحية الصفحة والمنتج، الأخطاء والغلاف JSON.

سيناريوهات من الواجهة: إنشاء طلب، مراجعة تكرار، تسجيل تواصل، تأكيد الطلب، الشحن، التسليم، الإرجاع، التصدير، وإبطال الجلسة.

اختبارات أمنية تشمل CSRF، حقن SQL عبر الفلاتر، XSS في الملاحظات، CSV Formula Injection، عدم تسريب الأسرار والبيانات في السجلات، وحماية المسارات العامة.

### **13.4 بوابة القبول** {#بوابة-القبول}

لا يُعلن عن اجتياز الاختبارات إلا بعد تشغيلها فعليًا مع ذكر الأمر والنتيجة. يجب أن تعمل قاعدة الاختبار عبر DATABASE_URL_TEST وتنتهي باسم \_test؛ ويجب أن يتوقف الاختبار إذا كانت قاعدة البيانات المستهدفة غير آمنة.

## **14. النشر والتشغيل والاستعادة \[استكمال مقترح\]** {#النشر-والتشغيل-والاستعادة-استكمال-مقترح}

بيئات منفصلة: development وtest وstaging وproduction، مع إعدادات وأسرار وقواعد بيانات مستقلة. لا يُسمح للـ seed أو اختبارات E2E بالعمل على الإنتاج.

يُثبت إصدار Node.js والإطار وPrisma وبقية المكتبات في lockfile بعد التحقق من وثائق التوافق الرسمية، ويُوثق سبب اختيار الإصدارات وتاريخها في docs/decisions.md.

يُحدد مزوّد النشر بعد التأكد من دعمه تشغيل Node.js وRoute Handlers وPostgreSQL والاتصالات المطلوبة والمهاجرات والنسخ الاحتياطي. لا تُستبدل PostgreSQL بـ Firebase أو قاعدة أخرى دون قرار صريح.

تُطبق migrations كخطوة نشر منفصلة ومحكومة، لا تلقائيًا عند كل طلب HTTP. تختبر migrations على staging ونسخة مستعادة قبل الإنتاج عند وجود تغيير حساس.

نسخ احتياطي مشفر مجدول لقاعدة البيانات، مع سياسة احتفاظ قابلة للضبط واختبار استعادة دوري موثق عبر scripts/restore-test. النسخة الاحتياطية غير المختبرة لا تُعد خطة استعادة مكتملة.

تسجيل structured logs مع timestamp UTC وlevel وrequest_id وroute وduration؛ منع كلمات المرور وCookies وAPI secrets والبيانات الشخصية غير اللازمة من السجلات.

مراقبة فشل الطلبات ومعدلات 4xx/5xx و429، وتأخر مهام المتابعة، وفشل النسخ الاحتياطي، واستهلاك قاعدة البيانات. تُرسل تنبيهات إلى قناة يختارها المالك بعد تحديدها.

الـ health endpoint لا يعيد أسرارًا أو تفاصيل بنية؛ يعيد حالة عامة ونتيجة تحقق اتصال بسيطة مع قاعدة البيانات. لا يصبح بديلًا عن مراقبة التطبيق.

تنفذ مهمة مجدولة لتنظيف idempotency_records المنتهية وإنشاء/تذكير المتابعات المستحقة حيث يلزم. يجب أن تكون قابلة لإعادة التشغيل دون تكرار آثار ضارة.

توثّق docs/runbook.md إجراءات النشر والتراجع واستعادة النسخة وإدارة الأسرار وتدوير المفاتيح والاستجابة للحوادث. لا تُخزّن كلمات المرور أو الأسرار داخل الوثائق.

## **15. ترتيب التنفيذ ومعايير الإنجاز \[استكمال مقترح\]** {#ترتيب-التنفيذ-ومعايير-الإنجاز-استكمال-مقترح}

### **15.1 ترتيب التنفيذ** {#ترتيب-التنفيذ}

المرحلة 2 --- تأسيس المشروع: التحقق من توافق Node.js وNext.js وPrisma وPostgreSQL من المصادر الرسمية؛ إنشاء المستودع وهيكل الملفات والأدوات وCI؛ تعريف مخططات Zod، schema أولي، migrations واختبارات اتصال.

المرحلة 3 --- أساس البيانات والمصادقة: جلسات قابلة للإبطال، حساب المالك، حماية المسارات، مخطط البيانات الكامل، قيود SQL والمحفزات والفهارس، وسجل التدقيق.

المرحلة 4 --- كتالوج المنتجات وصفحات الهبوط والحملات: الإدارة وتعطيل السجلات وربط المنتجات وpublic IDs وallowed_origins وCAPTCHA.

المرحلة 5 --- استقبال الطلبات: العقد العام، توحيد الهاتف، التسعير الخادمي، معاملات PostgreSQL، Idempotency، عدّاد الطلبات، ولقطات البنود والشحن.

المرحلة 6 --- سير العمل: آلة الحالات، التفاعلات، المتابعات، الشحن، مراجعة التكرار، ومنع التعديل المتزامن.

المرحلة 7 --- لوحة الإدارة والتقارير: الطلبات والعملاء والفلاتر والتصدير الآمن والمؤشرات والإعدادات.

المرحلة 8 --- التقوية والإطلاق: اختبارات وحدات/تكامل/E2E وأمنية، استعادة النسخ الاحتياطية، تجربة staging، توثيق التشغيل، ثم إطلاق مضبوط.

### **15.2 تعريف «مكتمل» لكل وحدة** {#تعريف-مكتمل-لكل-وحدة}

مخطط بيانات ومهاجرات موثقة، ومخططات validation مشتركة، وعقد API، وواجهات حالات التحميل/الخطأ/النجاح، واختبارات آلية قابلة للتشغيل.

لا توجد مسارات مؤقتة تعيد بيانات ثابتة بدل قاعدة البيانات، ولا أزرار ظاهرية لا تنفذ فعلًا، ولا بيانات سرية في المستودع.

يُحدّث OpenAPI من مصدر الحقيقة المعتمد وتتحقق CI من عدم انحرافه. تُوثق أوامر التشغيل والاختبارات والنسخ والاستعادة.

لا ينتقل العمل إلى المرحلة التالية إذا بقيت متطلبات أمنية/مالية حرجة غير مختبرة أو قرارات مقترحة مؤثرة غير محسومة.

### **15.3 قيود على استخدام Google AI Studio** {#قيود-على-استخدام-google-ai-studio}

استخدم الوثيقة كمرجع مواصفات، لا كإذن لتغيير المكدس التقني. إذا كانت بيئة AI Studio لا تدعم إنشاء أو تشغيل Next.js + PostgreSQL + Prisma مباشرة، فأنشئ الملفات/التعليمات الممكنة وحدد ما يحتاج إلى بيئة خارجية، ولا تستبدل التقنية ضمنيًا بخدمات أخرى. لا تدّعِ أن كودًا قد شُغّل أو اختُبر ما لم يحدث ذلك.

## **16. سجل التعديلات المقترحة والقرارات المفتوحة \[استكمال مقترح\]** {#سجل-التعديلات-المقترحة-والقرارات-المفتوحة-استكمال-مقترح}

هذا السجل يجمع التغييرات المقترحة في النسخة الأصلية مع الاستكمالات الجديدة. جميعها تحتاج اعتمادًا قبل التنفيذ عندما تؤثر في السلوك أو البنية؛ المتطلبات الأصلية غير الموسومة تبقى الأساس.

بنية البيانات: إضافة landing_page_products، ولقطات عنوان التسليم في orders، والحقول returned_at وversion وis_test، والجداول duplicate_flags وorder_counters وsessions وsettings، والمصفوفة allowed_origins والحقل captcha_required، وcampaigns.public_id.

الأمن: استخدام public_key_id مع hash لسر API عشوائي للتكاملات الموثوقة، بدل افتراض HMAC غير المتوافق مع تخزين hash فقط. لا توضع مفاتيح سرية في صفحات المتصفح.

عقد الطلب العام: إعادة total_amount وcurrency ورسالة نجاح عربية في الاستجابة. تُعاد الاستجابة الأصلية نفسها في Idempotent replay مع ترويسة Idempotent-Replay: true.

واجهات API مقترحة إضافيًا: إدارة المتابعات والتكرارات والمفاتيح وسجل التدقيق والإعدادات وفحص الصحة.

قواعد التشغيل المقترحة: حقل honeypot وCAPTCHA اختياري لكل صفحة؛ body limit؛ حدود معدل؛ سياسة جلسة أولية؛ حماية CSRF؛ وتعريف اختبارات الأمان والنسخ الاحتياطية.

تعريف التقارير: تثبيت تعريف صافي المبيعات ومعدل التأكيد ومتوسط قيمة الطلب، مع عدم ادعاء أرقام تحويل أو ROAS دون مصدر بيانات.

### **قرارات ينبغي حسمها قبل الإنتاج**

مزوّد CAPTCHA؛ ومزوّد الاستضافة وقاعدة PostgreSQL؛ والحدود النهائية لمعدل الطلبات وحجم الجسم؛ وسياسة مدة الجلسة؛ ومهلة إرجاع الطلبات؛ وسياسة الاحتفاظ والنسخ الاحتياطي ومؤشرات الاستعادة.

اعتماد تعريفات المؤشرات التشغيلية، وحقول CSV المسموح تصديرها، وسياسة ظهور بيانات العملاء، وأي متطلبات قانونية محلية للخصوصية.

هل ستبقى المفاتيح الخاصة للتكاملات ضمن MVP؟ المسار العام في المتصفح لا ينبغي أن يتطلب secret سرّيًا؛ لذلك قد يؤجل api_credentials إلى حين وجود مستهلك server-to-server.

حالة الاعتماد الحالية: غير معتمدة بعد. ابدأ المرحلة 2 بالتحقق التقني وتسجيل القرارات، ولا تعامل الاقتراحات على أنها موافقة تلقائية.
