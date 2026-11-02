# Sunset Clock · ساعت غروب

[English](#english) · [فارسی](#فارسی)

---

## English

A small, offline-capable web app (PWA) that counts time **from sunset to sunset**, with a sky that follows the real sun and calculated prayer times. It is bilingual (Persian / English) and runs entirely in your browser: nothing about your location is ever sent anywhere.

### Features

- Time since the last sunset, or until the next one, for any city or custom coordinates.
- Sky colours, stars and a sun-path chart driven by the real position of the sun (NOAA solar equations, calculated on the device).
- Prayer times with several calculation methods and two Asr options.
- **Sunset-clock mode** (toggle): a 12-hour analog dial whose hands meet at 12 at sunset, bars for *night passed* and *day remaining*, and labels such as “Night of Friday · night of 13 Rajab”. Based on the «ساعت غروب‌کوک» idea of Allameh Sayyid Muhammad-Husayn Husayni Tehrani.
- **Hijri date adjustment** of ±1 day, for differences between Umm al-Qura and local moon sighting.
- **Desk / full-screen mode**: a large clock and sky for tablets and monitors. It asks the browser to keep the screen awake where that is supported.
- Installable (Android, iPhone, desktop) and works offline after the first visit.
- Optional “live notification” (see limits below).

### Run locally

The translations are loaded from `i18n/*.json`, so the folder must be served over HTTP; opening `index.html` straight from disk will not work.

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

### Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In **Settings → Pages**, choose the branch and the root folder.
3. Open the published `https://<user>.github.io/<repo>/` link.

### Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole app (HTML, CSS, JavaScript) |
| `i18n/en.json`, `i18n/fa.json` | All visible text, one file per language |
| `sw.js` | Service worker for offline use |
| `manifest.webmanifest`, `icon*.png`, `icon.svg`, `apple-touch-icon.png` | PWA manifest and icons (add your own if missing) |

When you add or rename files that must work offline, list them in `CORE` inside `sw.js` and bump `VERSION` so existing installs update.

### Translations

Every key in `i18n/en.json` must exist in `i18n/fa.json` and vice versa. To add a language, create `i18n/<code>.json` with the same keys, then register it in `loadI18n()` and the language button in `index.html`.

### Limits, honestly

- **Live notification** is a workaround: a silent audio track makes the phone show a media player with the clock text. It only works while the browser or installed app keeps running, the phone may stop it at any time, it shows text only, it can take over media controls from other apps, and iPhone support is limited.
- **No reminders or alarms** when the app is closed. Web apps need a push server for that, and this project has none.
- **Prayer times and the Hijri date are calculated estimates.** They can differ by a minute or two from official tables, and by a day from local moon sighting. Check with your local authority.
- Desk mode relies on the Fullscreen and Wake Lock APIs, which some browsers (notably iPhone Safari) do not offer; the large layout still works there.

### Credits

Made by [Hossein Sheibah](https://sheibah.ir) (حسین شیبه). Released under the MIT License (see `LICENSE`).

---

## فارسی

<div dir="rtl">

یک برنامهٔ وب سبک (PWA) که زمان را **از غروب تا غروب** می‌شمارد، با آسمانی که از موقعیت واقعی خورشید پیروی می‌کند و اوقات شرعی محاسباتی. دوزبانه (فارسی / انگلیسی) است و کاملاً در مرورگر شما اجرا می‌شود؛ هیچ اطلاعاتی از مکان شما به جایی ارسال نمی‌شود.

### امکانات

- زمان سپری‌شده از آخرین غروب یا باقی‌مانده تا غروب بعدی، برای هر شهر یا مختصات دلخواه.
- رنگ آسمان، ستاره‌ها و نمودار مسیر خورشید بر پایهٔ موقعیت واقعی خورشید (معادلات خورشیدی NOAA، محاسبه روی همان دستگاه).
- اوقات شرعی با چند روش محاسبه و دو گزینه برای عصر.
- **حالت ساعت غروب‌کوک** (با یک کلید): ساعت عقربه‌ای ۱۲ ساعته که عقربه‌هایش هنگام غروب روی ۱۲ می‌روند، نوارهای «شب گذشته» و «روز مانده»، و برچسب‌هایی مثل «شب جمعه · شب ۱۳ رجب». بر پایهٔ ایدهٔ «ساعت غروب‌کوک» علامه سید محمدحسین حسینی طهرانی.
- **تنظیم تاریخ قمری** به اندازهٔ ±۱ روز، برای اختلاف تقویم ام‌القری با رؤیت هلال محلی.
- **حالت تمام‌صفحه و رومیزی**: نمایش بزرگ ساعت و آسمان برای تبلت و مانیتور. در مرورگرهایی که پشتیبانی کنند، صفحه را روشن نگه می‌دارد.
- قابل نصب (اندروید، آیفون، رایانه) و پس از اولین بازدید بدون اینترنت کار می‌کند.
- «اعلان زنده» اختیاری (محدودیت‌ها را در پایین ببینید).

### اجرا روی رایانه

متن‌ها از `i18n/*.json` بارگذاری می‌شوند؛ پس پوشه باید از طریق HTTP سرو شود و باز کردن مستقیم `index.html` از روی دیسک کار نمی‌کند.

```bash
python3 -m http.server 8080
# سپس http://localhost:8080 را باز کنید
```

### انتشار روی GitHub Pages

۱. این پوشه را در یک مخزن GitHub بگذارید.
۲. در **Settings → Pages** شاخه و پوشهٔ ریشه را انتخاب کنید.
۳. نشانی `https://<user>.github.io/<repo>/` را باز کنید.

### فایل‌ها

| فایل | کاربرد |
| --- | --- |
| `index.html` | کل برنامه (HTML، CSS، جاوااسکریپت) |
| `i18n/en.json`، `i18n/fa.json` | همهٔ متن‌های نمایشی، یک فایل برای هر زبان |
| `sw.js` | سرویس‌ورکر برای کار بدون اینترنت |
| `manifest.webmanifest`، `icon*.png`، `icon.svg`، `apple-touch-icon.png` | مانیفست و آیکون‌های PWA (اگر ندارید خودتان اضافه کنید) |

هر فایل تازه که باید آفلاین کار کند را در `CORE` داخل `sw.js` بنویسید و `VERSION` را بالا ببرید تا نصب‌های موجود به‌روز شوند.

### ترجمه‌ها

هر کلیدی که در `i18n/en.json` هست باید در `i18n/fa.json` هم باشد و برعکس. برای افزودن زبان، فایل `i18n/<code>.json` را با همان کلیدها بسازید و آن را در `loadI18n()` و دکمهٔ زبان داخل `index.html` ثبت کنید.

### محدودیت‌ها، صادقانه

- **اعلان زنده** یک راه‌حل جایگزین است: یک فایل صوتی بی‌صدا باعث می‌شود گوشی پخش‌کنندهٔ رسانه‌ای با متن ساعت نشان دهد. فقط تا وقتی کار می‌کند که مرورگر یا برنامهٔ نصب‌شده در حال اجرا باشد، گوشی هر لحظه می‌تواند آن را متوقف کند، فقط متن نشان می‌دهد، ممکن است کنترل رسانه را از برنامه‌های دیگر بگیرد و در آیفون پشتیبانی محدودی دارد.
- **وقتی برنامه بسته است یادآور یا هشداری وجود ندارد.** برنامه‌های وب برای این کار به سرور پوش نیاز دارند و این پروژه چنین سروری ندارد.
- **اوقات شرعی و تاریخ قمری برآوردهای محاسباتی‌اند.** ممکن است یکی دو دقیقه با تقویم‌های رسمی و یک روز با رؤیت هلال محلی فرق کنند. به مرجع محلی مراجعه کنید.
- حالت رومیزی به APIهای تمام‌صفحه و روشن‌ماندن صفحه وابسته است که برخی مرورگرها (به‌ویژه سافاری آیفون) ندارند؛ در آن‌ها هم نمای بزرگ کار می‌کند.

### سازنده

ساخته‌شده توسط [حسین شیبه](https://sheibah.ir). با مجوز MIT منتشر شده است (فایل `LICENSE`).

</div>
