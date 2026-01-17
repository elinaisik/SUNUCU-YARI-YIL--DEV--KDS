KDS – Ürün Geri Bildirim ve Kalite İyileştirme Sistemi
(MVC Mimarisi ile RESTful API – Node.js / Express)

* **Ders:** Sunucu Tabanlı Programlama
* **Konu:** MVC Mimarisi ile RESTful API Tasarımı
* **Teslim Türü:** Bireysel
* **Geliştirme Dili / Çatısı:** Node.js (Express)


1. Projenin Amacı

Bu proje, daha önce geliştirilmiş olan Ürün Geri Bildirim ve Kalite İyileştirme Karar Destek Sistemi’nin,
ders kapsamında istenen şekilde MVC mimarisi ve **RESTful API prensiplerine uygun** olarak düzenlenmesini amaçlamaktadır.


 2. Proje Senaryosu

Sistem, ürünler hakkında kullanıcılar tarafından oluşturulan **geri bildirimleri (şikayet/feedback)** yönetmek
ve bu veriler üzerinden yöneticilere karar desteği sağlamak amacıyla geliştirilmiştir.

Mevcut KDS kapsamında:

* Kullanıcılar sisteme giriş yapar,
* Ürünlere ait şikayet ve geri bildirimler görüntülenir,
* Konu ve alt konu bazlı analizler yapılır,
* Departman bazlı değerlendirmeler ve simülasyonlar sunulur.

---

## 3. Kullanılan Teknolojiler

* Node.js
* Express.js
* MySQL
* EJS (arayüz katmanı)
* MVC Architecture
* RESTful API
* dotenv

---

## 4. Mevcut Proje Klasör Yapısı

```
kds_api/
 ├── routes/
 │    ├── authRoutes.js
 │    ├── homeRoutes.js
 │    ├── analysisRoutes.js
 │
 ├── services/
 │    ├── authService.js
 │    ├── analysisService.js
 │
 ├── views/
 │    ├── login.ejs
 │    ├── home.ejs
 │    ├── sikayetler.ejs
 │    └── simulasyon.ejs
 │
 ├── config/
 │    └── db.js
 │
 ├── server.js
 ├── .env.example
 └── README.md
```

## 5. MVC Mimarisinin Projede Uygulanışı

### Route Katmanı

* `routes/` klasörü altında yer almaktadır.
* URL yönlendirmeleri yapılır.
* İlgili controller fonksiyonlarına yönlendirme sağlar.

### Controller Katmanı

* İstekler alınır (`req`),
* Servis katmanı çağrılır,
* Yanıtlar (`res`) döndürülür.

### Service Katmanı

* KDS’ye ait iş kuralları ve senaryolar uygulanır.
* Analiz ve karar destek mantığı bu katmanda yer alır.

### Model / Veritabanı Katmanı

* MySQL veritabanı bağlantısı `config/db.js` üzerinden sağlanır.
* Veritabanı işlemleri servis katmanı aracılığıyla gerçekleştirilir.

---

## 7. RESTful API ve Endpointler

### Kimlik Doğrulama

| Method | Endpoint          | Açıklama                |
| ------ | ----------------- | ----------------------- |
| POST   | /api/login        | Kullanıcı girişi        |
| POST   | /api/register     | Kullanıcı kaydı         |
| GET    | /api/current-user | Aktif kullanıcı bilgisi |

### Analiz ve KDS İşlevleri

| Method | Endpoint            | Açıklama               |
| ------ | ------------------- | ---------------------- |
| GET    | /urun-analiz        | Ürün bazlı analiz      |
| GET    | /departman-analiz   | Departman bazlı analiz |
| GET    | /simulasyon-isletme | İşletme simülasyonu    |

---

## 8. Ortam Değişkenleri (.env)

Veritabanı ve port bilgileri `.env` dosyası üzerinden yönetilmektedir.

### `.env.example`

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=""
DB_NAME=sonkds
DB_PORT=3306
```
