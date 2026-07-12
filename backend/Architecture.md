backend/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   │
│   ├── config/
│   │   └── prisma.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── exam.controller.js
│   │   ├── question.controller.js
│   │   ├── attempt.controller.js
│   │   └── result.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── exam.service.js
│   │   ├── question.service.js
│   │   ├── attempt.service.js
│   │   └── result.service.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── exam.routes.js
│   │   ├── question.routes.js
│   │   ├── attempt.routes.js
│   │   ├── result.routes.js
│   │   └── index.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   └── error.middleware.js
│   │
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── bcrypt.js
│   │   ├── response.js
│   │   └── constants.js
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── package.json
└── prisma.config.js

3 way pipline 

User Upload PDF
   ↓
Upload Service (validation + size check)
   ↓
Store file (S3 / disk sandbox)
   ↓
Queue Job (BullMQ / RabbitMQ)
   ↓
Worker Service (isolated)
   ↓
PDF → Text Extraction
   ↓
AI Question Generator
   ↓
Store Questions in DB
   ↓
Return Exam ID